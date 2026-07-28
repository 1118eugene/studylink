import { useState } from 'react';
import HeroSection from '../components/HeroSection';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home-page">
      <HeroSection />

      <section className="home-features container">
        <div className="home-features-grid">
          <article className="feature-card">
            <h2>Collaborate smarter on campus.</h2>
            <p>Connect with classmates, organize study groups, and manage session plans in a unified student workspace.</p>
          </article>

          <article className="feature-card">
            <h3>Courses, groups, sessions, and resources</h3>
            <p>Every academic interaction is visible, persistent, and designed for fast student collaboration.</p>
          </article>

          <article className="feature-card">
            <h3>Secure access and clear workflows</h3>
            <p>Sign in with a university-ready account, track your memberships, and join groups with easy requirement checks.</p>
          </article>
        </div>

        <div className="home-cta-row">
          <Link to="/signup" className="button button-primary button-lg">Get started</Link>
          <Link to="/login" className="button button-secondary button-lg">Sign in</Link>
        </div>
      </section>
    </div>
  );
}
