'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Topbar from '@/components/layout/Topbar';
import { useAuth } from '@/context/AuthContext';

function getInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || '?';
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg2)', border: '1px solid var(--border2)',
  borderRadius: 9, color: 'var(--text)', fontSize: 14, padding: '11px 14px',
  outline: 'none', fontFamily: 'inherit',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)',
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
};

function focusBorder(e: React.FocusEvent<HTMLInputElement>) { e.target.style.borderColor = 'var(--accent)'; }
function blurBorder(e: React.FocusEvent<HTMLInputElement>)  { e.target.style.borderColor = 'var(--border2)'; }

// A small status line shown under each section's save button.
function Status({ msg, error }: { msg: string; error: boolean }) {
  if (!msg) return null;
  return (
    <p className="text-[12px] mt-2" style={{ color: error ? 'var(--red)' : 'var(--accent-text)' }}>
      {msg}
    </p>
  );
}

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-[14px] p-6 mb-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text)' }}>{title}</h2>
      <p className="text-[12px] mb-5" style={{ color: 'var(--text3)' }}>{desc}</p>
      {children}
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px', background: 'var(--accent)', color: '#fff', border: 'none',
  borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};

export default function SettingsPage() {
  const { refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);

  // Profile fields
  const [email, setEmail]       = useState('');
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthday, setBirthday] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Per-section busy + status
  const [avatarBusy, setAvatarBusy]   = useState(false);
  const [avatarMsg, setAvatarMsg]     = useState({ msg: '', error: false });
  const [detailsBusy, setDetailsBusy] = useState(false);
  const [detailsMsg, setDetailsMsg]   = useState({ msg: '', error: false });
  const [emailBusy, setEmailBusy]     = useState(false);
  const [emailMsg, setEmailMsg]       = useState({ msg: '', error: false });

  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg]   = useState({ msg: '', error: false });

  const load = useCallback(async () => {
    const res = await fetch('/api/profile', { cache: 'no-store' });
    const data = await res.json();
    if (res.ok) {
      setEmail(data.profile.email || '');
      setFullName(data.profile.full_name || '');
      setNickname(data.profile.nickname || '');
      setBirthday(data.profile.birthday || '');
      setAvatarUrl(data.profile.avatar_url || '');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    setAvatarMsg({ msg: '', error: false });
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd });
    const data = await res.json();
    if (res.ok) {
      setAvatarUrl(data.avatar_url);
      setAvatarMsg({ msg: 'Photo updated ✓', error: false });
      await refreshProfile();
    } else {
      setAvatarMsg({ msg: data.error || 'Upload failed.', error: true });
    }
    setAvatarBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function saveDetails() {
    setDetailsBusy(true);
    setDetailsMsg({ msg: '', error: false });
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, nickname, birthday: birthday || null }),
    });
    const data = await res.json();
    if (res.ok) {
      setDetailsMsg({ msg: 'Saved ✓', error: false });
      await refreshProfile();
    } else {
      setDetailsMsg({ msg: data.error || 'Could not save.', error: true });
    }
    setDetailsBusy(false);
  }

  async function saveEmail() {
    setEmailBusy(true);
    setEmailMsg({ msg: '', error: false });
    const res = await fetch('/api/profile/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      setEmailMsg({ msg: 'Email updated ✓ — use it next time you sign in.', error: false });
      await refreshProfile();
    } else {
      setEmailMsg({ msg: data.error || 'Could not update email.', error: true });
    }
    setEmailBusy(false);
  }

  async function savePassword() {
    setPwMsg({ msg: '', error: false });
    if (pw1.length < 6) { setPwMsg({ msg: 'Password must be at least 6 characters.', error: true }); return; }
    if (pw1 !== pw2)    { setPwMsg({ msg: 'Passwords do not match.', error: true }); return; }
    setPwBusy(true);
    // Server route uses the admin API — the browser supabase.auth.updateUser
    // call hangs after the API-key migration, the same way getUser/getSession do.
    // Wrapped in try/finally so the button NEVER gets stuck on "Saving…", even
    // if the response is non-JSON (e.g. a Vercel function timeout returning HTML)
    // or the network drops mid-stream.
    // Abort after 15s so the button can never get permanently stuck on "Saving…".
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw1 }),
        signal: ctrl.signal,
      });
      // Read as text first so a non-JSON body (e.g. an error page) can't throw.
      const data = await res.json().catch(() => ({} as { error?: string }));
      if (res.ok) {
        setPwMsg({ msg: 'Password changed ✓', error: false });
        setPw1(''); setPw2('');
      } else {
        setPwMsg({ msg: data.error || 'Could not change password.', error: true });
      }
    } catch (e) {
      const aborted = e instanceof DOMException && e.name === 'AbortError';
      setPwMsg({
        msg: aborted
          ? 'Server took too long. Your password may have changed — try signing in with the new one.'
          : 'Could not reach the server. Try again.',
        error: true,
      });
    } finally {
      clearTimeout(timer);
      setPwBusy(false);
    }
  }

  const displayName = nickname || fullName || 'You';

  return (
    <>
      <Topbar title="Settings" statusLabel="Your account" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Account <em className="italic" style={{ color: 'var(--accent-text)' }}>Settings</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Update your photo, details, and login. Changes save straight to your account.
        </p>

        {loading ? (
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>Loading…</p>
        ) : (
          <>
            {/* Profile photo */}
            <Card title="Profile photo" desc="Shown in your sidebar and to your coach. Max 5MB.">
              <div className="flex items-center gap-5">
                <div
                  className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[22px] font-semibold text-white flex-shrink-0 overflow-hidden"
                  style={{ background: avatarUrl ? 'transparent' : 'var(--accent)' }}
                >
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={displayName} width={72} height={72} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    getInitials(displayName)
                  )}
                </div>
                <div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onPickAvatar} style={{ display: 'none' }} />
                  <button onClick={() => fileRef.current?.click()} disabled={avatarBusy} style={{ ...btnPrimary, opacity: avatarBusy ? 0.6 : 1 }}>
                    {avatarBusy ? 'Uploading…' : 'Upload photo'}
                  </button>
                  <Status msg={avatarMsg.msg} error={avatarMsg.error} />
                </div>
              </div>
            </Card>

            {/* Details */}
            <Card title="Your details" desc="Your name, what you'd like to be called, and your birthday.">
              <div className="flex flex-col gap-4">
                <div>
                  <label style={labelStyle}>Full name</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} placeholder="Your full name" />
                </div>
                <div>
                  <label style={labelStyle}>Nickname</label>
                  <input value={nickname} onChange={e => setNickname(e.target.value)} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} placeholder="What should we call you?" />
                </div>
                <div>
                  <label style={labelStyle}>Birthday</label>
                  <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} />
                </div>
                <div>
                  <button onClick={saveDetails} disabled={detailsBusy} style={{ ...btnPrimary, opacity: detailsBusy ? 0.6 : 1 }}>
                    {detailsBusy ? 'Saving…' : 'Save details'}
                  </button>
                  <Status msg={detailsMsg.msg} error={detailsMsg.error} />
                </div>
              </div>
            </Card>

            {/* Email */}
            <Card title="Email address" desc="The email you use to sign in.">
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} autoComplete="email" />
                <div className="mt-4">
                  <button onClick={saveEmail} disabled={emailBusy} style={{ ...btnPrimary, opacity: emailBusy ? 0.6 : 1 }}>
                    {emailBusy ? 'Updating…' : 'Update email'}
                  </button>
                  <Status msg={emailMsg.msg} error={emailMsg.error} />
                </div>
              </div>
            </Card>

            {/* Password */}
            <Card title="Password" desc="Set a new password. At least 6 characters.">
              <div className="flex flex-col gap-4">
                <div>
                  <label style={labelStyle}>New password</label>
                  <input type="password" value={pw1} onChange={e => setPw1(e.target.value)} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} autoComplete="new-password" />
                </div>
                <div>
                  <label style={labelStyle}>Confirm new password</label>
                  <input type="password" value={pw2} onChange={e => setPw2(e.target.value)} style={inputStyle} onFocus={focusBorder} onBlur={blurBorder} autoComplete="new-password" />
                </div>
                <div>
                  <button onClick={savePassword} disabled={pwBusy} style={{ ...btnPrimary, opacity: pwBusy ? 0.6 : 1 }}>
                    {pwBusy ? 'Saving…' : 'Change password'}
                  </button>
                  <Status msg={pwMsg.msg} error={pwMsg.error} />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
