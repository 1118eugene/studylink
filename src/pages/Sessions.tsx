import { useEffect, useState } from 'react';
import { apiFetch } from '../assets/images/api';

interface EnrolledUser {
  email: string;
  name?: string;
  enrolledAt?: string | number;
}

interface Session {
  id: number;
  title: string;
  time?: string;
  startsAt?: string;
  location?: string;
  group?: string;
  groupId?: number;
  courseCode?: string;
  date?: string;
  dayOfWeek?: string;
  month?: string;
  status?: 'Upcoming' | string;
  enrollments?: EnrolledUser[];
  agenda?: string[];
  prepNotes?: string[];
  attendanceRules?: string[];
  enrolledCount?: number;
}

function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [sessionForm, setSessionForm] = useState({
    groupId: '',
    title: '',
    startsAt: '',
    location: '',
    status: 'Upcoming',
    agenda: '',
    prepNotes: '',
    attendanceRules: '',
  });

  useEffect(() => {
    Promise.all([
      apiFetch('/api/sessions').then((r) => r.json()),
      apiFetch('/api/groups').then((r) => r.json()),
    ])
      .then(([sessionsData, groupsData]) => {
        setSessions(sessionsData.sessions || []);
        setGroups(groupsData.groups || []);
      })
      .catch(() => {
        setSessions([]);
        setGroups([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const resetSessionForm = () => {
    setEditingSessionId(null);
    setSessionForm({
      groupId: '',
      title: '',
      startsAt: '',
      location: '',
      status: 'Upcoming',
      agenda: '',
      prepNotes: '',
      attendanceRules: '',
    });
  };

  const loadSessionIntoForm = (session: Session) => {
    setEditingSessionId(session.id);
    setSessionForm({
      groupId: String(session.groupId || ''),
      title: session.title || '',
      startsAt: session.startsAt ? session.startsAt.slice(0, 16) : '',
      location: session.location || '',
      status: session.status || 'Upcoming',
      agenda: (session.agenda || []).join('\n'),
      prepNotes: (session.prepNotes || []).join('\n'),
      attendanceRules: (session.attendanceRules || []).join('\n'),
    });
  };

  const saveSession = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      groupId: sessionForm.groupId,
      title: sessionForm.title,
      startsAt: sessionForm.startsAt,
      location: sessionForm.location,
      status: sessionForm.status,
      agenda: sessionForm.agenda.split('\n').map((value) => value.trim()).filter(Boolean),
      prepNotes: sessionForm.prepNotes.split('\n').map((value) => value.trim()).filter(Boolean),
      attendanceRules: sessionForm.attendanceRules.split('\n').map((value) => value.trim()).filter(Boolean),
    };

    try {
      const response = await apiFetch(editingSessionId ? `/api/sessions/${editingSessionId}` : '/api/sessions', {
        method: editingSessionId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to save session');
      }

      const data = await response.json();
      const savedSession = data.session;

      setSessions((current) => {
        if (editingSessionId) {
          return current.map((session) => (session.id === savedSession.id ? { ...session, ...savedSession } : session));
        }
        return [savedSession, ...current];
      });
      resetSessionForm();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      alert('Could not save the session. Please try again.');
    }
  };

  const deleteSession = async (sessionId: number) => {
    if (!window.confirm('Delete this session?')) {
      return;
    }

    try {
      const response = await apiFetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        throw new Error('Unable to delete session');
      }

      setSessions((current) => current.filter((session) => session.id !== sessionId));
      if (editingSessionId === sessionId) {
        resetSessionForm();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      alert('Could not delete the session.');
    }
  };

  const handleEnroll = async (id: number) => {
    const raw = localStorage.getItem('user');
    if (!raw || !localStorage.getItem('token')) {
      alert('Please sign in to enroll in a session.');
      return;
    }

    try {
      const res = await apiFetch(`/api/sessions/${id}/enroll`, { method: 'POST' });
      if (!res.ok) throw new Error('Enroll failed');
      const data = await res.json();
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, ...data.session } : s)));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert('Failed to enroll. Please try again.');
    }
  };

  return (
    <section className="sessions-page">
      <div className="container">
        <div className="page-header">
          <h1>Upcoming Sessions</h1>
          <p className="page-description">All scheduled study sessions across your groups.</p>
        </div>

        <div className="management-panel">
          <div className="section-header">
            <h2>{editingSessionId ? 'Edit Session' : 'Create Session'}</h2>
            {editingSessionId ? <button className="text-button" onClick={resetSessionForm}>Cancel editing</button> : null}
          </div>

          <form className="management-form" onSubmit={saveSession}>
            <div className="form-grid form-grid-two">
              <label>
                <span>Group</span>
                <select value={sessionForm.groupId} onChange={(e) => setSessionForm((current) => ({ ...current, groupId: e.target.value }))} required>
                  <option value="">Select a group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select value={sessionForm.status} onChange={(e) => setSessionForm((current) => ({ ...current, status: e.target.value }))}>
                  <option>Upcoming</option>
                  <option>Open</option>
                  <option>Full</option>
                  <option>Completed</option>
                </select>
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Title</span>
                <input value={sessionForm.title} onChange={(e) => setSessionForm((current) => ({ ...current, title: e.target.value }))} required />
              </label>
              <label>
                <span>Start time</span>
                <input type="datetime-local" value={sessionForm.startsAt} onChange={(e) => setSessionForm((current) => ({ ...current, startsAt: e.target.value }))} required />
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Location</span>
                <input value={sessionForm.location} onChange={(e) => setSessionForm((current) => ({ ...current, location: e.target.value }))} />
              </label>
              <label>
                <span>Agenda</span>
                <textarea value={sessionForm.agenda} onChange={(e) => setSessionForm((current) => ({ ...current, agenda: e.target.value }))} rows={3} placeholder="One agenda item per line" />
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Prep notes</span>
                <textarea value={sessionForm.prepNotes} onChange={(e) => setSessionForm((current) => ({ ...current, prepNotes: e.target.value }))} rows={3} placeholder="One prep note per line" />
              </label>
              <label>
                <span>Attendance rules</span>
                <textarea value={sessionForm.attendanceRules} onChange={(e) => setSessionForm((current) => ({ ...current, attendanceRules: e.target.value }))} rows={3} placeholder="One rule per line" />
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="button button-primary">{editingSessionId ? 'Update session' : 'Create session'}</button>
              {editingSessionId ? <button type="button" className="button button-secondary" onClick={resetSessionForm}>Reset</button> : null}
            </div>
          </form>
        </div>

        {loading ? (
          <p>Loading sessions…</p>
        ) : (
          <div className="sessions-list">
            {sessions.map((session) => (
              <div key={session.id} className="session-group">
                <h3 className="session-date-header">{session.dayOfWeek}</h3>
                <div className="session-card">
                  <div className="session-date-block">
                    <p className="session-month">{session.month || 'Jun'}</p>
                    <p className="session-day">{session.date}</p>
                  </div>
                  <div className="session-content">
                    <h4 className="session-title">{session.title}</h4>
                    <div className="session-meta">
                      <span className="session-time">⏰ {session.time}</span>
                      <span className="session-location">📍 {session.location}</span>
                      <span className="session-group">👥 {session.group}</span>
                    </div>
                      <p className="session-enroll">Enrolled: {session.enrolledCount ?? session.enrollments?.length ?? 0}</p>
                      {session.prepNotes && session.prepNotes.length > 0 ? (
                        <div className="session-notes">
                          <strong>Prep notes:</strong>
                          <ul>
                            {session.prepNotes.map((note) => <li key={note}>{note}</li>)}
                          </ul>
                        </div>
                      ) : null}
                      {session.agenda && session.agenda.length > 0 ? (
                        <div className="session-notes">
                          <strong>Agenda:</strong>
                          <ul>
                            {session.agenda.map((item) => <li key={item}>{item}</li>)}
                          </ul>
                        </div>
                      ) : null}
                      {session.attendanceRules && session.attendanceRules.length > 0 ? (
                        <div className="session-notes">
                          <strong>Attendance rules:</strong>
                          <ul>
                            {session.attendanceRules.map((rule) => <li key={rule}>{rule}</li>)}
                          </ul>
                        </div>
                      ) : null}
                      {session.enrollments && session.enrollments.length > 0 ? (
                      <div className="enrolled-list">
                        <strong>Enrolled students:</strong>
                        <ul>
                          {session.enrollments.map((u: any) => (
                            <li key={u.email}>{u.name} — {new Date(u.enrolledAt).toLocaleString()}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                  <div className="session-actions">
                    <button className="button" onClick={() => handleEnroll(session.id)}>Enroll</button>
                    <button type="button" className="button button-secondary" onClick={() => loadSessionIntoForm(session)}>Edit</button>
                    <button type="button" className="button button-secondary action-danger" onClick={() => deleteSession(session.id)}>Delete</button>
                  </div>
                  <span className="session-status">{session.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Sessions;
