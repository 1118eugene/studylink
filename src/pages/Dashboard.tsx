import { useEffect, useState } from 'react';
import { apiFetch } from '../assets/images/api';

interface EnrollmentActivity {
  sessionId: number;
  sessionTitle: string;
  courseCode: string;
  name: string;
  email: string;
  enrolledAt: string;
}

function Dashboard() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [activity, setActivity] = useState<EnrollmentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadDashboard = async () => {
      try {
        const [sessionsResponse, groupsResponse, resourcesResponse] = await Promise.all([
          apiFetch('/api/sessions').then((r) => r.json()),
          apiFetch('/api/groups').then((r) => r.json()),
          apiFetch('/api/resources').then((r) => r.json()),
        ]);

        if (!mounted) return;

        const sessionList = sessionsResponse.sessions || [];
        const groupList = groupsResponse.groups || [];
        const resourceList = resourcesResponse.resources || [];

        setSessions(sessionList);
        setGroups(groupList);
        setResources(resourceList);

        const activityRows = await Promise.all(sessionList.map(async (session: any) => {
          const detailResponse = await apiFetch(`/api/sessions/${session.id}`);
          if (!detailResponse.ok) return [];
          const detailData = await detailResponse.json();
          return (detailData.session?.attendees || []).map((attendee: any) => ({
            sessionId: session.id,
            sessionTitle: session.title || detailData.session?.title || 'Session',
            courseCode: session.courseCode || '',
            name: attendee.name,
            email: attendee.email,
            enrolledAt: attendee.enrolledAt,
          }));
        }));

        if (!mounted) return;

        const flattened = activityRows
          .flat()
          .sort((left, right) => new Date(right.enrolledAt).getTime() - new Date(left.enrolledAt).getTime())
          .slice(0, 6);

        setActivity(flattened);
      } catch {
        if (!mounted) return;
        setSessions([]);
        setGroups([]);
        setResources([]);
        setActivity([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const totalEnrollments = sessions.reduce((sum, s) => sum + ((s.enrollments && s.enrollments.length) || 0), 0);
  const totalGroups = groups.length;
  const totalResources = resources.length;

  const stats = [
    { label: 'Study Groups', value: String(totalGroups) },
    { label: 'Sessions', value: String(sessions.length) },
    { label: 'Enrolled Students', value: String(totalEnrollments) },
    { label: 'Resources', value: String(totalResources) },
  ];

  const quickActions = [
    { label: 'Browse study groups', href: '/groups' },
    { label: 'Discover classmates', href: '/discover' },
    { label: 'Enrol in courses', href: '/courses' },
  ];

  return (
    <section className="dashboard-page">
      <div className="container">
        <h1>Home</h1>
        <p className="page-description">A private overview of live activity, academic groups, sessions, and resources.</p>

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
          <div className="dashboard-section dashboard-wide">
            <div className="section-header">
              <h2>Recent Enrollment Activity</h2>
              <span className="view-all-link">Live from the database</span>
            </div>

            {loading ? (
              <p>Loading activity…</p>
            ) : activity.length === 0 ? (
              <div className="empty-state">
                <p className="empty-text">No enrollment activity yet</p>
                <p className="empty-help">When someone enrols in a course, the event will appear here.</p>
              </div>
            ) : (
              <div className="activity-feed">
                {activity.map((item) => (
                  <article key={`${item.sessionId}-${item.email}-${item.enrolledAt}`} className="activity-card">
                    <div>
                      <p className="activity-title">{item.name} enrolled in {item.sessionTitle}</p>
                      <p className="activity-meta">{item.email} · {item.courseCode || 'No course code'} · {new Date(item.enrolledAt).toLocaleString()}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

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
                      const res = await apiFetch(`/api/sessions/${s.id}`);
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
                    <p className="session-enroll">Enrolled: {(s.enrolledCount ?? (s.enrollments && s.enrollments.length)) || 0}</p>
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
                    const res = await apiFetch(`/api/groups/${g.id}`);
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
                  <p>Members: {(g.members ?? (g.enrollments && g.enrollments.length)) || 0}</p>
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
                    const res = await apiFetch(`/api/resources/${r.id}`);
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
                  <p>Enrolled: {(r.downloads ?? (r.enrollments && r.enrollments.length)) || 0}</p>
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
                  {selectedSession.enrollments && selectedSession.enrollments.length > 0 ? (
                    <>
                      <p><strong>Enrolled students ({selectedSession.enrollments.length}):</strong></p>
                      <ul>
                        {selectedSession.enrollments.map((u: any) => (
                          <li key={u.email}>{u.name} — {u.email}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {selectedSession.membersList && selectedSession.membersList.length > 0 ? (
                    <>
                      <p><strong>Group members ({selectedSession.membersList.length}):</strong></p>
                      <ul>
                        {selectedSession.membersList.map((u: any) => (
                          <li key={u.email}>{u.name} — {u.email}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {selectedSession.attendees && selectedSession.attendees.length > 0 ? (
                    <>
                      <p><strong>Session attendees ({selectedSession.attendees.length}):</strong></p>
                      <ul>
                        {selectedSession.attendees.map((u: any) => (
                          <li key={u.email}>{u.name} — {u.email} — {new Date(u.enrolledAt).toLocaleString()}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
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
