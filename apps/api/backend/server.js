import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import { createAuthToken, getBearerToken, hashPassword, verifyAuthToken, verifyPassword } from './lib/auth.js';
import { reportReasons } from '@studylink/shared';
import {
  enrollInCourse,
  healthcheck,
  isLocalStore,
  listClassmates,
  listCourses,
  loadCourseDetails,
  loadUserProfile,
  query,
  updateUserProfile,
  withdrawFromCourse,
} from './lib/db.js';

const app = express();

const PORT = process.env.PORT || 4000;
const clientDistPath = path.resolve(process.cwd(), 'dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');
const hasClientBuild = fs.existsSync(clientIndexPath);
const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  ...String(process.env.CORS_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean),
]);

app.disable('x-powered-by');

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    // Keep logs compact so they remain readable in production terminals.
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
  }),
);
app.use(express.json({ limit: '7mb' }));

function createRateLimiter(windowMs, maxRequests) {
  const attempts = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const state = attempts.get(key);
    if (!state || now - state.startedAt >= windowMs) {
      attempts.set(key, { startedAt: now, count: 1 });
      return next();
    }
    if (state.count >= maxRequests) {
      res.setHeader('Retry-After', String(Math.ceil((windowMs - (now - state.startedAt)) / 1000)));
      return res.status(429).json({ message: 'Too many requests. Please wait and try again.' });
    }
    state.count += 1;
    if (attempts.size > 1000) {
      for (const [attemptKey, entry] of attempts) {
        if (now - entry.startedAt >= windowMs) attempts.delete(attemptKey);
      }
    }
    return next();
  };
}

const authRateLimiter = createRateLimiter(15 * 60 * 1000, 10);
const reportRateLimiter = createRateLimiter(60 * 60 * 1000, 20);
const uploadRateLimiter = createRateLimiter(60 * 60 * 1000, 30);
const maxUploadBytes = 5 * 1024 * 1024;
const allowedUploadExtensions = new Set(['.pdf', '.txt', '.md', '.doc', '.docx', '.ppt', '.pptx', '.png', '.jpg', '.jpeg', '.webp']);

// Simple in-memory cache for AI fetches (prototype) - key: `${courseCode}:${topic}` -> { ts, results }
const aiFetchCache = new Map();

// Helper to run an operation with a short-lived Postgres client if DATABASE_URL is provided.
async function withPgClient(fn) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    try { await client.end(); } catch (e) { /* ignore */ }
  }
}

async function getCuratedLinksFromDb(client, courseCode) {
  const res = await client.query('SELECT label, url, type, source, added_at, added_by, metadata FROM curated_links WHERE course_code = $1 ORDER BY added_at DESC;', [courseCode]);
  return res.rows.map((r) => ({ label: r.label, url: r.url, type: r.type, source: r.source, addedAt: r.added_at, addedBy: r.added_by, metadata: r.metadata }));
}

async function saveCuratedLinkToDb(client, courseCode, resource, addedBy) {
  const sql = `INSERT INTO curated_links (course_code, label, url, type, source, added_at, added_by, metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *;`;
  const metadata = { ...resource };
  delete metadata.label; delete metadata.url; delete metadata.type; delete metadata.source;
  const addedAt = new Date();
  const vals = [courseCode, resource.label || null, resource.url || null, resource.type || null, resource.source || null, addedAt, addedBy || null, metadata];
  const res = await client.query(sql, vals);
  return res.rows[0];
}

async function saveCurationFlagToDb(client, courseCode, resource, reason, flaggedBy) {
  const sql = `INSERT INTO curation_flags (course_code, url, reason, flagged_by, flagged_at, metadata) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;`;
  const metadata = { ...resource };
  delete metadata.label; delete metadata.url; delete metadata.type; delete metadata.source;
  const flaggedAt = new Date();
  const vals = [courseCode, resource.url || null, reason || null, flaggedBy || null, flaggedAt, metadata];
  const res = await client.query(sql, vals);
  return res.rows[0];
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value) {
  return Number(value) || 0;
}

function formatSessionDate(startsAt) {
  if (!startsAt) {
    return { time: '', date: '', dayOfWeek: '', month: '' };
  }

  const date = new Date(startsAt);
  if (Number.isNaN(date.getTime())) {
    return { time: '', date: '', dayOfWeek: '', month: '' };
  }

  return {
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    date: String(date.getDate()).padStart(2, '0'),
    dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase(),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
  };
}

function toPublicUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.full_name,
    university: row.university || '',
    program: row.program || '',
    role: row.role || 'student',
    major: row.major || '',
    yearOfStudy: row.year_of_study || '',
    bio: row.bio || '',
    profileVisibility: row.profile_visibility || 'members',
    notificationPreferences: row.notification_preferences || { groups: true, sessions: true, moderation: true },
  };
}

function toGroupSummary(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    course: row.course_name || '',
    courseCode: row.course_code || '',
    meetingType: row.meeting_type || 'Hybrid',
    members: toNumber(row.member_count),
    isMember: Boolean(row.is_member),
    capacity: row.capacity ? Number(row.capacity) : null,
    joinType: row.join_type || 'open',
    image: row.image_url || '',
    ownerUserId: row.owner_user_id || null,
    joinRequirements: toArray(row.join_requirements),
    groupRules: toArray(row.group_rules),
    memberBenefits: toArray(row.member_benefits),
    newMemberSteps: toArray(row.new_member_steps),
    whoCanJoin: row.who_can_join || '',
    communicationChannel: row.communication_channel || '',
    scheduleNotes: row.schedule_notes || '',
    sessionCount: toNumber(row.session_count),
  };
}

function toSessionSummary(row) {
  const dateInfo = formatSessionDate(row.starts_at);

  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at || null,
    time: dateInfo.time,
    location: row.location || '',
    group: row.group_name || '',
    groupId: row.group_id,
    courseCode: row.course_code || '',
    date: dateInfo.date,
    dayOfWeek: dateInfo.dayOfWeek,
    month: dateInfo.month,
    status: row.status || 'Upcoming',
    agenda: toArray(row.agenda),
    prepNotes: toArray(row.prep_notes),
    attendanceRules: toArray(row.attendance_rules),
    enrolledCount: toNumber(row.enrollment_count),
    isEnrolled: Boolean(row.is_enrolled),
    createdByUserId: row.created_by_user_id || null,
    groupOwnerUserId: row.group_owner_user_id || null,
  };
}

function toResourceSummary(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.resource_type || row.type,
    url: row.url,
    description: row.description || '',
    usageNotes: row.usage_notes || '',
    audience: row.audience || '',
    sourceNote: row.source_note || '',
    courseCode: row.course_code || '',
    downloads: toNumber(row.download_count),
  };
}

async function findUserByEmail(email) {
  const result = await query(
    'SELECT id, email, full_name, university, program, role, password_hash, major, year_of_study, bio, is_suspended, profile_visibility, notification_preferences FROM users WHERE lower(email) = lower($1) LIMIT 1;',
    [email],
  );
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await query(
    'SELECT id, email, full_name, university, program, role, major, year_of_study, bio, is_suspended, profile_visibility, notification_preferences FROM users WHERE id = $1 LIMIT 1;',
    [id],
  );
  return result.rows[0] || null;
}

async function requireAuth(req, res, next) {
  const token = getBearerToken(req.headers.authorization);
  const payload = verifyAuthToken(token);

  if (!payload) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const user = await findUserById(Number(payload.sub));
  if (!user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }
  if (user.is_suspended) {
    return res.status(403).json({ message: 'This account has been suspended. Contact an administrator for help.' });
  }

  req.user = toPublicUser(user);
  req.auth = payload;
  return next();
}

