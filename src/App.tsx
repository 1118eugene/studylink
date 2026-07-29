import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect, type ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import AdminAcademic from './pages/AdminAcademic';
import StudyGroups from './pages/StudyGroups';
import Schools from './pages/Schools';
import Sessions from './pages/Sessions';
import Profile from './pages/Profile';
import GroupDetail from './pages/GroupDetail';
import Resources from './pages/Resources';
import Library from './pages/Library';
import About from './pages/About';
import Contact from './pages/Contact';
import './App.css';
import './workspace.css';
import { getStoredUser } from './lib/session';

type ProtectedRouteProps = {
  children: ReactNode;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  return getStoredUser() ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getStoredUser());
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 1080 : false);

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

  const mobileNavLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Groups', path: '/groups' },
    { label: 'Sessions', path: '/sessions' },
    { label: 'Courses', path: '/courses' },
    { label: 'Resources', path: '/resources' },
    { label: 'Library', path: '/library' },
  ];

  return (
    <div className={`app-shell ${isAuthenticated ? 'authenticated-shell' : 'public-shell'}`}>
      {isAuthenticated ? <Sidebar /> : <Header />}
      {isAuthenticated && isMobile ? (
        <div className="mobile-auth-nav">
          <div className="mobile-auth-nav-links">
            {mobileNavLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={location.pathname === link.path ? 'mobile-auth-nav-link active' : 'mobile-auth-nav-link'}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <main className={isAuthenticated ? 'app-content' : 'app-content public-content'}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Home />} />

          {/* Auth pages */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onAuthSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignUp onAuthSuccess={() => setIsAuthenticated(true)} />} />

          {/* Public pages */}
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Authenticated pages */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/schools" element={<ProtectedRoute><Schools /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
          <Route path="/admin/academic" element={<ProtectedRoute><AdminAcademic /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><StudyGroups /></ProtectedRoute>} />
          <Route path="/groups/new" element={<ProtectedRoute><StudyGroups initialShowForm /></ProtectedRoute>} />
          <Route path="/groups/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
