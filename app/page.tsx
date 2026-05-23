'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';

export default function LoginPage() {
  const [role, setRole] = useState<UserRole>('client');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    login(role);
    if (role === 'coach') {
      router.push('/coach/overview');
    } else {
      const onboardingDone = localStorage.getItem('ss-onboarding-done');
      router.push(onboardingDone ? '/portal/home' : '/portal/onboarding');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(22,196,90,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-[400px] px-5 relative z-10">
        <div className="flex items-center gap-2.5 mb-9 justify-center">
          <div
            className="w-[34px] h-[34px] rounded-[8px] flex items-center justify-center font-serif text-[15px] text-white"
            style={{ background: 'var(--accent)' }}
          >
            SS
          </div>
          <span className="font-serif text-[19px] tracking-[-0.3px]" style={{ color: 'var(--text)' }}>
            SS Sustain
          </span>
        </div>

        <div
          className="rounded-[16px] p-8"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border2)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            className="flex gap-1 mb-6 p-[3px] rounded-[8px]"
            style={{ background: 'var(--bg3)' }}
          >
            {(['client', 'coach'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className="flex-1 py-[7px] px-3 rounded-[6px] text-[13px] font-medium capitalize transition-all duration-150"
                style={
                  role === r
                    ? { background: 'var(--surface)', color: 'var(--text)', boxShadow: 'var(--shadow-sm)' }
                    : { background: 'transparent', color: 'var(--text2)' }
                }
              >
                {r === 'client' ? 'Client' : 'Coach'}
              </button>
            ))}
          </div>

          <h1 className="font-serif text-[26px] tracking-[-0.5px] mb-1.5" style={{ color: 'var(--text)' }}>
            Welcome back
          </h1>
          <p className="text-[13px] mb-6" style={{ color: 'var(--text2)' }}>
            Sign in to access your portal.
          </p>

          <label className="block text-[11px] font-semibold uppercase tracking-[0.8px] mb-1.5" style={{ color: 'var(--text3)' }}>
            Email
          </label>
          <input
            type="email"
            placeholder="you@email.com"
            className="w-full px-3.5 py-[11px] rounded-[9px] text-[14px] outline-none transition-colors duration-150 mb-3.5"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text)' }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
          />

          <label className="block text-[11px] font-semibold uppercase tracking-[0.8px] mb-1.5" style={{ color: 'var(--text3)' }}>
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-3.5 py-[11px] rounded-[9px] text-[14px] outline-none transition-colors duration-150 mb-3.5"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text)' }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
          />

          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-[9px] text-white text-[14px] font-semibold tracking-[0.2px] mt-1 transition-all duration-200"
            style={{ background: 'var(--accent)' }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.filter = 'brightness(1.08)';
              el.style.transform = 'translateY(-1px)';
              el.style.boxShadow = '0 4px 16px rgba(22,196,90,0.3)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.filter = '';
              el.style.transform = '';
              el.style.boxShadow = '';
            }}
          >
            Sign in
          </button>

          <p className="text-[12px] text-center mt-[18px] leading-[1.6]" style={{ color: 'var(--text3)' }}>
            New client? Access is set up by your coach.
            <br />
            Get in touch at{' '}
            <a href="mailto:coach@sssustain.com" style={{ color: 'var(--accent-text)', textDecoration: 'none' }}>
              coach@sssustain.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
