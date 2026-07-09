import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/HeroSection';

export default function Home() {
  const navigate = useNavigate();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupForm, setSignupForm] = useState({ fullName: '', email: '', university: '', password: '' });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      localStorage.setItem('user', JSON.stringify({ email: loginEmail, authenticated: true }));
      navigate('/dashboard');
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (signupForm.fullName && signupForm.email && signupForm.university && signupForm.password) {
      localStorage.setItem('user', JSON.stringify({ email: signupForm.email, name: signupForm.fullName, university: signupForm.university, authenticated: true }));
      navigate('/dashboard');
    }
  };

  return (
    <div className="home-page">
      <HeroSection />

      <section className="login-section-landing">
        <div className="container">
          <div className="landing-intro">
            <h2 className="section-title">Create your account to unlock StudyLink</h2>
            <p className="section-copy">
              The public landing experience is intentionally focused on sign up and sign in. Once you enter the platform, you can access home, about, contact, courses, groups, sessions, and your dashboard.
            </p>
          </div>
          <div className="login-grid">
            <div className="login-card">
              <h3>Sign In to Your Account</h3>
              <form onSubmit={handleLogin} className="auth-form">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="form-input"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="form-input"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="button button-primary" style={{ width: '100%' }}>Sign In</button>
              </form>
              <p className="form-footer">New to StudyLink? <span className="auth-link" onClick={() => document.getElementById('signup-form')?.scrollIntoView({ behavior: 'smooth' })}>Create an account</span></p>
            </div>

            <div className="signup-card" id="signup-form">
              <h3>Create Your Account</h3>
              <form onSubmit={handleSignup} className="auth-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    className="form-input"
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="form-input"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>University</label>
                  <input
                    type="text"
                    placeholder="Your university"
                    className="form-input"
                    value={signupForm.university}
                    onChange={(e) => setSignupForm({ ...signupForm, university: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="Create a password"
                    className="form-input"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="button button-primary" style={{ width: '100%' }}>Create Account</button>
              </form>
              <p className="form-footer">Already have an account? <span className="auth-link" onClick={() => document.getElementById('signup-form')?.scrollIntoView({ behavior: 'smooth' })}>Sign in</span></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
