'use client';

import { useState, useEffect } from 'react';
import type { EmailOtpType } from '@supabase/supabase-js';
import SsLogo from '@/components/ui/SsLogo';

type Stage = 'loading' | 'set-password' | 'error';

// The link that brought the user here can take three shapes:
//  - tokens:  #access_token=…&refresh_token=…   (implicit flow — coach invites)
//  - code:    ?code=…                            (PKCE flow — password reset / magic link)
//  - otp:     ?token_hash=…&type=recovery        (token-hash email templates)
type Link =
  | { kind: 'tokens'; access_token: string; refresh_token: string }
  | { kind: 'code'; code: string }
  | { kind: 'otp'; token_hash: string; type: EmailOtpType }
  | null;

// Module-scoped cache: the one-time code may only be exchanged once, but React
// StrictMode (dev) mounts this effect twice. Caching the in-flight request by
// key guarantees a single server exchange that both passes can await.
const exchangeCache = new Map<string, Promise<boolean>>();

function exchangeOnce(key: string, body: Record<string, string>): Promise<boolean> {
  if (!exchangeCache.has(key)) {
    exchangeCache.set(
      key,
      fetch('/api/auth/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.ok).catch(() => false),
    );
  }
  return exchangeCache.get(key)!;
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg2)', border: '1px solid var(--border2)',
  borderRadius: 10, color: 'var(--text)', fontSize: 14, padding: '12px 14px',
  outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s',
};

export default function AuthCallbackPage() {
  // Capture link params once during render, before effects (or StrictMode's
  // double-invoke) can strip them. Never present during SSR.
  const [link] = useState<Link>(() => {
    if (typeof window === 'undefined') return null;
    const hash = new URLSearchParams(window.location.hash.substring(1));
    const at = hash.get('access_token');
    const rt = hash.get('refresh_token');
    if (at && rt) return { kind: 'tokens', access_token: at, refresh_token: rt };

    const q = new URLSearchParams(window.location.search);
    const code = q.get('code');
    if (code) return { kind: 'code', code };

    const token_hash = q.get('token_hash');
    const type = q.get('type');
    if (token_hash && type) return { kind: 'otp', token_hash, type: type as EmailOtpType };

    return null;
  });

  const [stage, setStage]       = useState<Stage>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    const strip = () => window.history.replaceState(null, '', window.location.pathname);

    if (!link) { setStage('error'); return; }

    // Invite path: tokens are consumed later by the server route — show the form now.
    if (link.kind === 'tokens') {
      strip();
      setStage('set-password');
      return;
    }

    // Reset / magic link: exchange the credential server-side (single shared request).
    const key = link.kind === 'code' ? link.code : link.token_hash;
    const body: Record<string, string> = link.kind === 'code'
      ? { code: link.code }
      : { token_hash: link.token_hash, type: link.type };

    exchangeOnce(key, body).then(ok => {
      if (cancelled) return;
      strip();
      setStage(ok ? 'set-password' : 'error');
    });

    return () => { cancelled = true; };
  }, [link]);

  async function handleSetPassword() {
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm)  { setError('Passwords do not match.'); return; }
    setSaving(true);
    setError('');

    // Invite (implicit tokens) → server route validates the token + sets the session.
    if (link?.kind === 'tokens') {
      const res = await fetch('/api/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: link.access_token, refresh_token: link.refresh_token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to set password.'); setSaving(false); return; }
      window.location.href = data.needsLogin ? '/login' : '/portal/home';
      return;
    }

    // Reset (PKCE/OTP) → session is already established; update via server route.
    const res = await fetch('/api/auth/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Could not update password.'); setSaving(false); return; }
    window.location.href = data.role === 'coach' ? '/coach/overview' : '/portal/home';
  }

  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <p className="text-[14px]" style={{ color: 'var(--text2)' }}>Verifying your link…</p>
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <p className="text-[14px] mb-3" style={{ color: 'var(--text2)' }}>
            This link has expired or has already been used. Request a new one from the login page.
          </p>
          <a href="/login" style={{ color: 'var(--accent)', fontSize: 13 }}>Go to login →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <SsLogo size={48} />
          <span className="font-serif text-[20px]" style={{ color: 'var(--text)' }}>SS Sustain</span>
        </div>

        <div className="rounded-[16px] p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <h1 className="font-serif text-[24px] tracking-[-0.4px] mb-1.5" style={{ color: 'var(--text)' }}>
            Set your password
          </h1>
          <p className="text-[13px] mb-6" style={{ color: 'var(--text2)' }}>
            Choose a new password to secure your account.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] mb-1.5" style={{ color: 'var(--text3)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                style={inputStyle}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
                onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] mb-1.5" style={{ color: 'var(--text3)' }}>
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
                onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
              />
            </div>

            {error && (
              <p className="text-[12px] px-3 py-2 rounded-[7px]" style={{ color: 'var(--red)', background: 'rgba(240,79,79,0.08)', border: '1px solid rgba(240,79,79,0.2)' }}>
                {error}
              </p>
            )}

            <button
              onClick={handleSetPassword}
              disabled={saving}
              className="w-full py-3 rounded-[10px] text-[14px] font-semibold text-white transition-all duration-150 mt-1 disabled:opacity-60"
              style={{ background: 'var(--accent)', border: 'none', cursor: saving ? 'default' : 'pointer' }}
              onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
            >
              {saving ? 'Saving…' : 'Set password & continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
