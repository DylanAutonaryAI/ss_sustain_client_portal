import { createBrowserClient } from '@supabase/ssr';

// No-op auth lock: run every auth operation immediately without acquiring any
// cross-call lock. BOTH the default navigator.locks AND processLock deadlocked
// here — getSession() / get_my_role would grab the lock, hang, and never release,
// so loadProfile never finished and the profile stayed empty ("Hello there").
// With no lock there is nothing to deadlock on. The token is fresh right after
// login so there's no refresh to race, and this is a single-session browser app.
const noLock = <R,>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => fn();

// One shared browser client for the whole app — reused across AuthProvider, the
// login page, layout RPCs, etc. (creating a new client per call multiplied the
// lock contention).
function makeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Auth-link tokens are handled explicitly (server-side exchange in
        // /auth/callback). Turning off URL auto-detection stops the browser
        // client from racing to consume the same one-time code.
        detectSessionInUrl: false,
        flowType: 'pkce',
        lock: noLock,
      },
    },
  );
}

// Concrete factory above keeps the precise client type (a generic ReturnType on
// the overloaded createBrowserClient would collapse to `any`).
let browserClient: ReturnType<typeof makeClient> | undefined;

export function createClient() {
  if (!browserClient) browserClient = makeClient();
  return browserClient;
}