async function loadGroupById(id) {
  const result = await query(
    `SELECT
      g.*,
      (SELECT COUNT(*) FROM group_enrollments ge WHERE ge.group_id = g.id) AS member_count,
      (SELECT COUNT(*) FROM sessions s WHERE s.group_id = g.id) AS session_count
     FROM study_groups g
     WHERE g.id = $1
     LIMIT 1;`,
    [id],
  );

  return result.rows[0] || null;
}

async function loadSessionById(id) {
  const result = await query(
    `SELECT
      s.*,
      g.name AS group_name,
      g.course_code AS course_code,
      g.owner_user_id AS group_owner_user_id,
      (SELECT COUNT(*) FROM session_enrollments se WHERE se.session_id = s.id) AS enrollment_count
     FROM sessions s
     JOIN study_groups g ON g.id = s.group_id
     WHERE s.id = $1
     LIMIT 1;`,
    [id],
  );

  return result.rows[0] || null;
}

async function loadResourceById(id) {
  const result = await query(
    `SELECT
      r.*,
      (SELECT COUNT(*) FROM resource_enrollments re WHERE re.resource_id = r.id) AS download_count
     FROM resources r
     WHERE r.id = $1
     LIMIT 1;`,
    [id],
  );

  return result.rows[0] || null;
}

function canManageEntity(req, ownerUserId) {
  return req.user && (req.user.role === 'admin' || Number(ownerUserId) === Number(req.user.id));
}

function notificationEnabled(user, type) {
  return user.notificationPreferences?.[type] !== false;
}

async function createNotification(userId, type, title, message) {
  const recipient = await findUserById(userId);
  if (!recipient || !notificationEnabled(toPublicUser(recipient), type)) return;
  await query(
    `INSERT INTO notifications (user_id, type, title, message)
     VALUES ($1, $2, $3, $4)
     RETURNING id;`,
    [userId, type, title, message],
  );
}

async function notifyGroupMembers(groupId, actorId, title, message) {
  const group = await loadGroupById(groupId);
  if (!group) return;
  const members = await query('SELECT user_id FROM group_enrollments WHERE group_id = $1;', [groupId]);
  const recipients = new Set([
    Number(group.owner_user_id),
    ...members.rows.map((row) => Number(row.user_id)),
  ]);
  recipients.delete(Number(actorId));
  for (const userId of recipients) {
    if (userId > 0) await createNotification(userId, 'sessions', title, message);
  }
}

app.post('/api/auth/signup', authRateLimiter, async (req, res) => {
  const { fullName, email, password, university, program } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Full name, email, and password are required.' });
  }

  if (String(password).trim().length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ message: 'An account with that email already exists.' });
  }

  const passwordHash = hashPassword(password);
  const result = await query(
    `INSERT INTO users (email, full_name, password_hash, university, program, role)
     VALUES ($1, $2, $3, $4, $5, 'student')
     RETURNING id, email, full_name, university, program, role;`,
    [String(email).trim(), String(fullName).trim(), passwordHash, university ? String(university).trim() : null, program ? String(program).trim() : null],
  );

  const user = toPublicUser(result.rows[0]);
  const token = createAuthToken(user);
  return res.status(201).json({ user, token });
});

app.post('/api/auth/login', authRateLimiter, async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = typeof email === 'string' ? email.trim() : '';
  const suppliedPassword = typeof password === 'string' ? password : '';

  if (!normalizedEmail || !suppliedPassword) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Enter a valid email address.' });
  }

  const userRecord = await findUserByEmail(normalizedEmail);

  if (!userRecord || !userRecord.password_hash || !verifyPassword(suppliedPassword, userRecord.password_hash)) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const user = toPublicUser(userRecord);
  if (userRecord.is_suspended) {
    return res.status(403).json({ message: 'This account has been suspended. Contact an administrator for help.' });
  }
  await query(
    `INSERT INTO audit_logs (actor_user_id, entity_type, entity_id, action, payload)
     VALUES ($1, $2, $3, $4, $5);`,
    [user.id, 'user', String(user.id), 'sign_in', JSON.stringify({ ipAddress: req.ip })],
  );
  const token = createAuthToken(user);
  return res.json({ user, token });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

app.post('/api/auth/logout', (_req, res) => {
  return res.json({ message: 'Logged out successfully.' });
});

app.get('/api/profile', requireAuth, async (req, res) => {
  const profile = await loadUserProfile(req.user.id);
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found.' });
  }

  return res.json(profile);
});

app.patch('/api/profile', requireAuth, async (req, res) => {
  const preferences = req.body?.notificationPreferences;
  if (preferences !== undefined && (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)
      || ['groups', 'sessions', 'moderation'].some((key) => typeof preferences[key] !== 'boolean'))) {
    return res.status(400).json({ message: 'Notification preferences must contain boolean groups, sessions, and moderation values.' });
  }
  if (req.body?.profileVisibility !== undefined && !['members', 'private'].includes(req.body.profileVisibility)) {
    return res.status(400).json({ message: 'Profile visibility must be members or private.' });
  }
  const profile = await updateUserProfile(req.user.id, req.body || {});
  if (!profile) {
    return res.status(404).json({ message: 'Profile not found.' });
  }

  return res.json(profile);
});

app.get('/api/classmates', requireAuth, async (req, res) => {
  const classmates = await listClassmates({
    viewerUserId: req.user.id,
    search: req.query.search || '',
    courseCode: req.query.courseCode || '',
  });

  return res.json({ classmates });
});

app.get('/api/courses', requireAuth, async (req, res) => {
  const courses = await listCourses(req.user.id);
  return res.json({ courses });
});

app.get('/api/courses/:id', requireAuth, async (req, res) => {
  const course = await loadCourseDetails(req.params.id, req.user.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  return res.json({ course });
});

app.post('/api/courses/:id/enroll', requireAuth, async (req, res) => {
  const course = await enrollInCourse(Number(req.params.id), req.user.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  return res.json({ course });
});

app.delete('/api/courses/:id/enroll', requireAuth, async (req, res) => {
  const course = await withdrawFromCourse(Number(req.params.id), req.user.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found.' });
  }
  return res.json({ course });
});

app.get('/api/notifications', requireAuth, async (req, res) => {
  const result = await query(
    `SELECT id, type, title, message, created_at, read_at
     FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 100;`,
    [req.user.id],
  );
  return res.json({ notifications: result.rows });
});

app.patch('/api/notifications/:id/read', requireAuth, async (req, res) => {
  const result = await query(
    `UPDATE notifications SET read_at = NOW()
     WHERE id = $1 AND user_id = $2 RETURNING id;`,
    [Number(req.params.id), req.user.id],
  );
  if (!result.rows[0]) return res.status(404).json({ message: 'Notification not found.' });
  return res.json({ ok: true });
});

app.delete('/api/notifications', requireAuth, async (req, res) => {
  await query('DELETE FROM notifications WHERE user_id = $1;', [req.user.id]);
  return res.status(204).send();
});

app.get('/api/admin/users', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin permission required.' });
  const result = await query(
    `SELECT id, full_name, email, role, is_suspended, created_at
     FROM users ORDER BY created_at DESC, id DESC;`,
  );
  return res.json({ users: result.rows });
});

app.patch('/api/admin/users/:id/suspension', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin permission required.' });
  const userId = Number(req.params.id);
  const suspended = req.body?.suspended;
  if (!Number.isSafeInteger(userId) || userId < 1 || typeof suspended !== 'boolean') {
    return res.status(400).json({ message: 'A valid user and suspension state are required.' });
  }
  if (userId === Number(req.user.id) && suspended) {
    return res.status(400).json({ message: 'You cannot suspend your own administrator account.' });
  }
  const target = await findUserById(userId);
  if (!target) return res.status(404).json({ message: 'User not found.' });
  if (target.role === 'admin') return res.status(409).json({ message: 'Administrator accounts cannot be suspended here.' });
  await query('UPDATE users SET is_suspended = $1 WHERE id = $2;', [suspended, userId]);
  await query(
    `INSERT INTO audit_logs (actor_user_id, entity_type, entity_id, action, payload)
     VALUES ($1, 'user', $2, $3, $4);`,
    [req.user.id, String(userId), suspended ? 'user_suspended' : 'user_unsuspended', JSON.stringify({ email: target.email })],
  );
  return res.json({ id: userId, suspended });
});

