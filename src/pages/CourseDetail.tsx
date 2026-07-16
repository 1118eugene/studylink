import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../assets/images/api';

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

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }

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

  const handleEnroll = async () => {
    if (!course) {
      return;
    }

    try {
      const response = await apiFetch(`/api/courses/${course.id}/enroll`, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Enrollment failed');
      }

      const data = await response.json();
      setCourse(data.course);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      alert('Could not enroll in this course right now.');
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
        <section className="detail-hero-card">
          <img src={course.image} alt={course.title} className="detail-hero-image" />
          <div className="detail-hero-copy">
            <p className="workspace-eyebrow">{course.category}</p>
            <h1>{course.code}: {course.title}</h1>
            <p className="workspace-lead">{course.description}</p>

            <div className="detail-chip-row">
              <span className="detail-chip">{course.level}</span>
              <span className="detail-chip">{course.deliveryMode}</span>
              <span className="detail-chip">{course.enrolledCount} students</span>
            </div>

            <div className="detail-action-row">
              <button
                type="button"
                className={`button ${course.isEnrolled ? 'button-dark' : 'button-primary'}`}
                onClick={handleEnroll}
              >
                {course.isEnrolled ? 'Enrollment saved' : 'Enroll in this course'}
              </button>
              <Link to="/discover" className="button button-secondary">
                Find classmates
              </Link>
            </div>
          </div>
        </section>

        <div className="detail-layout">
          <section className="detail-panel">
            <div className="section-header">
              <h2>Students enrolled</h2>
              <span className="panel-pill">{course.students.length} members</span>
            </div>
            <div className="member-list">
              {course.students.map((student) => (
                <article key={`${student.id}-${student.email}`} className="member-list-card">
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
          </section>

          <section className="detail-panel">
            <div className="section-header">
              <h2>Related study groups</h2>
              <span className="panel-pill">{course.groups.length} groups</span>
            </div>
            <div className="detail-card-grid">
              {course.groups.map((group) => (
                <Link key={group.id} to={`/groups/${group.id}`} className="detail-summary-card">
                  <strong>{group.name}</strong>
                  <p>{group.description}</p>
                  <span>{group.members} members · {group.sessionCount} sessions</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="detail-panel">
          <div className="section-header">
            <h2>Upcoming sessions</h2>
            <span className="panel-pill">{course.sessions.length} scheduled</span>
          </div>
          <div className="detail-card-grid">
            {course.sessions.map((session) => (
              <article key={session.id} className="detail-summary-card">
                <strong>{session.title}</strong>
                <p>{session.group}</p>
                <span>
                  {session.startsAt ? new Date(session.startsAt).toLocaleString() : 'Date to be confirmed'}
                  {' '}· {session.enrolledCount} enrolled
                </span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default CourseDetail;
