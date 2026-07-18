'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Client-facing form-check clip uploader. Picks a video from the phone's camera
// roll (or records one), uploads it STRAIGHT to Cloudflare Stream via a one-time
// URL minted by our server (so it never hits Vercel's request-body limit), then
// shows the client their own clips with a status + a "Reviewed by Sam" state.

type Clip = {
  id: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  label: string | null;
  muscle: string | null;
  durationSeconds: number | null;
  createdAt: string;
  reviewed: boolean;
};

const MUSCLES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Compound', 'Other'];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function fmtDur(s: number | null): string {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// Direct browser → Cloudflare upload with a progress callback (fetch has no
// upload-progress event, so we use XHR).
function uploadWithProgress(url: string, file: File, onProgress: (frac: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Upload failed — check your connection.'));
    const fd = new FormData();
    fd.append('file', file);
    xhr.send(fd);
  });
}

function StatusChip({ clip }: { clip: Clip }) {
  let text = 'Processing…';
  let style: React.CSSProperties = { background: 'rgba(245,158,11,0.1)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.25)' };
  if (clip.status === 'uploading') text = 'Uploading…';
  else if (clip.status === 'error') { text = 'Failed'; style = { background: 'rgba(240,79,79,0.1)', color: 'var(--red)', border: '1px solid rgba(240,79,79,0.25)' }; }
  else if (clip.status === 'ready' && clip.reviewed) { text = 'Reviewed by Sam ✓'; style = { background: 'var(--accent)', color: '#0a0a0a', border: '1px solid var(--accent)' }; }
  else if (clip.status === 'ready') { text = 'Sent'; style = { background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-mid)' }; }
  return (
    <span className="text-[10px] font-bold px-2 py-[3px] rounded-[6px] uppercase tracking-[0.3px] whitespace-nowrap" style={style}>
      {text}
    </span>
  );
}

export default function ClipSubmitter() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [muscle, setMuscle] = useState('');
  const [label, setLabel] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [watchUrl, setWatchUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/client-clips/me', { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        setClips(d.clips ?? []);
        setConfigured(!!d.configured);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // While anything is still uploading/processing, poll so it flips to "Sent"
  // without the client refreshing the page.
  useEffect(() => {
    if (!clips.some((c) => c.status === 'processing' || c.status === 'uploading')) return;
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [clips, load]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) { setErr('Please choose a video clip.'); return; }
    if (file.size > 500 * 1024 * 1024) { setErr('That clip is over 500MB — please trim it or lower the recording quality.'); return; }

    setErr(null); setUploading(true); setProgress(0);
    try {
      const res = await fetch('/api/client-clips/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || null, muscle: muscle || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Could not start the upload.');
      await uploadWithProgress(d.uploadURL, file, setProgress);
      await fetch('/api/client-clips/me', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: d.id }),
      });
      setLabel(''); setMuscle('');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false); setProgress(0);
    }
  }

  async function watch(id: string) {
    setErr(null);
    try {
      const res = await fetch(`/api/client-clips/play?id=${id}`, { cache: 'no-store' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Could not load the clip.');
      setWatchUrl(d.iframeUrl);
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not load the clip.'); }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this clip?')) return;
    await fetch(`/api/client-clips/me?id=${id}`, { method: 'DELETE' });
    load();
  }

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' };

  return (
    <div>
      {/* Upload card */}
      <div className="rounded-xl px-[22px] py-5 mb-4" style={card}>
        <h3 className="text-[14px] font-semibold mb-1" style={{ color: 'var(--text)' }}>Submit a clip</h3>
        <p className="text-[12px] mb-4 leading-[1.6]" style={{ color: 'var(--text3)' }}>
          Film a set (clear side or rear angle), then upload it here. Sam reviews your clips on your check-in.
        </p>

        {!configured ? (
          <div className="px-[16px] py-3 rounded-[9px] text-[12px] leading-[1.6]" style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-mid)' }}>
            Clip uploads switch on shortly. For now, keep sending your clips to Sam as you do already.
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <select
                value={muscle}
                onChange={(e) => setMuscle(e.target.value)}
                disabled={uploading}
                className="text-[13px] px-3 py-2 rounded-[9px] outline-none sm:w-[160px]"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="">Muscle (optional)</option>
                {MUSCLES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={uploading}
                placeholder="Exercise (optional) — e.g. Back squat"
                maxLength={120}
                className="text-[13px] px-3 py-2 rounded-[9px] outline-none flex-1"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            <input ref={fileRef} type="file" accept="video/*" hidden onChange={onFile} />

            {uploading ? (
              <div>
                <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(progress * 100)}%`, background: 'var(--accent)' }} />
                </div>
                <p className="text-[12px]" style={{ color: 'var(--text2)' }}>
                  {progress < 1 ? `Uploading… ${Math.round(progress * 100)}%` : 'Finishing up…'}
                </p>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full sm:w-auto text-[13px] font-semibold px-5 py-2.5 rounded-[9px] transition-opacity hover:opacity-90"
                style={{ background: 'var(--accent)', color: '#0a0a0a' }}
              >
                Choose a clip to upload
              </button>
            )}
          </>
        )}

        {err && <p className="text-[12px] mt-2.5" style={{ color: 'var(--red)' }}>{err}</p>}
      </div>

      {/* Your clips */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Your clips</span>
        {clips.length > 0 && <span className="text-[11px]" style={{ color: 'var(--text3)' }}>Kept for 6 weeks</span>}
      </div>

      {loading ? (
        <p className="text-[13px] py-2" style={{ color: 'var(--text3)' }}>Loading…</p>
      ) : clips.length === 0 ? (
        <div className="rounded-xl px-[22px] py-6 text-[13px]" style={{ ...card, color: 'var(--text3)' }}>
          No clips yet. Film a set and upload it above.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {clips.map((c) => (
            <div key={c.id} className="rounded-[11px] px-4 py-3 flex items-center gap-3" style={card}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {c.label || c.muscle || 'Training clip'}
                  </span>
                  {c.muscle && c.label && (
                    <span className="text-[11px] px-1.5 py-[1px] rounded-[5px]" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text3)' }}>{c.muscle}</span>
                  )}
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
                  {fmtDate(c.createdAt)}{c.durationSeconds ? ` · ${fmtDur(c.durationSeconds)}` : ''}
                </p>
              </div>
              <StatusChip clip={c} />
              {c.status === 'ready' && (
                <button onClick={() => watch(c.id)} className="text-[12px] font-semibold px-3 py-1.5 rounded-[8px]" style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-mid)' }}>
                  Watch
                </button>
              )}
              <button onClick={() => remove(c.id)} aria-label="Delete clip" className="text-[13px] px-2 py-1.5 rounded-[8px] hover:opacity-80" style={{ color: 'var(--text3)' }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Watch modal */}
      {watchUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={() => setWatchUrl(null)}>
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '16 / 9', background: '#000' }}>
              <iframe src={watchUrl} title="Training clip" className="w-full h-full" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowFullScreen />
            </div>
            <button onClick={() => setWatchUrl(null)} className="mt-3 text-[13px] font-semibold px-4 py-2 rounded-[9px]" style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