app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required.' });
  }

  await query(
    `INSERT INTO contact_messages (name, email, subject, message)
     VALUES ($1, $2, $3, $4);`,
    [String(name).trim(), String(email).trim(), subject ? String(subject).trim() : null, String(message).trim()],
  );

  return res.json({ message: 'Contact request received. Our team will follow up shortly.' });
});

app.get('/api/groups', requireAuth, async (req, res) => {
  const result = await query(
    `SELECT
      g.*,
      (SELECT COUNT(*) FROM group_enrollments ge WHERE ge.group_id = g.id) AS member_count,
      (SELECT COUNT(*) FROM sessions s WHERE s.group_id = g.id) AS session_count,
      (g.owner_user_id = $1 OR EXISTS(
        SELECT 1 FROM group_enrollments mine WHERE mine.group_id = g.id AND mine.user_id = $1
      )) AS is_member
     FROM study_groups g
     ORDER BY g.created_at DESC, g.id DESC;`,
    [req.user.id],
  );

  return res.json({ groups: result.rows.map(toGroupSummary) });
});

app.get('/api/groups/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const groupRow = await loadGroupById(id);
  if (!groupRow) {
    return res.status(404).json({ message: 'Group not found' });
  }

  const sessionsResult = await query(
    `SELECT
      s.*,
      g.name AS group_name,
      g.course_code AS course_code,
      (SELECT COUNT(*) FROM session_enrollments se WHERE se.session_id = s.id) AS enrollment_count
     FROM sessions s
     JOIN study_groups g ON g.id = s.group_id
     WHERE s.group_id = $1
     ORDER BY s.starts_at ASC NULLS LAST, s.id ASC;`,
    [id],
  );

  const membersResult = await query(
    `SELECT
      u.id,
      u.email,
      u.full_name AS name,
      ge.joined_at AS enrolled_at
     FROM group_enrollments ge
     JOIN users u ON u.id = ge.user_id
     WHERE ge.group_id = $1
     ORDER BY ge.joined_at ASC;`,
    [id],
  );

  return res.json({
    group: {
      ...toGroupSummary(groupRow),
      isMember: membersResult.rows.some((member) => Number(member.id) === Number(req.user.id)),
      sessions: sessionsResult.rows.map(toSessionSummary),
      membersList: membersResult.rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        enrolledAt: row.enrolled_at,
      })),
    },
  });
});

app.post('/api/groups', requireAuth, async (req, res) => {
  const {
    name,
    description,
    courseName,
    courseCode,
    meetingType,
    imageUrl,
    whoCanJoin,
    joinRequirements,
    groupRules,
    memberBenefits,
    newMemberSteps,
    communicationChannel,
    scheduleNotes,
    capacity,
    joinType,
  } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Group name is required.' });
  }
  const parsedCapacity = capacity === '' || capacity === undefined || capacity === null ? null : Number(capacity);
  if (parsedCapacity !== null && (!Number.isSafeInteger(parsedCapacity) || parsedCapacity < 2)) {
    return res.status(400).json({ message: 'Group capacity must be a whole number of at least 2.' });
  }
  if (joinType !== undefined && !['open', 'closed'].includes(joinType)) {
    return res.status(400).json({ message: 'Join type must be open or closed.' });
  }

  const result = await query(
    `INSERT INTO study_groups (
      name,
      description,
      course_name,
      course_code,
      meeting_type,
      image_url,
      who_can_join,
      join_requirements,
      group_rules,
      member_benefits,
      new_member_steps,
      communication_channel,
      schedule_notes,
      owner_user_id,
      capacity,
      join_type
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12, $13, $14, $15, $16)
    RETURNING *;`,
    [
      String(name).trim(),
      description ? String(description).trim() : null,
      courseName ? String(courseName).trim() : null,
      courseCode ? String(courseCode).trim() : null,
      meetingType || 'Hybrid',
      imageUrl ? String(imageUrl).trim() : null,
      whoCanJoin ? String(whoCanJoin).trim() : null,
      JSON.stringify(toArray(joinRequirements)),
      JSON.stringify(toArray(groupRules)),
      JSON.stringify(toArray(memberBenefits)),
      JSON.stringify(toArray(newMemberSteps)),
      communicationChannel ? String(communicationChannel).trim() : null,
      scheduleNotes ? String(scheduleNotes).trim() : null,
      req.user.id,
      parsedCapacity,
      joinType || 'open',
    ],
  );

  await query(
    `INSERT INTO group_enrollments (group_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (group_id, user_id) DO NOTHING;`,
    [result.rows[0].id, req.user.id],
  );
  const createdGroup = await loadGroupById(result.rows[0].id);
  return res.status(201).json({ group: toGroupSummary(createdGroup) });
});

app.patch('/api/groups/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await loadGroupById(id);
  if (!existing) {
    return res.status(404).json({ message: 'Group not found' });
  }

  if (!canManageEntity(req, existing.owner_user_id)) {
    return res.status(403).json({ message: 'You do not have permission to update this group.' });
  }

  const {
    name,
    description,
    courseName,
    courseCode,
    meetingType,
    imageUrl,
    whoCanJoin,
    joinRequirements,
    groupRules,
    memberBenefits,
    newMemberSteps,
    communicationChannel,
    scheduleNotes,
    capacity,
    joinType,
  } = req.body;
  const parsedCapacity = capacity === undefined || capacity === null || capacity === '' ? null : Number(capacity);
  if (parsedCapacity !== null && (!Number.isSafeInteger(parsedCapacity) || parsedCapacity < 2)) {
    return res.status(400).json({ message: 'Group capacity must be a whole number of at least 2.' });
  }
  if (joinType !== undefined && !['open', 'closed'].includes(joinType)) {
    return res.status(400).json({ message: 'Join type must be open or closed.' });
  }

  await query(
    `UPDATE study_groups
     SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       course_name = COALESCE($3, course_name),
       course_code = COALESCE($4, course_code),
       meeting_type = COALESCE($5, meeting_type),
       image_url = COALESCE($6, image_url),
       who_can_join = COALESCE($7, who_can_join),
       join_requirements = COALESCE($8::jsonb, join_requirements),
       group_rules = COALESCE($9::jsonb, group_rules),
       member_benefits = COALESCE($10::jsonb, member_benefits),
       new_member_steps = COALESCE($11::jsonb, new_member_steps),
       communication_channel = COALESCE($12, communication_channel),
       schedule_notes = COALESCE($13, schedule_notes),
       capacity = COALESCE($14, capacity),
       join_type = COALESCE($15, join_type),
       updated_at = NOW()
     WHERE id = $16;`,
    [
      name ? String(name).trim() : null,
      description ? String(description).trim() : null,
      courseName ? String(courseName).trim() : null,
      courseCode ? String(courseCode).trim() : null,
      meetingType || null,
      imageUrl ? String(imageUrl).trim() : null,
      whoCanJoin ? String(whoCanJoin).trim() : null,
      joinRequirements ? JSON.stringify(toArray(joinRequirements)) : null,
      groupRules ? JSON.stringify(toArray(groupRules)) : null,
      memberBenefits ? JSON.stringify(toArray(memberBenefits)) : null,
      newMemberSteps ? JSON.stringify(toArray(newMemberSteps)) : null,
      communicationChannel ? String(communicationChannel).trim() : null,
      scheduleNotes ? String(scheduleNotes).trim() : null,
      parsedCapacity,
      joinType || null,
      id,
    ],
  );

  const updated = await loadGroupById(id);
  return res.json({ group: toGroupSummary(updated) });
});

