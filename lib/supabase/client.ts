import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Auth-link tokens are handled explicitly (server-side exchange in
        // /auth/callback). Turning off URL auto-detection stops the several
        // browser client instances (AuthProvider, page, etc.) from racing to
        // consume the same one-time code and deadlocking on the auth lock.
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    },
  );
}
