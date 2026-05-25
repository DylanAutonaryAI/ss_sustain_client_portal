'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from './ThemeToggle';
import SsLogo from '@/components/ui/SsLogo';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  sections: NavSection[];
  userName: string;
  userInitials: string;
  userRole: string;
  isCoach?: boolean;
}

export default function Sidebar({
  sections,
  userName,
  userInitials,
  userRole,
  isCoach = false,
}: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside
      className="w-[220px] min-h-screen fixed top-0 left-0 z-60 flex flex-col"
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Brand + user */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5 mb-3.5">
          <SsLogo size={48} />
          <span className="font-serif text-[16px] tracking-[-0.3px]" style={{ color: 'var(--text)' }}>
            SS Sustain
          </span>
        </div>

        <div
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[9px]"
          style={{
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-mid)',
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
            style={{
              background: isCoach
                ? 'linear-gradient(135deg, #16c45a, #0d8f3e)'
                : 'var(--accent)',
            }}
          >
            {userInitials}
          </div>
          <div>
            <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
              {userName}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--accent-text)' }}>
              {userRole}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-2.5 overflow-y-auto flex flex-col gap-px">
        {sections.map((section) => (
          <div key={section.label}>
            <div
              className="text-[10px] font-semibold tracking-[1.2px] uppercase px-2 py-3 pb-1"
              style={{ color: 'var(--text3)' }}
            >
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-[7px] text-[13px] relative transition-all duration-[120ms] w-full"
                  style={{
                    color: isActive ? 'var(--accent-text)' : 'var(--text2)',
                    background: isActive ? 'var(--accent-dim)' : 'transparent',
                    fontWeight: isActive ? '500' : '400',
                  }}
                >
                  <span
                    className="w-[15px] h-[15px] flex-shrink-0 transition-opacity duration-[120ms]"
                    style={{ opacity: isActive ? 1 : 0.6 }}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                  {item.badge !== undefined && (
                    <span
                      className="ml-auto text-[10px] font-semibold px-1.5 py-px rounded-[10px] min-w-[18px] text-center text-white"
                      style={{ background: item.badgeColor || 'var(--accent)' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
        <ThemeToggle />
        <button
          onClick={logout}
          className="w-full py-2 rounded-[7px] text-[12px] font-medium transition-all duration-150 text-center"
          style={{
            background: 'none',
            border: '1px solid var(--border2)',
            color: 'var(--text3)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)';
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg3)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)';
            (e.currentTarget as HTMLButtonElement).style.background = 'none';
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
