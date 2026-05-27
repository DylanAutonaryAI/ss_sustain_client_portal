'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Topbar from '@/components/layout/Topbar';
import StatCard from '@/components/ui/StatCard';
import { StatusPill, PayTag } from '@/components/ui/Pill';
import { calcPaymentStatus } from '@/context/ClientContext';
import { mapRow, type ClientRow } from '@/lib/clients';
import { weekFromStart } from '@/lib/my-client';
import { ONBOARDING_TOTAL } from '@/lib/onboarding';
import type { Client, ClientStatus } from '@/lib/types';

// Onboarding state for the roster: completed (green), in progress (amber), or
// not started (grey). Reads from the per-client progress joined into /api/clients.
function onboardingStatus(c: Client): { label: string; color: string } {
  if (c.onboardingCompletedAt) return { label: 'Onboarded ✓', color: 'var(--accent-text)' };
  const done = c.onboardingStepsDone ?? 0;
  if (done === 0) return { label: 'Onboarding not started', color: 'var(--text3)' };
  return { label: `Onboarding ${done}/${ONBOARDING_TOTAL}`, color: 'var(--amber)' };
}

function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getSince() {
  const d = new Date();
  return `Since ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`;
}

const GOALS = ['Bulk', 'Fat loss', 'Muscle build', 'Body recomp', 'Maintenance', 'Athletic performance'];

function AddClientModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [goal, setGoal]             = useState('Fat loss');
  const [goalCustom, setGoalCustom] = useState('');
  const [status, setStatus]         = useState<ClientStatus>('Active');
  const [notes, setNotes]           = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [sent, setSent]             = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg2)', border: '1px solid var(--border2)',
    borderRadius: 8, color: 'var(--text)', fontSize: 13, padding: '9px 12px',
    outline: 'none', fontFamily: 'inherit',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)',
    textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4,
  };

  async function handleSubmit() {
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!email.trim()) { setError('Email is required.'); return; }
    const finalGoal = goal === '__custom__' ? goalCustom.trim() : goal;
    if (!finalGoal) { setError('Please enter a goal.'); return; }

    setLoading(true);
    setError('');

    const res = await fetch('/api/invite-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        full_name: name.trim(),
        goal: finalGoal,
        status,
        notes: notes.trim(),
        since: getSince(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Failed to add client. Check your service role key in .env.local.');
      setLoading(false);
      return;
    }

    setSent(true);
    onAdded();
    setTimeout(onClose, 1200);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[520px] rounded-[16px] overflow-hidden"
        style={{ background: 'var(--surface)', border: '1px solid var(--border2)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-serif text-[20px]" style={{ color: 'var(--text)' }}>
              Add <em className="italic" style={{ color: 'var(--accent-text)' }}>Client</em>
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
              Sends a portal invite email so they can set their password.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[16px] transition-colors duration-150"
            style={{ background: 'var(--bg3)', color: 'var(--text3)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg2)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg3)'; }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Full name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sarah J." style={inputStyle}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
              />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@example.com" type="email" style={inputStyle}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Goal</label>
            <select value={goal} onChange={e => setGoal(e.target.value)} style={inputStyle}>
              {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              <option value="__custom__">Other (type below)</option>
            </select>
            {goal === '__custom__' && (
              <input value={goalCustom} onChange={e => setGoalCustom(e.target.value)} placeholder="Describe their goal..." style={{ ...inputStyle, marginTop: 6 }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
              />
            )}
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as ClientStatus)} style={inputStyle}>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Private coach notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Injuries, personality notes, context for coaching..."
              style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7' }}
              onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'; }}
              onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border2)'; }}
            />
          </div>

          {error && <p className="text-[12px]" style={{ color: 'var(--red)' }}>{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleSubmit}
            disabled={loading || sent}
            className="px-5 py-2.5 rounded-[8px] text-[13px] font-semibold text-white transition-all duration-150 disabled:opacity-60"
            style={{ background: sent ? '#0d8f3e' : 'var(--accent)', border: 'none', cursor: loading || sent ? 'default' : 'pointer' }}
            onMouseEnter={(e) => { if (!loading && !sent) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
          >
            {sent ? 'Invite sent ✓' : loading ? 'Sending invite…' : 'Add client & send invite'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-[8px] text-[13px] transition-all duration-150"
            style={{ background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text3)', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientRosterPage() {
  const [roster, setRoster]       = useState<Client[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState('');
  const [openNotes, setOpenNotes] = useState<string | null>(null);
  const [drafts, setDrafts]       = useState<Record<string, { notes: string; paymentDate: string; goal: string; programStart: string }>>({});
  const [saved, setSaved]         = useState<string | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [deleting, setDeleting]   = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoadError('');
    try {
      const res = await fetch('/api/clients', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || 'Failed to load clients.');
        setRoster([]);
      } else {
        setRoster((data.clients as ClientRow[]).map(mapRow));
      }
    } catch {
      setLoadError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const getDraft = (c: Client) =>
    drafts[c.id] ?? {
      notes: c.notes,
      paymentDate: c.nextPaymentDate ?? '',
      goal: c.goal === '—' ? '' : c.goal,
      programStart: c.programStart ?? '',
    };

  const toggleNotes = (id: string) => setOpenNotes(openNotes === id ? null : id);

  const saveNote = async (c: Client) => {
    const d = getDraft(c);
    const goal = d.goal.trim();
    const res = await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: c.id,
        notes: d.notes,
        next_payment_date: d.paymentDate || null,
        goal: goal || null,
        program_start: d.programStart || null,
      }),
    });
    if (res.ok) {
      setRoster(prev => prev.map(x =>
        x.id === c.id
          ? {
              ...x,
              notes: d.notes,
              nextPaymentDate: d.paymentDate || undefined,
              payment: calcPaymentStatus(d.paymentDate || undefined),
              goal: goal || '—',
              programStart: d.programStart || undefined,
            }
          : x
      ));
      setSaved(c.id);
      setTimeout(() => setSaved(null), 2000);
    }
  };

  const deleteClient = async (c: Client) => {
    if (!window.confirm(`Remove ${c.name} from your roster?\n\nThis deletes their client record${c.lastLogin === 'Active login' ? ' and revokes their login' : ''}. This cannot be undone.`)) return;
    setDeleting(c.id);
    const res = await fetch(`/api/clients?id=${encodeURIComponent(c.id)}`, { method: 'DELETE' });
    if (res.ok) {
      setRoster(prev => prev.filter(x => x.id !== c.id));
      if (openNotes === c.id) setOpenNotes(null);
    } else {
      const data = await res.json().catch(() => ({}));
      window.alert(data.error || 'Failed to delete client.');
    }
    setDeleting(null);
  };

  const active = roster.filter(c => c.status === 'Active').length;
  const paused = roster.filter(c => c.status === 'Paused').length;

  return (
    <>
      <Topbar title="Client Roster" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7">
        <div className="flex items-start justify-between mb-1.5">
          <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15]" style={{ color: 'var(--text)' }}>
            Client <em className="italic" style={{ color: 'var(--accent-text)' }}>Roster</em>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-[9px] text-[13px] font-semibold text-white transition-all duration-150 mt-1"
            style={{ background: 'var(--accent)', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
          >
            + Add client
          </button>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          All active and paused clients. Click a row to edit their phase, program start, notes, or payment — or remove the client.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="Total clients" value={String(roster.length)} valueColor="var(--accent-text)" />
          <StatCard label="Paused"        value={String(paused)} />
          <StatCard label="Active"        value={String(active)} valueColor="var(--accent-text)" />
        </div>

        {loadError && (
          <div className="mb-4 px-4 py-3 rounded-[10px] text-[13px]" style={{ color: 'var(--red)', background: 'rgba(240,79,79,0.08)', border: '1px solid rgba(240,79,79,0.2)' }}>
            {loadError}
          </div>
        )}

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

          {roster.map((c, i) => (
            <div key={c.id}>
              <div
                className="grid items-center px-5 py-3 cursor-pointer transition-colors duration-100"
                style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', borderBottom: '1px solid var(--border)' }}
                onClick={() => toggleNotes(c.id)}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg2)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-white flex-shrink-0 overflow-hidden"
                    style={{ background: c.avatarUrl ? 'transparent' : 'var(--accent)' }}
                  >
                    {c.avatarUrl ? (
                      <Image src={c.avatarUrl} alt={c.name} width={28} height={28} className="w-full h-full object-cover" unoptimized />
                    ) : (
                      c.initials
                    )}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>
                      {c.name}
                      {c.nickname && (
                        <span style={{ color: 'var(--text3)', fontWeight: 400 }}> · &ldquo;{c.nickname}&rdquo;</span>
                      )}
                    </div>
                    <div className="text-[11px] flex items-center gap-2 flex-wrap" style={{ color: 'var(--text3)' }}>
                      <span>{c.since}</span>
                      <span style={{ color: 'var(--border2)' }}>·</span>
                      <span style={{ color: onboardingStatus(c).color, fontWeight: 600 }}>{onboardingStatus(c).label}</span>
                    </div>
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
                  style={{ borderBottom: i < roster.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div
                    className="rounded-xl p-[22px] mt-1 grid grid-cols-2 gap-6"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                  >
                    {/* Onboarding status — full width, read-only proof of completion */}
                    <div
                      className="col-span-2 rounded-[10px] px-4 py-3 flex items-center justify-between gap-4"
                      style={{
                        background: c.onboardingCompletedAt ? 'var(--accent-dim)' : 'var(--bg2)',
                        border: `1px solid ${c.onboardingCompletedAt ? 'var(--accent-mid)' : 'var(--border)'}`,
                      }}
                    >
                      <div>
                        <h3 className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--text)' }}>
                          Onboarding
                        </h3>
                        <p className="text-[12px]" style={{ color: 'var(--text3)' }}>
                          {c.onboardingCompletedAt
                            ? `Completed all ${ONBOARDING_TOTAL} steps on ${formatDate(c.onboardingCompletedAt)}.`
                            : `${c.onboardingStepsDone ?? 0} of ${ONBOARDING_TOTAL} steps done — not finished yet.`}
                        </p>
                      </div>
                      <span
                        className="text-[12px] font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
                        style={{ background: 'var(--surface)', color: onboardingStatus(c).color, border: '1px solid var(--border2)' }}
                      >
                        {onboardingStatus(c).label}
                      </span>
                    </div>

                    {/* Phase (goal) — shows in the client's top-bar */}
                    <div>
                      <h3 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text)' }}>
                        Current phase
                      </h3>
                      <p className="text-[12px] mb-3" style={{ color: 'var(--text3)' }}>
                        Shows in their portal top-bar as &ldquo;{getDraft(c).goal || 'Phase'} · Week {weekFromStart(getDraft(c).programStart) ?? 'N'}&rdquo;.
                      </p>
                      <input
                        list="phase-options"
                        value={getDraft(c).goal}
                        onChange={(e) => setDrafts(d => ({ ...d, [c.id]: { ...getDraft(c), goal: e.target.value } }))}
                        placeholder="e.g. Bulk"
                        className="w-full px-3 py-2.5 rounded-[8px] text-[13px] outline-none transition-colors duration-150"
                        style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text)' }}
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
                      />
                      <datalist id="phase-options">
                        {GOALS.map(g => <option key={g} value={g} />)}
                      </datalist>
                    </div>

                    {/* Program start — drives the auto-incrementing week */}
                    <div>
                      <h3 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text)' }}>
                        Program start date
                      </h3>
                      <p className="text-[12px] mb-3" style={{ color: 'var(--text3)' }}>
                        The week ticks over automatically from this date.
                      </p>
                      <input
                        type="date"
                        value={getDraft(c).programStart}
                        onChange={(e) => setDrafts(d => ({ ...d, [c.id]: { ...getDraft(c), programStart: e.target.value } }))}
                        className="w-full px-3 py-2.5 rounded-[8px] text-[13px] outline-none transition-colors duration-150 mb-2"
                        style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text)' }}
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
                      />
                      {getDraft(c).programStart && weekFromStart(getDraft(c).programStart) && (
                        <p className="text-[11px]" style={{ color: 'var(--accent-text)' }}>
                          Currently: Week {weekFromStart(getDraft(c).programStart)}
                        </p>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <h3 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text)' }}>
                        Private coach notes
                      </h3>
                      <p className="text-[12px] mb-3" style={{ color: 'var(--text3)' }}>
                        Only you can see these. Never visible to the client.
                      </p>
                      <textarea
                        value={getDraft(c).notes}
                        onChange={(e) => setDrafts(d => ({ ...d, [c.id]: { ...getDraft(c), notes: e.target.value } }))}
                        rows={3}
                        className="w-full px-3 py-2.5 rounded-[8px] text-[13px] outline-none resize-y leading-[1.7] transition-colors duration-150"
                        style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text)', minHeight: '70px' }}
                        onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'; }}
                        onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border2)'; }}
                      />
                    </div>

                    {/* Payment date */}
                    <div>
                      <h3 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--text)' }}>
                        Next payment due
                      </h3>
                      <p className="text-[12px] mb-3" style={{ color: 'var(--text3)' }}>
                        Sets the payment status automatically — Paid, Due, or Overdue.
                      </p>
                      <input
                        type="date"
                        value={getDraft(c).paymentDate}
                        onChange={(e) => setDrafts(d => ({ ...d, [c.id]: { ...getDraft(c), paymentDate: e.target.value } }))}
                        className="w-full px-3 py-2.5 rounded-[8px] text-[13px] outline-none transition-colors duration-150 mb-2"
                        style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text)' }}
                        onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
                        onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
                      />
                      {getDraft(c).paymentDate && (
                        <p className="text-[11px]" style={{ color: `var(--${calcPaymentStatus(getDraft(c).paymentDate) === 'Paid' ? 'accent-text' : calcPaymentStatus(getDraft(c).paymentDate) === 'Due' ? 'amber' : 'red'})` }}>
                          Status will show: {calcPaymentStatus(getDraft(c).paymentDate)}
                        </p>
                      )}
                    </div>

                    {/* Actions spanning full width */}
                    <div className="col-span-2 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                      <button
                        onClick={() => saveNote(c)}
                        className="px-[18px] py-[9px] rounded-[8px] text-[13px] font-semibold text-white transition-all duration-150"
                        style={{ background: saved === c.id ? '#0d8f3e' : 'var(--accent)', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={(e) => { if (saved !== c.id) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
                      >
                        {saved === c.id ? 'Saved ✓' : 'Save changes'}
                      </button>
                      <button
                        onClick={() => deleteClient(c)}
                        disabled={deleting === c.id}
                        className="px-[18px] py-[9px] rounded-[8px] text-[13px] font-semibold transition-all duration-150 disabled:opacity-60"
                        style={{ background: 'transparent', border: '1px solid rgba(240,79,79,0.4)', color: 'var(--red)', cursor: deleting === c.id ? 'default' : 'pointer' }}
                        onMouseEnter={(e) => { if (deleting !== c.id) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(240,79,79,0.08)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        {deleting === c.id ? 'Removing…' : 'Delete client'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {!loading && roster.length === 0 && !loadError && (
            <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--text3)' }}>
              No clients yet. Add your first one above.
            </div>
          )}
          {loading && (
            <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--text3)' }}>
              Loading clients…
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdded={fetchClients} />}
    </>
  );
}
