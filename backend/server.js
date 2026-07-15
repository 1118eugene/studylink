import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createAuthToken, getBearerToken, hashPassword, verifyAuthToken, verifyPassword } from './lib/auth.js';
import { healthcheck, isLocalStore, query } from './lib/db.js';

const app = express();
const PORT = process.env.PORT || 4000;
const clientDistPath = path.resolve(process.cwd(), 'dist');
const clientIndexPath = path.join(clientDistPath, 'index.html');
const hasClientBuild = fs.existsSync(clientIndexPath);
const allowedOrigins = String(process.env.CORS_ORIGIN || process.env.VITE_API_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean);

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
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  }),
);
app.use(express.json({ limit: '1mb' }));

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
    role: row.role || 'student',
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
    image: row.image_url || '',
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
  };
}

function toResourceSummary(row) {
  return {
    id: row.id,
    title: row.title,
    type: row.resource_type,
    url: row.url,
    description: row.description || '',
    usageNotes: row.usage_notes || '',
    audience: row.audience || '',
    downloads: toNumber(row.download_count),
  };
}

async function findUserByEmail(email) {
  const result = await query(
    'SELECT id, email, full_name, university, role, password_hash FROM users WHERE lower(email) = lower($1) LIMIT 1;',
    [email],
  );
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await query(
    'SELECT id, email, full_name, university, role FROM users WHERE id = $1 LIMIT 1;',
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

app.post('/api/auth/signup', async (req, res) => {
  const { fullName, email, password, university } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Full name, email, and password are required.' });
  }

  if (String(password).trim().length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ message: 'An account with that email already exists.' });
  }

  const passwordHash = hashPassword(password);
  const result = await query(
    `INSERT INTO users (email, full_name, password_hash, university, role)
     VALUES ($1, $2, $3, $4, 'student')
     RETURNING id, email, full_name, university, role;`,
    [String(email).trim(), String(fullName).trim(), passwordHash, university ? String(university).trim() : null],
  );

  const user = toPublicUser(result.rows[0]);
  const token = createAuthToken(user);
  return res.status(201).json({ user, token });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const userRecord = await findUserByEmail(email);
  const localDevelopmentUser = isLocalStore() && userRecord && !userRecord.password_hash;

  if (!userRecord || (!localDevelopmentUser && (!userRecord.password_hash || !verifyPassword(password, userRecord.password_hash)))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const user = toPublicUser(userRecord);
  const token = createAuthToken(user);
  return res.json({ user, token });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

app.post('/api/auth/logout', (_req, res) => {
  return res.json({ message: 'Logged out successfully.' });
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

app.get('/api/groups', async (_req, res) => {
  const result = await query(
    `SELECT
      g.*,
      (SELECT COUNT(*) FROM group_enrollments ge WHERE ge.group_id = g.id) AS member_count,
      (SELECT COUNT(*) FROM sessions s WHERE s.group_id = g.id) AS session_count
     FROM study_groups g
     ORDER BY g.created_at DESC, g.id DESC;`,
  );

  return res.json({ groups: result.rows.map(toGroupSummary) });
});

app.get('/api/groups/:id', async (req, res) => {
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
      sessions: sessionsResult.rows.map(toSessionSummary),
      membersList: membersResult.rows.map((row) => ({
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
  } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Group name is required.' });
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
      owner_user_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12, $13, $14)
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
    ],
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
  } = req.body;

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
       updated_at = NOW()
     WHERE id = $14;`,
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

  await query(
    `INSERT INTO group_enrollments (group_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (group_id, user_id) DO NOTHING;`,
    [id, req.user.id],
  );

  const updated = await loadGroupById(id);
  return res.json({ group: toGroupSummary(updated) });
});

app.get('/api/sessions', async (_req, res) => {
  const result = await query(
    `SELECT
      s.*,
      g.name AS group_name,
      g.course_code AS course_code,
      (SELECT COUNT(*) FROM session_enrollments se WHERE se.session_id = s.id) AS enrollment_count
     FROM sessions s
     JOIN study_groups g ON g.id = s.group_id
     ORDER BY s.starts_at ASC NULLS LAST, s.id ASC;`,
  );

  return res.json({ sessions: result.rows.map(toSessionSummary) });
});

app.get('/api/sessions/:id', async (req, res) => {
  const id = Number(req.params.id);
  const sessionRow = await loadSessionById(id);
  if (!sessionRow) {
    return res.status(404).json({ message: 'Session not found' });
  }

  const attendeesResult = await query(
    `SELECT
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
      attendees: attendeesResult.rows.map((row) => ({
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

  await query(
    `INSERT INTO session_enrollments (session_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (session_id, user_id) DO NOTHING;`,
    [id, req.user.id],
  );

  const updated = await loadSessionById(id);
  return res.json({ session: toSessionSummary(updated) });
});

app.get('/api/resources', async (_req, res) => {
  const result = await query(
    `SELECT
      r.*,
      (SELECT COUNT(*) FROM resource_enrollments re WHERE re.resource_id = r.id) AS download_count
     FROM resources r
     ORDER BY r.created_at DESC, r.id DESC;`,
  );

  return res.json({ resources: result.rows.map(toResourceSummary) });
});

app.get('/api/resources/:id', async (req, res) => {
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

app.post('/api/resources', requireAuth, async (req, res) => {
  const { title, resourceType, url, description, usageNotes, audience } = req.body;

  if (!title || !resourceType || !url) {
    return res.status(400).json({ message: 'Title, type, and URL are required.' });
  }

  const result = await query(
    `INSERT INTO resources (
      title,
      resource_type,
      url,
      description,
      usage_notes,
      audience,
      created_by_user_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id;`,
    [
      String(title).trim(),
      String(resourceType).trim(),
      String(url).trim(),
      description ? String(description).trim() : null,
      usageNotes ? String(usageNotes).trim() : null,
      audience ? String(audience).trim() : null,
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

  const { title, resourceType, url, description, usageNotes, audience } = req.body;
  await query(
    `UPDATE resources
     SET
       title = COALESCE($1, title),
       resource_type = COALESCE($2, resource_type),
       url = COALESCE($3, url),
       description = COALESCE($4, description),
       usage_notes = COALESCE($5, usage_notes),
       audience = COALESCE($6, audience),
       updated_at = NOW()
     WHERE id = $7;`,
    [
      title ? String(title).trim() : null,
      resourceType ? String(resourceType).trim() : null,
      url ? String(url).trim() : null,
      description ? String(description).trim() : null,
      usageNotes ? String(usageNotes).trim() : null,
      audience ? String(audience).trim() : null,
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

app.get('/api/health', async (_req, res) => {
  try {
    await healthcheck();
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unavailable' });
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

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found. Use /api/health or the frontend app.' });
});

async function start() {
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
