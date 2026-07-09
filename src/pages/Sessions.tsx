import { useEffect, useState } from 'react';

interface EnrolledUser {
  email: string;
  name?: string;
  enrolledAt?: string | number;
}

interface Session {
  id: number;
  title: string;
  time?: string;
  location?: string;
  group?: string;
  date?: string;
  dayOfWeek?: string;
  status?: 'Upcoming' | string;
  enrollments?: EnrolledUser[];
}

function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sessions')
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const handleEnroll = async (id: number) => {
    const raw = localStorage.getItem('user');
    if (!raw) {
      alert('Please sign in to enroll in a session.');
      return;
    }

    const user = JSON.parse(raw);

    try {
      const res = await fetch(`/api/sessions/${id}/enroll`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user }) });
      if (!res.ok) throw new Error('Enroll failed');
      const data = await res.json();
      setSessions((prev) => prev.map((s) => (s.id === id ? data.session : s)));
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

        {loading ? (
          <p>Loading sessions…</p>
        ) : (
          <div className="sessions-list">
            {sessions.map((session) => (
              <div key={session.id} className="session-group">
                <h3 className="session-date-header">{session.dayOfWeek}</h3>
                <div className="session-card">
                  <div className="session-date-block">
                    <p className="session-month">Jun</p>
                    <p className="session-day">{session.date}</p>
                  </div>
                  <div className="session-content">
                    <h4 className="session-title">{session.title}</h4>
                    <div className="session-meta">
                      <span className="session-time">⏰ {session.time}</span>
                      <span className="session-location">📍 {session.location}</span>
                      <span className="session-group">👥 {session.group}</span>
                    </div>
                    <p className="session-enroll">Enrolled: {session.enrollments?.length ?? 0}</p>
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
