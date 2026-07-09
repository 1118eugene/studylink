import { useEffect, useState } from 'react';

interface SessionSummary {
  id: number;
  title?: string;
  enrollments?: number;
}

function Dashboard() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch('/api/sessions').then((r) => r.json()),
      fetch('/api/groups').then((r) => r.json()),
      fetch('/api/resources').then((r) => r.json()),
    ])
      .then(([sData, gData, rData]) => {
        if (!mounted) return;
        setSessions(sData.sessions || []);
        setGroups(gData.groups || []);
        setResources(rData.resources || []);
      })
      .catch(() => {
        if (!mounted) return;
        setSessions([]);
        setGroups([]);
        setResources([]);
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const [groups, setGroups] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  const totalEnrollments = sessions.reduce((sum, s) => sum + ((s.enrollments && s.enrollments.length) || 0), 0);

  const stats = [
    { label: 'Study Groups', value: '0' },
    { label: 'Sessions', value: String(sessions.length) },
    { label: 'Enrolled Students', value: String(totalEnrollments) },
    { label: 'Resources', value: '0' },
  ];

  const quickActions = [
    { label: 'Browse study groups', href: '/groups' },
    { label: 'Discover classmates', href: '/discover' },
    { label: 'Enrol in courses', href: '/courses' },
  ];

  return (
    <section className="dashboard-page">
      <div className="container">
        <h1>Dashboard</h1>

        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="stat-icon" aria-hidden="true">•</div>
              <div className="stat-content">
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-sections">
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Upcoming Sessions</h2>
              <a href="/sessions" className="view-all-link">View all →</a>
            </div>

            {loading ? (
              <p>Loading sessions…</p>
            ) : sessions.length === 0 ? (
              <div className="empty-state">
                <p className="empty-icon" aria-hidden="true">•</p>
                <p className="empty-text">No upcoming sessions</p>
                <p className="empty-help">Join a group to get started</p>
              </div>
            ) : (
              <div className="session-previews">
                {sessions.slice(0, 3).map((s) => (
                  <div key={s.id} className="session-preview" onClick={async () => {
                    try {
                      const res = await fetch(`/api/sessions/${s.id}`);
                      if (!res.ok) throw new Error('Failed');
                      const data = await res.json();
                      setSelectedSession(data.session);
                    } catch (err) {
                      // eslint-disable-next-line no-console
                      console.error(err);
                      alert('Failed to load session details');
                    }
                  }} style={{ cursor: 'pointer' }}>
                    <h4>{s.title || 'Session'}</h4>
                    <p className="session-enroll">Enrolled: {(s.enrollments && s.enrollments.length) || 0}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dashboard-section">
            <div className="section-header"><h2>Study Groups</h2></div>
            <div className="group-previews">
              {groups.slice(0, 3).map((g) => (
                <div key={g.id} className="group-preview" onClick={async () => {
                  try {
                    const res = await fetch(`/api/groups/${g.id}`);
                    if (!res.ok) throw new Error('Failed');
                    const data = await res.json();
                    setSelectedSession(data.group);
                  } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error(err);
                    alert('Failed to load group details');
                  }
                }} style={{ cursor: 'pointer' }}>
                  <h4>{g.name}</h4>
                  <p>Members: {(g.enrollments && g.enrollments.length) || 0}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-header"><h2>Resources</h2></div>
            <div className="resource-previews">
              {resources.slice(0, 3).map((r) => (
                <div key={r.id} className="resource-preview" onClick={async () => {
                  try {
                    const res = await fetch(`/api/resources/${r.id}`);
                    if (!res.ok) throw new Error('Failed');
                    const data = await res.json();
                    setSelectedSession(data.resource);
                  } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error(err);
                    alert('Failed to load resource details');
                  }
                }} style={{ cursor: 'pointer' }}>
                  <h4>{r.title}</h4>
                  <p>Enrolled: {(r.enrollments && r.enrollments.length) || 0}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              {quickActions.map((action) => (
                <a key={action.label} href={action.href} className="quick-action-btn">
                  <span className="action-icon" aria-hidden="true">→</span>
                  <span>{action.label}</span>
                </a>
              ))}
            </div>
          </div>
          {selectedSession ? (
            <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{selectedSession.title}</h3>
                  <button onClick={() => setSelectedSession(null)}>Close</button>
                </div>
                <div className="modal-body">
                  <p><strong>Enrolled students ({(selectedSession.enrollments && selectedSession.enrollments.length) || 0}):</strong></p>
                  <ul>
                    {(selectedSession.enrollments || []).map((u: any) => (
                      <li key={u.email}>{u.name} — {u.email}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
