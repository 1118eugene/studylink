import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';
import { buildCourseContent, buildStudyLinkAiResponse, saveSupplementalEnrollmentCode } from '../lib/studylinkContent';

const hubTabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'notes', label: 'Notes' },
  { key: 'pdfs', label: 'PDFs' },
  { key: 'podcasts', label: 'Podcasts' },
  { key: 'videos', label: 'Videos' },
  { key: 'quizzes', label: 'MCQs' },
  { key: 'papers', label: 'Past papers' },
  { key: 'groups', label: 'Study groups' },
  { key: 'sessions', label: 'Live sessions' },
  { key: 'students', label: 'Students enrolled' },
  { key: 'ask', label: 'Ask StudyLink AI' },
];

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [question, setQuestion] = useState('Give me notes and revision guidance for the hardest topic in this course.');
  const [submittedQuestion, setSubmittedQuestion] = useState(question);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hubTabs.some((tab) => tab.key === hash)) {
      setSelectedTab(hash);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    apiFetch(`/api/courses/${id}`)
      .then((response) => response.ok ? response.json() : { course: null })
      .then((data) => setCourse(buildCourseContent(data.course || { id })))
      .catch(() => setCourse(buildCourseContent({ id })))
      .finally(() => setLoading(false));
  }, [id]);

  const resourcesByType = useMemo(() => {
    const resources = course?.resources || [];
    return {
      notes: resources.filter((resource: any) => resource.type === 'Note'),
      pdfs: resources.filter((resource: any) => resource.type === 'PDF' || resource.type === 'Guide'),
      podcasts: resources.filter((resource: any) => resource.type === 'Podcast'),
      videos: resources.filter((resource: any) => resource.type === 'Video'),
      quizzes: resources.filter((resource: any) => resource.type === 'MCQ'),
      papers: resources.filter((resource: any) => resource.type === 'Past Paper'),
    };
  }, [course]);

  const aiResponse = useMemo(
    () => buildStudyLinkAiResponse(submittedQuestion, course?.code),
    [course?.code, submittedQuestion],
  );

  const handleEnroll = async () => {
    if (!course) return;
    try {
      const response = await apiFetch(`/api/courses/${course.id}/enroll`, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Local enrollment fallback');
      }
      const data = await response.json();
      setCourse(buildCourseContent(data.course));
    } catch {
      saveSupplementalEnrollmentCode(course.code);
      setCourse((current: any) => current ? { ...current, isEnrolled: true, enrolledCount: Number(current.enrolledCount || 0) + 1 } : current);
    }
  };

  const renderResourceGrid = (items: any[], buttonLabel: string) => (
    <div className="detail-card-grid">
      {items.map((item) => (
        <article key={item.id} className="detail-summary-card">
          <strong>{item.title}</strong>
          <p>{item.description}</p>
          <span>{item.audience}</span>
          <button type="button" className="button button-secondary button-sm" onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}>
            {buttonLabel}
          </button>
        </article>
      ))}
    </div>
  );

  const renderTabContent = () => {
    if (!course) {
      return <p>Course data is unavailable.</p>;
    }

    switch (selectedTab) {
      case 'overview':
        return (
          <div className="hub-section-grid">
            <div className="detail-panel">
              <h3>Course support summary</h3>
              <p>{course.description}</p>
              <ul className="detail-list compact-list">
                <li>{course.school}</li>
                <li>{course.program}</li>
                <li>{course.level} · {course.deliveryMode}</li>
                <li>{course.resources.length} learning resources inside this hub</li>
                <li>{course.supportFocus}</li>
              </ul>
            </div>
            <div className="detail-panel">
              <h3>Why this hub matters</h3>
              <ul className="detail-list compact-list">
                {course.objectives.map((objective: string) => (
                  <li key={objective}>{objective}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      case 'notes':
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>Course notes</h3>
              <span className="panel-pill">{resourcesByType.notes.length}</span>
            </div>
            {renderResourceGrid(resourcesByType.notes, 'Open note')}
          </div>
        );
      case 'pdfs':
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>PDFs and guides</h3>
              <span className="panel-pill">{resourcesByType.pdfs.length}</span>
            </div>
            {renderResourceGrid(resourcesByType.pdfs, 'Open PDF')}
          </div>
        );
      case 'podcasts':
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>Learning podcasts</h3>
              <span className="panel-pill">{resourcesByType.podcasts.length}</span>
            </div>
            {renderResourceGrid(resourcesByType.podcasts, 'Open podcast guide')}
          </div>
        );
      case 'videos':
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>Video companions</h3>
              <span className="panel-pill">{resourcesByType.videos.length}</span>
            </div>
            {renderResourceGrid(resourcesByType.videos, 'Open video guide')}
          </div>
        );
      case 'quizzes':
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>MCQs and quiz drills</h3>
              <span className="panel-pill">{resourcesByType.quizzes.length}</span>
            </div>
            {renderResourceGrid(resourcesByType.quizzes, 'Open MCQ drill')}
          </div>
        );
      case 'papers':
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>Past papers</h3>
              <span className="panel-pill">{resourcesByType.papers.length}</span>
            </div>
            {renderResourceGrid(resourcesByType.papers, 'Open paper')}
          </div>
        );
      case 'groups':
        return (
          <div className="detail-panel">
            <h3>Study groups</h3>
            {course.groups.length === 0 ? (
              <p>Use the course resources first, then create or join a study group to discuss difficult topics together.</p>
            ) : (
              <div className="detail-card-grid">
                {course.groups.map((group: any) => (
                  <Link key={group.id} to={`/groups/${group.id}`} className="detail-summary-card">
                    <strong>{group.name}</strong>
                    <p>{group.description}</p>
                    <span>{group.members} members · {group.sessionCount} sessions</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      case 'sessions':
        return (
          <div className="detail-panel">
            <h3>Live sessions</h3>
            {course.sessions.length === 0 ? (
              <p>No live sessions are scheduled yet. Use StudyLink AI and the course resources while your study group plans the next review.</p>
            ) : (
              <div className="detail-card-grid">
                {course.sessions.map((session: any) => (
                  <article key={session.id} className="detail-summary-card">
                    <strong>{session.title}</strong>
                    <p>{session.group || 'Study session'}</p>
                    <span>{session.startsAt ? new Date(session.startsAt).toLocaleString() : 'Time pending'}</span>
                  </article>
                ))}
              </div>
            )}
          </div>
        );
      case 'students':
        return (
          <div className="detail-panel">
            <h3>Students enrolled</h3>
            {course.students.length === 0 ? (
              <p>This course hub is ready for learners. Enroll and start the peer-support cycle.</p>
            ) : (
              <div className="member-list">
                {course.students.map((student: any) => (
                  <article key={student.id} className="member-list-card">
                    <div>
                      <strong>{student.name}</strong>
                      <p>{student.major || 'Student'} · {student.yearOfStudy || 'Active learner'}</p>
                    </div>
                    <div className="member-list-meta">
                      <span>{student.email}</span>
                      <span>{student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString() : 'Recently enrolled'}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        );
      case 'ask':
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>Ask StudyLink AI</h3>
              <Link to={`/ask-ai?course=${encodeURIComponent(course.code)}`} className="button button-secondary button-sm">
                Open full AI workspace
              </Link>
            </div>
            <p>Ask for notes, explanations, revision plans, MCQs, or what to study next in this course.</p>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask StudyLink AI about this course..."
              className="studylink-input"
            />
            <div className="detail-action-row" style={{ marginTop: '1rem' }}>
              <button type="button" className="button button-primary" onClick={() => setSubmittedQuestion(question)}>
                Get academic guidance
              </button>
            </div>
            <div className="detail-panel" style={{ marginTop: '1rem' }}>
              <strong>{aiResponse.headline}</strong>
              <p style={{ marginTop: '0.75rem' }}>{aiResponse.explanation}</p>
              <ul className="detail-list compact-list">
                {aiResponse.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
            <div className="detail-card-grid" style={{ marginTop: '1rem' }}>
              {aiResponse.recommendedResources.map((resource) => (
                <article key={resource.id} className="detail-summary-card">
                  <strong>{resource.title}</strong>
                  <p>{resource.description}</p>
                  <button type="button" className="button button-secondary button-sm" onClick={() => window.open(resource.url, '_blank', 'noopener,noreferrer')}>
                    Open resource
                  </button>
                </article>
              ))}
            </div>
          </div>
        );
      default:
        return <p>Select a section to explore.</p>;
    }
  };

  if (loading) {
    return (
      <section className="workspace-page">
        <div className="container workspace-loading-card">
          <p>Loading course details...</p>
        </div>
      </section>
    );
  }

  if (!course) {
    return (
      <section className="workspace-page">
        <div className="container workspace-loading-card">
          <p>Course not found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <section className="hub-hero-card">
          <div>
            <p className="workspace-eyebrow">{course.school}</p>
            <h1>{course.code}: {course.title}</h1>
            <p className="workspace-lead">{course.description}</p>
            <div className="detail-chip-row">
              <span className="detail-chip">{course.level}</span>
              <span className="detail-chip">{course.deliveryMode}</span>
              <span className="detail-chip">{course.resources.length} resources</span>
            </div>
          </div>
          <div className="detail-action-row">
            <button type="button" className="button button-primary" onClick={handleEnroll}>
              {course.isEnrolled ? 'Enrolled' : 'Enroll in course'}
            </button>
            <Link to={`/ask-ai?course=${encodeURIComponent(course.code)}`} className="button button-secondary">
              Ask StudyLink AI
            </Link>
            <Link to="/courses" className="button button-secondary">Back to courses</Link>
          </div>
        </section>

        <div className="hub-tab-bar">
          {hubTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`hub-tab-button ${selectedTab === tab.key ? 'hub-tab-active' : ''}`}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="hub-section">
          {renderTabContent()}
        </div>
      </div>
    </section>
  );
}

export default CourseDetail;
