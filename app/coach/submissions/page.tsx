'use client';

import { useEffect, useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import { QUESTIONNAIRE } from '@/lib/onboarding-questionnaire';

type Submission = {
  clientId: string;
  name: string | null;
  email: string | null;
  answers: Record<string, string> | null;
  submittedAt: string | null;
  signedName: string | null;
  signedAt: string | null;
};

const WELCOME_PACK_URL = '/assets/welcome-pack.pdf';

function fmt(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(name: string | null): string {
  return (name ?? '?').trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || '?';
}

// Read-only, section-grouped view of one client's questionnaire answers.
function Answers({ answers }: { answers: Record<string, string> }) {
  return (
    <div className="flex flex-col gap-5">
      {QUESTIONNAIRE.map((section) => {
        const filled = section.fields.filter((f) => answers[f.id]);
        if (!filled.length) return null;
        return (
          <div key={section.title}>
            <h4 className="text-[11px] font-semibold uppercase tracking-[1px] mb-2" style={{ color: 'var(--accent-text)' }}>
              {section.title}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
              {filled.map((f) => (
                <div key={f.id} className="text-[12.5px] leading-[1.5]">
                  <span style={{ color: 'var(--text3)' }}>{f.label}: </span>
                  <span style={{ color: 'var(--text)' }}>{answers[f.id]}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Card({ sub, open, onToggle }: { sub: Submission; open: boolean; onToggle: () => void }) {
  const hasQ = !!sub.answers && Object.keys(sub.answers).length > 0;
  return (
    <div className="rounded-[12px] overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header row — click to expand */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3.5 px-4 md:px-5 py-3.5 text-left transition-colors duration-150"
        style={{ background: open ? 'var(--bg2)' : 'transparent' }}
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold text-white flex-shrink-0" style={{ background: 'var(--accent)' }}>
          {initials(sub.name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold truncate" style={{ color: 'var(--text)' }}>{sub.name ?? 'Unknown'}</div>
          <div className="text-[12px] truncate" style={{ color: 'var(--text3)' }}>{sub.email}</div>
        </div>
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          {hasQ && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-mid)' }}>
              Questionnaire · {fmt(sub.submittedAt)}
            </span>
          )}
          {sub.signedName ? (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--accent-dim)', color: 'var(--accent-text)', border: '1px solid var(--accent-mid)' }}>
              ✍️ Signed
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--bg3)', color: 'var(--text3)', border: '1px solid var(--border2)' }}>
              Not signed
            </span>
          )}
        </div>
        <span className="text-[13px] flex-shrink-0 ml-1" style={{ color: 'var(--text3)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="px-4 md:px-5 py-5" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Welcome-pack signature — a signed document, so surfaced clearly */}
          <div
            className="rounded-[10px] px-4 py-3 mb-5 flex items-center justify-between gap-4 flex-wrap"
            style={{ background: sub.signedName ? 'var(--accent-dim)' : 'var(--bg2)', border: `1px solid ${sub.signedName ? 'var(--accent-mid)' : 'var(--border)'}` }}
          >
            <div>
              <div className="text-[12px] font-semibold mb-0.5" style={{ color: 'var(--text)' }}>Welcome pack</div>
              <div className="text-[12px]" style={{ color: 'var(--text2)' }}>
                {sub.signedName
                  ? <>✍️ Signed by <strong style={{ color: 'var(--text)' }}>{sub.signedName}</strong>{sub.signedAt ? ` on ${fmt(sub.signedAt)}` : ''}</>
                  : 'Not signed yet.'}
              </div>
            </div>
            <a href={WELCOME_PACK_URL} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold flex-shrink-0" style={{ color: 'var(--accent-text)' }}>
              View the welcome pack ↗
            </a>
          </div>

          {/* Questionnaire answers */}
          {hasQ ? (
            <Answers answers={sub.answers!} />
          ) : (
            <p className="text-[12px]" style={{ color: 'var(--text3)' }}>No questionnaire submitted yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function SubmissionsPage() {
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/coach/submissions', { cache: 'no-store' });
        const d = await res.json();
        if (alive) setSubs(Array.isArray(d.submissions) ? d.submissions : []);
      } catch {
        /* leave empty */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? subs.filter((s) => `${s.name ?? ''} ${s.email ?? ''}`.toLowerCase().includes(q))
    : subs;

  const questionnaireCount = subs.filter((s) => s.answers).length;
  const signedCount = subs.filter((s) => s.signedName).length;

  return (
    <>
      <Topbar title="Submissions" statusLabel="Coach Dashboard" />
      <div className="px-4 md:px-8 py-6 md:py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15]" style={{ color: 'var(--text)' }}>
          Client <em className="italic" style={{ color: 'var(--accent-text)' }}>Submissions</em>
        </div>
        <p className="text-[13px] mt-1.5 mb-6" style={{ color: 'var(--text2)' }}>
          Intake questionnaires and signed welcome packs from clients working through onboarding. Click a name to read their full submission.
        </p>

        {/* Counts */}
        <div className="flex items-center gap-3 flex-wrap mb-5">
          <span className="text-[12px] font-semibold px-3 py-1.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text2)', border: '1px solid var(--border2)' }}>
            {questionnaireCount} questionnaire{questionnaireCount === 1 ? '' : 's'}
          </span>
          <span className="text-[12px] font-semibold px-3 py-1.5 rounded-full" style={{ background: 'var(--surface)', color: 'var(--text2)', border: '1px solid var(--border2)' }}>
            {signedCount} welcome pack{signedCount === 1 ? '' : 's'} signed
          </span>
        </div>

        {/* Search */}
        {subs.length > 0 && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full max-w-[360px] mb-5"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 9, color: 'var(--text)', fontSize: 13.5, padding: '10px 14px', outline: 'none', fontFamily: 'inherit' }}
          />
        )}

        {loading ? (
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>Loading submissions…</p>
        ) : subs.length === 0 ? (
          <div className="rounded-[12px] px-5 py-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-[13px]" style={{ color: 'var(--text2)' }}>No submissions yet.</p>
            <p className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>
              They&apos;ll appear here as new clients complete their onboarding questionnaire and sign their welcome pack.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>No submissions match &ldquo;{query}&rdquo;.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((s) => (
              <Card key={s.clientId} sub={s} open={open === s.clientId} onToggle={() => setOpen(open === s.clientId ? null : s.clientId)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