app.delete('/api/groups/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await loadGroupById(id);
  if (!existing) {
    return res.status(404).json({ message: 'Group not found' });
  }

  if (!canManageEntity(req, existing.owner_user_id)) {
    return res.status(403).json({ message: 'You do not have permission to delete this group.' });
  }

  await query('DELETE FROM study_groups WHERE id = $1;', [id]);
  return res.status(204).send();
});

app.post('/api/groups/:id/enroll', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const group = await loadGroupById(id);
  if (!group) {
    return res.status(404).json({ message: 'Group not found' });
  }
  if (group.join_type === 'closed') {
    return res.status(403).json({ message: 'This group is closed to new members.' });
  }
  if (toArray(group.join_requirements).length > 0 && req.body?.acceptedRequirements !== true) {
    return res.status(400).json({ message: 'Confirm that you meet the group requirements before joining.' });
  }
  const currentMemberResult = await query(
    'SELECT 1 FROM group_enrollments WHERE group_id = $1 AND user_id = $2 LIMIT 1;',
    [id, req.user.id],
  );
  if (!currentMemberResult.rows.length && group.capacity && Number(group.member_count) >= Number(group.capacity)) {
    return res.status(409).json({ message: 'This study group has reached its member capacity.' });
  }

  await query(
    `INSERT INTO group_enrollments (group_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (group_id, user_id) DO NOTHING;`,
    [id, req.user.id],
  );

  const updated = await loadGroupById(id);
  if (Number(group.owner_user_id) !== Number(req.user.id)) {
    await createNotification(Number(group.owner_user_id), 'groups', 'New group member', `${req.user.name} joined ${group.name}.`);
  }
  return res.json({ group: toGroupSummary(updated) });
});

app.delete('/api/groups/:id/enroll', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const group = await loadGroupById(id);
  if (!group) return res.status(404).json({ message: 'Group not found.' });
  if (Number(group.owner_user_id) === Number(req.user.id)) {
    return res.status(409).json({ message: 'Group owners cannot leave their own group. Delete the group or transfer ownership first.' });
  }
  await query('DELETE FROM group_enrollments WHERE group_id = $1 AND user_id = $2;', [id, req.user.id]);
  const updated = await loadGroupById(id);
  return res.json({ group: toGroupSummary(updated) });
});

// Prototype AI fetcher endpoint - returns curated/stubbed links for a course/topic
app.post('/api/ai/fetch', requireAuth, async (req, res) => {
  const { courseCode, topic } = req.body || {};
  const cacheKey = `${String(courseCode || '').toUpperCase()}:${String(topic || '').trim()}`;
  const TTL = 1000 * 60 * 10; // 10 minutes
  const cached = aiFetchCache.get(cacheKey);
  if (cached && (Date.now() - cached.ts) < TTL) {
    return res.json({ results: cached.results, cached: true });
  }

  // In prototype mode we return safe, curated links (replace with real search integration later)
  const results = [];

  if (String(courseCode || '').toUpperCase() === 'APT3060') {
    results.push(
      { label: 'Android Activity lifecycle - official docs', url: 'https://developer.android.com/guide/components/activities/activity-lifecycle', type: 'Note', source: 'developer.android.com' },
      { label: 'Activity lifecycle MCQ examples', url: 'https://www.javatpoint.com/android-activity-lifecycle', type: 'MCQ', source: 'javatpoint.com' },
      { label: 'Mobile UI design checklist (Material Design)', url: 'https://material.io/design', type: 'PDF', source: 'material.io' },
    );
  } else {
    // Generic safe fallback links
    results.push(
      { label: `${topic || 'Topic'} - general PDFs`, url: `https://www.google.com/search?q=${encodeURIComponent((topic || courseCode) + ' filetype:pdf')}`, type: 'PDF', source: 'google.com' },
      { label: `${topic || 'Topic'} - YouTube`, url: `https://www.youtube.com/results?search_query=${encodeURIComponent((topic || courseCode))}`, type: 'Video', source: 'youtube.com' },
    );
  }

  aiFetchCache.set(cacheKey, { ts: Date.now(), results });
  return res.json({ results });
});

// Accept curated link and persist to backend/curated_links.json - simple prototype persistence
app.post('/api/ai/accept', requireAuth, async (req, res) => {
  const { courseCode, resource } = req.body || {};
  if (!courseCode || !resource || !resource.url) {
    return res.status(400).json({ message: 'courseCode and resource.url are required' });
  }
  // Try to persist to Postgres if configured, otherwise fall back to file-based persistence
  const course = String(courseCode || '').toUpperCase();
  try {
    const dbResult = await withPgClient(async (client) => {
      if (!client) return null;
      return await saveCuratedLinkToDb(client, course, resource, req.user.email || req.user.id);
    });

    if (dbResult) {
      // still append analytics
      try {
        const analyticsPath = path.join(process.cwd(), 'backend', 'ai_analytics.log');
        const entry = { event: 'accept', courseCode: course, resource: { ...resource }, by: req.user.email || req.user.id, at: new Date().toISOString(), persisted: 'db' };
        fs.appendFileSync(analyticsPath, JSON.stringify(entry) + '\n', 'utf8');
      } catch (err) {
        console.error('Failed writing analytics log', err);
      }

      return res.json({ saved: true, resource: { ...resource, persisted: 'db' } });
    }
  } catch (err) {
    console.error('DB save failed, falling back to file:', err && err.message ? err.message : err);
  }

  // fallback: file-based persistence
  const filePath = path.join(process.cwd(), 'backend', 'curated_links.json');
  let current = {};
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      current = raw ? JSON.parse(raw) : {};
    }
  } catch (err) {
    console.error('Failed reading curated links file', err);
    current = {};
  }

  const list = Array.isArray(current[course]) ? current[course] : [];
  list.push({ ...resource, addedAt: new Date().toISOString(), addedBy: req.user.email || req.user.id });
  current[course] = list;

  try {
    fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed writing curated links file', err);
    return res.status(500).json({ message: 'Failed to persist curated link' });
  }

  try {
    const analyticsPath = path.join(process.cwd(), 'backend', 'ai_analytics.log');
    const entry = { event: 'accept', courseCode: course, resource: { ...resource }, by: req.user.email || req.user.id, at: new Date().toISOString(), persisted: 'file' };
    fs.appendFileSync(analyticsPath, JSON.stringify(entry) + '\n', 'utf8');
  } catch (err) {
    console.error('Failed writing analytics log', err);
  }

  return res.json({ saved: true, resource });
});

