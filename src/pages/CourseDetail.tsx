import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';

type CourseDetailData = {
  id: number;
  code: string;
  category: string;
  title: string;
  description: string;
  image: string;
  level: string;
  deliveryMode: string;
  enrolledCount: number;
  isEnrolled: boolean;
  students: Array<{
    id: number;
    name: string;
    email: string;
    university: string;
    major: string;
    yearOfStudy: string;
    enrolledAt: string;
  }>;
  groups: Array<{
    id: number;
    name: string;
    course: string;
    courseCode: string;
    meetingType: string;
    members: number;
    image: string;
    description: string;
    sessionCount: number;
  }>;
  sessions: Array<{
    id: number;
    title: string;
    startsAt: string | null;
    location: string;
    group: string;
    courseCode: string;
    status: string;
    enrolledCount: number;
  }>;
};

const hubTabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'outline', label: 'Course outline' },
  { key: 'objectives', label: 'Learning goals' },
  { key: 'topics', label: 'Weekly topics' },
  { key: 'notes', label: 'Notes' },
  { key: 'quizzes', label: 'MCQs' },
  { key: 'papers', label: 'Past papers' },
  { key: 'groups', label: 'Study groups' },
  { key: 'sessions', label: 'Live sessions' },
  { key: 'students', label: 'Students enrolled' },
  { key: 'ask', label: 'Ask StudyLink AI' },
];

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['overview', 'outline', 'objectives', 'topics', 'notes', 'quizzes', 'papers', 'groups', 'sessions', 'students', 'ask'].includes(hash)) {
      setSelectedTab(hash);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;

    apiFetch(`/api/courses/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Course not found');
        }
        return response.json();
      })
      .then((data) => setCourse(data.course))
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [id]);

  const courseOverview = useMemo(() => {
    if (!course) return [];
    return [
      `${course.level} course at ${course.deliveryMode}`,
      `${course.enrolledCount} students currently enrolled`,
      `${course.students.length} course peers available`,
      `${course.groups.length} active study groups`,
      `${course.sessions.length} live sessions scheduled`,
    ];
  }, [course]);

  const weeklyTopics = useMemo(() => {
    if (!course) return [];
    return [
      `${course.title} introduction and foundations`,
      `Core concepts and terminology`,
      `Practical examples and course applications`,
      `Exam-focused review and practice`,
      `Revision checklist and study summary`,
    ];
  }, [course]);

  const learningObjectives = useMemo(() => {
    if (!course) return [];
    return [
      `Understand the fundamentals of ${course.title}`,
      `Apply key concepts from ${course.category} to real academic tasks`,
      `Connect theory to practical study and exam preparation`,
      `Use the course resources to solve past questions`,
    ];
  }, [course]);

  const courseNotes = useMemo(() => {
    if (!course) return [];
    return [
      {
        title: 'Lecture summary',
        description: `Core ideas from today’s ${course.title} lecture with definitions and examples.`,
      },
      {
        title: 'Revision sheet',
        description: 'A one-page study guide for exam preparation and quick topic review.',
      },
      {
        title: 'Problem-solving notes',
        description: 'Step-by-step examples for the most tested course concepts.',
      },
    ];
  }, [course]);

  const coursePdfs = useMemo(() => {
    if (!course) return [];
    return [
      {
        title: `${course.code} course outline`,
        description: 'Download the official course structure and weekly topic plan.',
        url: `https://example.com/${course.code}-outline.pdf`,
      },
      {
        title: `${course.code} revision checklist`,
        description: 'Key revision steps for every week of the semester.',
        url: `https://example.com/${course.code}-revision.pdf`,
      },
    ];
  }, [course]);

  const coursePapers = useMemo(() => {
    if (!course) return [];
    return [
      {
        title: 'Past paper: Midterm',
        description: 'Practice question set from previous midterm exams.',
        url: `https://example.com/${course.code}-midterm.pdf`,
      },
      {
        title: 'Past paper: Final exam',
        description: 'Final exam sample with worked answers and marking guide.',
        url: `https://example.com/${course.code}-final.pdf`,
      },
    ];
  }, [course]);

  const handleAskStudyLink = () => {
    if (!question.trim()) return;
    setIsAsking(true);
    setTimeout(() => {
      setAnswer(
        `Ask StudyLink: ${question.trim()}

` +
        `Review ${course?.title} notes, syllabus outline, and recent study groups to answer this question. ` +
        `Start with the course outline and weekly topics, then practice with MCQs and past papers for best results.`,
      );
      setIsAsking(false);
    }, 650);
  };

  const renderTabContent = () => {
    if (!course) {
      return <p>Course data is unavailable.</p>;
    }

    switch (selectedTab) {
      case 'overview':
        return (
          <div className="hub-section-grid">
            <div className="detail-panel">
              <h3>Course summary</h3>
              <p>{course.description}</p>
              <ul className="detail-list compact-list">
                {courseOverview.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="detail-action-row" style={{ marginTop: '1rem' }}>
                <button type="button" className="button button-secondary" onClick={() => setSelectedTab('ask')}>
                  Ask StudyLink AI about this course
                </button>
              </div>
            </div>
            <div className="detail-panel">
              <h3>Course details</h3>
              <div className="course-meta-grid">
                <div>
                  <span className="mini-label">Course code</span>
                  <strong>{course.code}</strong>
                </div>
                <div>
                  <span className="mini-label">Category</span>
                  <strong>{course.category}</strong>
                </div>
                <div>
                  <span className="mini-label">Level</span>
                  <strong>{course.level}</strong>
                </div>
                <div>
                  <span className="mini-label">Delivery</span>
                  <strong>{course.deliveryMode}</strong>
                </div>
              </div>
            </div>
          </div>
        );
      case 'outline':
        return (
          <div className="hub-section-grid">
            <div className="detail-panel">
              <h3>Course outline</h3>
              <p>This section is your central syllabus and weekly guide.</p>
              <ul className="detail-list compact-list">
                {weeklyTopics.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ul>
              <div className="detail-card-grid" style={{ marginTop: '1rem' }}>
                {coursePdfs.map((pdf) => (
                  <article key={pdf.title} className="detail-summary-card">
                    <strong>{pdf.title}</strong>
                    <p>{pdf.description}</p>
                    <a href={pdf.url} target="_blank" rel="noreferrer" className="button button-secondary button-sm">
                      Open PDF
                    </a>
                  </article>
                ))}
              </div>
              <div className="detail-action-row" style={{ marginTop: '1rem' }}>
                <button type="button" className="button button-primary">Save outline to library</button>
              </div>
            </div>
            <div className="detail-panel">
              <h3>Study checklist</h3>
              <ul className="detail-list compact-list">
                <li>Review the week-by-week topics.</li>
                <li>Save notes and practice resources.</li>
                <li>Join groups for peer review.</li>
                <li>Use Ask StudyLink for quick explanations.</li>
              </ul>
            </div>
          </div>
        );
      case 'objectives':
        return (
          <div className="detail-panel">
            <h3>Learning objectives</h3>
            <ul className="detail-list compact-list">
              {learningObjectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </div>
        );
      case 'topics':
        return (
          <div className="detail-panel">
            <h3>Weekly topics</h3>
            <ul className="detail-list compact-list">
              {weeklyTopics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </div>
        );
      case 'notes':
        return (
          <div className="detail-panel">
            <div className="section-header">
              <h3>Course notes</h3>
              <span className="panel-pill">Revision-ready</span>
            </div>
            <p>Organized notes for lecture summaries, exam revision, and fast concept review.</p>
            <div className="detail-card-grid">
              {courseNotes.map((note) => (
                <article key={note.title} className="detail-summary-card">
                  <strong>{note.title}</strong>
                  <p>{note.description}</p>
                  <button type="button" className="button button-secondary button-sm">Open note</button>
                </article>
              ))}
            </div>
          </div>
        );
      case 'quizzes':
        return (
          <div className="detail-panel">
            <h3>MCQs & quizzes</h3>
            <p>Practice course concepts with quick quiz sessions and review prompts.</p>
            <div className="detail-card-grid">
              <article className="detail-summary-card">
                <strong>Quiz practice</strong>
                <p>20 MCQs for immediate revision.</p>
              </article>
              <article className="detail-summary-card">
                <strong>Timed review</strong>
                <p>Fast-paced question rounds to test your memory.</p>
              </article>
            </div>
          </div>
        );
      case 'papers':
        return (
          <div className="detail-panel">
            <h3>Past papers</h3>
            <p>Link your past exams and solutions for exam-style practice.</p>
            <div className="detail-card-grid">
              {coursePapers.map((paper) => (
                <article key={paper.title} className="detail-summary-card">
                  <strong>{paper.title}</strong>
                  <p>{paper.description}</p>
                  <a href={paper.url} target="_blank" rel="noreferrer" className="button button-secondary button-sm">
                    Open paper
                  </a>
                </article>
              ))}
            </div>
          </div>
        );
      case 'groups':
        return (
          <div className="detail-panel">
            <h3>Study groups</h3>
            {course.groups.length === 0 ? (
              <p>No study groups have been created for this course yet.</p>
            ) : (
              <div className="detail-card-grid">
                {course.groups.map((group) => (
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
              <p>No live sessions are scheduled for this course yet.</p>
            ) : (
              <div className="detail-card-grid">
                {course.sessions.map((session) => (
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
            <div className="member-list">
              {course.students.map((student) => (
                <article key={student.id} className="member-list-card">
                  <div>
                    <strong>{student.name}</strong>
                    <p>{student.major || 'Student'} · {student.yearOfStudy || 'Active learner'}</p>
                  </div>
                  <div className="member-list-meta">
                    <span>{student.email}</span>
                    <span>{new Date(student.enrolledAt).toLocaleDateString()}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        );
      case 'ask':
        return (
          <div className="detail-panel">
            <h3>Ask StudyLink</h3>
            <p>Ask a question about the course, revision, or exam preparation.</p>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask StudyLink about this course..."
              className="studylink-input"
            />
            <div className="detail-action-row" style={{ marginTop: '1rem' }}>
              <button type="button" className="button button-primary" onClick={handleAskStudyLink} disabled={isAsking}>
                {isAsking ? 'Thinking…' : 'Get academic guidance'}
              </button>
            </div>
            {answer ? (
              <div className="detail-panel" style={{ marginTop: '1rem' }}>
                <strong>Answer</strong>
                <p style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap' }}>{answer}</p>
              </div>
            ) : null}
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
            <p className="workspace-eyebrow">{course.category}</p>
            <h1>{course.code}: {course.title}</h1>
            <p className="workspace-lead">{course.description}</p>
            <div className="detail-chip-row">
              <span className="detail-chip">{course.level}</span>
              <span className="detail-chip">{course.deliveryMode}</span>
              <span className="detail-chip">{course.enrolledCount} students</span>
            </div>
          </div>
          <div className="detail-action-row">
            <button type="button" className="button button-primary" onClick={() => setSelectedTab('ask')}>
              Ask StudyLink AI
            </button>
            <button type="button" className="button button-secondary" onClick={() => setSelectedTab('students')}>
              Students enrolled
            </button>
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
