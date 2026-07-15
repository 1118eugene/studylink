import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, '..', 'data.json');

const databaseUrl = process.env.DATABASE_URL;
const useLocalStore = !databaseUrl;

const defaultLocalState = {
  sessions: [
    { id: 1, title: 'Intro to Recursion', time: '09:00', location: 'Science Block LT2', group: 'CS101 Beginners Group', date: '18', dayOfWeek: 'TOMORROW', status: 'Upcoming', enrollments: [] },
    { id: 2, title: 'Binary Trees & Heaps Deep Dive', time: '15:30', location: 'Library Room 3A', group: 'Data Structures Study Circle', date: '19', dayOfWeek: 'FRIDAY, JUNE 19', status: 'Upcoming', enrollments: [] },
    { id: 3, title: 'APT3065 Sprint Review', time: '14:00', location: 'Lab A', group: 'APT3065 Project Team', date: '20', dayOfWeek: 'SATURDAY, JUNE 20', status: 'Upcoming', enrollments: [] },
  ],
  groups: [
    { id: 1, name: 'CS101 Beginners Group', description: 'Weekly study group for introductory CS', enrollments: [] },
    { id: 2, name: 'Data Structures Study Circle', description: 'Deep dives into DS topics', enrollments: [] },
    { id: 3, name: 'APT3065 Project Team', description: 'Remote collaboration for planning, prototyping, and presenting the semester project.', enrollments: [] },
  ],
  resources: [
    { id: 1, title: 'Recursion Notes', type: 'pdf', url: '/assets/recursion.pdf', downloads: 0, enrollments: [] },
    { id: 2, title: 'Binary Trees Slides', type: 'ppt', url: '/assets/trees.pptx', downloads: 0, enrollments: [] },
  ],
  users: [
    { id: 1, email: 'onyangoeugene@gmail.com', full_name: 'Eugene onyango Juma', password_hash: '', university: '', role: 'student' },
    { id: 2, email: 'eugeneonyango@gmail.com', full_name: 'violet eugene', password_hash: '', university: '', role: 'student' },
    { id: 3, email: 'eugenonyango@gmail.com', full_name: 'eugen juma', password_hash: '', university: '', role: 'student' },
  ],
  contact_messages: [],
};

function normalizeLocalState(raw) {
  const state = {
    ...defaultLocalState,
    ...(raw || {}),
  };

  state.users = (state.users || []).map((user, index) => ({
    id: user.id || index + 1,
    email: user.email,
    full_name: user.full_name || user.name || user.email,
    password_hash: user.password_hash || '',
    university: user.university || '',
    role: user.role || 'student',
  }));

  state.groups = (state.groups || []).map((group, index) => ({
    enrollments: [],
    ...group,
    id: group.id || index + 1,
  }));

  state.sessions = (state.sessions || []).map((session, index) => ({
    enrollments: [],
    ...session,
    id: session.id || index + 1,
  }));

  state.resources = (state.resources || []).map((resource, index) => ({
    enrollments: [],
    ...resource,
    id: resource.id || index + 1,
  }));

  state.contact_messages = state.contact_messages || [];
  state.group_enrollments = state.group_enrollments || [];
  state.session_enrollments = state.session_enrollments || [];
  state.resource_enrollments = state.resource_enrollments || [];

  return state;
}

function loadLocalData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      return normalizeLocalState(JSON.parse(raw));
    }
  } catch {
    // fall through to defaults
  }

  const initial = normalizeLocalState(defaultLocalState);
  saveLocalData(initial);
  return initial;
}

function saveLocalData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // ignore local write failures in dev
  }
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    university: user.university || '',
    role: user.role || 'student',
    password_hash: user.password_hash || '',
  };
}

function localRows(rows) {
  return Promise.resolve({ rows });
}

let localState = useLocalStore ? loadLocalData() : null;

let pool = null;
if (!useLocalStore) {
  const ssl = process.env.PGSSLMODE === 'require' || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : undefined;

  pool = new Pool({
    connectionString: databaseUrl,
    ssl,
  });
}

