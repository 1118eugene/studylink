import { NavLink, useNavigate } from 'react-router-dom';

function AuthHeader() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const navLinks = [
    { label: 'Home', path: '/dashboard' },
    { label: 'Discover', path: '/discover' },
    { label: 'Courses', path: '/courses' },
    { label: 'Groups', path: '/groups' },
    { label: 'Sessions', path: '/sessions' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <aside className="auth-header sidebar-shell">
      <div className="sidebar-brand">
        <span className="brand-name">StudyLink</span>
        <p className="subtle">Student coordination workspace</p>
      </div>

      <div className="sidebar-user">
        <p className="sidebar-user-label">Signed in as</p>
        <strong>{user?.name || 'Student'}</strong>
        <span>{user?.email || 'No email found'}</span>
      </div>

      <nav className="auth-nav sidebar-nav">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => `nav-item sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-label">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className="profile-link sidebar-profile-link" aria-label="Profile">
          Profile
        </NavLink>
        <button className="logout-btn sidebar-logout" onClick={handleLogout} title="Logout">
          Logout
        </button>
      </div>
    </aside>
  );
}

export default AuthHeader;
