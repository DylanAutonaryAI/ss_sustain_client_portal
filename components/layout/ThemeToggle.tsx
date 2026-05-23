'use client';

import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      onClick={toggleTheme}
      className="flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer"
      style={{ background: 'var(--bg3)' }}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--text2)' }}>
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </span>
      <div
        className="relative w-[34px] h-[18px] rounded-full transition-colors duration-200 cursor-pointer"
        style={{ background: theme === 'light' ? 'var(--accent)' : 'var(--border2)' }}
      >
        <div
          className="absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full transition-transform duration-200"
          style={{
            transform: theme === 'light' ? 'translateX(16px)' : 'translateX(0)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </div>
  );
}
