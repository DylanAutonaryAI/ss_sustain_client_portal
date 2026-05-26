'use client';

import { useRouter } from 'next/navigation';

interface ChurnAlertProps {
  icon: string;
  title: string;
  body: string;
}

export default function ChurnAlert({ icon, title, body }: ChurnAlertProps) {
  const router = useRouter();
  return (
    <div
      className="flex items-start gap-3 px-[18px] py-3.5 mb-2 rounded-r-[10px]"
      style={{
        background: 'rgba(240,79,79,0.06)',
        border: '1px solid rgba(240,79,79,0.2)',
        borderLeft: '3px solid var(--red)',
      }}
    >
      <span className="text-[15px] flex-shrink-0 mt-px">{icon}</span>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-semibold mb-[2px]" style={{ color: 'var(--red)' }}>{title}</h4>
        <p className="text-[12px] leading-[1.6]" style={{ color: 'var(--text2)' }}>{body}</p>
      </div>
      <button
        onClick={() => router.push('/coach/health')}
        className="flex-shrink-0 ml-auto px-3.5 py-1.5 rounded-[7px] text-[12px] font-medium whitespace-nowrap transition-all duration-150"
        style={{
          border: '1px solid rgba(240,79,79,0.3)',
          background: 'transparent',
          color: 'var(--red)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(240,79,79,0.08)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        Review →
      </button>
    </div>
  );
}