// Return persisted curated links for a course (prototype)
app.get('/api/ai/links', requireAuth, async (req, res) => {
  const courseCode = String(req.query.courseCode || '').toUpperCase();
  // Try DB first
  try {
    const dbResult = await withPgClient(async (client) => {
      if (!client) return null;
      return await getCuratedLinksFromDb(client, courseCode);
    });

    if (dbResult) {
      return res.json({ links: dbResult });
    }
  } catch (err) {
    console.error('DB fetch failed, falling back to file:', err && err.message ? err.message : err);
  }

  const filePath = path.join(process.cwd(), 'backend', 'curated_links.json');
  try {
    if (!fs.existsSync(filePath)) return res.json({ links: [] });
    const raw = fs.readFileSync(filePath, 'utf8');
    const current = raw ? JSON.parse(raw) : {};
    const links = current[courseCode] || [];
    return res.json({ links });
  } catch (err) {
    console.error('Failed reading curated links file', err);
    return res.status(500).json({ message: 'Failed to read curated links' });
  }
});

// Flag a curated link for review (prototype) - stores a small flag record
app.post('/api/ai/flag', requireAuth, async (req, res) => {
  const { courseCode, resource, reason } = req.body || {};
  if (!courseCode || !resource || !resource.url) {
    return res.status(400).json({ message: 'courseCode and resource.url are required' });
  }
  const course = String(courseCode || '').toUpperCase();
  try {
    const dbResult = await withPgClient(async (client) => {
      if (!client) return null;
      return await saveCurationFlagToDb(client, course, resource, reason || '', req.user.email || req.user.id);
    });

    if (dbResult) {
      try {
        const analyticsPath = path.join(process.cwd(), 'backend', 'ai_analytics.log');
        const logEntry = { event: 'flag', courseCode: course, resource: { ...resource }, reason: reason || '', by: req.user.email || req.user.id, at: new Date().toISOString(), persisted: 'db' };
        fs.appendFileSync(analyticsPath, JSON.stringify(logEntry) + '\n', 'utf8');
      } catch (err) {
        console.error('Failed writing analytics log', err);
      }
      return res.json({ ok: true, persisted: 'db' });
    }
  } catch (err) {
    console.error('DB flag save failed, falling back to file:', err && err.message ? err.message : err);
  }

  const filePath = path.join(process.cwd(), 'backend', 'curation_flags.json');
  let current = [];
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      current = raw ? JSON.parse(raw) : [];
    }
  } catch (err) {
    console.error('Failed reading curation flags file', err);
    current = [];
  }

  const entry = { courseCode: course, resource: { ...resource }, reason: reason || '', flaggedAt: new Date().toISOString(), flaggedBy: req.user.email || req.user.id };
  current.push(entry);

  try {
    fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed writing curation flags file', err);
    return res.status(500).json({ message: 'Failed to persist flag' });
  }

  try {
    const analyticsPath = path.join(process.cwd(), 'backend', 'ai_analytics.log');
    const logEntry = { event: 'flag', courseCode: course, resource: { ...resource }, reason: reason || '', by: req.user.email || req.user.id, at: new Date().toISOString(), persisted: 'file' };
    fs.appendFileSync(analyticsPath, JSON.stringify(logEntry) + '\n', 'utf8');
  } catch (err) {
    console.error('Failed writing analytics log', err);
  }

  return res.json({ ok: true });
});

app.post('/api/reports', requireAuth, reportRateLimiter, async (req, res) => {
  const { contentType, contentId, reason, details = '' } = req.body || {};
  const parsedContentId = Number(contentId);
  if (!['group', 'resource'].includes(contentType) || !Number.isSafeInteger(parsedContentId) || parsedContentId < 1) {
    return res.status(400).json({ message: 'A valid group or resource must be selected.' });
  }
  if (!reportReasons.includes(reason)) {
    return res.status(400).json({ message: 'Choose a valid reason for the report.' });
  }
  if (typeof details !== 'string' || details.length > 1000) {
    return res.status(400).json({ message: 'Additional details must be 1,000 characters or fewer.' });
  }

  const content = contentType === 'group'
    ? await loadGroupById(parsedContentId)
    : await loadResourceById(parsedContentId);
  if (!content) {
    return res.status(404).json({ message: 'The item you are reporting could not be found.' });
  }

  const result = await query(
    `INSERT INTO content_reports (content_type, content_id, reason, details, reporter_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, content_type, content_id, reason, details, status, created_at;`,
    [contentType, String(parsedContentId), reason, details.trim(), req.user.id],
  );
  await query(
    `INSERT INTO audit_logs (actor_user_id, entity_type, entity_id, action, payload)
     VALUES ($1, $2, $3, $4, $5);`,
    [req.user.id, 'content_report', String(result.rows[0].id), 'report_created', JSON.stringify({ contentType, contentId: parsedContentId })],
  );

  return res.status(201).json({ report: result.rows[0] });
});

app.get('/api/admin/reports', requireAuth, async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Moderator permission required.' });
  }

  const result = await query(
    `SELECT cr.id, cr.content_type, cr.content_id, cr.reason, cr.details, cr.status,
            cr.decision, cr.created_at, cr.reviewed_at,
            u.full_name AS reporter_name, u.email AS reporter_email,
            CASE WHEN cr.content_type = 'group' THEN g.name ELSE r.title END AS content_title
     FROM content_reports cr
     JOIN users u ON u.id = cr.reporter_id
     LEFT JOIN study_groups g ON cr.content_type = 'group' AND g.id::text = cr.content_id
     LEFT JOIN resources r ON cr.content_type = 'resource' AND r.id::text = cr.content_id
     ORDER BY cr.created_at DESC;`,
  );
  return res.json({ reports: result.rows });
});

app.patch('/api/admin/reports/:id', requireAuth, async (req, res) => {
  if (!['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Moderator permission required.' });
  }

  const reportId = Number(req.params.id);
  const action = req.body?.action;
  if (!Number.isSafeInteger(reportId) || reportId < 1 || !['dismiss', 'remove'].includes(action)) {
    return res.status(400).json({ message: 'Choose whether to dismiss or remove the reported content.' });
  }

  const reportsResult = await query(
    `SELECT id, content_type, content_id, status
     FROM content_reports
     WHERE id = $1
     LIMIT 1;`,
    [reportId],
  );
  const report = reportsResult.rows[0];
  if (!report) {
    return res.status(404).json({ message: 'Report not found.' });
  }
  if (report.status !== 'pending') {
    return res.status(409).json({ message: 'This report has already been reviewed.' });
  }

  if (action === 'remove') {
    const table = report.content_type === 'group' ? 'study_groups' : 'resources';
    const removed = await query(`DELETE FROM ${table} WHERE id = $1 RETURNING id;`, [Number(report.content_id)]);
    if (removed.rows.length === 0) {
      return res.status(404).json({ message: 'The reported item no longer exists.' });
    }
  }

  const status = action === 'remove' ? 'removed' : 'dismissed';
  const decision = action === 'remove' ? 'Content removed after review.' : 'Report reviewed and dismissed.';
  await query(
    `UPDATE content_reports
     SET status = $1, decision = $2, reviewed_by = $3, reviewed_at = NOW()
     WHERE id = $4;`,
    [status, decision, req.user.id, reportId],
  );
  await query(
    `INSERT INTO audit_logs (actor_user_id, entity_type, entity_id, action, payload)
     VALUES ($1, $2, $3, $4, $5);`,
    [req.user.id, 'content_report', String(reportId), `report_${action}`, JSON.stringify({ contentType: report.content_type, contentId: report.content_id })],
  );
  await createNotification(
    Number(report.reporter_id),
    'moderation',
    'Report reviewed',
    `Your report about this ${report.content_type} was ${action === 'remove' ? 'resolved by removing the content' : 'dismissed'}.`,
  );

  return res.json({ ok: true, status, decision });
});

