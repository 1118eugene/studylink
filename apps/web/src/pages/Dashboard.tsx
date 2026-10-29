import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card';
import PageHeader from '../components/PageHeader';
import { apiFetch } from '../lib/apiClient';
import { getStoredUser } from '../lib/session';

type Course = {
  id: number;
  code: string;
  title: string;
  category?: string;
  isEnrolled: boolean;
  enrolledCount?: number;
};

type StudyGroup = {
  id: number;
  name: string;
  courseCode?: string;
  members: number;
  capacity: number | null;
  isMember: boolean;
  sessionCount: number;
};

type StudySession = {
  id: number;
  title: string;
  startsAt: string | null;
  status: string;
  group: string;
  courseCode: string;
  location: string;
  enrolledCount: number;
  isEnrolled: boolean;
};

type LearningResource = {
  id: number;
  title: string;
  type: string;
  courseCode: string;
  sourceNote: string;
  downloads: number;
};

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
};

type Profile = {
  user: {
    name: string;
    university: string;
    program: string;
    major: string;
    yearOfStudy: string;
    role: string;
  };
};

type AdminUser = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_suspended: boolean;
  created_at: string | null;
};

type ContentReport = {
  id: number;
  content_type: string;
  content_title: string | null;
  reason: string;
  status: string;
  created_at: string;
};

type AuditEvent = {
  id: number;
  actor_name: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  created_at: string;
  payload?: string | { responseHeadline?: string; reason?: string; details?: string } | null;
};

type ProviderStatus = {
  mode: string;
  connected: boolean;
  responseSource: string;
  externalRequestsTracked: boolean;
  curatedLinks: number;
  flaggedLinks: number;
};

type DashboardData = {
  courses: Course[];
  groups: StudyGroup[];
  sessions: StudySession[];
  resources: LearningResource[];
  myResources: LearningResource[];
  notifications: Notification[];
  health: { status: string; database: string };
  profile: Profile;
  users?: AdminUser[];
  reports?: ContentReport[];
  auditEvents?: AuditEvent[];
  provider?: ProviderStatus;
};

type Stat = {
  label: string;
  value: number;
  detail: string;
  href: string;
};

const functionalRequirements = [
  { id: 'FR1', label: 'Registration and sign-in', status: 'Implemented', href: '/profile' },
  { id: 'FR2', label: 'Profile and preferences', status: 'Implemented', href: '/profile' },
  { id: 'FR3', label: 'Course browsing and search', status: 'Implemented', href: '/courses' },
  { id: 'FR4', label: 'Course enrolment', status: 'Implemented', href: '/courses' },
  { id: 'FR5', label: 'Study group creation', status: 'Implemented', href: '/groups/new' },
  { id: 'FR6', label: 'Joining and leaving groups', status: 'Implemented', href: '/groups' },
  { id: 'FR7', label: 'Session scheduling', status: 'Implemented', href: '/sessions' },
  { id: 'FR8', label: 'Session responses and status', status: 'Implemented', href: '/sessions' },
  { id: 'FR9', label: 'Learning resources and provenance', status: 'Partially implemented', href: '/learning?view=resources' },
  { id: 'FR10', label: 'Content reporting', status: 'Implemented', href: '/admin/reports' },
  { id: 'FR11', label: 'Moderation and account suspension', status: 'Implemented', href: '/admin/users' },
  { id: 'FR12', label: 'Notifications and preferences', status: 'Implemented', href: '/profile' },
  { id: 'FR13', label: 'Optional AI study support', status: 'Local prototype; external provider not connected', href: '/ask-ai' },
  { id: 'FR14', label: 'Security audit logging', status: 'Partially implemented', href: '/admin/users' },
];

async function loadJson<T>(path: string): Promise<T> {
  const response = await apiFetch(path);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || `Unable to load ${path}.`);
  }
  return payload as T;
}

function isUpcoming(session: StudySession) {
  return Boolean(session.startsAt
    && new Date(session.startsAt).getTime() >= Date.now()
    && !session.status.toLowerCase().includes('cancel'));
}

