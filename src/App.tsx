import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, type ReactNode } from 'react';
import Header from './components/Header';
import AuthHeader from './components/AuthHeader';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import DiscoverClassmates from './pages/DiscoverClassmates';
import Courses from './pages/Courses';
import StudyGroups from './pages/StudyGroups';
import Sessions from './pages/Sessions';
import Profile from './pages/Profile';
import GroupDetail from './pages/GroupDetail';
import './App.css';

type ProtectedRouteProps = {
  children: ReactNode;
};

function ProtectedRoute({ children }: ProtectedRouteProps) {
  return localStorage.getItem('user') ? <>{children}</> : <Navigate to="/signup" replace />;
}

function App() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('user'));

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('user'));
  }, [location.pathname]);

  const isAuthenticatedPage = ['/dashboard', '/discover', '/courses', '/groups', '/sessions', '/profile'].includes(location.pathname);
  const showPublicShell = !isAuthenticated && !['/login', '/signup'].includes(location.pathname);

  return (
    <div className="app-shell">
      {!showPublicShell && !isAuthenticated ? null : isAuthenticated || isAuthenticatedPage ? <AuthHeader /> : <Header />}
      <main>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/signup" replace />} />
          <Route path="/about" element={isAuthenticated ? <About /> : <Navigate to="/signup" replace />} />
          <Route path="/contact" element={isAuthenticated ? <Contact /> : <Navigate to="/signup" replace />} />

          {/* Auth pages */}
          <Route path="/login" element={<Login onAuthSuccess={() => setIsAuthenticated(true)} />} />
          <Route path="/signup" element={<SignUp onAuthSuccess={() => setIsAuthenticated(true)} />} />

          {/* Authenticated pages */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/discover" element={<ProtectedRoute><DiscoverClassmates /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><StudyGroups /></ProtectedRoute>} />
          <Route path="/groups/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </main>
      {!isAuthenticatedPage && !showPublicShell && <Footer />}
    </div>
  );
}

export default App;