app.get('/api/sessions', requireAuth, async (req, res) => {
  const result = await query(
    `SELECT
      s.*,
      g.name AS group_name,
      g.course_code AS course_code,
      g.owner_user_id AS group_owner_user_id,
      (SELECT COUNT(*) FROM session_enrollments se WHERE se.session_id = s.id) AS enrollment_count,
      EXISTS(SELECT 1 FROM session_enrollments mine WHERE mine.session_id = s.id AND mine.user_id = $1) AS is_enrolled
     FROM sessions s
     JOIN study_groups g ON g.id = s.group_id
     ORDER BY s.starts_at ASC NULLS LAST, s.id ASC;`,
    [req.user.id],
  );

  return res.json({ sessions: result.rows.map(toSessionSummary) });
});

app.get('/api/sessions/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const sessionRow = await loadSessionById(id);
  if (!sessionRow) {
    return res.status(404).json({ message: 'Session not found' });
  }

  const attendeesResult = await query(
    `SELECT
      u.id,
      u.email,
      u.full_name AS name,
      se.enrolled_at AS enrolled_at
     FROM session_enrollments se
     JOIN users u ON u.id = se.user_id
     WHERE se.session_id = $1
     ORDER BY se.enrolled_at ASC;`,
    [id],
  );

  return res.json({
    session: {
      ...toSessionSummary(sessionRow),
      isEnrolled: attendeesResult.rows.some((attendee) => Number(attendee.id) === Number(req.user.id)),
      attendees: attendeesResult.rows.map((row) => ({
        id: row.id,
        email: row.email,
        name: row.name,
        enrolledAt: row.enrolled_at,
      })),
    },
  });
});

app.post('/api/sessions', requireAuth, async (req, res) => {
  const {
    groupId,
    title,
    startsAt,
    location,
    status,
    agenda,
    prepNotes,
    attendanceRules,
  } = req.body;

  if (!groupId || !title || !startsAt) {
    return res.status(400).json({ message: 'Group, title, and start time are required.' });
  }
  if (String(title).trim().length > 160 || Number.isNaN(new Date(startsAt).getTime())) {
    return res.status(400).json({ message: 'Enter a valid session title and date/time.' });
  }
  const group = await loadGroupById(Number(groupId));
  if (!group) return res.status(404).json({ message: 'Group not found.' });
  const membershipResult = await query(
    'SELECT 1 FROM group_enrollments WHERE group_id = $1 AND user_id = $2 LIMIT 1;',
    [Number(groupId), req.user.id],
  );
  if (Number(group.owner_user_id) !== Number(req.user.id) && !membershipResult.rows.length) {
    return res.status(403).json({ message: 'Join this study group before scheduling a session.' });
  }

  const result = await query(
    `INSERT INTO sessions (
      group_id,
      title,
      starts_at,
      location,
      status,
      agenda,
      prep_notes,
      attendance_rules,
      created_by_user_id
    ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9)
    RETURNING id;`,
    [
      Number(groupId),
      String(title).trim(),
      startsAt,
      location ? String(location).trim() : null,
      status || 'Upcoming',
      JSON.stringify(toArray(agenda)),
      JSON.stringify(toArray(prepNotes)),
      JSON.stringify(toArray(attendanceRules)),
      req.user.id,
    ],
  );

  const created = await loadSessionById(result.rows[0].id);
  await notifyGroupMembers(Number(groupId), req.user.id, 'New study session', `${created.title} was scheduled for ${group.name}.`);
  return res.status(201).json({ session: toSessionSummary(created) });
});

app.patch('/api/sessions/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await loadSessionById(id);
  if (!existing) {
    return res.status(404).json({ message: 'Session not found' });
  }

  const groupOwnerResult = await query('SELECT owner_user_id FROM study_groups WHERE id = $1 LIMIT 1;', [existing.group_id]);
  const groupOwnerUserId = groupOwnerResult.rows[0]?.owner_user_id;
  if (!canManageEntity(req, existing.created_by_user_id) && !canManageEntity(req, groupOwnerUserId)) {
    return res.status(403).json({ message: 'You do not have permission to update this session.' });
  }

  const {
    groupId,
    title,
    startsAt,
    location,
    status,
    agenda,
    prepNotes,
    attendanceRules,
  } = req.body;
  if (status !== undefined && !['Upcoming', 'Open', 'Completed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Choose a valid session status.' });
  }
  if (title !== undefined && (!String(title).trim() || String(title).trim().length > 160)) {
    return res.status(400).json({ message: 'Session title must contain 1 to 160 characters.' });
  }
  if (startsAt !== undefined && Number.isNaN(new Date(startsAt).getTime())) {
    return res.status(400).json({ message: 'Enter a valid session date and time.' });
  }

  await query(
    `UPDATE sessions
     SET
       group_id = COALESCE($1, group_id),
       title = COALESCE($2, title),
       starts_at = COALESCE($3, starts_at),
       location = COALESCE($4, location),
       status = COALESCE($5, status),
       agenda = COALESCE($6::jsonb, agenda),
       prep_notes = COALESCE($7::jsonb, prep_notes),
       attendance_rules = COALESCE($8::jsonb, attendance_rules),
       updated_at = NOW()
     WHERE id = $9;`,
    [
      groupId ? Number(groupId) : null,
      title ? String(title).trim() : null,
      startsAt || null,
      location ? String(location).trim() : null,
      status || null,
      agenda ? JSON.stringify(toArray(agenda)) : null,
      prepNotes ? JSON.stringify(toArray(prepNotes)) : null,
      attendanceRules ? JSON.stringify(toArray(attendanceRules)) : null,
      id,
    ],
  );

  const updated = await loadSessionById(id);
  if (status === 'Cancelled') {
    await notifyGroupMembers(Number(updated.group_id), req.user.id, 'Study session cancelled', `${updated.title} was cancelled.`);
  } else {
    await notifyGroupMembers(Number(updated.group_id), req.user.id, 'Study session updated', `${updated.title} has been updated.`);
  }
  return res.json({ session: toSessionSummary(updated) });
});

app.delete('/api/sessions/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await loadSessionById(id);
  if (!existing) {
    return res.status(404).json({ message: 'Session not found' });
  }

  const groupOwnerResult = await query('SELECT owner_user_id FROM study_groups WHERE id = $1 LIMIT 1;', [existing.group_id]);
  const groupOwnerUserId = groupOwnerResult.rows[0]?.owner_user_id;
  if (!canManageEntity(req, existing.created_by_user_id) && !canManageEntity(req, groupOwnerUserId)) {
    return res.status(403).json({ message: 'You do not have permission to delete this session.' });
  }

  await query('DELETE FROM sessions WHERE id = $1;', [id]);
  return res.status(204).send();
});

