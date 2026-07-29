import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import logo from '../assets/images/studylinklogo.png';
import NotificationBell from './NotificationBell';
import { clearStoredAuth, getStoredUser } from '../lib/session';

function Sidebar() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const currentUser = getStoredUser();

  const handleLogout = () => {
    clearStoredAuth();
    navigate('/');
  };

  return (
    <aside className={collapsed ? 'sidebar sidebar-collapsed' : 'sidebar'}>
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <Link to="/dashboard" className="logo-brand sidebar-logo-link">
            <img src={logo} alt="StudyLink logo" className="brand-image sidebar-brand-image" />
            <span className="brand-text">StudyLink</span>
          </Link>
        </div>
        <button type="button" className="sidebar-toggle" onClick={() => setCollapsed((value) => !value)} aria-label="Toggle navigation">
          ☰
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
          <span className="nav-label">Dashboard</span>
        </NavLink>
        <NavLink to="/schools" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
          <span className="nav-label">Schools</span>
        </NavLink>
        <NavLink to="/courses" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
          <span className="nav-label">Courses</span>
        </NavLink>
        <NavLink to="/groups" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
          <span className="nav-label">Study Groups</span>
        </NavLink>
        <NavLink to="/sessions" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
          <span className="nav-label">Sessions</span>
        </NavLink>
        <NavLink to="/resources" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
          <span className="nav-label">Resources</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
          <span className="nav-label">Profile</span>
        </NavLink>
        <NavLink to="/library" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
          <span className="nav-label">Library</span>
        </NavLink>
        {currentUser?.role === 'admin' ? (
          <NavLink to="/admin/academic" className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}>
            <span className="nav-label">Academic Admin</span>
          </NavLink>
        ) : null}
      </nav>

      <div className="sidebar-footer">
        <NotificationBell />
        <button type="button" className="logout-btn sidebar-logout" onClick={handleLogout} title="Logout">
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
