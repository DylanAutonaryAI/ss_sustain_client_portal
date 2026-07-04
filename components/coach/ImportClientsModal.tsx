'use client';

import { useMemo, useRef, useState } from 'react';

// Bulk-import existing clients into the roster from a pasted list or a .csv.
// HEADER-AWARE: if the first row is a header (has recognisable column names) the
// columns are mapped BY NAME in any order — so "Client Name, Phone, Email, Phase"
// works exactly as-is. Without a header it falls back to positional order
// (name, email, phone, goal, monthly £, next-due). Shows a live preview with
// per-row validation; on confirm POSTs to /api/clients/import (PENDING clients).

interface ParsedRow { full_name: string; email: string; phone: string; goal: string; amount: string; nextDue: string; valid: boolean; reason?: string }

type Field = 'full_name' | 'email' | 'phone' | 'goal' | 'amount' | 'nextDue';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Header labels we recognise for each field (matched case-insensitively, after
// stripping £/() and spaces). Order-independent: we map by whichever column
// carries a matching header.
const HEADER_ALIASES: Record<Field, string[]> = {
  full_name: ['name', 'clientname', 'fullname', 'client'],
  email:     ['email', 'emailaddress', 'e-mail'],
  phone:     ['phone', 'phonenumber', 'mobile', 'whatsapp', 'number', 'contact', 'tel'],
  goal:      ['goal', 'phase', 'plan', 'focus'],
  amount:    ['amount', 'monthly', 'monthlyamount', 'rate', 'price', 'fee', 'monthly£', '£/mo', 'permonth'],
  nextDue:   ['nextdue', 'due', 'duedate', 'nextpayment', 'nextpaymentdue', 'renewal', 'renews'],
};

const normHeader = (s: string) => s.trim().toLowerCase().replace(/[£()]/g, '').replace(/\s+/g, '');

// If the row's cells look like column headers, return field→index; else null.
// Matches a header when it CONTAINS an alias keyword (so "Mobile Number",
// "Email Address" etc. resolve), taking the first field that matches each column.
function detectHeaderMap(cells: string[]): Partial<Record<Field, number>> | null {
  const norm = cells.map(normHeader);
  const map: Partial<Record<Field, number>> = {};
  for (const field of Object.keys(HEADER_ALIASES) as Field[]) {
    const idx = norm.findIndex((h) => h !== '' && HEADER_ALIASES[field].some((a) => h.includes(a)));
    if (idx !== -1 && !Object.values(map).includes(idx)) map[field] = idx;
  }
  // Only treat row 1 as a header if it named at least the two required columns.
  return map.full_name != null && map.email != null ? map : null;
}

const looksLikePhone = (s: string) => /^\+?[\d][\d ()\-.]{6,}$/.test(s.trim()) && s.replace(/\D/g, '').length >= 7;

// No header → infer which column is which by looking at the VALUES across ALL
// data rows (not just the first — a blank cell in row 1 must not unmap a column
// for everyone). email = the column where the most rows hold a valid email;
// phone = the column (≠ email) where the most rows look phone-shaped; name = the
// first remaining column with alphabetic (non-numeric) values; goal = the leftover.
function inferColMapMulti(rows: string[][]): Partial<Record<Field, number>> | null {
  const cols = Math.max(0, ...rows.map((r) => r.length));
  if (cols === 0) return null;
  const emailHits = new Array(cols).fill(0);
  const phoneHits = new Array(cols).fill(0);
  for (const r of rows) {
    for (let i = 0; i < cols; i++) {
      const v = (r[i] ?? '').trim();
      if (EMAIL_RE.test(v)) emailHits[i]++;
      else if (looksLikePhone(v)) phoneHits[i]++;
    }
  }
  const argmax = (arr: number[], skip = -1) => {
    let bi = -1, bv = 0;
    for (let i = 0; i < arr.length; i++) if (i !== skip && arr[i] > bv) { bv = arr[i]; bi = i; }
    return bi;
  };
  const emailIdx = argmax(emailHits);
  if (emailIdx === -1) return null; // no email column anywhere → can't infer
  const map: Partial<Record<Field, number>> = { email: emailIdx };
  const phoneIdx = argmax(phoneHits, emailIdx);
  if (phoneIdx !== -1) map.phone = phoneIdx;
  const used = new Set<number>([emailIdx, phoneIdx].filter((i) => i >= 0));
  // name = first unused column with a letter-containing, non-pure-number value.
  for (let i = 0; i < cols; i++) {
    if (used.has(i)) continue;
    if (rows.some((r) => /[a-zA-Z]/.test(r[i] ?? '') && !/^\s*\d+\s*$/.test(r[i] ?? ''))) { map.full_name = i; used.add(i); break; }
  }
  // goal = next unused non-empty column.
  for (let i = 0; i < cols; i++) {
    if (used.has(i)) continue;
    if (rows.some((r) => (r[i] ?? '').trim() !== '')) { map.goal = i; break; }
  }
  return map.full_name != null ? map : null;
}

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

  const firstCells = splitLine(lines[0]);
  const headerMap = detectHeaderMap(firstCells);
  const posMap: Record<Field, number> = { full_name: 0, email: 1, phone: 2, goal: 3, amount: 4, nextDue: 5 };

  let colMap: Partial<Record<Field, number>>;
  let dataLines: string[];
  if (headerMap) {
    // Recognised header row → map by column name, skip the header.
    colMap = headerMap;
    dataLines = lines.slice(1);
  } else {
    // No header → row 0 is data if it holds an email; otherwise it's an
    // unrecognised header, so drop it. Infer columns by VALUE across ALL data
    // rows so a blank cell in the first row can't unmap a column. Falls back to
    // positional order if no email column is found anywhere.
    const row0IsData = firstCells.some((c) => EMAIL_RE.test(c.trim()));
    dataLines = row0IsData ? lines : lines.slice(1);
    colMap = inferColMapMulti(dataLines.map(splitLine)) ?? posMap;
  }

  const cellFor = (cells: string[], f: Field) => {
    const i = colMap[f];
    return i != null ? (cells[i] ?? '') : '';
  };

  const seen = new Set<string>();
  return dataLines.map((line) => {
    const cells = splitLine(line);
    const full_name = cellFor(cells, 'full_name').trim();
    // Per-row email recovery: if a ragged row shifted the columns, still find the
    // email wherever it landed rather than rejecting a valid client.
    let email = cellFor(cells, 'email').trim();
    if (!EMAIL_RE.test(email)) { const e = cells.find((c) => EMAIL_RE.test(c.trim())); if (e) email = e.trim(); }
    const phone = cellFor(cells, 'phone').replace(/\s+/g, ' ').trim();
    const goal = cellFor(cells, 'goal').trim();
    const amount = cellFor(cells, 'amount').replace(/[£,\s]/g, '');
    const nextDue = cellFor(cells, 'nextDue').trim();
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
                placeholder={'Client Name, Phone Number, Email, Phase\nOllie Turner, +44 7805 732687, oliverj_8@hotmail.com, Fat loss\nMax North, +44 7498 859385, max-north@hotmail.co.uk, Fat loss'}
                className="w-full rounded-[10px] px-3 py-2.5 text-[12px] outline-none resize-y font-mono leading-[1.6]"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text)' }}
              />
              <p className="text-[11px]" style={{ color: 'var(--text3)' }}>
                <strong>Columns can be in any order</strong>, with or without a header row — it finds the name, email, phone and phase automatically. Just <strong>Name</strong> and <strong>Email</strong> are required. To also set payment info on import, include a header row with <strong>Monthly £</strong> and/or <strong>Next due</strong> (YYYY-MM-DD) columns. Copy straight from your spreadsheet and paste.
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