app.post('/api/sessions/:id/enroll', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const session = await loadSessionById(id);
  if (!session) {
    return res.status(404).json({ message: 'Session not found' });
  }
  if (session.status === 'Cancelled') {
    return res.status(409).json({ message: 'This session has been cancelled.' });
  }
  const membershipResult = await query(
    'SELECT owner_user_id FROM study_groups WHERE id = $1 LIMIT 1;',
    [session.group_id],
  );
  const membership = await query(
    'SELECT 1 FROM group_enrollments WHERE group_id = $1 AND user_id = $2 LIMIT 1;',
    [session.group_id, req.user.id],
  );
  if (Number(membershipResult.rows[0]?.owner_user_id) !== Number(req.user.id) && !membership.rows.length) {
    return res.status(403).json({ message: 'Join this study group before responding to its session.' });
  }

  await query(
    `INSERT INTO session_enrollments (session_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (session_id, user_id) DO NOTHING;`,
    [id, req.user.id],
  );

  const updated = await loadSessionById(id);
  return res.json({ session: { ...toSessionSummary(updated), isEnrolled: true } });
});

app.delete('/api/sessions/:id/enroll', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const session = await loadSessionById(id);
  if (!session) return res.status(404).json({ message: 'Session not found.' });
  await query('DELETE FROM session_enrollments WHERE session_id = $1 AND user_id = $2;', [id, req.user.id]);
  return res.json({ session: { ...toSessionSummary(await loadSessionById(id)), isEnrolled: false } });
});

app.get('/api/resources', requireAuth, async (_req, res) => {
  const result = await query(
    `SELECT
      r.*,
      (SELECT COUNT(*) FROM resource_enrollments re WHERE re.resource_id = r.id) AS download_count
     FROM resources r
     ORDER BY r.created_at DESC, r.id DESC;`,
  );

  return res.json({ resources: result.rows.map(toResourceSummary) });
});

app.get('/api/resources/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const resourceRow = await loadResourceById(id);
  if (!resourceRow) {
    return res.status(404).json({ message: 'Resource not found' });
  }

  const accessResult = await query(
    `SELECT u.email, u.full_name AS name, re.accessed_at AS enrolled_at
     FROM resource_enrollments re
     JOIN users u ON u.id = re.user_id
     WHERE re.resource_id = $1
     ORDER BY re.accessed_at ASC;`,
    [id],
  );

  return res.json({
    resource: {
      ...toResourceSummary(resourceRow),
      accesses: accessResult.rows.map((row) => ({
        email: row.email,
        name: row.name,
        enrolledAt: row.enrolled_at,
      })),
    },
  });
});

// Get current user's saved resources (personal library)
app.get('/api/my/resources', requireAuth, async (req, res) => {
  const result = await query(
    `SELECT r.* FROM resources r
     JOIN resource_enrollments re ON re.resource_id = r.id
     WHERE re.user_id = $1
     ORDER BY re.accessed_at DESC NULLS LAST, r.id DESC;`,
    [req.user.id],
  );

  return res.json({ resources: result.rows.map(toResourceSummary) });
});

// Remove a resource from current user's library
app.delete('/api/my/resources/:id', requireAuth, async (req, res) => {
  const resourceId = Number(req.params.id);
  await query('DELETE FROM resource_enrollments WHERE resource_id = $1 AND user_id = $2;', [resourceId, req.user.id]);
  return res.status(204).send();
});

app.post('/api/resources', requireAuth, async (req, res) => {
  const { title, resourceType, url, description, usageNotes, audience, sourceNote, courseCode } = req.body;

  if (!title || !resourceType || !url) {
    return res.status(400).json({ message: 'Title, type, and URL are required.' });
  }
  if (String(title).length > 160 || String(resourceType).length > 40 || String(url).length > 2048
      || String(description || '').length > 2000 || String(sourceNote || '').length > 1000) {
    return res.status(400).json({ message: 'Resource fields exceed the allowed length.' });
  }
  let validatedUrl;
  try {
    validatedUrl = new URL(String(url).trim());
  } catch {
    return res.status(400).json({ message: 'Resource URL must be a valid HTTP or HTTPS link.' });
  }
  if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
    return res.status(400).json({ message: 'Resource URL must use HTTP or HTTPS.' });
  }

  const result = await query(
    `INSERT INTO resources (
      title,
      resource_type,
      url,
      description,
      usage_notes,
      audience,
      source_note,
      course_code,
      created_by_user_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id;`,
    [
      String(title).trim(),
      String(resourceType).trim(),
      String(url).trim(),
      description ? String(description).trim() : null,
      usageNotes ? String(usageNotes).trim() : null,
      audience ? String(audience).trim() : null,
      sourceNote ? String(sourceNote).trim() : null,
      courseCode ? String(courseCode).trim() : null,
      req.user.id,
    ],
  );

  const created = await loadResourceById(result.rows[0].id);
  return res.status(201).json({ resource: toResourceSummary(created) });
});

app.patch('/api/resources/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await loadResourceById(id);
  if (!existing) {
    return res.status(404).json({ message: 'Resource not found' });
  }

  const creatorResult = await query('SELECT created_by_user_id FROM resources WHERE id = $1 LIMIT 1;', [id]);
  const creatorUserId = creatorResult.rows[0]?.created_by_user_id;
  if (!canManageEntity(req, creatorUserId)) {
    return res.status(403).json({ message: 'You do not have permission to update this resource.' });
  }

  const { title, resourceType, url, description, usageNotes, audience, sourceNote, courseCode } = req.body;
  if (title !== undefined && String(title).length > 160
      || resourceType !== undefined && String(resourceType).length > 40
      || url !== undefined && String(url).length > 2048
      || description !== undefined && String(description).length > 2000
      || sourceNote !== undefined && String(sourceNote).length > 1000) {
    return res.status(400).json({ message: 'Resource fields exceed the allowed length.' });
  }
  if (url !== undefined) {
    let validatedUrl;
    try {
      validatedUrl = new URL(String(url).trim());
    } catch {
      return res.status(400).json({ message: 'Resource URL must be a valid HTTP or HTTPS link.' });
    }
    if (!['http:', 'https:'].includes(validatedUrl.protocol)) {
      return res.status(400).json({ message: 'Resource URL must use HTTP or HTTPS.' });
    }
  }
  await query(
    `UPDATE resources
     SET
       title = COALESCE($1, title),
       resource_type = COALESCE($2, resource_type),
       url = COALESCE($3, url),
       description = COALESCE($4, description),
       usage_notes = COALESCE($5, usage_notes),
       audience = COALESCE($6, audience),
       source_note = COALESCE($7, source_note),
       course_code = COALESCE($8, course_code),
       updated_at = NOW()
     WHERE id = $9;`,
    [
      title ? String(title).trim() : null,
      resourceType ? String(resourceType).trim() : null,
      url ? String(url).trim() : null,
      description ? String(description).trim() : null,
      usageNotes ? String(usageNotes).trim() : null,
      audience ? String(audience).trim() : null,
      sourceNote ? String(sourceNote).trim() : null,
      courseCode ? String(courseCode).trim() : null,
      id,
    ],
  );

  const updated = await loadResourceById(id);
  return res.json({ resource: toResourceSummary(updated) });
});

app.delete('/api/resources/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const existing = await loadResourceById(id);
  if (!existing) {
    return res.status(404).json({ message: 'Resource not found' });
  }

  const creatorResult = await query('SELECT created_by_user_id FROM resources WHERE id = $1 LIMIT 1;', [id]);
  const creatorUserId = creatorResult.rows[0]?.created_by_user_id;
  if (!canManageEntity(req, creatorUserId)) {
    return res.status(403).json({ message: 'You do not have permission to delete this resource.' });
  }

  await query('DELETE FROM resources WHERE id = $1;', [id]);
  return res.status(204).send();
});

