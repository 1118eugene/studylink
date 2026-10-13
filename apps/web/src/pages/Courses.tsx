import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';
import { buildMergedCourses, saveSupplementalEnrollmentCode } from '../lib/studylinkContent';
import { Card, getCardCategory } from '../components/Card';
import PageHeader from '../components/PageHeader';
import { useToast } from '../context/ToastContext';

function Courses() {
  const notify = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(searchParams.get('school') || 'All schools');
  const [selectedProgram, setSelectedProgram] = useState(searchParams.get('program') || 'All programs');

  useEffect(() => {
    apiFetch('/api/courses')
      .then((response) => response.ok ? response.json() : { courses: [] })
      .then((data) => setCourses(buildMergedCourses(data.courses || [])))
      .catch(() => setCourses(buildMergedCourses([])))
      .finally(() => setLoading(false));
  }, []);

  const schools = useMemo(
    () => ['All schools', ...Array.from(new Set(courses.map((course) => course.school).filter(Boolean)))],
    [courses],
  );
  const programs = useMemo(() => {
    const filtered = selectedSchool === 'All schools'
      ? courses
      : courses.filter((course) => course.school === selectedSchool);
    return ['All programs', ...Array.from(new Set(filtered.map((course) => course.program).filter(Boolean)))];
  }, [courses, selectedSchool]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const schoolMatch = selectedSchool === 'All schools' || course.school === selectedSchool;
      const programMatch = selectedProgram === 'All programs' || course.program === selectedProgram;
      const searchMatch = [course.code, course.title, course.category, course.school, course.program, course.description]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return schoolMatch && programMatch && searchMatch;
    });
  }, [courses, searchTerm, selectedProgram, selectedSchool]);

  const handleEnroll = async (course: any) => {
    try {
      const response = await apiFetch(`/api/courses/${course.id}/enroll`, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Fallback to local enrollment');
      }

      const data = await response.json();
      const updatedCourse = data.course;
      setCourses((current) => current.map((item) => (
        String(item.code).toLowerCase() === String(updatedCourse.code).toLowerCase()
          ? { ...item, ...updatedCourse, isEnrolled: true }
          : item
      )));
      notify(`Enrolled in ${course.code}.`);
    } catch {
      try {
        saveSupplementalEnrollmentCode(course.code);
        setCourses((current) => current.map((item) => (
          item.code === course.code
            ? { ...item, isEnrolled: true, enrolledCount: Number(item.enrolledCount || 0) + 1 }
            : item
        )));
        notify(`Enrollment for ${course.code} was saved on this device and may not sync to your account.`);
      } catch {
        notify(`Could not save enrollment for ${course.code}. Please try again.`, 'error');
      }
    }
  };

  const enrolledCount = courses.filter((course) => course.isEnrolled).length;

  return (
    <section className="courses-page workspace-page">
      <div className="container workspace-stack">
        <PageHeader
          className="page-header--courses"
          eyebrow="Course Directory"
          title="Every enrolled class should give the learner notes, PDFs, podcasts, MCQs, and past-paper support."
          description="StudyLink now treats every course as a full study hub so students can move from confusion to revision, peer support, and guided AI help without leaving the platform."
          stats={[
            { value: courses.length, label: 'Course hubs' },
            { value: enrolledCount, label: 'My enrolled courses' },
            { value: courses.reduce((sum, course) => sum + (course.podcastCount || 0), 0), label: 'Podcast supports' },
          ]}
        />

        <section className="workspace-toolbar library-toolbar">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by course, school, program, or support topic"
            className="search-input"
            aria-label="Search courses by course, school, program, or support topic"
          />
          <select value={selectedSchool} onChange={(event) => {
            setSelectedSchool(event.target.value);
            setSelectedProgram('All programs');
          }} className="filter-select" aria-label="Filter courses by school">
            {schools.map((school) => (
              <option key={school} value={school}>{school}</option>
            ))}
          </select>
          <select value={selectedProgram} onChange={(event) => setSelectedProgram(event.target.value)} className="filter-select" aria-label="Filter courses by program">
            {programs.map((program) => (
              <option key={program} value={program}>{program}</option>
            ))}
          </select>
        </section>

        {loading ? (
          <div className="workspace-loading-card">
            <p>Loading course catalog...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card.Empty message="No courses match your search and filters." />
        ) : (
          <div className="course-showcase-grid">
            {filteredCourses.map((course) => (
              <Card key={`${course.code}-${course.id}`} variant="elevated" className="course-showcase-card" data-school-category={getCardCategory(course.school || course.category)}>
                <Card.Media src={course.image} alt={course.title} className="course-image" placeholder={<span>{course.code}</span>} />
                <Card.Body className="course-card-body">
                  <Card.Header
                    overline={course.code}
                    title={course.title}
                    subtitle={course.school}
                    trailing={<span className="course-level-badge">{course.level}</span>}
                  />
                  <div>
                    <p className="course-description">{course.description}</p>
                  </div>

                  <Card.Meta className="course-meta-grid">
                    <div>
                      <span className="mini-label">Program</span>
                      <strong>{course.program}</strong>
                    </div>
                    <div>
                      <span className="mini-label">Support focus</span>
                      <strong>{course.supportFocus}</strong>
                    </div>
                    <div>
                      <span className="mini-label">PDFs & Notes</span>
                      <strong>{(course.pdfCount || 0) + (course.noteCount || 0)}</strong>
                    </div>
                    <div>
                      <span className="mini-label">Podcasts</span>
                      <strong>{course.podcastCount || 0}</strong>
                    </div>
                  </Card.Meta>
                </Card.Body>

                <Card.Footer className="course-card-actions">
                    <Link to={`/courses/${course.id}`} className="button button-secondary">
                      Open course hub
                    </Link>
                    <Link to={`/ask-ai?course=${encodeURIComponent(course.code)}`} className="button button-secondary">
                      Ask StudyLink AI
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleEnroll(course)}
                      className={`button ${course.isEnrolled ? 'button-dark' : 'button-primary'}`}
                    >
                      {course.isEnrolled ? 'Enrolled' : 'Enroll now'}
                    </button>
                </Card.Footer>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Courses;
