function HeroSection() {
  return (
    <section className="hero-landing">
      <div className="hero-landing-content">
        <div className="hero-badge">The academic social network</div>

        <h1 className="hero-landing-title">
          Purposeful Study.
          <br />
          <span className="title-accent">Brilliant Results.</span>
        </h1>

        <p className="hero-landing-description">
          StudyLink is the scholarly platform where university students discover classmates,
          coordinate study groups, and share academic resources.
        </p>

        <div className="hero-landing-actions">
          <a href="/signup" className="button button-join">Join StudyLink</a>
          <a href="/login" className="button button-signin">Sign In</a>
        </div>

        <div className="hero-landing-media">
          <img
            src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80"
            alt="Students studying together in a collaborative academic setting"
          />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;