app.post('/api/resources/:id/enroll', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const resource = await loadResourceById(id);
  if (!resource) {
    return res.status(404).json({ message: 'Resource not found' });
  }

  await query(
    `INSERT INTO resource_enrollments (resource_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (resource_id, user_id) DO NOTHING;`,
    [id, req.user.id],
  );

  const updated = await loadResourceById(id);
  return res.json({ resource: toResourceSummary(updated) });
});

// Academic management endpoints (schools / programs / courses)
app.get('/api/academic/schools', requireAuth, async (_req, res) => {
  const result = await query('SELECT id, name, short_code FROM schools ORDER BY name ASC;');
  return res.json({ schools: result.rows });
});

app.post('/api/academic/schools', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin permission required.' });
  }

  const { name, shortCode } = req.body || {};
  if (!name) return res.status(400).json({ message: 'School name is required.' });

  const result = await query(
    'INSERT INTO schools (name, short_code) VALUES ($1, $2) RETURNING id, name, short_code;',
    [String(name).trim(), shortCode ? String(shortCode).trim() : null],
  );

  return res.status(201).json({ school: result.rows[0] });
});

app.get('/api/academic/programs', requireAuth, async (req, res) => {
  const schoolId = req.query.schoolId ? Number(req.query.schoolId) : null;
  let result;
  if (schoolId) {
    result = await query('SELECT id, school_id, name, code FROM programs WHERE school_id = $1 ORDER BY name ASC;', [schoolId]);
  } else {
    result = await query('SELECT id, school_id, name, code FROM programs ORDER BY name ASC;');
  }

  return res.json({ programs: result.rows });
});

app.post('/api/academic/programs', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin permission required.' });
  }

  const { schoolId, name, code } = req.body || {};
  if (!schoolId || !name) return res.status(400).json({ message: 'School and program name are required.' });

  const result = await query(
    'INSERT INTO programs (school_id, name, code) VALUES ($1, $2, $3) RETURNING id, school_id, name, code;'
    , [Number(schoolId), String(name).trim(), code ? String(code).trim() : null],
  );

  return res.status(201).json({ program: result.rows[0] });
});

app.get('/api/academic/courses', requireAuth, async (req, res) => {
  const programId = req.query.programId ? Number(req.query.programId) : null;
  let result;
  if (programId) {
    result = await query(
      'SELECT id, program_id, semester_id, code, title, description FROM courses WHERE program_id = $1 ORDER BY code ASC;'
      , [programId],
    );
  } else {
    result = await query('SELECT id, program_id, semester_id, code, title, description FROM courses ORDER BY code ASC;');
  }

  return res.json({ courses: result.rows });
});

app.get('/api/academic/courses/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const result = await query(
    `SELECT
      c.id,
      c.program_id,
      c.semester_id,
      c.code,
      c.title,
      c.description,
      p.name AS program_name,
      p.code AS program_code,
      y.year_number AS year_number,
      s.name AS semester_name
     FROM courses c
     LEFT JOIN programs p ON p.id = c.program_id
     LEFT JOIN semesters s ON s.id = c.semester_id
     LEFT JOIN years y ON y.id = s.year_id
     WHERE c.id = $1
     LIMIT 1;`,
    [id],
  );

  if (!result.rows[0]) {
    return res.status(404).json({ message: 'Course not found.' });
  }

  return res.json({ course: result.rows[0] });
});

app.post('/api/academic/courses', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin permission required.' });
  }

  const { programId, semesterId, code, title, description } = req.body || {};
  if (!code || !title) return res.status(400).json({ message: 'Course code and title are required.' });

  const result = await query(
    `INSERT INTO courses (program_id, semester_id, code, title, description, created_by_user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, program_id, semester_id, code, title, description;`,
    [programId ? Number(programId) : null, semesterId ? Number(semesterId) : null, String(code).trim(), String(title).trim(), description ? String(description).trim() : null, req.user.id],
  );

  return res.status(201).json({ course: result.rows[0] });
});

app.get('/api/academic/courses/:id/resources', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const result = await query('SELECT id, title, url, resource_type FROM course_resources WHERE course_id = $1 ORDER BY created_at DESC;', [id]);
  return res.json({ resources: result.rows });
});

app.post('/api/academic/courses/:id/resources', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const { title, url, resourceType } = req.body || {};
  if (!title || !url) return res.status(400).json({ message: 'Title and URL are required.' });

  const result = await query(
    'INSERT INTO course_resources (course_id, title, url, resource_type, created_by_user_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, url, resource_type;'
    , [id, String(title).trim(), String(url).trim(), resourceType ? String(resourceType).trim() : null, req.user.id],
  );

  return res.status(201).json({ resource: result.rows[0] });
});

app.get('/api/health', async (_req, res) => {
  try {
    await healthcheck();
    if (isLocalStore()) {
      return res.json({ status: 'degraded', database: 'local-fallback' });
    }

    return res.json({ status: 'ok', database: 'connected' });
  } catch {
    return res.status(503).json({ status: 'degraded', database: 'unavailable' });
  }
});

app.get('/', (_req, res) => {
  if (hasClientBuild) {
    return res.sendFile(clientIndexPath);
  }

  res.json({
    message: 'StudyLink backend is running.',
    health: '/api/health',
    frontend: 'Use the Vite frontend to access the app UI.',
  });
});

if (hasClientBuild) {
  app.use(express.static(clientDistPath));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(clientIndexPath);
  });
}

// Serve uploaded files
const uploadsPath = process.env.STUDYLINK_UPLOADS_PATH || path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

app.post('/api/uploads', requireAuth, uploadRateLimiter, async (req, res) => {
  const { filename, data } = req.body || {};
  if (typeof filename !== 'string' || typeof data !== 'string' || !filename.trim() || !data) {
    return res.status(400).json({ message: 'Filename and base64 data are required.' });
  }

  const name = path.basename(filename.trim());
  const extension = path.extname(name).toLowerCase();
  if (!allowedUploadExtensions.has(extension)) {
    return res.status(400).json({ message: 'This file type is not allowed.' });
  }
  if (data.length > Math.ceil(maxUploadBytes / 3) * 4 || data.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(data)) {
    return res.status(400).json({ message: 'The uploaded file data is invalid or exceeds the 5 MB limit.' });
  }
  const buffer = Buffer.from(data, 'base64');
  if (buffer.length === 0 || buffer.length > maxUploadBytes || buffer.toString('base64') !== data) {
    return res.status(400).json({ message: 'The uploaded file data is invalid or exceeds the 5 MB limit.' });
  }
  const safeName = `${Date.now()}_${path.basename(name).replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
  const outPath = path.join(uploadsPath, safeName);
  fs.writeFileSync(outPath, buffer, { flag: 'wx' });
  return res.status(201).json({ url: `/uploads/${safeName}` });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found. Use /api/health or the frontend app.' });
});

app.use((error, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error('Request failed:', error);
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body exceeds the 7 MB limit.' });
  }
  return res.status(500).json({ message: 'The request could not be completed.' });
});

async function start() {
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be configured in production.');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET) {
    throw new Error('AUTH_SECRET must be configured in production.');
  }

  await healthcheck();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend server listening at http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start backend server:', error);
  process.exit(1);
});
