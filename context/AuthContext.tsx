'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'client' | 'coach';

export interface MockUser {
  role: UserRole;
  name: string;
  initials: string;
  phase?: string;
  avatarUrl?: string;
  nickname?: string;
}

interface AuthContextValue {
  user: MockUser | null;
  supabaseUser: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  supabaseUser: null,
  login: () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Load initial session — swallow errors so a stale/invalid session never
    // surfaces as an unhandled rejection (which freezes the dev error overlay).
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) await loadProfile(session.user);
      })
      .catch(() => { setUser(null); setSupabaseUser(null); });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        if (session?.user) {
          await loadProfile(session.user);
        } else {
          setUser(null);
          setSupabaseUser(null);
        }
      } catch {
        setUser(null);
        setSupabaseUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(sbUser: User) {
    setSupabaseUser(sbUser);
    try {
      const { data: role } = await supabase.rpc('get_my_role');
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      const name = profile?.full_name || sbUser.email?.split('@')[0] || 'User';
      setUser({
        role: (role as UserRole) ?? 'client',
        name,
        initials: getInitials(name),
        avatarUrl: profile?.avatar_url || undefined,
        nickname: profile?.nickname || undefined,
      });
    } catch {
      // Session is present but unusable (e.g. revoked) — treat as logged out.
      setUser(null);
      setSupabaseUser(null);
    }
  }

  // Re-read the profile for the current session (call after a settings save so
  // the sidebar avatar / nickname update without a full reload).
  const refreshProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await loadProfile(session.user);
    } catch { /* ignore */ }
  };

  // Kept for backwards compatibility — not used in practice now
  const login = () => {};

  const logout = async () => {
    // Clear local state first so the UI is logged-out immediately.
    localStorage.removeItem('ss-user');
    localStorage.removeItem('ss-onboarding-done');
    sessionStorage.removeItem('ss-dev-skip'); // so every fresh login re-shows onboarding
    sessionStorage.removeItem('ss-activity-stamped');
    // Sign out to clear the auth cookies — but NEVER let a hung/locked signOut
    // block the redirect (that's what made the sign-out button "do nothing").
    // Race it against a short timeout, then navigate regardless.
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    } catch { /* ignore — navigate anyway */ }
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
