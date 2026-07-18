'use client';

import { useCallback, useEffect, useState } from 'react';
import Topbar from '@/components/layout/Topbar';

// Coach review area for client-submitted form-check clips. A list of every
// client with an "N new" badge on the left; open one to watch their clips
// (signed, private Cloudflare playback), mark them reviewed, or delete them.
// Deep-linked from the roster row via /coach/client-clips?client=<id>.
//
// Deliberately separate from Content Manager → Training Vids (Sam's reference
// demos): different data, different screen, opposite direction.

type Summary = { clientId: string; name: string; total: number; unreviewed: number; latestAt: string | null };
type Clip = { id: string; status: string; label: string | null; muscle: string | null; durationSeconds: number | null; createdAt: string; reviewed: boolean };

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDur(s: number | null): string {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function CoachClientClipsPage() {
  const [clients, setClients] = useState<Summary[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clips, setClips] = useState<Clip[]>([]);
  const [loadingClips, setLoadingClips] = useState(false);
  const [watchUrl, setWatchUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/client-clips/coach', { cache: 'no-store' });
      if (res.ok) { const d = await res.json(); setClients(d.clients ?? []); setConfigured(!!d.configured); }
      else setClients([]);
    } catch { setClients([]); }
  }, []);

  const openClient = useCallback(async (clientId: string) => {
    setSelected(clientId); setLoadingClips(true); setClips([]); setErr(null);
    try {
      const res = await fetch(`/api/client-clips/coach?clientId=${clientId}`, { cache: 'no-store' });
      const d = await res.json();
      if (res.ok) { setClips(d.clips ?? []); setClientName(d.client?.name ?? ''); }
      else setErr(d.error || 'Could not load clips.');
    } catch { setErr('Could not load clips.'); }
    setLoadingClips(false);
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  // Deep-link from the roster: /coach/client-clips?client=<id> auto-opens them.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('client');
    if (id) openClient(id);
  }, [openClient]);

  async function watch(id: string) {
    setErr(null);
    try {
      const res = await fetch(`/api/client-clips/play?id=${id}`, { cache: 'no-store' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Could not load the clip.');
      setWatchUrl(d.iframeUrl);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not load the clip.'); }
  }

  async function toggleReviewed(clip: Clip) {
    const next = !clip.reviewed;
    setClips((cs) => cs.map((c) => (c.id === clip.id ? { ...c, reviewed: next } : c)));
    await fetch('/api/client-clips/coach', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: clip.id, reviewed: next }),
    });
    loadSummary();
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this clip? This removes the video for good.')) return;
    setClips((cs) => cs.filter((c) => c.id !== id));
    await fetch(`/api/client-clips/coach?id=${id}`, { method: 'DELETE' });
    loadSummary();
  }

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' };

  return (
    <>
      <Topbar title="Client Clips" />
      <div className="px-4 md:px-8 py-6 md:py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Client <em className="italic" style={{ color: 'var(--accent-text)' }}>Clips</em>
        </div>
        <p className="text-[13px] mb-6" style={{ color: 'var(--text2)' }}>
          Form-check clips your clients have submitted. Open a client to review and mark them off.
        </p>

        {!configured && (
          <div className="rounded-xl px-[22px] py-4 mb-5 text-[13px] leading-[1.6]" style={{ ...card, color: 'var(--text2)' }}>
            Clip uploads aren&rsquo;t switched on yet — add the Cloudflare Stream keys in Vercel and clients can start submitting.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
          {/* Client list */}
          <div className="rounded-xl overflow-hidden self-start" style={card}>
            <div className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[1px]" style={{ color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>Clients</div>
            {clients === null ? (
              <p className="text-[13px] px-4 py-4" style={{ color: 'var(--text3)' }}>Loading…</p>
            ) : clients.length === 0 ? (
              <p className="text-[13px] px-4 py-4" style={{ color: 'var(--text3)' }}>No clients yet.</p>
            ) : (
              <div className="max-h-[620px] overflow-y-auto">
                {clients.map((c) => (
                  <button
                    key={c.clientId}
                    onClick={() => openClient(c.clientId)}
                    className="w-full text-left px-4 py-3 flex items-center gap-2 transition-colors"
                    style={{ borderBottom: '1px solid var(--border)', background: selected === c.clientId ? 'var(--bg2)' : 'transparent' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium truncate" style={{ color: 'var(--text)' }}>{c.name}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text3)' }}>
                        {c.total === 0 ? 'No clips' : `${c.total} clip${c.total > 1 ? 's' : ''}${c.latestAt ? ` · ${fmtDate(c.latestAt)}` : ''}`}
                      </div>
                    </div>
                    {c.unreviewed > 0 && (
                      <span className="text-[10px] font-bold px-2 py-[3px] rounded-full flex-shrink-0" style={{ background: 'var(--accent)', color: '#0a0a0a' }}>{c.unreviewed} new</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected client's clips */}
          <div className="rounded-xl p-[22px]" style={card}>
            {!selected ? (
              <p className="text-[13px]" style={{ color: 'var(--text3)' }}>Select a client to see their clips.</p>
            ) : loadingClips ? (
              <p className="text-[13px]" style={{ color: 'var(--text3)' }}>Loading clips…</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-[18px]" style={{ color: 'var(--text)' }}>{clientName}</h2>
                  <span className="text-[12px]" style={{ color: 'var(--text3)' }}>{clips.length} clip{clips.length !== 1 ? 's' : ''} · last 6 weeks</span>
                </div>
                {err && <p className="text-[12px] mb-3" style={{ color: 'var(--red)' }}>{err}</p>}
                {clips.length === 0 ? (
                  <p className="text-[13px]" style={{ color: 'var(--text3)' }}>No clips submitted in the last 6 weeks.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {clips.map((c) => (
                      <div key={c.id} className="rounded-[11px] px-4 py-3 flex items-center gap-3 flex-wrap" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                        <div className="flex-1 min-w-[140px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{c.label || c.muscle || 'Training clip'}</span>
                            {c.muscle && c.label && <span className="text-[11px] px-1.5 py-[1px] rounded-[5px]" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text3)' }}>{c.muscle}</span>}
                          </div>
                          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>{fmtDate(c.createdAt)}{c.durationSeconds ? ` · ${fmtDur(c.durationSeconds)}` : ''}</p>
                        </div>
                        {c.status === 'ready' ? (
                          <button onClick={() => watch(c.id)} className="text-[12px] font-semibold px-3 py-1.5 rounded-[8px] flex-shrink-0" style={{ background: 'var(--accent)', color: '#0a0a0a' }}>Watch</button>
                        ) : (
                          <span className="text-[11px] px-2 py-1 rounded-[6px] flex-shrink-0" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.25)' }}>
                            {c.status === 'error' ? 'Failed' : 'Processing…'}
                          </span>
                        )}
                        <button
                          onClick={() => toggleReviewed(c)}
                          className="text-[12px] font-semibold px-3 py-1.5 rounded-[8px] flex-shrink-0"
                          style={c.reviewed
                            ? { background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-mid)' }
                            : { background: 'var(--surface)', color: 'var(--text2)', border: '1px solid var(--border)' }}
                        >
                          {c.reviewed ? 'Reviewed ✓' : 'Mark reviewed'}
                        </button>
                        <button onClick={() => remove(c.id)} aria-label="Delete clip" className="text-[13px] px-2 py-1.5 rounded-[8px] flex-shrink-0" style={{ color: 'var(--text3)' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Watch modal */}
      {watchUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => setWatchUrl(null)}>
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '16 / 9', background: '#000' }}>
              <iframe src={watchUrl} title="Training clip" className="w-full h-full" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowFullScreen />
            </div>
            <button onClick={() => setWatchUrl(null)} className="mt-3 text-[13px] font-semibold px-4 py-2 rounded-[9px]" style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
