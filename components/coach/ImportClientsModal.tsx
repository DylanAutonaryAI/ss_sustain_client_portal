'use client';

import { useMemo, useRef, useState } from 'react';

// Bulk-import existing clients into the roster from a pasted list or a .csv.
// Columns in order: name, email, phone?, goal?, monthly amount?, next-due (YYYY-MM-DD)?
// A header row (containing "email") is auto-detected and skipped. Shows a live
// preview with per-row validation before anything is sent; on confirm it POSTs
// to /api/clients/import, which creates each as PENDING + skip-onboarding.

interface ParsedRow { full_name: string; email: string; phone: string; goal: string; amount: string; nextDue: string; valid: boolean; reason?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Split one CSV line respecting simple double-quoted fields.
function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if ((ch === ',' || ch === '\t') && !inQ) {
      out.push(cur); cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parse(text: string, existingEmails: Set<string>): ParsedRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  // Drop a header row only when the first line is NOT a real data row — i.e. its
  // second cell isn't a valid email. This avoids eating a genuine first client
  // whose email happens to contain "name"/"email" (e.g. rename.io, myname@…).
  const firstCells = splitLine(lines[0]);
  const start = EMAIL_RE.test(firstCells[1] ?? '') ? 0 : 1;

  const seen = new Set<string>();
  return lines.slice(start).map((line) => {
    const cells = splitLine(line);
    const full_name = cells[0] ?? '';
    const email = cells[1] ?? '';
    const phone = cells[2] ?? '';
    const goal = cells[3] ?? '';
    const amount = (cells[4] ?? '').replace(/[£,\s]/g, '');
    const nextDue = (cells[5] ?? '').trim();
    const emailLc = email.toLowerCase();
    let valid = true;
    let reason: string | undefined;
    if (!full_name) { valid = false; reason = 'no name'; }
    else if (!EMAIL_RE.test(email)) { valid = false; reason = 'bad email'; }
    else if (existingEmails.has(emailLc)) { valid = false; reason = 'already on roster'; }
    else if (seen.has(emailLc)) { valid = false; reason = 'duplicate in list'; }
    else if (amount && isNaN(Number(amount))) { valid = false; reason = 'bad amount'; }
    else if (nextDue && !DATE_RE.test(nextDue)) { valid = false; reason = 'date must be YYYY-MM-DD'; }
    if (valid) seen.add(emailLc);
    return { full_name, email, phone, goal, amount, nextDue, valid, reason };
  });
}

const cellText: React.CSSProperties = { fontSize: 12, color: 'var(--text)' };

export default function ImportClientsModal({
  existingEmails,
  onClose,
  onImported,
}: {
  existingEmails: Set<string>;
  onClose: () => void;
  onImported: () => void;
}) {
  const [text, setText] = useState('');
  const [skipOnboarding, setSkipOnboarding] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ added: number; duplicate: number; invalid: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = useMemo(() => parse(text, existingEmails), [text, existingEmails]);
  const validRows = rows.filter((r) => r.valid);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ''));
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submit() {
    if (validRows.length === 0) { setError('No valid rows to import.'); return; }
    setLoading(true);
    setError('');
    const res = await fetch('/api/clients/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clients: validRows.map((r) => ({ full_name: r.full_name, email: r.email, phone: r.phone, goal: r.goal, amount: r.amount, next_due: r.nextDue })),
        skipOnboarding,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Import failed.'); return; }
    setDone({ added: data.added, duplicate: data.duplicate, invalid: data.invalid });
    onImported();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[640px] mx-4 max-h-[90vh] overflow-y-auto rounded-[16px] animate-scale-in"
        style={{ background: 'var(--surface)', border: '1px solid var(--border2)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-serif text-[20px]" style={{ color: 'var(--text)' }}>
              Import <em className="italic" style={{ color: 'var(--accent-text)' }}>Clients</em>
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
              Added as <strong>pending</strong> (no email yet). Invite them with &ldquo;Grant access to all pending&rdquo; when ready.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[16px]"
            style={{ background: 'var(--bg3)', color: 'var(--text3)', border: 'none', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {done ? (
          <div className="px-6 py-8 text-center">
            <div className="text-[40px] mb-2">✓</div>
            <p className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text)' }}>
              {done.added} client{done.added === 1 ? '' : 's'} imported
            </p>
            <p className="text-[12px] mb-6" style={{ color: 'var(--text3)' }}>
              {done.duplicate > 0 && `${done.duplicate} skipped (already on roster). `}
              {done.invalid > 0 && `${done.invalid} skipped (invalid). `}
              They&rsquo;re on the roster as pending — press &ldquo;Grant access to all pending&rdquo; to invite them.
            </p>
            <button onClick={onClose} className="px-5 py-2.5 rounded-[8px] text-[13px] font-semibold text-white" style={{ background: 'var(--accent)', border: 'none', cursor: 'pointer' }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-[0.4px]" style={{ color: 'var(--text3)' }}>
                  Paste rows, or upload a .csv
                </label>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-[6px]"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text2)', cursor: 'pointer' }}
                >
                  Upload .csv
                </button>
                <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" onChange={onFile} style={{ display: 'none' }} />
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder={'Name, Email, Phone, Goal, Monthly £, Next due (YYYY-MM-DD)\nSarah Jones, sarah@example.com, +447700900123, Fat loss, 185, 2026-08-01\nTom Smith, tom@example.com, , , 150'}
                className="w-full rounded-[10px] px-3 py-2.5 text-[12px] outline-none resize-y font-mono leading-[1.6]"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text)' }}
              />
              <p className="text-[11px]" style={{ color: 'var(--text3)' }}>
                Columns in order: <strong>Name, Email</strong>, then optional Phone, Goal, <strong>Monthly £</strong> (feeds MRR) and <strong>Next due</strong> (YYYY-MM-DD, sets the payment status). A header row is skipped automatically.
              </p>

              {/* Onboarding toggle */}
              <button
                type="button"
                onClick={() => setSkipOnboarding((v) => !v)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-[10px] text-left transition-colors duration-150"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', cursor: 'pointer' }}
              >
                <span
                  className="relative flex-shrink-0 rounded-full transition-colors duration-200"
                  style={{ width: 38, height: 22, background: skipOnboarding ? 'var(--accent)' : 'var(--border2)' }}
                >
                  <span
                    className="absolute top-[3px] rounded-full bg-white transition-all duration-200"
                    style={{ width: 16, height: 16, left: skipOnboarding ? 19 : 3 }}
                  />
                </span>
                <span>
                  <span className="block text-[12.5px] font-semibold" style={{ color: 'var(--text)' }}>
                    {skipOnboarding ? 'Skip onboarding' : 'Require onboarding'}
                  </span>
                  <span className="block text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
                    {skipOnboarding
                      ? 'Existing clients land straight on the home page — for anyone who already did onboarding.'
                      : 'Imported clients must complete the portal onboarding flow before they get in.'}
                  </span>
                </span>
              </button>

              {/* Preview */}
              {rows.length > 0 && (
                <div className="rounded-[10px] overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between px-3 py-2 text-[11px] font-semibold" style={{ background: 'var(--bg3)', color: 'var(--text3)' }}>
                    <span>Preview — {rows.length} row{rows.length === 1 ? '' : 's'}</span>
                    <span style={{ color: 'var(--accent-text)' }}>{validRows.length} will import · {rows.length - validRows.length} skipped</span>
                  </div>
                  <div className="overflow-x-auto">
                    <div style={{ minWidth: 660 }}>
                      <div className="grid px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.5px]" style={{ gridTemplateColumns: '1.3fr 1.7fr 1.1fr 0.9fr 0.7fr 1fr 0.9fr', background: 'var(--bg2)', color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>
                        <div>Name</div><div>Email</div><div>Phone</div><div>Goal</div><div>£/mo</div><div>Next due</div><div>Status</div>
                      </div>
                      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                        {rows.map((r, i) => (
                          <div key={i} className="grid items-center px-3 py-1.5" style={{ gridTemplateColumns: '1.3fr 1.7fr 1.1fr 0.9fr 0.7fr 1fr 0.9fr', borderBottom: '1px solid var(--border)', opacity: r.valid ? 1 : 0.55 }}>
                            <div style={cellText} className="truncate">{r.full_name || '—'}</div>
                            <div style={cellText} className="truncate">{r.email || '—'}</div>
                            <div style={cellText} className="truncate">{r.phone || '—'}</div>
                            <div style={cellText} className="truncate">{r.goal || '—'}</div>
                            <div style={cellText} className="truncate">{r.amount || '—'}</div>
                            <div style={cellText} className="truncate">{r.nextDue || '—'}</div>
                            <div className="text-[10px] font-semibold" style={{ color: r.valid ? 'var(--accent-text)' : 'var(--amber)' }}>
                              {r.valid ? 'OK' : r.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {error && <p className="text-[12px]" style={{ color: 'var(--red)' }}>{error}</p>}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={submit}
                disabled={loading || validRows.length === 0}
                className="px-5 py-2.5 rounded-[8px] text-[13px] font-semibold text-white transition-all duration-150 disabled:opacity-50"
                style={{ background: 'var(--accent)', border: 'none', cursor: loading || validRows.length === 0 ? 'default' : 'pointer' }}
              >
                {loading
                  ? 'Importing…'
                  : `Import ${validRows.length} · ${skipOnboarding ? 'skip onboarding' : 'require onboarding'}`}
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-[8px] text-[13px]"
                style={{ background: 'transparent', border: '1px solid var(--border2)', color: 'var(--text3)', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
