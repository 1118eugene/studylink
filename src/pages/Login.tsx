import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
type LoginProps = {
  onAuthSuccess: () => void;
};

function Login({ onAuthSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('user')) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(
  `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
  {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Login failed');
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
          <h1>Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue to StudyLink</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                required
              />
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <button type="submit" className="button button-primary auth-button">Sign in</button>
          </form>

          <p className="auth-footer">
            New to StudyLink? <Link to="/signup" className="auth-link">Create an account</Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Login;
