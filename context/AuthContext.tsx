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
  // True until the FIRST auth check (getSession + profile load) completes, so
  // UI can hold the name/greeting instead of flashing "there" on a hard reload.
  loading: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  supabaseUser: null,
  loading: true,
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
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Safety net: never let the initial auth check freeze the UI. The portal
    // holds its "Loading…" state until `loading` is false, so if getSession or
    // loadProfile is slow / hangs (a stalled network request can't be caught),
    // flip it false after a short cap and render anyway — loadProfile keeps
    // running and fills in the name when it resolves. The normal fast path
    // clears this timer immediately in the finally.
    const safety = setTimeout(() => setLoading(false), 2000);

    // Load initial session — swallow errors so a stale/invalid session never
    // surfaces as an unhandled rejection (which freezes the dev error overlay).
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) await loadProfile(session.user);
      })
      .catch(() => { setUser(null); setSupabaseUser(null); })
      .finally(() => { clearTimeout(safety); setLoading(false); });

    // Listen for auth changes. Only clear the user on an explicit SIGNED_OUT —
    // a transient event without a session must NOT wipe a logged-in profile.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          await loadProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSupabaseUser(null);
        }
      } catch {
        /* keep current state — don't wipe the profile on a transient error */
      }
    });

    return () => { clearTimeout(safety); subscription.unsubscribe(); };
  }, []);

  async function loadProfile(sbUser: User) {
    setSupabaseUser(sbUser);
    const fallbackName = sbUser.email?.split('@')[0] || 'User';

    // Resolve role + profile INDEPENDENTLY and defensively. loadProfile runs
    // concurrently (getSession + onAuthStateChange), so a transient failure on
    // either query must never blank the user back to null — that race is what
    // made a logged-in client intermittently flash "Hello there". Worst case we
    // fall back to the email name + the previously-known role; real logout is
    // handled by the SIGNED_OUT event, not by a query error here.
    let resolvedRole: UserRole | null = null;
    try {
      const { data } = await supabase.rpc('get_my_role');
      if (data === 'coach' || data === 'client') resolvedRole = data;
    } catch { /* transient — keep going */ }

    let profile: { full_name?: string | null; avatar_url?: string | null; nickname?: string | null } | null = null;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, nickname')
        .eq('id', sbUser.id)
        .maybeSingle();
      profile = data;
    } catch { /* transient — keep going */ }

    const name = profile?.full_name || fallbackName;
    setUser((prev) => ({
      role: resolvedRole ?? prev?.role ?? 'client',
      name,
      initials: getInitials(name),
      avatarUrl: profile?.avatar_url || undefined,
      nickname: profile?.nickname || undefined,
    }));
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
    // Belt-and-suspenders: hard-expire the Supabase auth cookies + clear any
    // leftover supabase keys, so logout FULLY clears even a wedged session
    // (signOut can silently fail on a clobbered/multi-role session).
    try {
      document.cookie.split(';').forEach((c) => {
        const name = c.split('=')[0].trim();
        if (name.startsWith('sb-') && name.includes('auth-token')) {
          document.cookie = `${name}=; Max-Age=0; path=/`;
        }
      });
      Object.keys(localStorage).filter((k) => k.startsWith('sb-')).forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
