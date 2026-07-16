import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../assets/images/api';

type Course = {
  id: number;
  code: string;
  category: string;
  title: string;
  description: string;
  image: string;
  level: string;
  deliveryMode: string;
  enrolledCount: number;
  relatedGroupCount: number;
  upcomingSessionCount: number;
  isEnrolled: boolean;
};

function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All categories');

  useEffect(() => {
    apiFetch('/api/courses')
      .then((response) => response.json())
      .then((data) => setCourses(data.courses || []))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ['All categories', ...Array.from(new Set(courses.map((course) => course.category)))],
    [courses],
  );

  const filteredCourses = selectedCategory === 'All categories'
    ? courses
    : courses.filter((course) => course.category === selectedCategory);

  const totalEnrollments = courses.reduce((sum, course) => sum + course.enrolledCount, 0);

  const handleEnroll = async (courseId: number) => {
    try {
      const response = await apiFetch(`/api/courses/${courseId}/enroll`, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Enrollment failed');
      }

      const data = await response.json();
      const updatedCourse = data.course;
      setCourses((current) => current.map((course) => (course.id === updatedCourse.id ? updatedCourse : course)));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      alert('Could not save your course enrollment. Please try again.');
    }
  };

  return (
    <section className="courses-page workspace-page">
      <div className="container workspace-stack">
        <section className="workspace-hero workspace-hero-courses">
          <div>
            <p className="workspace-eyebrow">Course Directory</p>
            <h1>Enroll once, keep your academic progress saved, and open the right study spaces faster.</h1>
            <p className="workspace-lead">
              Every course below is now connected to the backend, so enrollments, related study groups,
              and classmate discovery remain available even after you sign out.
            </p>
          </div>
          <div className="hero-stat-grid">
            <article className="hero-stat-card">
              <span className="hero-stat-value">{courses.length}</span>
              <span className="hero-stat-label">Active courses</span>
            </article>
            <article className="hero-stat-card">
              <span className="hero-stat-value">{totalEnrollments}</span>
              <span className="hero-stat-label">Saved enrollments</span>
            </article>
            <article className="hero-stat-card">
              <span className="hero-stat-value">{courses.filter((course) => course.isEnrolled).length}</span>
              <span className="hero-stat-label">My courses</span>
            </article>
          </div>
        </section>

        <section className="workspace-toolbar">
          <div>
            <h2>Explore the catalog</h2>
            <p>Choose a course and keep it linked to your account for dashboard insights and classmate matching.</p>
          </div>
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="filter-select"
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </section>

        {loading ? (
          <div className="workspace-loading-card">
            <p>Loading course catalog...</p>
          </div>
        ) : (
          <div className="course-showcase-grid">
            {filteredCourses.map((course) => (
              <article key={course.id} className="course-showcase-card">
                <img className="course-image" src={course.image} alt={course.title} loading="lazy" />
                <div className="course-card-body">
                  <div className="course-card-topline">
                    <div>
                      <p className="course-code">{course.code}</p>
                      <p className="course-category">{course.category}</p>
                    </div>
                    <span className="course-level-badge">{course.level}</span>
                  </div>

                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-description">{course.description}</p>

                  <div className="course-meta-grid">
                    <div>
                      <span className="mini-label">Delivery</span>
                      <strong>{course.deliveryMode}</strong>
                    </div>
                    <div>
                      <span className="mini-label">Students</span>
                      <strong>{course.enrolledCount}</strong>
                    </div>
                    <div>
                      <span className="mini-label">Groups</span>
                      <strong>{course.relatedGroupCount}</strong>
                    </div>
                    <div>
                      <span className="mini-label">Sessions</span>
                      <strong>{course.upcomingSessionCount}</strong>
                    </div>
                  </div>

                  <div className="course-card-actions">
                    <Link to={`/courses/${course.id}`} className="button button-secondary">
                      View details
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleEnroll(course.id)}
                      className={`button ${course.isEnrolled ? 'button-dark' : 'button-primary'}`}
                    >
                      {course.isEnrolled ? 'Enrolled' : 'Enroll now'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Courses;
