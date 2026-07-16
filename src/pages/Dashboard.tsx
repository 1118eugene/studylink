import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../assets/images/api';

interface ActivityItem {
  id: string;
  title: string;
  meta: string;
  occurredAt: string;
  href: string;
}

function Dashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [classmates, setClassmates] = useState<any[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        const [coursesData, sessionsData, groupsData, resourcesData, classmatesData] = await Promise.all([
          apiFetch('/api/courses').then((response) => response.json()),
          apiFetch('/api/sessions').then((response) => response.json()),
          apiFetch('/api/groups').then((response) => response.json()),
          apiFetch('/api/resources').then((response) => response.json()),
          apiFetch('/api/classmates').then((response) => response.json()),
        ]);

        if (!mounted) {
          return;
        }

        const courseList = coursesData.courses || [];
        const sessionList = sessionsData.sessions || [];
        const groupList = groupsData.groups || [];
        const resourceList = resourcesData.resources || [];
        const classmatesList = classmatesData.classmates || [];

        setCourses(courseList);
        setSessions(sessionList);
        setGroups(groupList);
        setResources(resourceList);
        setClassmates(classmatesList);

        const [courseDetails, groupDetails, sessionDetails, resourceDetails] = await Promise.all([
          Promise.all(courseList.slice(0, 6).map(async (course: any) => {
            const response = await apiFetch(`/api/courses/${course.id}`);
            if (!response.ok) {
              return null;
            }
            const data = await response.json();
            return data.course;
          })),
          Promise.all(groupList.slice(0, 6).map(async (group: any) => {
            const response = await apiFetch(`/api/groups/${group.id}`);
            if (!response.ok) {
              return null;
            }
            const data = await response.json();
            return data.group;
          })),
          Promise.all(sessionList.slice(0, 6).map(async (session: any) => {
            const response = await apiFetch(`/api/sessions/${session.id}`);
            if (!response.ok) {
              return null;
            }
            const data = await response.json();
            return data.session;
          })),
          Promise.all(resourceList.slice(0, 4).map(async (resource: any) => {
            const response = await apiFetch(`/api/resources/${resource.id}`);
            if (!response.ok) {
              return null;
            }
            const data = await response.json();
            return data.resource;
          })),
        ]);

        if (!mounted) {
          return;
        }

        const courseActivity = courseDetails.flatMap((course: any) =>
          (course?.students || []).map((student: any) => ({
            id: `course-${course.id}-${student.id}-${student.enrolledAt}`,
            title: `${student.name} enrolled in ${course.code}`,
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
            title: `${attendee.name} enrolled in ${session.title}`,
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
        if (!mounted) {
          return;
        }

        setCourses([]);
        setSessions([]);
        setGroups([]);
        setResources([]);
        setClassmates([]);
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

  const stats = [
    { label: 'Courses enrolled', value: String(courses.filter((course) => course.isEnrolled).length), href: '/courses' },
    { label: 'Study groups', value: String(groups.length), href: '/groups' },
    { label: 'Upcoming sessions', value: String(sessions.length), href: '/sessions' },
    { label: 'Classmate matches', value: String(classmates.filter((student) => student.sharedCourses?.length > 0).length), href: '/discover' },
  ];

  const spotlightLinks = [
    { title: 'Study groups', description: 'Open saved group rosters, requirements, and member counts.', href: '/groups' },
    { title: 'Courses', description: 'Review enrolled students, related groups, and linked sessions.', href: '/courses' },
    { title: 'Sessions', description: 'Track attendance and run better-prepared study meetings.', href: '/sessions' },
    { title: 'Resources', description: 'Share reusable study material with visible access history.', href: '/resources' },
  ];

  return (
    <section className="dashboard-page workspace-page">
      <div className="container workspace-stack">
        <section className="workspace-hero workspace-hero-dashboard">
          <div>
            <p className="workspace-eyebrow">Dashboard</p>
            <h1>Your academic workspace now keeps courses, groups, sessions, and enrollments in one persistent flow.</h1>
            <p className="workspace-lead">
              This home view is no longer powered by temporary browser-only data. The sections below reflect saved
              memberships, enrollments, and activity that remain available after logout.
            </p>
          </div>
          <div className="hero-action-stack">
            <Link to="/courses" className="button button-primary">Open course directory</Link>
            <Link to="/groups" className="button button-secondary">Manage study groups</Link>
          </div>
        </section>

        <div className="stats-grid polished-stats-grid">
          {stats.map((stat) => (
            <Link key={stat.label} to={stat.href} className="stat-card stat-card-link">
              <div className="stat-content">
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
              </div>
              <span className="stat-link-arrow">View</span>
            </Link>
          ))}
        </div>

        <div className="dashboard-layout">
          <section className="dashboard-section dashboard-primary-panel">
            <div className="section-header">
              <h2>Recent activity</h2>
              <span className="panel-pill">Saved events</span>
            </div>

            {loading ? (
              <p>Loading dashboard activity...</p>
            ) : activity.length === 0 ? (
              <div className="empty-state">
                <p className="empty-text">No saved activity yet</p>
                <p className="empty-help">Enroll in courses, groups, sessions, or resources to start building a visible history.</p>
              </div>
            ) : (
              <div className="activity-feed">
                {activity.map((item) => (
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
              <h2>Workspace shortcuts</h2>
            </div>
            <div className="quick-actions quick-actions-grid">
              {spotlightLinks.map((item) => (
                <Link key={item.title} to={item.href} className="quick-action-btn quick-action-card">
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                  <span className="action-icon">Go</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="dashboard-layout">
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Course spotlight</h2>
              <Link to="/courses" className="view-all-link">Open all courses</Link>
            </div>
            <div className="detail-card-grid">
              {courses.slice(0, 3).map((course) => (
                <Link key={course.id} to={`/courses/${course.id}`} className="detail-summary-card">
                  <strong>{course.code}</strong>
                  <p>{course.title}</p>
                  <span>{course.enrolledCount} students · {course.relatedGroupCount} groups</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-header">
              <h2>Study groups</h2>
              <Link to="/groups" className="view-all-link">Open groups</Link>
            </div>
            <div className="detail-card-grid">
              {groups.slice(0, 3).map((group) => (
                <Link key={group.id} to={`/groups/${group.id}`} className="detail-summary-card">
                  <strong>{group.name}</strong>
                  <p>{group.courseCode || 'Study Group'}</p>
                  <span>{group.members} members · {group.sessionCount || 0} sessions</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="dashboard-layout">
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Upcoming sessions</h2>
              <Link to="/sessions" className="view-all-link">Open sessions</Link>
            </div>
            <div className="detail-card-grid">
              {sessions.slice(0, 3).map((session) => (
                <article key={session.id} className="detail-summary-card">
                  <strong>{session.title}</strong>
                  <p>{session.group || 'Study Session'}</p>
                  <span>{session.startsAt ? new Date(session.startsAt).toLocaleString() : session.time || 'Time pending'}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="section-header">
              <h2>Classmates to reconnect with</h2>
              <Link to="/discover" className="view-all-link">Open classmates</Link>
            </div>
            <div className="detail-card-grid">
              {classmates.slice(0, 3).map((classmate) => (
                <article key={classmate.id} className="detail-summary-card">
                  <strong>{classmate.name}</strong>
                  <p>{classmate.major || 'Student'} · {classmate.university || 'University'}</p>
                  <span>{classmate.sharedCourses?.length || 0} shared courses</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
