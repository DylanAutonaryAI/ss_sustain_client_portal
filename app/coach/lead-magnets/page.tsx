'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Topbar from '@/components/layout/Topbar';

// Coach-only list of website lead-magnet signups. Clients never see this.
// Fed by the public webhook /api/webhooks/lead-magnet.

type Lead = { id: string; name: string | null; email: string; source: string | null; createdAt: string; archived: boolean };

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function LeadMagnetsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/lead-magnets', { cache: 'no-store' });
      setLeads(res.ok ? (await res.json()).leads ?? [] : []);
    } catch { setLeads([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const visible = useMemo(
    () => (leads ?? []).filter((l) => (showArchived ? true : !l.archived)),
    [leads, showArchived],
  );
  const total = leads?.length ?? 0;
  const active = (leads ?? []).filter((l) => !l.archived).length;
  const weekAgo = Date.now() - 7 * 86_400_000;
  const thisWeek = (leads ?? []).filter((l) => new Date(l.createdAt).getTime() > weekAgo).length;

  async function toggleArchive(l: Lead) {
    setLeads((ls) => (ls ?? []).map((x) => (x.id === l.id ? { ...x, archived: !x.archived } : x)));
    await fetch('/api/lead-magnets', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: l.id, archived: !l.archived }),
    });
  }
  async function remove(id: string) {
    if (!window.confirm('Delete this lead permanently?')) return;
    setLeads((ls) => (ls ?? []).filter((x) => x.id !== id));
    await fetch(`/api/lead-magnets?id=${id}`, { method: 'DELETE' });
  }
  function exportCsv() {
    const rows = [
      ['Name', 'Email', 'Source', 'Date'],
      ...visible.map((l) => [l.name ?? '', l.email, l.source ?? '', new Date(l.createdAt).toISOString()]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lead-magnets-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' };
  const cols = '1.4fr 2fr 1fr auto';

  return (
    <>
      <Topbar title="Lead Magnets" />
      <div className="px-4 md:px-8 py-6 md:py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Lead <em className="italic" style={{ color: 'var(--accent-text)' }}>Magnets</em>
        </div>
        <p className="text-[13px] mb-6" style={{ color: 'var(--text2)' }}>
          People who signed up through your website lead magnet. Only you can see these.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6 max-w-[520px]">
          {([['Total leads', total], ['This week', thisWeek], ['Active', active]] as const).map(([label, val]) => (
            <div key={label} className="rounded-xl px-4 py-3.5" style={card}>
              <div className="text-[22px] font-serif leading-none mb-1" style={{ color: 'var(--text)' }}>{val}</div>
              <div className="text-[11px] uppercase tracking-[0.5px]" style={{ color: 'var(--text3)' }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <label className="flex items-center gap-2 text-[12px] cursor-pointer" style={{ color: 'var(--text2)' }}>
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Show archived
          </label>
          {visible.length > 0 && (
            <button onClick={exportCsv} className="text-[12px] font-semibold px-3 py-1.5 rounded-[8px]" style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              Export CSV
            </button>
          )}
        </div>

        {leads === null ? (
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>Loading…</p>
        ) : visible.length === 0 ? (
          <div className="rounded-xl px-[22px] py-8 text-[13px] text-center" style={{ ...card, color: 'var(--text3)' }}>
            No leads yet. When someone submits your website form, they&rsquo;ll appear here.
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={card}>
            <div className="overflow-x-auto">
              <div style={{ minWidth: 560 }}>
                <div className="grid px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[1px]" style={{ gridTemplateColumns: cols, color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
                  <div>Name</div><div>Email</div><div>Date</div><div />
                </div>
                {visible.map((l) => (
                  <div key={l.id} className="grid items-center px-4 py-3 text-[13px]" style={{ gridTemplateColumns: cols, borderBottom: '1px solid var(--border)', opacity: l.archived ? 0.5 : 1 }}>
                    <div className="truncate pr-2" style={{ color: 'var(--text)' }}>{l.name || '—'}</div>
                    <div className="truncate pr-2">
                      <a href={`mailto:${l.email}`} style={{ color: 'var(--accent-text)' }}>{l.email}</a>
                    </div>
                    <div style={{ color: 'var(--text3)' }} title={fmtTime(l.createdAt)}>{fmtDate(l.createdAt)}</div>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => toggleArchive(l)} className="text-[11px] px-2 py-1 rounded-[6px]" style={{ color: 'var(--text3)', border: '1px solid var(--border)' }}>
                        {l.archived ? 'Restore' : 'Archive'}
                      </button>
                      <button onClick={() => remove(l.id)} aria-label="Delete lead" className="text-[13px] px-2 py-1 rounded-[6px]" style={{ color: 'var(--text3)' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
