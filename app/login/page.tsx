'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import SsLogo from '@/components/ui/SsLogo';
import LoginSplash from '@/components/ui/LoginSplash';

export default function LoginPage() {
  const [tab, setTab]           = useState<'client' | 'coach'>('client');
  const [mode, setMode]         = useState<'signin' | 'reset'>('signin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [splash, setSplash]     = useState(false);
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Incorrect email or password. Try again.');
      setLoading(false);
      return;
    }

    // Use security-definer RPC to bypass RLS and get role reliably
    const { data: role } = await supabase.rpc('get_my_role');

    // Enforce that the selected tab matches the account's actual role —
    // clients sign in under "Client", coaches under "Coach". On a mismatch,
    // sign back out so they can't bypass the gate by navigating directly.
    if (role !== tab) {
      await supabase.auth.signOut();
      setLoading(false);
      if (role === 'coach' && tab === 'client') {
        setError('That’s a coach account — switch to the Coach tab to sign in.');
      } else if (role === 'client' && tab === 'coach') {
        setError('That’s a client account — switch to the Client tab to sign in.');
      } else {
        setError('This account doesn’t have portal access yet. Contact your coach.');
      }
      return;
    }

    // Fresh login → clear any leftover onboarding skip so the flow shows again
    // every time (testing mode). Harmless in prod once ONBOARDING_TEST_MODE is off.
    sessionStorage.removeItem('ss-dev-skip');

    // Play the swoosh splash, then hard-navigate. The hard nav keeps the white
    // splash on screen until the dashboard document loads underneath it.
    const dest = role === 'coach' ? '/coach/overview' : '/portal/home';
    setSplash(true);
    setTimeout(() => { window.location.href = dest; }, 1000);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError('Enter your email and we’ll send a reset link.'); return; }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
    setLoading(false);

    if (error && /rate|limit|seconds/i.test(error.message)) {
      setError('Too many requests — wait a minute and try again.');
      return;
    }
    // Don't reveal whether an account exists — always confirm.
    setResetSent(true);
  }

  function goReset() { setMode('reset'); setError(''); setResetSent(false); }
  function goSignin() { setMode('signin'); setError(''); setResetSent(false); }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg2)', border: '1px solid var(--border2)',
    borderRadius: 10, color: 'var(--text)', fontSize: 14, padding: '12px 14px',
    outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s',
  };
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-[0.5px] mb-1.5';
  const btnCls = 'w-full py-3 rounded-[10px] text-[14px] font-semibold text-white transition-all duration-150 mt-1 disabled:opacity-60';
  const errBox = (
    <p className="text-[12px] px-3 py-2 rounded-[7px]" style={{ color: 'var(--red)', background: 'rgba(240,79,79,0.08)', border: '1px solid rgba(240,79,79,0.2)' }}>
      {error}
    </p>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      {splash && <LoginSplash />}
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <SsLogo size={48} />
          <span className="font-serif text-[20px]" style={{ color: 'var(--text)' }}>SS Sustain</span>
        </div>

        {/* Card */}
        <div className="rounded-[16px] p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          {mode === 'signin' ? (
            <>
              {/* Tab switcher */}
              <div className="flex rounded-[10px] p-1 mb-6" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                {(['client', 'coach'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTab(t); setError(''); }}
                    className="flex-1 py-2 text-[13px] font-semibold rounded-[7px] transition-all duration-150 capitalize"
                    style={{
                      background: tab === t ? 'var(--accent)' : 'transparent',
                      color: tab === t ? '#fff' : 'var(--text3)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {t === 'client' ? 'Client' : 'Coach'}
                  </button>
                ))}
              </div>

              <h1 className="font-serif text-[26px] tracking-[-0.4px] mb-1.5" style={{ color: 'var(--text)' }}>
                Welcome back
              </h1>
              <p className="text-[13px] mb-6" style={{ color: 'var(--text2)' }}>
                {tab === 'coach' ? 'Sign in to your coaching dashboard.' : 'Sign in to access your portal.'}
              </p>

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div>
                  <label className={labelCls} style={{ color: 'var(--text3)' }}>Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" style={inputStyle} autoComplete="email"
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelCls + ' mb-0'} style={{ color: 'var(--text3)' }}>Password</label>
                    <button
                      type="button"
                      onClick={goReset}
                      className="text-[11px] font-medium"
                      style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" style={inputStyle} autoComplete="current-password"
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
                  />
                </div>

                {error && errBox}

                <button
                  type="submit" disabled={loading} className={btnCls}
                  style={{ background: 'var(--accent)', border: 'none', cursor: loading ? 'default' : 'pointer' }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <p className="text-[11px] mt-5 text-center" style={{ color: 'var(--text3)' }}>
                {tab === 'coach'
                  ? 'Coaching access only. Contact support if you need help.'
                  : 'New client? Access is set up by your coach.\nGet in touch at '}
                {tab === 'client' && (
                  <a href="mailto:coach@sssustain.com" style={{ color: 'var(--accent)' }}>coach@sssustain.com</a>
                )}
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif text-[26px] tracking-[-0.4px] mb-1.5" style={{ color: 'var(--text)' }}>
                Reset your password
              </h1>

              {resetSent ? (
                <>
                  <p className="text-[13px] mb-5" style={{ color: 'var(--text2)' }}>
                    If an account exists for <strong style={{ color: 'var(--text)' }}>{email.trim()}</strong>, a password-reset link is on its way. Open it to choose a new password.
                  </p>
                  <div
                    className="text-[12px] px-3 py-2.5 rounded-[8px] mb-5"
                    style={{ color: 'var(--accent-text)', background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)' }}
                  >
                    Didn’t get it? Check spam, or wait a minute and try again.
                  </div>
                  <button type="button" onClick={goSignin} className="text-[13px]" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    ← Back to sign in
                  </button>
                </>
              ) : (
                <>
                  <p className="text-[13px] mb-6" style={{ color: 'var(--text2)' }}>
                    Enter your email and we’ll send a link to reset your password. Works for both client and coach accounts.
                  </p>
                  <form onSubmit={handleReset} className="flex flex-col gap-4">
                    <div>
                      <label className={labelCls} style={{ color: 'var(--text3)' }}>Email</label>
                      <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com" style={inputStyle} autoComplete="email" autoFocus
                        onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
                        onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
                      />
                    </div>

                    {error && errBox}

                    <button
                      type="submit" disabled={loading} className={btnCls}
                      style={{ background: 'var(--accent)', border: 'none', cursor: loading ? 'default' : 'pointer' }}
                      onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
                    >
                      {loading ? 'Sending…' : 'Send reset link'}
                    </button>
                  </form>
                  <button type="button" onClick={goSignin} className="text-[13px] mt-5" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    ← Back to sign in
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
