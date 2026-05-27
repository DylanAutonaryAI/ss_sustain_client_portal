import { createBrowserClient } from '@supabase/ssr';
import { processLock } from '@supabase/supabase-js';

// One shared browser client for the whole app. Previously every createClient()
// call made a NEW client (AuthProvider, login page, layout RPCs, …). All of them
// share the same `navigator.locks` auth lock, and under React StrictMode's
// double-mount they deadlocked it — getSession()/RPCs would hang forever, so
// `user` stayed null (broken name, avatar, greeting and sign-out). Reusing one
// instance, plus the in-memory processLock instead of navigator.locks, removes
// the deadlock.
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
        // In-memory lock — never deadlocks the way navigator.locks did.
        lock: processLock,
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
