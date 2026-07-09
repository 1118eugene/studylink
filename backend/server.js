import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const DATA_PATH = path.resolve(process.cwd(), 'backend', 'data.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    // ignore and return defaults
  }
  const initial = {
    sessions: [
      { id: 1, title: 'Intro to Recursion', time: '09:00', location: 'Science Block LT2', group: 'CS101 Beginners Group', date: '18', dayOfWeek: 'TOMORROW', status: 'Upcoming', enrollments: [] },
      { id: 2, title: 'Binary Trees & Heaps Deep Dive', time: '15:30', location: 'Library Room 3A', group: 'Data Structures Study Circle', date: '19', dayOfWeek: 'FRIDAY, JUNE 19', status: 'Upcoming', enrollments: [] },
      { id: 3, title: 'APT3065 Sprint Review', time: '14:00', location: 'Lab A', group: 'APT3065 Project Team', date: '20', dayOfWeek: 'SATURDAY, JUNE 20', status: 'Upcoming', enrollments: [] },
    ],
    groups: [
      { id: 1, name: 'CS101 Beginners Group', description: 'Weekly study group for introductory CS', enrollments: [] },
      { id: 2, name: 'Data Structures Study Circle', description: 'Deep dives into DS topics', enrollments: [] },
    ],
    resources: [
      { id: 1, title: 'Recursion Notes', type: 'pdf', url: '/assets/recursion.pdf', downloads: 0, enrollments: [] },
      { id: 2, title: 'Binary Trees Slides', type: 'ppt', url: '/assets/trees.pptx', downloads: 0, enrollments: [] },
    ],
    users: [],
  };
  saveData(initial);
  return initial;
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to write data file', err);
  }
}

const store = loadData();

function createToken() {
  return `${Math.random().toString(36).slice(2)}.${Date.now()}`;
}

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // Demo: accept any email if password matches demo password
  if (password !== '12345678') {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const user = store.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase()) || { email, name: 'StudyLink User' };

  return res.json({ user, token: createToken() });
});

app.post('/api/auth/signup', (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: 'Full name, email, and password are required.' });
  }

  if (password !== '12345678') {
    return res.status(400).json({ message: 'Password must be 12345678 for this demo.' });
  }

  const existingUser = store.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (existingUser) {
    return res.status(409).json({ message: 'An account with that email already exists.' });
  }

  const user = { email, name: fullName };
  store.users.push(user);
  saveData(store);

  return res.status(201).json({ user, token: createToken() });
});

app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required.' });
  }

  // For demo, just log and return success
  // eslint-disable-next-line no-console
  console.log('Contact request received:', { name, email, subject, message });

  return res.json({ message: 'Contact request received. Our team will follow up shortly.' });
});

// Sessions endpoints
app.get('/api/sessions', (req, res) => {
  return res.json({ sessions: store.sessions });
});

app.post('/api/sessions/:id/enroll', (req, res) => {
  const id = Number(req.params.id);
  const session = store.sessions.find((s) => s.id === id);
  if (!session) return res.status(404).json({ message: 'Session not found' });

  const user = req.body?.user;
  // user should be an object { email, name }
  if (!user || !user.email) {
    return res.status(400).json({ message: 'User information required to enroll' });
  }

  session.enrollments = session.enrollments || [];
  const exists = session.enrollments.find((u) => u.email && u.email.toLowerCase() === String(user.email).toLowerCase());
  if (exists) {
    return res.status(200).json({ session });
  }

  const entry = { email: user.email, name: user.name || user.email, enrolledAt: Date.now() };
  session.enrollments.push(entry);
  saveData(store);

  return res.json({ session });
});

app.get('/api/sessions/:id', (req, res) => {
  const id = Number(req.params.id);
  const session = store.sessions.find((s) => s.id === id);
  if (!session) return res.status(404).json({ message: 'Session not found' });
  return res.json({ session });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.json({
    message: 'StudyLink backend is running.',
    health: '/api/health',
    frontend: 'Use the Vite frontend to access the app UI.',
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found. Use /api/health or the frontend app.' });
});

// Groups endpoints
app.get('/api/groups', (req, res) => {
  return res.json({ groups: store.groups });
});

app.get('/api/groups/:id', (req, res) => {
  const id = Number(req.params.id);
  const group = store.groups.find((g) => g.id === id);
  if (!group) return res.status(404).json({ message: 'Group not found' });
  return res.json({ group });
});

app.post('/api/groups/:id/enroll', (req, res) => {
  const id = Number(req.params.id);
  const group = store.groups.find((g) => g.id === id);
  if (!group) return res.status(404).json({ message: 'Group not found' });
  const user = req.body?.user;
  if (!user || !user.email) return res.status(400).json({ message: 'User information required' });
  group.enrollments = group.enrollments || [];
  const exists = group.enrollments.find((u) => u.email && u.email.toLowerCase() === String(user.email).toLowerCase());
  if (exists) return res.status(200).json({ group });
  group.enrollments.push({ email: user.email, name: user.name || user.email, enrolledAt: Date.now() });
  saveData(store);
  return res.json({ group });
});

// Resources endpoints
app.get('/api/resources', (req, res) => {
  return res.json({ resources: store.resources });
});

app.get('/api/resources/:id', (req, res) => {
  const id = Number(req.params.id);
  const resource = store.resources.find((r) => r.id === id);
  if (!resource) return res.status(404).json({ message: 'Resource not found' });
  return res.json({ resource });
});

app.post('/api/resources/:id/enroll', (req, res) => {
  const id = Number(req.params.id);
  const resource = store.resources.find((r) => r.id === id);
  if (!resource) return res.status(404).json({ message: 'Resource not found' });
  const user = req.body?.user;
  if (!user || !user.email) return res.status(400).json({ message: 'User information required' });
  resource.enrollments = resource.enrollments || [];
  const exists = resource.enrollments.find((u) => u.email && u.email.toLowerCase() === String(user.email).toLowerCase());
  if (exists) return res.status(200).json({ resource });
  resource.enrollments.push({ email: user.email, name: user.name || user.email, enrolledAt: Date.now() });
  saveData(store);
  return res.json({ resource });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend server listening at http://localhost:${PORT}`);
});
