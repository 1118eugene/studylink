import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import logo from '../assets/images/studylinklogo.png';
import NotificationBell from './NotificationBell';
import { clearStoredAuth, getStoredUser } from '../lib/session';
import ThemeToggle from './ThemeToggle';

const mainNavItems = [
  { label: 'Schools', path: '/schools', icon: '\u{1F3EB}' },
  { label: 'Courses', path: '/courses', icon: '\u{1F4D8}' },
  { label: 'Learning Hub', path: '/learning?view=library', icon: '\u{1F4DA}' },
  { label: 'StudyLink AI', path: '/ask-ai', icon: '\u2726' },
  { label: 'Study Groups', path: '/groups', icon: '\u{1F465}' },
  { label: 'Sessions', path: '/sessions', icon: '\u{1F5D3}' },
  { label: 'Dashboard', path: '/dashboard', icon: '\u25EB' },
];

type SidebarProps = {
  onNavigate?: () => void;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
};

function Sidebar({ onNavigate, collapsed: controlledCollapsed, onCollapseChange }: SidebarProps) {
  const navigate = useNavigate();
  const [localCollapsed, setLocalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? localCollapsed;
  const currentUser = getStoredUser();

  const handleLogout = () => {
    clearStoredAuth();
    navigate('/');
  };

  return (
    <aside id="app-navigation" className={collapsed ? 'sidebar sidebar-collapsed' : 'sidebar'}>
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <Link to="/dashboard" className="logo-brand sidebar-logo-link">
            <img src={logo} alt="StudyLink logo" className="brand-image sidebar-brand-image" />
            <div className="sidebar-brand-copy">
              <span className="brand-text">StudyLink</span>
              <span className="sidebar-brand-subtitle">Student workspace</span>
            </div>
          </Link>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => {
            const nextCollapsed = !collapsed;
            if (onCollapseChange) onCollapseChange(nextCollapsed);
            else setLocalCollapsed(nextCollapsed);
          }}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          <span className="sidebar-toggle-icon" aria-hidden="true">{collapsed ? '\u2192' : '\u2190'}</span>
        </button>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Workspace</p>
        {mainNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
            title={collapsed ? item.label : undefined}
            onClick={onNavigate}
          >
            <span className="sidebar-link-icon" aria-hidden="true">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
        {currentUser?.role === 'admin' || currentUser?.role === 'moderator' ? (
          <>
            {currentUser.role === 'admin' ? (
              <>
                <NavLink
                  to="/admin/ai-provider"
                  className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
                  title={collapsed ? 'AI Service' : undefined}
                  onClick={onNavigate}
                >
                  <span className="sidebar-link-icon" aria-hidden="true">{'\u2726'}</span>
                  <span className="nav-label">AI Service</span>
                </NavLink>
                <NavLink
                  to="/admin/academic"
                  className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
                  title={collapsed ? 'Academic Admin' : undefined}
                  onClick={onNavigate}
                >
                  <span className="sidebar-link-icon" aria-hidden="true">{'\u2699'}</span>
                  <span className="nav-label">Academic Admin</span>
                </NavLink>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
                  title={collapsed ? 'User Administration' : undefined}
                  onClick={onNavigate}
                >
                  <span className="sidebar-link-icon" aria-hidden="true">{'\u{1F465}'}</span>
                  <span className="nav-label">User Administration</span>
                </NavLink>
              </>
            ) : null}
            <NavLink
              to="/admin/reports"
              className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
              title={collapsed ? 'Report Queue' : undefined}
              onClick={onNavigate}
            >
              <span className="sidebar-link-icon" aria-hidden="true">{'\u2691'}</span>
              <span className="nav-label">Report Queue</span>
            </NavLink>
          </>
        ) : null}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className="profile-link sidebar-profile-link" aria-label="Profile" title={collapsed ? 'Profile' : undefined} onClick={onNavigate}>
          <span className="sidebar-link-icon" aria-hidden="true">{'\u{1F464}'}</span>
          <span className="nav-label">Profile</span>
        </NavLink>
        <NotificationBell />
        <ThemeToggle />
        <button type="button" className="logout-btn sidebar-logout" onClick={handleLogout} title="Logout">
          <span className="sidebar-link-icon" aria-hidden="true">{'\u2197'}</span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
