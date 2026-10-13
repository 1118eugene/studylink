import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { api, ApiError, setApiToken, setUnauthorizedHandler } from '../services/api';
import { clearAuth, loadAuth, saveAuth } from '../services/storage';
import type { User } from '../types/api';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  authMessage: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string, university: string, program: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setApiToken('');
      setUser(null);
      setAuthMessage('');
      void clearAuth().catch(() => {
        setAuthMessage('Your session ended, but saved sign-in could not be removed from secure storage.');
      });
    });
    let active = true;
    async function restoreSession() {
      try {
        const auth = await loadAuth();
        if (!active) return;
        if (!auth) return;

        setApiToken(auth.token);
        try {
          const result = await api.me();
          if (active) {
            setUser(result.user);
            setAuthMessage('');
          }
        } catch (error) {
          if (!active) return;
          if (error instanceof ApiError && error.status === 401) {
            return;
          }

          setUser(auth.user);
        }
      } catch {
        if (active) {
          setApiToken('');
          setAuthMessage('Saved sign-in could not be read securely. Please sign in again.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void restoreSession();
    return () => { active = false; setUnauthorizedHandler(undefined); };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    authMessage,
    async signIn(email, password) {
      const result = await api.login(email.trim(), password);
      await saveAuth(result.token, result.user);
      setApiToken(result.token);
      setUser(result.user);
      setAuthMessage('');
    },
    async signUp(fullName, email, password, university, program) {
      const result = await api.signup(fullName.trim(), email.trim(), password, university.trim(), program.trim());
      await saveAuth(result.token, result.user);
      setApiToken(result.token);
      setUser(result.user);
      setAuthMessage('');
    },
    async signOut() {
      try {
        await api.logout();
      } finally {
        setApiToken('');
        setUser(null);
        setAuthMessage('');
        try {
          await clearAuth();
        } catch {
          setAuthMessage('You are signed out, but saved credentials could not be removed from secure storage.');
        }
      }
    },
  }), [authMessage, loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
