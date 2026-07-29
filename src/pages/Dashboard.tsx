import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';

type ActivityItem = {
  id: string;
  title: string;
  meta: string;
  occurredAt: string;
  href: string;
};

const announcementList = [
  { id: 'a1', title: 'New course outline templates are available.', detail: 'Course outline PDFs and weekly plans will help you keep every module organized.' },
  { id: 'a2', title: 'Create or join a study group for your current course.', detail: 'Structured groups improve exam preparation and keep your study time focused.' },
  { id: 'a3', title: 'Library search now surfaces notes, videos, and past papers.', detail: 'Open your library to filter by category and find what you need faster.' },
];

function Dashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const [coursesData, sessionsData, groupsData, resourcesData] = await Promise.all([
          apiFetch('/api/courses').then((response) => response.json()),
          apiFetch('/api/sessions').then((response) => response.json()),
          apiFetch('/api/groups').then((response) => response.json()),
          apiFetch('/api/resources').then((response) => response.json()),
        ]);

        if (!mounted) return;

        const courseList = coursesData.courses || [];
        const sessionList = sessionsData.sessions || [];
        const groupList = groupsData.groups || [];
        const resourceList = resourcesData.resources || [];

        setCourses(courseList);
        setSessions(sessionList);
        setGroups(groupList);
        setResources(resourceList);

        const [courseDetails, groupDetails, sessionDetails, resourceDetails] = await Promise.all([
          Promise.all(courseList.slice(0, 4).map(async (course: any) => {
            const response = await apiFetch(`/api/courses/${course.id}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.course;
          })),
          Promise.all(groupList.slice(0, 4).map(async (group: any) => {
            const response = await apiFetch(`/api/groups/${group.id}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.group;
          })),
          Promise.all(sessionList.slice(0, 4).map(async (session: any) => {
            const response = await apiFetch(`/api/sessions/${session.id}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.session;
          })),
          Promise.all(resourceList.slice(0, 4).map(async (resource: any) => {
            const response = await apiFetch(`/api/resources/${resource.id}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.resource;
          })),
        ]);

        const courseActivity = courseDetails.flatMap((course: any) =>
          (course?.students || []).map((student: any) => ({
            id: `course-${course.id}-${student.id}-${student.enrolledAt}`,
            title: `${student.name} is active in ${course.code}`,
            meta: `${course.title} · ${student.email}`,
            occurredAt: student.enrolledAt,
            href: `/courses/${course.id}`,
          })), 
        );

        const groupActivity = groupDetails.flatMap((group: any) =>
          (group?.membersList || []).map((member: any) => ({
            id: `group-${group.id}-${member.email}-${member.enrolledAt}`,
            title: `${member.name} joined ${group.name}`,
            meta: `${group.courseCode || 'Study Group'} · ${member.email}`,
            occurredAt: member.enrolledAt,
            href: `/groups/${group.id}`,
          })),
        );

        const sessionActivity = sessionDetails.flatMap((session: any) =>
          (session?.attendees || []).map((attendee: any) => ({
            id: `session-${session.id}-${attendee.email}-${attendee.enrolledAt}`,
            title: `${attendee.name} joined ${session.title}`,
            meta: `${session.group || 'Study Session'} · ${attendee.email}`,
            occurredAt: attendee.enrolledAt,
            href: '/sessions',
          })),
        );

        const resourceActivity = resourceDetails.flatMap((resource: any) =>
          (resource?.accesses || []).map((access: any) => ({
            id: `resource-${resource.id}-${access.email}-${access.enrolledAt}`,
            title: `${access.name} opened ${resource.title}`,
            meta: `${resource.type || 'Resource'} · ${access.email}`,
            occurredAt: access.enrolledAt,
            href: '/resources',
          })),
        );

        setActivity(
          [...courseActivity, ...groupActivity, ...sessionActivity, ...resourceActivity]
            .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
            .slice(0, 6),
        );
      } catch {
        if (!mounted) return;
        setCourses([]);
        setSessions([]);
        setGroups([]);
        setResources([]);
        setActivity([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = [
    { label: 'Courses enrolled', value: String(courses.filter((course) => course.isEnrolled).length), href: '/courses' },
    { label: 'Study groups', value: String(groups.length), href: '/groups' },
    { label: 'Upcoming sessions', value: String(sessions.length), href: '/sessions' },
    { label: 'Saved resources', value: String(resources.length), href: '/library' },
  ];

  const upcomingSessions = sessions.slice(0, 4);
  const recentActivity = activity.slice(0, 4);

  return (
    <section className="dashboard-page workspace-page">
      <div className="container workspace-stack">
        <section className="dashboard-summary-card">
          <div>
            <p className="workspace-eyebrow">Welcome back</p>
            <h1>StudyLink keeps your academic ecosystem compact and productive.</h1>
            <p className="workspace-lead">A slimmer dashboard with quick stats, upcoming sessions, and direct access to courses, library, and groups.</p>
          </div>
          <div className="dashboard-summary-actions">
            <Link to="/courses" className="button button-primary">Continue learning</Link>
            <Link to="/library" className="button button-secondary">Open library</Link>
          </div>
        </section>

        <div className="dashboard-stats-grid">
          {stats.map((stat) => (
            <Link key={stat.label} to={stat.href} className="stat-card stat-card-link compact-stat-card">
              <div className="stat-content">
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="dashboard-layout">
          <section className="dashboard-section dashboard-primary-panel">
            <div className="section-header">
              <h2>Recent activity</h2>
              <span className="panel-pill">Latest updates</span>
            </div>
            {loading ? (
              <div className="workspace-loading-card"><p>Loading dashboard activity…</p></div>
            ) : recentActivity.length === 0 ? (
              <div className="empty-state">
                <p className="empty-text">No recent activity available yet.</p>
                <p className="empty-help">Enroll in a course or join a study group to start tracking your academic actions.</p>
              </div>
            ) : (
              <div className="activity-feed">
                {recentActivity.map((item) => (
                  <Link key={item.id} to={item.href} className="activity-card activity-card-link">
                    <div>
                      <p className="activity-title">{item.title}</p>
                      <p className="activity-meta">{item.meta}</p>
                    </div>
                    <span className="activity-time">{new Date(item.occurredAt).toLocaleString()}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="dashboard-section">
            <div className="section-header">
              <h2>Upcoming sessions</h2>
              <Link to="/sessions" className="view-all-link">View sessions</Link>
            </div>
            {upcomingSessions.length === 0 ? (
              <div className="empty-state">
                <p className="empty-text">No upcoming sessions found.</p>
                <p className="empty-help">Create or join a study session to keep your calendar active.</p>
              </div>
            ) : (
              <div className="detail-card-grid">
                {upcomingSessions.map((session) => (
                  <article key={session.id} className="detail-summary-card">
                    <strong>{session.title}</strong>
                    <p>{session.group || 'Study session'}</p>
                    <span>{session.startsAt ? new Date(session.startsAt).toLocaleString() : session.time || 'Time pending'}</span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="dashboard-layout">
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Announcements</h2>
              <span className="panel-pill">Campus insights</span>
            </div>
            <div className="announcement-list">
              {announcementList.map((announcement) => (
                <article key={announcement.id} className="detail-summary-card">
                  <strong>{announcement.title}</strong>
                  <p>{announcement.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-header">
              <h2>Quick shortcuts</h2>
              <span className="panel-pill">Navigate faster</span>
            </div>
            <div className="quick-actions quick-actions-grid">
              <Link to="/courses" className="quick-action-btn quick-action-card">
                <div>
                  <strong>Courses</strong>
                  <p>Open your enrolled and available course catalog.</p>
                </div>
                <span className="action-icon">→</span>
              </Link>
              <Link to="/library" className="quick-action-btn quick-action-card">
                <div>
                  <strong>Library</strong>
                  <p>Find notes, PDFs, past papers, and curated resources.</p>
                </div>
                <span className="action-icon">→</span>
              </Link>
              <Link to="/courses" className="quick-action-btn quick-action-card">
                <div>
                  <strong>Ask StudyLink AI</strong>
                  <p>Open a course and ask the AI tutor for explanations, quizzes, and summaries.</p>
                </div>
                <span className="action-icon">→</span>
              </Link>
              <Link to="/groups" className="quick-action-btn quick-action-card">
                <div>
                  <strong>Study groups</strong>
                  <p>Review active groups and join collaborative sessions.</p>
                </div>
                <span className="action-icon">→</span>
              </Link>
              <Link to="/sessions" className="quick-action-btn quick-action-card">
                <div>
                  <strong>Sessions</strong>
                  <p>Check your upcoming sessions and join live review meetings.</p>
                </div>
                <span className="action-icon">→</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
