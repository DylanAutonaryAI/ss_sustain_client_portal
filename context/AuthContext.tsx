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

// Shape returned by GET /api/me (server-validated identity).
interface MeResponse {
  role?: string | null;
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  nickname?: string | null;
}

function buildMockUser(d: MeResponse): MockUser {
  const name = d.full_name || d.email?.split('@')[0] || 'User';
  return {
    role: d.role === 'coach' || d.role === 'client' ? d.role : 'client',
    name,
    initials: getInitials(name),
    avatarUrl: d.avatar_url || undefined,
    nickname: d.nickname || undefined,
  };
}

// Ask the server for the cookie-validated identity. The server's getUser()
// validates the access token directly and never depends on the browser's
// client-side refresh-token grant (which can fail after the API-key migration),
// so this recovers the profile even when the browser client can't read/refresh
// the session. Returns null only when the server agrees there's no session.
async function fetchMe(): Promise<MockUser | null> {
  try {
    const res = await fetch('/api/me', { cache: 'no-store' });
    if (!res.ok) return null;
    const { user } = await res.json();
    return user ? buildMockUser(user) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Safety net: never let the initial auth check freeze the UI (the portal
    // holds its "Loading…" state until `loading` is false). Flip it false after
    // a short cap and render regardless; the user populates when it resolves.
    const safety = setTimeout(() => setLoading(false), 2000);

    // Initial load. Use getUser() (validates the access token) rather than
    // getSession(), which triggers a client-side refresh-token grant on load —
    // and that refresh can fail after the API-key migration, returning a null
    // session AND wiping the cookie, which showed the logged-in client as
    // "Good morning, there." If getUser() yields nothing, fall back to the
    // server (/api/me) — the same cookie-validated check the route guards pass —
    // so the profile loads even when the browser client can't read the session.
    (async () => {
      try {
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (sbUser) { await loadProfile(sbUser); return; }
        const me = await fetchMe();
        if (me) setUser(me);
      } catch {
        const me = await fetchMe();
        if (me) setUser(me); else { setUser(null); setSupabaseUser(null); }
      } finally {
        clearTimeout(safety);
        setLoading(false);
      }
    })();

    // Listen for auth changes. A FAILED background token refresh also fires
    // SIGNED_OUT, so before wiping the profile, re-check server-side: if the
    // access token still validates (/api/me returns a user), it was just a
    // client refresh hiccup — keep the user. Only clear when the server agrees
    // there's no session (a genuine sign-out clears the cookies, so /api/me
    // returns null and we clear).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          await loadProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          const me = await fetchMe();
          if (me) setUser(me);
          else { setUser(null); setSupabaseUser(null); }
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
