import { NavLink, useNavigate } from 'react-router-dom';

function AuthHeader() {
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Courses', path: '/courses' },
    { label: 'Groups', path: '/groups' },
    { label: 'Sessions', path: '/sessions' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <header className="auth-header">
      <div className="container header-nav">
        <div className="header-brand">
          <span className="brand-name">StudyLink</span>
        </div>
        
        <nav className="auth-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <NavLink to="/profile" className="profile-link" aria-label="Profile">
            Profile
          </NavLink>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default AuthHeader;
