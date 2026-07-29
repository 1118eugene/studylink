import { Link } from 'react-router-dom';

const schools = [
  'School of Science and Technology',
  'School of Business',
  'School of Pharmacy',
  'School of Humanities',
];

function Schools() {
  return (
    <section className="schools-page workspace-page">
      <div className="container workspace-stack">
        <section className="workspace-hero workspace-hero-compact">
          <div>
            <p className="workspace-eyebrow">Schools</p>
            <h1>Select your school to begin</h1>
            <p className="workspace-lead">Choose the school that matches your program to filter programs, years, and course hubs.</p>
          </div>
          <div className="hero-stat-grid">
            <article className="hero-stat-card">
              <span className="hero-stat-value">{schools.length}</span>
              <span className="hero-stat-label">Schools</span>
            </article>
          </div>
        </section>

        <div className="section-block">
          <h2>Available schools</h2>
          <div className="groups-grid">
            {schools.map((school) => (
              <article key={school} className="group-card">
                <h3>{school}</h3>
                <p className="group-course">Programs, years, and courses under this school.</p>
                <div className="group-actions">
                  <Link to={`/courses`} className="button button-secondary">Open programs</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Schools;
