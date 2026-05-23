'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';
import { StatusPill, PayTag } from '@/components/ui/Pill';
import { clients } from '@/lib/mock-data/clients';

export default function ClientRosterPage() {
  const [openNotes, setOpenNotes] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(clients.map((c) => [c.id, c.notes]))
  );
  const [saved, setSaved] = useState<string | null>(null);

  const toggleNotes = (id: string) => setOpenNotes(openNotes === id ? null : id);

  const saveNote = (id: string) => {
    setSaved(id);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <>
      <Topbar title="Client Roster" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Client <em className="italic" style={{ color: 'var(--accent-text)' }}>Roster</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          All active and paused clients. Click a row to add private coach notes.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Total clients"         value="67"   valueColor="var(--accent-text)" />
          <StatCard label="Paused"                value="3" />
          <StatCard label="Avg revenue / client"  value="£147" valueColor="var(--accent-text)" />
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div
            className="grid px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[1px]"
            style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', background: 'var(--bg3)', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}
          >
            <div>Client</div><div>Goal</div><div>Duration</div><div>Status</div><div>Payment</div>
          </div>

          {clients.map((c, i) => (
            <div key={c.id}>
              <div
                className="grid items-center px-5 py-3 cursor-pointer transition-colors duration-100"
                style={{
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  borderBottom: '1px solid var(--border)',
                }}
                onClick={() => toggleNotes(c.id)}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0"
                    style={{ background: 'var(--accent)' }}
                  >
                    {c.initials}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{c.name}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{c.since}</div>
                  </div>
                </div>
                <div className="text-[13px]" style={{ color: 'var(--text2)' }}>{c.goal}</div>
                <div className="text-[13px]" style={{ color: 'var(--text2)' }}>{c.duration}</div>
                <div><StatusPill status={c.status} /></div>
                <div><PayTag status={c.payment} /></div>
              </div>

              {openNotes === c.id && (
                <div
                  className="px-5 pb-4"
                  style={{ borderBottom: i < clients.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div
                    className="rounded-xl p-[22px] mt-1"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                  >
                    <h3 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text)' }}>
                      Private coach notes — {c.name}
                    </h3>
                    <p className="text-[12px] mb-3.5" style={{ color: 'var(--text3)' }}>
                      Only you can see these. Never visible to the client.
                    </p>
                    <textarea
                      value={notes[c.id]}
                      onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-[8px] text-[13px] outline-none resize-y leading-[1.7] transition-colors duration-150 mb-2.5"
                      style={{
                        background: 'var(--bg2)',
                        border: '1px solid var(--border2)',
                        color: 'var(--text)',
                        minHeight: '70px',
                      }}
                      onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'; }}
                      onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border2)'; }}
                    />
                    <button
                      onClick={() => saveNote(c.id)}
                      className="px-[18px] py-[9px] rounded-[8px] text-[13px] font-semibold text-white transition-all duration-150"
                      style={{ background: saved === c.id ? '#0d8f3e' : 'var(--accent)' }}
                      onMouseEnter={(e) => { if (saved !== c.id) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
                    >
                      {saved === c.id ? 'Saved ✓' : 'Save note'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
