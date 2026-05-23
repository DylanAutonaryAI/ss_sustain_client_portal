'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import { clients } from '@/lib/mock-data/clients';
import { coachMessageHistory } from '@/lib/mock-data/messages';

type HistoryItem = { date: string; body: string; read: boolean };

export default function CoachMessagesPage() {
  const [selected, setSelected] = useState(clients[0]);
  const [body, setBody]         = useState('');
  const [sent, setSent]         = useState(false);
  const [history, setHistory]   = useState<Record<string, HistoryItem[]>>(coachMessageHistory);

  const handleSend = () => {
    if (!body.trim()) return;
    const entry: HistoryItem = { date: 'Sent just now', body, read: false };
    setHistory((prev) => ({
      ...prev,
      [selected.name]: [entry, ...(prev[selected.name] ?? [])],
    }));
    setBody('');
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  };

  const currentHistory = history[selected.name] ?? [];

  return (
    <>
      <Topbar title="Client Messages" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7 max-w-[780px]">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Client <em className="italic" style={{ color: 'var(--accent-text)' }}>Messages</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Send personal notes to individual clients. Only they see it.
        </p>

        {/* Client selector */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-150"
              style={
                selected.id === c.id
                  ? { background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)', color: 'var(--accent-text)' }
                  : { background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text2)' }
              }
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Composer */}
        <div
          className="rounded-xl p-[22px] mb-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
              style={{ background: 'var(--accent)' }}
            >
              {selected.initials}
            </div>
            <div>
              <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                To: {selected.name}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
                Only this client will see this message in their portal
              </div>
            </div>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Write your personal feedback, update or note...\n\ne.g. Solid week — I've bumped your calories and added a set to hack squat. Keep it up.`}
            rows={4}
            className="w-full px-3.5 py-3 rounded-[9px] text-[13px] outline-none resize-y leading-[1.7] transition-colors duration-150 mb-3"
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border2)',
              color: 'var(--text)',
              minHeight: '100px',
            }}
            onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'; }}
            onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border2)'; }}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleSend}
              className="px-5 py-2.5 rounded-[8px] text-[13px] font-semibold text-white transition-all duration-150"
              style={{ background: sent ? '#0d8f3e' : 'var(--accent)' }}
              onMouseEnter={(e) => { if (!sent) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
            >
              {sent ? 'Sent ✓' : 'Send message'}
            </button>
            <span className="text-[11px]" style={{ color: 'var(--text3)' }}>
              Delivered instantly to {selected.name.split(' ')[0]}&apos;s portal
            </span>
          </div>
        </div>

        {/* History */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>
            Message history —{' '}
            <span style={{ color: 'var(--accent-text)' }}>{selected.name}</span>
          </span>
        </div>

        {currentHistory.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>No messages sent yet.</p>
        ) : (
          currentHistory.map((msg, i) => (
            <div
              key={i}
              className="rounded-[10px] px-[18px] py-4 mb-2"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-medium uppercase tracking-[0.5px]" style={{ color: 'var(--accent-text)' }}>
                  {msg.date}
                </span>
                <div className="flex gap-1.5">
                  <button
                    className="px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all duration-150"
                    style={{ border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text3)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg3)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    Edit
                  </button>
                  <button
                    className="px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all duration-150"
                    style={{ border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text3)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(240,79,79,0.3)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-[13px] leading-[1.8]" style={{ color: 'var(--text2)' }}>{msg.body}</p>
              <p className="text-[11px] mt-2" style={{ color: 'var(--text3)' }}>
                {msg.read ? '✓ Read by client' : '⏳ Not yet read'}
              </p>
            </div>
          ))
        )}
      </div>
    </>
  );
}
