import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, type ReactNode } from 'react';
import AuthHeader from './components/AuthHeader';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import DiscoverClassmates from './pages/DiscoverClassmates';
import Courses from './pages/Courses';
import StudyGroups from './pages/StudyGroups';
import Sessions from './pages/Sessions';
import Profile from './pages/Profile';
import GroupDetail from './pages/GroupDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import './App.css';

type ProtectedRouteProps = {
  children: ReactNode;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  return localStorage.getItem('user') ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('user'));

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('user'));
  }, [location.pathname]);

  const isAuthPage = ['/login', '/signup'].includes(location.pathname);
  const isProtectedPage = ['/dashboard', '/discover', '/courses', '/groups', '/sessions', '/profile', '/about', '/contact'].includes(location.pathname);

  return (
    <div className={`app-shell ${isAuthenticated ? 'authenticated-shell' : 'public-shell'}`}>
      {isAuthenticated ? <AuthHeader /> : null}
      <main className={isAuthenticated ? 'app-content' : 'app-content public-content'}>
        <Routes>
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />

          {/* Auth pages */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onAuthSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignUp onAuthSuccess={() => setIsAuthenticated(true)} />} />

          {/* Authenticated pages */}
          <Route path="/home" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
          <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/discover" element={<ProtectedRoute><DiscoverClassmates /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><StudyGroups /></ProtectedRoute>} />
          <Route path="/groups/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
