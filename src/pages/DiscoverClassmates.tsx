import { useState } from 'react';

interface Student {
  id: number;
  name: string;
  initials: string;
  university: string;
  courses: string[];
}

function DiscoverClassmates() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All courses');

  const students: Student[] = [
    {
      id: 1,
      name: 'Talemwa Violet',
      initials: 'T',
      university: 'USIU-Africa',
      courses: ['CS101', 'CS201', 'APT3065'],
    },
    {
      id: 2,
      name: 'Eugene Juma',
      initials: 'E',
      university: 'USIU-Africa',
      courses: ['CS201', 'CS301', 'APT3065'],
    },
    {
      id: 3,
      name: 'Amina Hassan',
      initials: 'A',
      university: 'USIU-Africa',
      courses: ['CS101', 'MATH101'],
    },
    {
      id: 4,
      name: 'Brian Otieno',
      initials: 'B',
      university: 'USIU-Africa',
      courses: ['CS201', 'CS401'],
    },
    {
      id: 5,
      name: 'Cynthia Wanjiku',
      initials: 'C',
      university: 'USIU-Africa',
      courses: ['CS101', 'CS301'],
    },
    {
      id: 6,
      name: 'Eugene onyango Juma',
      initials: 'E',
      university: 'USIU-Africa',
      courses: ['CS201', 'CS301', 'APT3065'],
    },
  ];

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="discover-page">
      <div className="container">
        <div className="page-header">
          <h1>Discover Classmates</h1>
          <p className="page-description">
            Find students taking the same courses and build your academic network.
          </p>
        </div>

        <div className="discover-filters">
          <input
            type="text"
            placeholder="Search by name or school..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="filter-select"
          >
            <option>All courses</option>
            <option>CS101</option>
            <option>CS201</option>
            <option>CS301</option>
            <option>APT3065</option>
          </select>
        </div>

        <div className="students-grid">
          {filteredStudents.map((student) => (
            <div key={student.id} className="student-card">
              <div className="student-header">
                <div className="student-avatar">{student.initials}</div>
                <div className="student-info">
                  <h3 className="student-name">{student.name}</h3>
                  <p className="student-university">{student.university}</p>
                </div>
              </div>
              <div className="student-courses">
                {student.courses.map((course) => (
                  <span key={course} className="course-badge">
                    {course}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default DiscoverClassmates;