function normalizeSql(text) {
  return String(text).replace(/\s+/g, ' ').trim().toLowerCase();
}

function findGroup(id) {
  return localState.groups.find((group) => Number(group.id) === Number(id)) || null;
}

function findSession(id) {
  return localState.sessions.find((session) => Number(session.id) === Number(id)) || null;
}

function findResource(id) {
  return localState.resources.find((resource) => Number(resource.id) === Number(id)) || null;
}

function findUser(id) {
  return localState.users.find((user) => Number(user.id) === Number(id)) || null;
}

function findUserByEmail(email) {
  return localState.users.find((user) => String(user.email).toLowerCase() === String(email).toLowerCase()) || null;
}

function saveEnrollments() {
  saveLocalData(localState);
}

async function localQuery(text, params = []) {
  const sql = normalizeSql(text);

  if (sql === 'select 1 as ok') {
    return localRows([{ ok: 1 }]);
  }

  if (sql.includes('from users where lower(email) = lower($1) limit 1')) {
    const user = findUserByEmail(params[0]);
    return localRows(user ? [publicUser(user)] : []);
  }

  if (sql.includes('from users where id = $1 limit 1')) {
    const user = findUser(params[0]);
    return localRows(user ? [publicUser(user)] : []);
  }

  if (sql.startsWith('insert into users')) {
    const user = {
      id: nextId(localState.users),
      email: params[0],
      full_name: params[1],
      password_hash: params[2] || '',
      university: params[3] || '',
      role: 'student',
    };
    localState.users.push(user);
    saveEnrollments();
    return localRows([{ id: user.id, email: user.email, full_name: user.full_name, university: user.university, role: user.role }]);
  }

  if (sql.startsWith('insert into contact_messages')) {
    localState.contact_messages.push({
      id: nextId(localState.contact_messages),
      name: params[0],
      email: params[1],
      subject: params[2],
      message: params[3],
      status: 'new',
    });
    saveEnrollments();
    return localRows([]);
  }

  if (sql.includes('from study_groups g order by g.created_at desc, g.id desc')) {
    return localRows(localState.groups.map((group) => ({
      ...group,
      member_count: group.enrollments?.length || 0,
      session_count: localState.sessions.filter((session) => Number(session.group_id) === Number(group.id)).length,
    })));
  }

  if (sql.includes('from study_groups g where g.id = $1 limit 1')) {
    const group = findGroup(params[0]);
    return localRows(group ? [{
      ...group,
      member_count: group.enrollments?.length || 0,
      session_count: localState.sessions.filter((session) => Number(session.group_id) === Number(group.id)).length,
    }] : []);
  }

  if (sql.includes('from sessions s join study_groups g on g.id = s.group_id order by s.starts_at asc nulls last, s.id asc')) {
    return localRows(localState.sessions.map((session) => {
      const group = findGroup(session.group_id) || {};
      return {
        ...session,
        group_name: group.name || session.group || '',
        course_code: group.course_code || '',
        enrollment_count: session.enrollments?.length || 0,
      };
    }));
  }

  if (sql.includes('from sessions s join study_groups g on g.id = s.group_id where s.id = $1 limit 1')) {
    const session = findSession(params[0]);
    if (!session) {
      return localRows([]);
    }
    const group = findGroup(session.group_id) || {};
    return localRows([{ ...session, group_name: group.name || '', course_code: group.course_code || '', enrollment_count: session.enrollments?.length || 0 }]);
  }

  if (sql.includes('from group_enrollments ge join users u on u.id = ge.user_id where ge.group_id = $1 order by ge.joined_at asc')) {
    const group = findGroup(params[0]);
    const rows = (group?.enrollments || []).map((entry) => ({ email: entry.email, name: entry.name, enrolled_at: entry.enrolledAt || entry.joinedAt || Date.now() }));
    return localRows(rows);
  }

  if (sql.includes('from session_enrollments se join users u on u.id = se.user_id where se.session_id = $1 order by se.enrolled_at asc')) {
    const session = findSession(params[0]);
    const rows = (session?.enrollments || []).map((entry) => ({ email: entry.email, name: entry.name, enrolled_at: entry.enrolledAt || Date.now() }));
    return localRows(rows);
  }

  if (sql.includes('from resource_enrollments re join users u on u.id = re.user_id where re.resource_id = $1 order by re.accessed_at asc')) {
    const resource = findResource(params[0]);
    const rows = (resource?.enrollments || []).map((entry) => ({ email: entry.email, name: entry.name, enrolled_at: entry.enrolledAt || Date.now() }));
    return localRows(rows);
  }

  if (sql.startsWith('insert into study_groups')) {
    const group = {
      id: nextId(localState.groups),
      name: params[0],
      description: params[1],
      course_name: params[2],
      course_code: params[3],
      meeting_type: params[4] || 'Hybrid',
      image_url: params[5],
      who_can_join: params[6],
      join_requirements: JSON.parse(params[7] || '[]'),
      group_rules: JSON.parse(params[8] || '[]'),
      member_benefits: JSON.parse(params[9] || '[]'),
      new_member_steps: JSON.parse(params[10] || '[]'),
      communication_channel: params[11],
      schedule_notes: params[12],
      owner_user_id: params[13],
      enrollments: [],
    };
    localState.groups.push(group);
    saveEnrollments();
    return localRows([{ ...group }]);
  }

  if (sql.startsWith('update study_groups')) {
    const group = findGroup(params[13]);
    if (!group) return localRows([]);
    group.name = params[0] ?? group.name;
    group.description = params[1] ?? group.description;
    group.course_name = params[2] ?? group.course_name;
    group.course_code = params[3] ?? group.course_code;
    group.meeting_type = params[4] ?? group.meeting_type;
    group.image_url = params[5] ?? group.image_url;
    group.who_can_join = params[6] ?? group.who_can_join;
    group.join_requirements = params[7] ? JSON.parse(params[7]) : group.join_requirements;
    group.group_rules = params[8] ? JSON.parse(params[8]) : group.group_rules;
    group.member_benefits = params[9] ? JSON.parse(params[9]) : group.member_benefits;
    group.new_member_steps = params[10] ? JSON.parse(params[10]) : group.new_member_steps;
    group.communication_channel = params[11] ?? group.communication_channel;
    group.schedule_notes = params[12] ?? group.schedule_notes;
    saveEnrollments();
    return localRows([{ ...group }]);
  }

  if (sql.startsWith('delete from study_groups')) {
    localState.groups = localState.groups.filter((group) => Number(group.id) !== Number(params[0]));
    localState.sessions = localState.sessions.filter((session) => Number(session.group_id) !== Number(params[0]));
    saveEnrollments();
    return localRows([]);
  }

  if (sql.startsWith('insert into group_enrollments')) {
    const group = findGroup(params[0]);
    if (group) {
      group.enrollments = group.enrollments || [];
      if (!group.enrollments.some((entry) => Number(entry.user_id) === Number(params[1]))) {
        const user = findUser(params[1]);
        group.enrollments.push({ user_id: params[1], email: user?.email || '', name: user?.full_name || '', joinedAt: Date.now() });
      }
      saveEnrollments();
    }
    return localRows([]);
  }

  if (sql.startsWith('insert into sessions')) {
    const session = {
      id: nextId(localState.sessions),
      group_id: Number(params[0]),
      title: params[1],
      starts_at: params[2],
      location: params[3],
      status: params[4] || 'Upcoming',
      agenda: JSON.parse(params[5] || '[]'),
      prep_notes: JSON.parse(params[6] || '[]'),
      attendance_rules: JSON.parse(params[7] || '[]'),
      created_by_user_id: params[8],
      enrollments: [],
    };
    localState.sessions.push(session);
    saveEnrollments();
    return localRows([{ id: session.id }]);
  }

  if (sql.startsWith('update sessions')) {
    const session = findSession(params[8]);
    if (!session) return localRows([]);
    session.group_id = params[0] ?? session.group_id;
    session.title = params[1] ?? session.title;
    session.starts_at = params[2] ?? session.starts_at;
    session.location = params[3] ?? session.location;
    session.status = params[4] ?? session.status;
    session.agenda = params[5] ? JSON.parse(params[5]) : session.agenda;
    session.prep_notes = params[6] ? JSON.parse(params[6]) : session.prep_notes;
    session.attendance_rules = params[7] ? JSON.parse(params[7]) : session.attendance_rules;
    saveEnrollments();
    return localRows([{ ...session }]);
  }

  if (sql.startsWith('delete from sessions')) {
    localState.sessions = localState.sessions.filter((session) => Number(session.id) !== Number(params[0]));
    saveEnrollments();
    return localRows([]);
  }

  if (sql.startsWith('insert into session_enrollments')) {
    const session = findSession(params[0]);
    if (session) {
      session.enrollments = session.enrollments || [];
      if (!session.enrollments.some((entry) => Number(entry.user_id) === Number(params[1]))) {
        const user = findUser(params[1]);
        session.enrollments.push({ user_id: params[1], email: user?.email || '', name: user?.full_name || '', enrolledAt: Date.now() });
      }
      saveEnrollments();
    }
    return localRows([]);
  }

  if (sql.startsWith('insert into resources')) {
    const resource = {
      id: nextId(localState.resources),
      title: params[0],
      resource_type: params[1],
      url: params[2],
      description: params[3],
      usage_notes: params[4],
      audience: params[5],
      created_by_user_id: params[6],
      enrollments: [],
    };
    localState.resources.push(resource);
    saveEnrollments();
    return localRows([{ id: resource.id }]);
  }

  if (sql.startsWith('update resources')) {
    const resource = findResource(params[6]);
    if (!resource) return localRows([]);
    resource.title = params[0] ?? resource.title;
    resource.resource_type = params[1] ?? resource.resource_type;
    resource.url = params[2] ?? resource.url;
    resource.description = params[3] ?? resource.description;
    resource.usage_notes = params[4] ?? resource.usage_notes;
    resource.audience = params[5] ?? resource.audience;
    saveEnrollments();
    return localRows([{ ...resource }]);
  }

  if (sql.startsWith('delete from resources')) {
    localState.resources = localState.resources.filter((resource) => Number(resource.id) !== Number(params[0]));
    saveEnrollments();
    return localRows([]);
  }

  if (sql.startsWith('insert into resource_enrollments')) {
    const resource = findResource(params[0]);
    if (resource) {
      resource.enrollments = resource.enrollments || [];
      if (!resource.enrollments.some((entry) => Number(entry.user_id) === Number(params[1]))) {
        const user = findUser(params[1]);
        resource.enrollments.push({ user_id: params[1], email: user?.email || '', name: user?.full_name || '', enrolledAt: Date.now() });
      }
      saveEnrollments();
    }
    return localRows([]);
  }

  if (sql.includes('from resources r order by r.created_at desc, r.id desc')) {
    return localRows(localState.resources.map((resource) => ({
      ...resource,
      download_count: resource.enrollments?.length || 0,
    })));
  }

  if (sql.includes('from resources r where r.id = $1 limit 1')) {
    const resource = findResource(params[0]);
    return localRows(resource ? [{ ...resource, download_count: resource.enrollments?.length || 0 }] : []);
  }

  if (sql.includes('select owner_user_id from study_groups where id = $1 limit 1')) {
    const group = findGroup(params[0]);
    return localRows(group ? [{ owner_user_id: group.owner_user_id || null }] : []);
  }

  if (sql.includes('select created_by_user_id from resources where id = $1 limit 1')) {
    const resource = findResource(params[0]);
    return localRows(resource ? [{ created_by_user_id: resource.created_by_user_id || null }] : []);
  }

  return localRows([]);
}

export async function query(text, params = []) {
  if (!useLocalStore) {
    return pool.query(text, params);
  }

  return localQuery(text, params);
}

export async function healthcheck() {
  return query('SELECT 1 AS ok');
}

export function isLocalStore() {
  return useLocalStore;
}
