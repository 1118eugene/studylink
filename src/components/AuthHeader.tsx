import { NavLink, useNavigate } from 'react-router-dom';
import { clearStoredAuth, getStoredUser, getInitials } from '../lib/session';

function AuthHeader() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const navLinks = [
    { label: 'Home', path: '/dashboard' },
    { label: 'Discover', path: '/discover' },
    { label: 'Courses', path: '/courses' },
    { label: 'Groups', path: '/groups' },
    { label: 'Sessions', path: '/sessions' },
    { label: 'Resources', path: '/resources' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
  ];

  const handleLogout = () => {
    clearStoredAuth();
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
        <div className="sidebar-user-badge">{getInitials(user?.name || 'Student')}</div>
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
