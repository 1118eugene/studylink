import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { api, setApiToken, setUnauthorizedHandler } from '../services/api';
import { clearAuth, loadAuth, saveAuth } from '../services/storage';
import type { User } from '../types/api';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string, university: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setApiToken('');
      void clearAuth();
      setUser(null);
    });
    let active = true;
    loadAuth().then(async (auth) => {
      if (!active) return;
      if (!auth) {
        setLoading(false);
        return;
      }
      setApiToken(auth.token);
      try {
        const result = await api.me();
        if (active) setUser(result.user);
      } catch {
        await clearAuth();
        setApiToken('');
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; setUnauthorizedHandler(undefined); };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async signIn(email, password) {
      const result = await api.login(email.trim(), password);
      setApiToken(result.token);
      await saveAuth(result.token, result.user);
      setUser(result.user);
    },
    async signUp(fullName, email, password, university) {
      const result = await api.signup(fullName.trim(), email.trim(), password, university.trim());
      setApiToken(result.token);
      await saveAuth(result.token, result.user);
      setUser(result.user);
    },
    async signOut() {
      try {
        await api.logout();
      } finally {
        setApiToken('');
        await clearAuth();
        setUser(null);
      }
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
