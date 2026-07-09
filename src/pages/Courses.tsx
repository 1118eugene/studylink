import { useState } from 'react';

interface Course {
  id: string;
  code: string;
  category: string;
  title: string;
  description: string;
  image: string;
  enrolled?: boolean;
}

function Courses() {
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);

  const courses: Course[] = [
    {
      id: '1',
      code: 'APT3065',
      category: 'Applied Technology',
      title: 'Mid-Term Project',
      description: 'Collaborative project planning, research methods, and presentation preparation.',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
      enrolled: false,
    },
    {
      id: '2',
      code: 'BUS101',
      category: 'Business',
      title: 'Introduction to Business',
      description: 'Understand entrepreneurship, operations, and strategic decision-making.',
      image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80',
      enrolled: false,
    },
    {
      id: '3',
      code: 'CS101',
      category: 'Computer Science',
      title: 'Introduction to Computer Science',
      description: 'Build a strong foundation in programming logic, problem solving, and algorithms.',
      image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
      enrolled: false,
    },
    {
      id: '4',
      code: 'CS201',
      category: 'Computer Science',
      title: 'Data Structures & Algorithms',
      description: 'Explore efficient data handling, sorting, and optimization techniques.',
      image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80',
      enrolled: false,
    },
    {
      id: '5',
      code: 'CS301',
      category: 'Computer Science',
      title: 'Database Systems',
      description: 'Learn data modeling, SQL, and database design for modern applications.',
      image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=80',
      enrolled: false,
    },
    {
      id: '6',
      code: 'CS401',
      category: 'Computer Science',
      title: 'Software Engineering',
      description: 'Practice team-based development, software architecture, and quality assurance.',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
      enrolled: false,
    },
    {
      id: '7',
      code: 'MATH101',
      category: 'Mathematics',
      title: 'Calculus I',
      description: 'Review limits, derivatives, and real-world applications in science.',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=900&q=80',
      enrolled: false,
    },
    {
      id: '8',
      code: 'MATH201',
      category: 'Mathematics',
      title: 'Linear Algebra',
      description: 'Study matrices, vector spaces, and computational problem solving.',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
      enrolled: false,
    },
    {
      id: '9',
      code: 'ENG201',
      category: 'English',
      title: 'Academic Writing',
      description: 'Strengthen essay drafting, research, editing, and formal communication skills.',
      image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80',
      enrolled: false,
    },
    {
      id: '10',
      code: 'PSY101',
      category: 'Psychology',
      title: 'Introduction to Psychology',
      description: 'Explore cognition, learning behavior, and applied psychological principles.',
      image: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=900&q=80',
      enrolled: false,
    },
  ];

  const handleEnroll = (courseCode: string) => {
    if (enrolledCourses.includes(courseCode)) {
      setEnrolledCourses(enrolledCourses.filter((c) => c !== courseCode));
    } else {
      setEnrolledCourses([...enrolledCourses, courseCode]);
    }
  };

  return (
    <section className="courses-page">
      <div className="container">
        <div className="page-header">
          <h1>Courses</h1>
          <p className="page-description">
            Enrol in courses to discover classmates and join study groups.
          </p>
        </div>

        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <img className="course-image" src={course.image} alt={course.title} loading="lazy" />
              <div className="course-header">
                <div className="course-info">
                  <p className="course-code">{course.code}</p>
                  <p className="course-category">{course.category}</p>
                </div>
                <button
                  onClick={() => handleEnroll(course.code)}
                  className={`course-enroll-btn ${
                    enrolledCourses.includes(course.code) ? 'enrolled' : ''
                  }`}
                >
                  {enrolledCourses.includes(course.code) ? 'Enrolled' : 'Enrol'}
                </button>
              </div>
              <h3 className="course-title">{course.title}</h3>
              <p className="course-description">{course.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Courses;
