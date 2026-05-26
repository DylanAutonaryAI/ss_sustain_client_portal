'use client';

import { useState, useEffect } from 'react';
import SsLogo from '@/components/ui/SsLogo';

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg2)', border: '1px solid var(--border2)',
  borderRadius: 10, color: 'var(--text)', fontSize: 14, padding: '12px 14px',
  outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s',
};

export default function JoinPage() {
  const [ref, setRef]     = useState('');
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]   = useState(false);

  useEffect(() => {
    setRef(new URLSearchParams(window.location.search).get('ref') || '');
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError('Please enter your name and email.'); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/referral/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, name, email }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Something went wrong — try again.'); return; }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-[420px]">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <SsLogo size={48} />
          <span className="font-serif text-[20px]" style={{ color: 'var(--text)' }}>SS Sustain</span>
        </div>

        <div className="rounded-[16px] p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          {sent ? (
            <div className="text-center">
              <div className="font-serif text-[24px] tracking-[-0.4px] mb-2" style={{ color: 'var(--text)' }}>
                You&apos;re on the list 🎉
              </div>
              <p className="text-[13px] leading-[1.7]" style={{ color: 'var(--text2)' }}>
                Thanks, {name.trim().split(' ')[0]}. A coach from SS Sustain will reach out to{' '}
                <strong style={{ color: 'var(--text)' }}>{email.trim()}</strong> soon to get you started.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-[26px] tracking-[-0.4px] mb-1.5" style={{ color: 'var(--text)' }}>
                Start with SS Sustain
              </h1>
              <p className="text-[13px] mb-6" style={{ color: 'var(--text2)' }}>
                {ref
                  ? 'A friend thinks you’d be a great fit. Leave your details and a coach will be in touch.'
                  : 'Leave your details and a coach will be in touch about coaching.'}
              </p>

              <form onSubmit={submit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] mb-1.5" style={{ color: 'var(--text3)' }}>
                    Your name
                  </label>
                  <input
                    value={name} onChange={e => setName(e.target.value)} placeholder="Jordan Smith" style={inputStyle}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.5px] mb-1.5" style={{ color: 'var(--text3)' }}>
                    Email
                  </label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} autoComplete="email"
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
                  />
                </div>

                {error && (
                  <p className="text-[12px] px-3 py-2 rounded-[7px]" style={{ color: 'var(--red)', background: 'rgba(240,79,79,0.08)', border: '1px solid rgba(240,79,79,0.2)' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3 rounded-[10px] text-[14px] font-semibold text-white transition-all duration-150 mt-1 disabled:opacity-60"
                  style={{ background: 'var(--accent)', border: 'none', cursor: loading ? 'default' : 'pointer' }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
                >
                  {loading ? 'Sending…' : 'Request to join'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
