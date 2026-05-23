'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'client' | 'coach';

export interface MockUser {
  role: UserRole;
  name: string;
  initials: string;
  phase?: string;   // e.g. "Bulk · Week 8" — clients only
}

interface AuthContextValue {
  user: MockUser | null;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
});

const MOCK_USERS: Record<UserRole, MockUser> = {
  client: {
    role: 'client',
    name: 'Dylan',
    initials: 'DY',
    phase: 'Bulk · Week 8',
  },
  coach: {
    role: 'coach',
    name: 'Coach SS',
    initials: 'SC',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('ss-user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const login = (role: UserRole) => {
    const u = MOCK_USERS[role];
    setUser(u);
    localStorage.setItem('ss-user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ss-user');
    // also clear onboarding flag on logout so it resets
    localStorage.removeItem('ss-onboarding-done');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
