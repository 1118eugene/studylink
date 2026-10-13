import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import { Card } from '../components/Card';

export default function Home() {
  return (
    <div className="home-page">
      <HeroSection />

      <section className="home-overview container">
        <div className="home-overview-grid">
          <Card className="feature-card" variant="outlined">
            <Card.Header title="Learn faster with structure" titleAs="h3" />
            <Card.Body>From schools and programs to course hubs and weekly topics, StudyLink keeps your academic journey organized and easy to follow.</Card.Body>
          </Card>
          <Card className="feature-card" variant="outlined">
            <Card.Header title="Find resources instantly" titleAs="h3" />
            <Card.Body>Search PDFs, lecture notes, MCQs, past papers, videos, and podcasts from one curated academic library.</Card.Body>
          </Card>
          <Card className="feature-card" variant="outlined">
            <Card.Header title="Collaborate with purpose" titleAs="h3" />
            <Card.Body>Join study groups, attend live sessions, and connect with classmates in each course's enrolled student hub.</Card.Body>
          </Card>
        </div>
      </section>

      <section className="home-cta container">
        <div className="home-cta-copy">
          <p className="eyebrow">Start your academic ecosystem</p>
          <h2>Compact dashboard, direct access, and AI support for every course.</h2>
        </div>
        <div className="home-cta-row">
          <Link to="/signup" className="button button-primary">Create account</Link>
          <Link to="/login" className="button button-secondary">Sign in</Link>
        </div>
      </section>
    </div>
  );
}
