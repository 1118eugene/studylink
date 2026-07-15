import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../assets/images/api';

type SignUpProps = {
  onAuthSuccess: () => void;
};

function SignUp({ onAuthSuccess }: SignUpProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const passwordTooShort = formData.password.length > 0 && formData.password.length < 8;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all fields to continue.');
      return;
    }

    if (formData.password.trim().length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      const response = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Signup failed');
        return;
      }

      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      onAuthSuccess();
      navigate('/dashboard');
    } catch (err) {
      setError('Unable to connect to the backend.');
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>Join StudyLink</h1>
          <p className="auth-subtitle">Create your free academic account</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Full name</label>
              <input
                type="text"
                name="fullName"
                placeholder="Violet Eugene"
                value={formData.fullName}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                minLength={8}
                required
              />
              <p className="form-help">Use at least 8 characters for your password.</p>
              {passwordTooShort ? <p className="form-error">Password is too short. Add at least 8 characters.</p> : null}
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <button type="submit" className="button button-primary auth-button">Create account</button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default SignUp;
