import type { CoachMessage } from '@/lib/types';

export default function MsgBubble({ msg }: { msg: CoachMessage }) {
  return (
    <div
      className="rounded-[10px] px-5 py-[18px] mb-2.5"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${msg.unread ? 'var(--accent-mid)' : 'var(--border)'}`,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
          style={{ background: 'var(--accent)' }}
        >
          {msg.fromInitials}
        </div>
        <div>
          <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{msg.from}</div>
          <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{msg.time}</div>
        </div>
        {msg.unread && (
          <span
            className="ml-auto text-[10px] font-semibold px-2 py-[2px] rounded-[10px] text-white"
            style={{ background: 'var(--accent)' }}
          >
            New
          </span>
        )}
      </div>
      <p className="text-[13px] leading-[1.8]" style={{ color: 'var(--text2)' }}>{msg.body}</p>
      <p className="text-[11px] mt-2.5" style={{ color: 'var(--text3)' }}>
        {msg.unread ? '↗ Received ' + msg.time : '✓ Read'}
      </p>
    </div>
  );
}
