'use client';

import { QUESTIONNAIRE, type QField } from '@/lib/onboarding-questionnaire';

// Controlled intake form used in the onboarding flow. Parent owns the answers
// map (keyed by field id) so it can POST them on submit.

const inputBase: React.CSSProperties = {
  width: '100%', background: 'var(--bg2)', border: '1px solid var(--border2)',
  borderRadius: 8, color: 'var(--text)', fontSize: 13.5, padding: '10px 12px',
  outline: 'none', fontFamily: 'inherit',
};

function focus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) { e.target.style.borderColor = 'var(--accent)'; }
function blur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>)  { e.target.style.borderColor = 'var(--border2)'; }

function pill(active: boolean): React.CSSProperties {
  return {
    padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.12s',
    background: active ? 'var(--accent)' : 'var(--bg2)',
    color: active ? '#fff' : 'var(--text2)',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border2)'}`,
  };
}

function Field({ field, value, onChange }: { field: QField; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>{field.label}</label>

      {field.type === 'textarea' ? (
        <textarea
          value={value} onChange={(e) => onChange(e.target.value)} onFocus={focus} onBlur={blur}
          placeholder={field.placeholder} rows={3}
          style={{ ...inputBase, resize: 'vertical', minHeight: 72 }}
        />
      ) : field.type === 'scale' ? (
        <div className="flex items-center gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => onChange(String(n))} style={pill(value === String(n))} className="w-10 text-center">
              {n}
            </button>
          ))}
          <span className="text-[11px] ml-1" style={{ color: 'var(--text3)' }}>1 = worst · 5 = best</span>
        </div>
      ) : field.type === 'yesno' ? (
        <div className="flex items-center gap-2">
          {['Yes', 'No'].map((o) => (
            <button key={o} type="button" onClick={() => onChange(o)} style={pill(value === o)} className="min-w-[64px]">
              {o}
            </button>
          ))}
        </div>
      ) : field.type === 'select' ? (
        <div className="flex items-center gap-2 flex-wrap">
          {(field.options ?? []).map((o) => (
            <button key={o} type="button" onClick={() => onChange(o)} style={pill(value === o)}>
              {o}
            </button>
          ))}
        </div>
      ) : (
        <div className="relative">
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            inputMode={field.type === 'number' ? 'decimal' : undefined}
            value={value} onChange={(e) => onChange(e.target.value)} onFocus={focus} onBlur={blur}
            placeholder={field.placeholder}
            style={{ ...inputBase, paddingRight: field.suffix ? 44 : undefined }}
          />
          {field.suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold pointer-events-none" style={{ color: 'var(--text3)' }}>
              {field.suffix}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function QuestionnaireForm({
  answers,
  onChange,
}: {
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-7 px-6 py-6" style={{ background: 'var(--bg2)' }}>
      {QUESTIONNAIRE.map((section) => (
        <div key={section.title}>
          <h3 className="text-[11px] font-semibold uppercase tracking-[1px] mb-3" style={{ color: 'var(--accent-text)' }}>
            {section.title}
          </h3>
          <div className="flex flex-col gap-4">
            {section.fields.map((f) => (
              <Field key={f.id} field={f} value={answers[f.id] ?? ''} onChange={(v) => onChange(f.id, v)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