function Dashboard() {
  const user = getStoredUser();
  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator';
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');
      try {
        const [courses, groups, sessions, resources, myResources, notifications, health, profile] = await Promise.all([
          loadJson<{ courses: Course[] }>('/api/courses'),
          loadJson<{ groups: StudyGroup[] }>('/api/groups'),
          loadJson<{ sessions: StudySession[] }>('/api/sessions'),
          loadJson<{ resources: LearningResource[] }>('/api/resources'),
          loadJson<{ resources: LearningResource[] }>('/api/my/resources'),
          loadJson<{ notifications: Notification[] }>('/api/notifications'),
          loadJson<{ status: string; database: string }>('/api/health'),
          loadJson<Profile>('/api/profile'),
        ]);

        const dashboard: DashboardData = {
          courses: courses.courses,
          groups: groups.groups,
          sessions: sessions.sessions,
          resources: resources.resources,
          myResources: myResources.resources,
          notifications: notifications.notifications,
          health,
          profile,
        };

        if (isAdmin) {
          const [users, reports, audit, provider] = await Promise.all([
            loadJson<{ users: AdminUser[] }>('/api/admin/users'),
            loadJson<{ reports: ContentReport[] }>('/api/admin/reports'),
            loadJson<{ events: AuditEvent[] }>('/api/admin/audit'),
            loadJson<{ provider: ProviderStatus }>('/api/admin/ai-provider'),
          ]);
          dashboard.users = users.users;
          dashboard.reports = reports.reports;
          dashboard.auditEvents = audit.events;
          dashboard.provider = provider.provider;
        } else if (isModerator) {
          const reports = await loadJson<{ reports: ContentReport[] }>('/api/admin/reports');
          dashboard.reports = reports.reports;
        }

        if (active) setData(dashboard);
      } catch (loadError) {
        if (active) {
          setData(null);
          setError(loadError instanceof Error ? loadError.message : 'Dashboard information could not be loaded.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadDashboard();
    return () => { active = false; };
  }, [isAdmin, isModerator]);

  const upcomingSessions = useMemo(
    () => (data?.sessions || [])
      .filter(isUpcoming)
      .sort((left, right) => new Date(left.startsAt || 0).getTime() - new Date(right.startsAt || 0).getTime()),
    [data?.sessions],
  );
  const unreadNotifications = data?.notifications.filter((notification) => !notification.read_at).length || 0;
  const pendingReports = data?.reports?.filter((report) => report.status === 'pending') || [];
  const displayUser = data?.profile.user || user;

  const stats: Stat[] = data ? isAdmin
    ? [
      { label: 'Registered accounts', value: data.users?.length || 0, detail: `${data.users?.filter((item) => item.role === 'student').length || 0} student accounts`, href: '/admin/users' },
      { label: 'Study groups in directory', value: data.groups.length, detail: `${data.groups.reduce((total, item) => total + item.members, 0)} memberships`, href: '/groups' },
      { label: 'Upcoming sessions', value: upcomingSessions.length, detail: `${data.sessions.length} scheduled in total`, href: '/sessions' },
      { label: 'Reports awaiting review', value: pendingReports.length, detail: 'Student-submitted moderation queue', href: '/admin/reports' },
      { label: 'Shared resources', value: data.resources.length, detail: `${data.resources.reduce((total, item) => total + item.downloads, 0)} recorded opens`, href: '/learning?view=resources' },
      { label: 'Suspended accounts', value: data.users?.filter((item) => item.is_suspended).length || 0, detail: 'Access can be restored by an administrator', href: '/admin/users' },
    ]
    : [
      { label: 'My courses', value: data.courses.filter((course) => course.isEnrolled).length, detail: `${data.courses.length} courses available`, href: '/courses' },
      { label: 'My study groups', value: data.groups.filter((group) => group.isMember).length, detail: `${data.groups.length} groups in the directory`, href: '/groups' },
      { label: 'My upcoming sessions', value: upcomingSessions.filter((session) => session.isEnrolled).length, detail: `${upcomingSessions.length} upcoming across StudyLink`, href: '/sessions' },
      { label: 'Saved resources', value: data.myResources.length, detail: `${data.resources.length} resources in the shared library`, href: '/learning?view=library' },
      { label: 'Unread notifications', value: unreadNotifications, detail: 'Based on your account preferences', href: '/profile' },
    ]
    : [];

  const title = isAdmin ? 'Administrator overview' : isModerator ? 'Moderator overview' : 'Your study overview';
  const description = isAdmin
    ? 'A live operational view of accounts, academic activity, moderation, audit events, and the optional AI integration.'
    : 'Your enrolled courses, study groups, scheduled sessions, saved resources, and account notifications in one place.';

  return (
    <section className="dashboard-page workspace-page">
      <div className="container workspace-stack">
        <PageHeader
          className="page-header--dashboard"
          eyebrow={`${displayUser?.role || 'student'} workspace · ${displayUser?.university || 'StudyLink'}`}
          title={title}
          description={description}
          stats={[
            { label: 'Signed in as', value: displayUser?.name || 'StudyLink user' },
            { label: 'Programme', value: displayUser?.program || displayUser?.major || displayUser?.yearOfStudy || 'Not set in profile' },
          ]}
          actions={(
            <div className="dashboard-summary-actions">
              <Link to="/profile" className="button button-secondary">Review my profile</Link>
              {isAdmin ? <Link to="/admin/ai-provider" className="button button-primary">AI service console</Link> : <Link to="/ask-ai" className="button button-primary">Open StudyLink AI</Link>}
            </div>
          )}
        />

        {error ? (
          <div className="dashboard-error" role="alert">
            <strong>Dashboard data is unavailable.</strong>
            <p>{error}</p>
            <button type="button" className="button button-secondary button-sm" onClick={() => window.location.reload()}>Reload dashboard</button>
          </div>
        ) : null}

        {loading ? <div className="workspace-loading-card" role="status">Loading your latest dashboard information…</div> : null}

        {data && !loading ? (
          <>
            <section aria-label="Dashboard summary">
              <div className="dashboard-stats-grid">
                {stats.map((stat) => (
                  <Link key={stat.label} to={stat.href} className="stat-card stat-card-link dashboard-stat-detail">
                    <div className="stat-content">
                      <p className="stat-label">{stat.label}</p>
                      <p className="stat-value">{stat.value}</p>
                      <span className="dashboard-stat-caption">{stat.detail}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {isAdmin ? (
              <AdminDashboard data={data} upcomingSessions={upcomingSessions} pendingReports={pendingReports} />
            ) : (
              <StudentDashboard
                data={data}
                upcomingSessions={upcomingSessions.filter((session) => session.isEnrolled)}
                unreadNotifications={unreadNotifications}
                isModerator={isModerator}
              />
            )}

            <section className="detail-panel dashboard-service-panel">
              <div className="section-header">
                <div>
                  <p className="workspace-eyebrow">External actor · AI Provider</p>
                  <h2>StudyLink AI service and privacy status</h2>
                </div>
                <span className="dashboard-status-pill dashboard-status-limited">Optional prototype</span>
              </div>
              <p>
                The report defines the AI provider as an external service—not a person who signs in to StudyLink.
                The current app generates course guidance from its local catalogue and curated links; no external
                AI provider is connected, and no student prompt is sent to one.
              </p>
              {isAdmin && data.provider ? (
                <div className="dashboard-detail-grid">
                  <StatusDetail label="Provider connection" value={data.provider.connected ? 'Connected' : 'Not connected'} />
                  <StatusDetail label="Current response source" value={data.provider.responseSource} />
                  <StatusDetail label="Saved curated links" value={data.provider.curatedLinks} />
                  <StatusDetail label="Links flagged for review" value={data.provider.flaggedLinks} />
                  <StatusDetail label="External prompt requests" value={data.provider.externalRequestsTracked ? 'Tracked' : 'Not applicable; no provider connected'} />
                  <StatusDetail label="AI support mode" value={data.provider.mode} />
                </div>
              ) : null}
              <div className="detail-action-row">
                <Link to="/ask-ai" className="button button-secondary button-sm">Review student AI support</Link>
                {isAdmin ? <Link to="/admin/ai-provider" className="button button-primary button-sm">Open integration details</Link> : null}
              </div>
            </section>

            {isAdmin ? <RequirementCoverage /> : null}
          </>
        ) : null}
      </div>
    </section>
  );
}

function StudentDashboard({
  data,
  upcomingSessions,
  unreadNotifications,
  isModerator,
}: {
  data: DashboardData;
  upcomingSessions: StudySession[];
  unreadNotifications: number;
  isModerator: boolean;
}) {
  const enrolledCourses = data.courses.filter((course) => course.isEnrolled);
  const joinedGroups = data.groups.filter((group) => group.isMember);
  const latestNotifications = data.notifications.slice(0, 5);

  return (
    <>
      {isModerator ? (
        <section className="detail-panel">
          <div className="section-header">
            <h2>Moderation workload</h2>
            <Link to="/admin/reports" className="view-all-link">Open report queue</Link>
          </div>
          <p>{data.reports?.filter((report) => report.status === 'pending').length || 0} reports currently await review.</p>
        </section>
      ) : null}

      <div className="dashboard-layout">
        <section className="detail-panel">
          <div className="section-header">
            <h2>My courses and study groups</h2>
            <Link to="/courses" className="view-all-link">Browse courses</Link>
          </div>
          {enrolledCourses.length === 0 && joinedGroups.length === 0 ? (
            <p className="dashboard-empty-copy">You are not enrolled in a course or study group yet. Browse courses or discover a group to get started.</p>
          ) : (
            <div className="dashboard-record-list">
              {enrolledCourses.map((course) => (
                <Link key={course.id} to={`/courses/${course.id}`} className="dashboard-record-row">
                  <span><strong>{course.code}</strong><small>{course.title}</small></span>
                  <span className="dashboard-record-meta">{course.category || 'Course hub'}</span>
                </Link>
              ))}
              {joinedGroups.map((group) => (
                <Link key={group.id} to={`/groups/${group.id}`} className="dashboard-record-row">
                  <span><strong>{group.name}</strong><small>{group.courseCode || 'Study group'}</small></span>
                  <span className="dashboard-record-meta">{group.members}{group.capacity ? ` / ${group.capacity}` : ''} members</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="detail-panel">
          <div className="section-header">
            <h2>My upcoming sessions</h2>
            <Link to="/sessions" className="view-all-link">Open calendar</Link>
          </div>
          {upcomingSessions.length === 0 ? <p className="dashboard-empty-copy">No future sessions you have joined. Check your groups to find the next study session.</p> : (
            <div className="dashboard-record-list">
              {upcomingSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="dashboard-record-row dashboard-record-static">
                  <span><strong>{session.title}</strong><small>{session.group} · {session.courseCode || 'Study group'}</small></span>
                  <span className="dashboard-record-meta">{session.startsAt ? new Date(session.startsAt).toLocaleString() : 'Time not set'}<br />{session.location || 'Location to be confirmed'}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="dashboard-layout">
        <section className="detail-panel">
          <div className="section-header">
            <h2>Notifications</h2>
            <span className="panel-pill">{unreadNotifications} unread</span>
          </div>
          {latestNotifications.length === 0 ? <p className="dashboard-empty-copy">No account notifications are available yet.</p> : (
            <div className="dashboard-record-list">
              {latestNotifications.map((notification) => (
                <div key={notification.id} className="dashboard-record-row dashboard-record-static">
                  <span><strong>{notification.title}</strong><small>{notification.message}</small></span>
                  <span className="dashboard-record-meta">{new Date(notification.created_at).toLocaleString()}<br />{notification.read_at ? 'Read' : 'Unread'} · {notification.type}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="detail-panel">
          <div className="section-header">
            <h2>Saved learning resources</h2>
            <Link to="/learning?view=library" className="view-all-link">Open Learning Hub</Link>
          </div>
          {data.myResources.length === 0 ? <p className="dashboard-empty-copy">Your saved-resource list is empty. Open a shared resource to add it to your library.</p> : (
            <div className="dashboard-record-list">
              {data.myResources.slice(0, 5).map((resource) => (
                <Link key={resource.id} to={`/resources/${resource.id}`} className="dashboard-record-row">
                  <span><strong>{resource.title}</strong><small>{resource.courseCode || 'Unassigned course'} · {resource.type}</small></span>
                  <span className="dashboard-record-meta">{resource.sourceNote || 'Source note not provided'}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function AdminDashboard({
  data,
  upcomingSessions,
  pendingReports,
}: {
  data: DashboardData;
  upcomingSessions: StudySession[];
  pendingReports: ContentReport[];
}) {
  const recentAudit = data.auditEvents || [];
  const users = data.users || [];

  return (
    <>
      <div className="dashboard-layout">
        <section className="detail-panel">
          <div className="section-header">
            <h2>Moderation queue</h2>
            <Link to="/admin/reports" className="view-all-link">Review all reports</Link>
          </div>
          {pendingReports.length === 0 ? <p className="dashboard-empty-copy">No content reports are waiting for review.</p> : (
            <div className="dashboard-record-list">
              {pendingReports.slice(0, 5).map((report) => (
                <Link key={report.id} to="/admin/reports" className="dashboard-record-row">
                  <span><strong>{report.content_title || 'Content report'}</strong><small>{report.content_type} · {report.reason}</small></span>
                  <span className="dashboard-record-meta">{new Date(report.created_at).toLocaleString()}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="detail-panel">
          <div className="section-header">
            <h2>Upcoming academic sessions</h2>
            <Link to="/sessions" className="view-all-link">View sessions</Link>
          </div>
          {upcomingSessions.length === 0 ? <p className="dashboard-empty-copy">There are no upcoming sessions with a future date.</p> : (
            <div className="dashboard-record-list">
              {upcomingSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="dashboard-record-row dashboard-record-static">
                  <span><strong>{session.title}</strong><small>{session.group} · {session.courseCode || 'Study group'}</small></span>
                  <span className="dashboard-record-meta">{new Date(session.startsAt || '').toLocaleString()}<br />{session.enrolledCount} enrolled</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="dashboard-layout">
        <section className="detail-panel">
          <div className="section-header">
            <h2>Recent audit events</h2>
            <Link to="/admin/users" className="view-all-link">Manage accounts</Link>
          </div>
          {recentAudit.length === 0 ? <p className="dashboard-empty-copy">No audit events have been recorded yet.</p> : (
            <div className="dashboard-record-list">
              {recentAudit.slice(0, 8).map((event) => (
                <div key={event.id} className="dashboard-record-row dashboard-record-static">
                  <span>
                    <strong>{event.action.replace(/_/g, ' ')}</strong>
                    <small>{event.actor_name || 'Former or unknown user'} · {event.entity_type} #{event.entity_id}</small>
                    {getAiReportSummary(event.payload)}
                  </span>
                  <span className="dashboard-record-meta">{new Date(event.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="detail-panel">
          <div className="section-header">
            <h2>User access and account status</h2>
            <Link to="/admin/users" className="view-all-link">Open user administration</Link>
          </div>
          <div className="dashboard-record-list">
            {users.slice(0, 8).map((adminUser) => (
              <div key={`${adminUser.id}-${adminUser.email}`} className="dashboard-record-row dashboard-record-static">
                <span><strong>{adminUser.full_name}</strong><small>{adminUser.email}</small></span>
                <span className={`dashboard-status-pill ${adminUser.is_suspended ? 'dashboard-status-limited' : 'dashboard-status-ok'}`}>
                  {adminUser.role} · {adminUser.is_suspended ? 'Suspended' : 'Active'}
                </span>
              </div>
            ))}
            {users.length === 0 ? <p className="dashboard-empty-copy">No user accounts were returned.</p> : null}
          </div>
        </section>
      </div>

      <section className="detail-panel">
        <div className="section-header">
          <div>
            <p className="workspace-eyebrow">Live service checks</p>
            <h2>Application and data health</h2>
          </div>
          <span className={`dashboard-status-pill ${data.health.status === 'ok' ? 'dashboard-status-ok' : 'dashboard-status-limited'}`}>
            API {data.health.status}
          </span>
        </div>
        <div className="dashboard-detail-grid">
          <StatusDetail label="API status" value={data.health.status} />
          <StatusDetail label="Database adapter" value={data.health.database} />
          <StatusDetail label="Student accounts" value={users.filter((item) => item.role === 'student').length} />
          <StatusDetail label="Administrator / moderator accounts" value={users.filter((item) => item.role !== 'student').length} />
          <StatusDetail label="Groups and memberships" value={`${data.groups.length} groups · ${data.groups.reduce((total, item) => total + item.members, 0)} memberships`} />
          <StatusDetail label="Resources and recorded opens" value={`${data.resources.length} resources · ${data.resources.reduce((total, item) => total + item.downloads, 0)} opens`} />
        </div>
      </section>
    </>
  );
}

function getAiReportSummary(payload: AuditEvent['payload']) {
  if (!payload) return null;
  let details = payload;
  if (typeof payload === 'string') {
    try {
      details = JSON.parse(payload) as Exclude<AuditEvent['payload'], string | null | undefined>;
    } catch {
      return null;
    }
  }
  if (!details || typeof details !== 'object' || !('reason' in details)) return null;
  const report = details as { responseHeadline?: string; reason?: string; details?: string };
  return (
    <small>
      {report.responseHeadline || 'AI response'} · {report.reason || 'Reason not supplied'}
      {report.details ? ` · ${report.details}` : ''}
    </small>
  );
}

function RequirementCoverage() {
  return (
    <details className="detail-panel dashboard-requirements">
      <summary>
        <span>
          <strong>Report-to-app coverage</strong>
          <small>Functional requirements FR1–FR14 and their current prototype status</small>
        </span>
        <span className="panel-pill">14 requirements</span>
      </summary>
      <div className="dashboard-requirement-list">
        {functionalRequirements.map((requirement) => (
          <Link key={requirement.id} to={requirement.href} className="dashboard-requirement-row">
            <strong>{requirement.id}</strong>
            <span>{requirement.label}</span>
            <span className={`dashboard-status-pill ${requirement.status === 'Implemented' ? 'dashboard-status-ok' : 'dashboard-status-limited'}`}>
              {requirement.status}
            </span>
          </Link>
        ))}
      </div>
      <p className="dashboard-requirement-note">
        Statuses reflect the current prototype and the project traceability record. In particular, the report’s
        external AI provider is not connected, resource storage still needs durable deployment storage, and audit
        coverage remains incomplete.
      </p>
    </details>
  );
}

function StatusDetail({ label, value }: { label: string; value: string | number }) {
  return (
    <Card variant="outlined" className="dashboard-detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </Card>
  );
}

export default Dashboard;
