import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { lazy, Suspense, useState, useEffect, useRef, type ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ThemeToggle from './components/ThemeToggle';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import AdminAcademic from './pages/AdminAcademic';
import ReportQueue from './pages/ReportQueue';
import AdminUsers from './pages/AdminUsers';
import StudyGroups from './pages/StudyGroups';
import Schools from './pages/Schools';
import Sessions from './pages/Sessions';
import Profile from './pages/Profile';
import GroupDetail from './pages/GroupDetail';
import Resources from './pages/Resources';
import Library from './pages/Library';
import LearningHub from './pages/LearningHub';
import ResourceDetail from './pages/ResourceDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import StudyLinkAI from './pages/StudyLinkAI';
import './App.css';
import './workspace.css';
import { getStoredUser } from './lib/session';

const CardGallery = import.meta.env.DEV
  ? lazy(() => import('./pages/CardGallery'))
  : null;

type ProtectedRouteProps = {
  children: ReactNode;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  return getStoredUser() ? <>{children}</> : <Navigate to="/login" replace />;
}

function getMobilePageTitle(pathname: string) {
  if (pathname.startsWith('/courses/')) return 'Course Hub';
  if (pathname.startsWith('/groups/')) return 'Study Groups';
  if (pathname.startsWith('/dashboard')) return 'Dashboard';
  if (pathname.startsWith('/schools')) return 'Schools';
  if (pathname.startsWith('/courses')) return 'Courses';
  if (pathname.startsWith('/sessions')) return 'Sessions';
  if (pathname.startsWith('/learning')) return 'Learning Hub';
  if (pathname.startsWith('/resources')) return 'Learning Hub';
  if (pathname.startsWith('/library')) return 'Learning Hub';
  if (pathname.startsWith('/profile')) return 'Profile';
  if (pathname.startsWith('/ask-ai')) return 'StudyLink AI';
  if (pathname.startsWith('/admin/reports')) return 'Report Queue';
  if (pathname.startsWith('/admin/users')) return 'User Administration';
  return 'StudyLink';
}

function App() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getStoredUser());
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 1080 : false);
  const [isDesktopSidebarVisible, setIsDesktopSidebarVisible] = useState(true);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const mobileNavDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setIsAuthenticated(!!getStoredUser());
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1080);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsDesktopSidebarVisible(true);
      setIsDesktopSidebarCollapsed(false);
    }
  }, [isMobile]);

  useEffect(() => {
    const dialog = mobileNavDialogRef.current;
    if (!dialog) return;
    if (isAuthenticated && isMobile && isMobileNavOpen && !dialog.open) {
      dialog.showModal();
    } else if (dialog.open && (!isAuthenticated || !isMobile || !isMobileNavOpen)) {
      dialog.close();
    }
  }, [isAuthenticated, isMobile, isMobileNavOpen]);

  const currentUser = getStoredUser();
  const mobileNavLinks = [
    { label: 'Schools', path: '/schools', icon: '\u{1F3EB}' },
    { label: 'Courses', path: '/courses', icon: '\u{1F4D8}' },
    { label: 'Learning', path: '/learning?view=library', icon: '\u{1F4DA}' },
    { label: 'AI', path: '/ask-ai', icon: '\u{1F916}' },
    { label: 'Profile', path: '/profile', icon: '\u{1F464}' },
  ];
  if (currentUser?.role === 'admin' || currentUser?.role === 'moderator') {
    mobileNavLinks.push({ label: 'Reports', path: '/admin/reports', icon: '\u2691' });
  }
  if (currentUser?.role === 'admin') {
    mobileNavLinks.push({ label: 'Users', path: '/admin/users', icon: '\u{1F465}' });
  }
  const showDesktopSidebar = isAuthenticated && !isMobile && isDesktopSidebarVisible;
  const showDesktopTopbar = isAuthenticated && !isMobile && (!isDesktopSidebarVisible || isDesktopSidebarCollapsed);

  return (
    <div className={`app-shell ${isAuthenticated ? 'authenticated-shell' : 'public-shell'}`}>
      {!isAuthenticated ? <Header /> : null}
      {showDesktopSidebar ? (
        <Sidebar
          collapsed={isDesktopSidebarCollapsed}
          onCollapseChange={setIsDesktopSidebarCollapsed}
          onNavigate={() => setIsDesktopSidebarVisible(false)}
        />
      ) : null}
      {isAuthenticated && isMobile ? (
        <>
          <header className="mobile-auth-header">
            <button
              type="button"
              className="app-topbar-menu"
              aria-label={isMobileNavOpen ? 'Close navigation' : 'Open navigation'}
              aria-controls="mobile-navigation-dialog"
              aria-expanded={isMobileNavOpen}
              onClick={() => setIsMobileNavOpen((open) => !open)}
            >
              <span aria-hidden="true">{isMobileNavOpen ? '\u2715' : '\u2630'}</span>
            </button>
            <div className="mobile-auth-header-copy">
              <p className="mobile-auth-kicker">StudyLink Workspace</p>
              <strong>{getMobilePageTitle(location.pathname)}</strong>
            </div>
            <ThemeToggle />
            <Link to="/profile" className="mobile-auth-profile-link">
              {currentUser?.name ? currentUser.name.split(' ')[0] : 'Profile'}
            </Link>
          </header>
          <div className="mobile-auth-nav">
            <div className="mobile-auth-nav-links">
              {mobileNavLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={location.pathname === '/learning' && link.path.startsWith('/learning')
                    ? 'mobile-auth-nav-link active'
                    : location.pathname === link.path || `${location.pathname}${location.search}` === link.path
                      ? 'mobile-auth-nav-link active'
                      : 'mobile-auth-nav-link'}
                >
                  <span className="mobile-auth-nav-icon">{link.icon}</span>
                  <span className="mobile-auth-nav-label">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}
      {isAuthenticated && isMobile ? (
        <dialog
          ref={mobileNavDialogRef}
          id="mobile-navigation-dialog"
          className="mobile-navigation-dialog"
          onClose={() => setIsMobileNavOpen(false)}
          onCancel={(event) => {
            event.preventDefault();
            setIsMobileNavOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              setIsMobileNavOpen(false);
            }
          }}
        >
          <button
            type="button"
            className="mobile-navigation-dialog-backdrop"
            aria-label="Close navigation"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="mobile-navigation-dialog-panel">
            <div className="mobile-navigation-dialog-header">
              <span>StudyLink navigation</span>
              <button type="button" onClick={() => setIsMobileNavOpen(false)}>Close</button>
            </div>
            <Sidebar onNavigate={() => setIsMobileNavOpen(false)} />
          </div>
        </dialog>
      ) : null}
      {showDesktopTopbar ? (
        <header className="app-topbar">
          <button
            type="button"
            className="app-topbar-menu"
            aria-label="Open sidebar"
            aria-controls="app-navigation"
            onClick={() => {
              setIsDesktopSidebarVisible(true);
              setIsDesktopSidebarCollapsed(false);
            }}
          >
            <span aria-hidden="true">{'\u2630'}</span>
          </button>
          <div className="app-topbar-title">
            <p>StudyLink Workspace</p>
            <strong>{getMobilePageTitle(location.pathname)}</strong>
          </div>
          <ThemeToggle />
        </header>
      ) : null}
      <main className={isAuthenticated ? `app-content ${showDesktopSidebar ? '' : 'app-content-wide'} ${showDesktopTopbar ? 'app-content-toolbar' : ''}`.trim() : 'app-content public-content'}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/schools" replace /> : <Home />} />

          <Route path="/login" element={isAuthenticated ? <Navigate to="/schools" replace /> : <Login onAuthSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/schools" replace /> : <SignUp onAuthSuccess={() => setIsAuthenticated(true)} />} />

          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/dev/cards"
            element={CardGallery
              ? <Suspense fallback={null}><CardGallery /></Suspense>
              : <Navigate to="/" replace />}
          />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/schools" element={<ProtectedRoute><Schools /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
          <Route path="/ask-ai" element={<ProtectedRoute><StudyLinkAI /></ProtectedRoute>} />
          <Route path="/admin/academic" element={<ProtectedRoute><AdminAcademic /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute><ReportQueue /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><StudyGroups /></ProtectedRoute>} />
          <Route path="/groups/new" element={<ProtectedRoute><StudyGroups initialShowForm /></ProtectedRoute>} />
          <Route path="/groups/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path="/learning" element={<ProtectedRoute><LearningHub /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/resources/:id" element={<ProtectedRoute><ResourceDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/schools' : '/'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
