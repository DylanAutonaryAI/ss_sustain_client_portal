'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface ResourceRowProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  href?: string;
  badge?: string | number;
  color?: string;
  onClick?: () => void;
}

export default function ResourceRow({ icon, title, subtitle, href, badge, color = 'var(--accent)', onClick }: ResourceRowProps) {
  function handleEnter(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    el.style.borderColor = 'var(--border2)';
    el.style.background = 'var(--surface2)';
    el.style.boxShadow = 'var(--shadow)';
    el.style.transform = 'translateY(-1px)';
    const arrow = el.querySelector<HTMLSpanElement>('[data-arrow]');
    if (arrow) arrow.style.opacity = '0.7';
  }

  function handleLeave(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    el.style.borderColor = 'var(--border)';
    el.style.background = 'var(--surface)';
    el.style.boxShadow = 'var(--shadow-sm)';
    el.style.transform = 'translateY(0)';
    const arrow = el.querySelector<HTMLSpanElement>('[data-arrow]');
    if (arrow) arrow.style.opacity = '0.25';
  }

  const inner = (
    <div
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="flex items-center gap-4 px-5 py-4 rounded-[14px] cursor-pointer transition-all duration-200"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center flex-shrink-0"
        style={{
          background: `color-mix(in srgb, ${color} 18%, var(--surface))`,
          boxShadow: `0 2px 8px color-mix(in srgb, ${color} 28%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)`,
          color,
        }}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-[3px]">
          <h4 className="text-[13.5px] font-semibold leading-none" style={{ color: 'var(--text)' }}>
            {title}
          </h4>
          {badge !== undefined && (
            <span
              className="text-[10px] font-bold px-[6px] py-[2px] rounded-full leading-none flex-shrink-0"
              style={{
                background: `color-mix(in srgb, ${color} 18%, transparent)`,
                color,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11.5px] leading-snug" style={{ color: 'var(--text2)' }}>
          {subtitle}
        </p>
      </div>

      <span
        data-arrow=""
        className="text-[20px] flex-shrink-0 transition-opacity duration-200"
        style={{ color: 'var(--text)', opacity: 0.25 }}
      >
        ›
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
        {inner}
      </Link>
    );
  }

  return inner;
}
