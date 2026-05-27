'use client';

import { useState, useEffect, useCallback, CSSProperties } from 'react';
import Topbar from '@/components/layout/Topbar';
import {
  DRINKS, drinkUnits, LATE_NIGHT_FOOD, MEAL_PRESETS, FAST_FOOD_BRANDS,
  recoveryOptions, weekStats,
  type TrackerProfile, type TrackerLog, type FastFoodBrand, type RecoveryOption,
} from '@/lib/tracker';

const PURPLE = '#9b59b6';
const PURPLE_DIM = 'rgba(155,89,182,0.12)';

// ── portal-themed style helpers (CSS vars → light/dark aware) ────────────────
const card = (x: CSSProperties = {}): CSSProperties => ({
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
  padding: 16, marginBottom: 12, boxShadow: 'var(--shadow-sm)', ...x,
});
const label: CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10,
};
const input: CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border2)',
  fontSize: 15, color: 'var(--text)', background: 'var(--bg2)', outline: 'none',
};
const statNum: CSSProperties = { fontFamily: 'var(--font-serif, serif)', fontSize: 26, fontWeight: 400, lineHeight: 1, color: 'var(--text)' };
const statLabel: CSSProperties = { fontSize: 10, color: 'var(--text3)', marginTop: 4, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' };

function primaryBtn(extra: CSSProperties = {}): CSSProperties {
  return { display: 'block', width: '100%', padding: 13, borderRadius: 11, border: 'none',
    background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', ...extra };
}
function ghostBtn(extra: CSSProperties = {}): CSSProperties {
  return { display: 'block', width: '100%', padding: 13, borderRadius: 11, border: '1px solid var(--border2)',
    background: 'transparent', color: 'var(--text)', fontSize: 14, fontWeight: 600, cursor: 'pointer', ...extra };
}

function Bar({ pct, color = 'var(--accent)', h = 12 }: { pct: number; color?: string; h?: number }) {
  return (
    <div style={{ height: h, borderRadius: 10, background: 'var(--bg3)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 10, transition: 'width 0.7s ease' }} />
    </div>
  );
}

function Heading({ title, em, sub }: { title: string; em: string; sub: string }) {
  return (
    <div className="mb-5">
      <div className="font-serif text-[28px] tracking-[-0.4px] leading-[1.1]" style={{ color: 'var(--text)' }}>
        {title} <em className="italic" style={{ color: 'var(--accent-text)' }}>{em}</em>
      </div>
      <p className="text-[13px] mt-1" style={{ color: 'var(--text2)' }}>{sub}</p>
    </div>
  );
}

type View = 'dashboard' | 'log' | 'nightout' | 'setup' | 'recovery';

export default function TrackerPage() {
  const [profile, setProfile]   = useState<TrackerProfile | null>(null);
  const [weekLogs, setWeekLogs] = useState<TrackerLog[]>([]);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState<View>('dashboard');
  const [recovery, setRecovery] = useState<{ over: number; isNightOut: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/tracker/me', { cache: 'no-store' });
      const d = await res.json();
      setProfile(d.profile ?? null);
      setWeekLogs(Array.isArray(d.weekLogs) ? d.weekLogs : []);
    } catch { /* keep state */ } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // After a log lands: refetch, then show recovery if over the daily target.
  const afterLog = async (over: number, isNightOut: boolean) => {
    await load();
    if (over > 0) { setRecovery({ over, isNightOut }); setView('recovery'); }
    else setView('dashboard');
  };

  if (loading) {
    return (<><Topbar title="Meal Tracker" statusLabel="Your account" />
      <div className="px-8 py-10 text-center text-[13px]" style={{ color: 'var(--text3)' }}>Loading…</div></>);
  }

  // First run / no setup yet → force setup.
  const needsSetup = !profile;

  return (
    <>
      <Topbar title="Meal Tracker" statusLabel="Your account" />
      <div className="px-6 py-7 mx-auto" style={{ maxWidth: 620 }}>
        {!needsSetup && view !== 'recovery' && (
          <div className="flex rounded-[10px] p-0.5 mb-5" style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
            {([['dashboard', 'This Week'], ['log', 'Log Meal'], ['nightout', 'Night Out'], ['setup', 'Settings']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setView(v)}
                className="flex-1 py-2 text-[12px] font-semibold rounded-[7px] transition-all"
                style={{ background: view === v ? 'var(--accent)' : 'transparent', color: view === v ? '#fff' : 'var(--text3)', border: 'none', cursor: 'pointer' }}>
                {l}
              </button>
            ))}
          </div>
        )}

        {(needsSetup || view === 'setup') && (
          <SetupView profile={profile} onSaved={async () => { await load(); setView('dashboard'); }} />
        )}
        {!needsSetup && view === 'dashboard' && (
          <DashboardView profile={profile!} weekLogs={weekLogs}
            onLog={() => setView('log')} onNightOut={() => setView('nightout')} onDelete={load} />
        )}
        {!needsSetup && view === 'log' && (
          <LogMealView profile={profile!} onLogged={afterLog} onNightOut={() => setView('nightout')} />
        )}
        {!needsSetup && view === 'nightout' && (
          <NightOutView profile={profile!} onLogged={afterLog} onSkip={() => setView('dashboard')} />
        )}
        {!needsSetup && view === 'recovery' && recovery && (
          <RecoveryView over={recovery.over} isNightOut={recovery.isNightOut} onDone={() => { setRecovery(null); setView('dashboard'); }} />
        )}
      </div>
    </>
  );
}

/* ─────────────────────────── SETUP ─────────────────────────── */
function SetupView({ profile, onSaved }: { profile: TrackerProfile | null; onSaved: () => void }) {
  const [calories, setCalories] = useState(profile?.calories ?? 1800);
  const [goal, setGoal]         = useState<TrackerProfile['goal']>(profile?.goal ?? 'Fat loss');
  const [steps, setSteps]       = useState<number | null>(profile?.steps ?? 6500);
  const [sessions, setSessions] = useState<number | null>(profile?.sessions ?? 3);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');
  const ok = calories >= 1000 && calories <= 5000;

  const seg = (active: boolean): CSSProperties => ({
    flex: 1, padding: '11px 4px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    border: active ? 'none' : '1px solid var(--border2)', background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text2)',
  });

  const save = async () => {
    if (!ok) return;
    setSaving(true); setErr('');
    const res = await fetch('/api/tracker/me', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ calories, goal, steps, sessions }),
    }).catch(() => null);
    setSaving(false);
    if (!res || !res.ok) { setErr('Could not save — try again.'); return; }
    onSaved();
  };

  return (
    <div>
      <Heading title="Your" em="Setup" sub="takes 30 seconds — you can change it anytime" />
      <div style={card()}>
        <label style={label}>Daily calorie target</label>
        <input type="number" style={input} placeholder="e.g. 1800" value={calories || ''} onChange={(e) => setCalories(+e.target.value)} />
        <div className="text-[12px] mt-2" style={{ color: 'var(--text3)' }}>Not sure? 1600–2000 is a solid start for fat loss.</div>
      </div>
      <div style={card()}>
        <label style={label}>Your goal</label>
        <div className="flex gap-1.5">
          {(['Fat loss', 'Maintenance'] as const).map((g) => (
            <button key={g} onClick={() => setGoal(g)} style={seg(goal === g)}>{g === 'Fat loss' ? '🔥 Fat Loss' : '⚖️ Maintain'}</button>
          ))}
        </div>
      </div>
      <div style={card()}>
        <label style={label}>Average daily steps</label>
        <div className="flex gap-1.5">
          {[['< 5k', 4000], ['5–8k', 6500], ['8–12k', 10000], ['12k+', 14000]].map(([l, v]) => (
            <button key={v} onClick={() => setSteps(v as number)} style={seg(steps === v)}>{l}</button>
          ))}
        </div>
      </div>
      <div style={card()}>
        <label style={label}>Weekly training sessions</label>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5, 6].map((n) => (
            <button key={n} onClick={() => setSessions(n)} style={seg(sessions === n)}>{n}</button>
          ))}
        </div>
      </div>
      {err && <div className="text-[12px] mb-2" style={{ color: 'var(--red)' }}>{err}</div>}
      <button onClick={save} disabled={!ok || saving} style={primaryBtn({ opacity: ok && !saving ? 1 : 0.5 })}>
        {saving ? 'Saving…' : 'Save & Continue →'}
      </button>
    </div>
  );
}

/* ─────────────────────────── DASHBOARD ─────────────────────────── */
function DashboardView({ profile, weekLogs, onLog, onNightOut, onDelete }: {
  profile: TrackerProfile; weekLogs: TrackerLog[]; onLog: () => void; onNightOut: () => void; onDelete: () => void;
}) {
  const st = weekStats(profile, weekLogs);
  const statusC = st.status === 'under' ? 'var(--accent-text)' : st.status === 'on' ? 'var(--amber)' : 'var(--red)';
  const statusLabel = { under: 'Under budget 🎉', on: 'On track 👌', over: 'Slightly over 💪' }[st.status];

  const del = async (id: number) => {
    await fetch(`/api/tracker/me?id=${id}`, { method: 'DELETE' }).catch(() => {});
    onDelete();
  };

  return (
    <div>
      <Heading title="This" em="Week" sub="this is what actually matters" />

      <div style={card({ background: 'var(--bg2)', border: `1px solid ${statusC}`, textAlign: 'center', padding: '20px 16px' })}>
        <span className="text-[10px] font-bold px-2 py-[3px] rounded-full uppercase tracking-[0.4px]" style={{ background: 'var(--bg3)', color: statusC, border: `1px solid ${statusC}` }}>{statusLabel}</span>
        <div className="font-serif mt-2.5" style={{ fontSize: 42, lineHeight: 1, color: 'var(--text)' }}>
          {Math.abs(st.remaining).toLocaleString()}
        </div>
        <div className="text-[13px] mt-1" style={{ color: 'var(--text2)' }}>kcal {st.remaining >= 0 ? 'remaining this week' : 'over weekly budget'}</div>
      </div>

      <div className="flex gap-2.5 mb-3">
        {[['Weekly budget', st.budget.toLocaleString(), 'var(--text)'],
          ['Consumed', st.consumed.toLocaleString(), st.pct > 90 ? 'var(--red)' : 'var(--text)'],
          ['vs expected', `${st.vs > 0 ? '+' : ''}${st.vs.toLocaleString()}`, st.vs > 300 ? 'var(--red)' : 'var(--accent-text)']].map(([l, v, c]) => (
          <div key={l} className="flex-1 rounded-[10px] py-3.5 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div style={{ ...statNum, color: c }}>{v}</div>
            <div style={statLabel}>{l}</div>
          </div>
        ))}
      </div>

      <div style={card()}>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[12px] font-semibold" style={{ color: 'var(--text)' }}>Weekly progress</span>
          <span className="text-[12px]" style={{ color: 'var(--text3)' }}>{Math.round(st.pct)}%</span>
        </div>
        <Bar pct={st.pct} color={st.pct > 95 ? 'var(--red)' : 'var(--accent)'} />
        <div className="flex justify-between mt-3.5">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => {
            const past = i < st.daysIn, today = i === st.daysIn - 1;
            return (
              <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold"
                style={{ background: today ? 'var(--accent)' : past ? 'var(--accent-mid)' : 'var(--bg3)', color: today ? '#fff' : past ? 'var(--accent-text)' : 'var(--text3)' }}>
                {d}
              </div>
            );
          })}
        </div>
      </div>

      {weekLogs.length > 0 ? (
        <div style={card()}>
          <div className="text-[12px] font-semibold mb-3 uppercase tracking-[0.06em]" style={{ color: 'var(--text2)' }}>Off-plan log</div>
          {weekLogs.map((m, i) => (
            <div key={m.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < weekLogs.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="min-w-0">
                <div className="text-[14px] font-medium truncate" style={{ color: 'var(--text)' }}>{m.label}</div>
                <div className="text-[12px]" style={{ color: 'var(--text3)' }}>{m.loggedOn}{m.notes ? ` · ${m.notes}` : ''}</div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="font-serif text-[15px]" style={{ color: m.isNightOut ? PURPLE : 'var(--amber)' }}>{m.cal.toLocaleString()}</span>
                <button onClick={() => del(m.id)} title="Remove" className="text-[14px]" style={{ color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-[13px] py-3" style={{ color: 'var(--text3)' }}>No off-plan meals logged this week. Use the buttons below when you need them.</div>
      )}

      <div style={card({ background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)' })}>
        <div className="text-[11px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: 'var(--accent-text)' }}>SS Sustain mindset</div>
        <div className="text-[14px] leading-relaxed italic" style={{ color: 'var(--accent-text)' }}>
          &ldquo;The lads who get results aren&apos;t the ones who were perfect — they&apos;re the ones who kept going after an off-plan day. That&apos;s you, right now.&rdquo;
        </div>
      </div>

      <button onClick={onLog} style={primaryBtn({ background: 'var(--amber)', marginBottom: 8 })}>+ Log off-plan meal</button>
      <button onClick={onNightOut} style={ghostBtn({ border: `1px solid ${PURPLE}`, color: PURPLE })}>🍺 Night out mode</button>
    </div>
  );
}

/* ─────────────────────────── LOG MEAL ─────────────────────────── */
function LogMealView({ profile, onLogged, onNightOut }: {
  profile: TrackerProfile; onLogged: (over: number, nightOut: boolean) => void; onNightOut: () => void;
}) {
  const [tab, setTab]       = useState<'quick' | 'fastfood'>('quick');
  const [brand, setBrand]   = useState<FastFoodBrand | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<{ label: string; cal: number } | null>(null);
  const [manual, setManual] = useState('');
  const [notes, setNotes]   = useState('');
  const [saving, setSaving] = useState(false);

  const cal = selected?.cal ?? (manual ? +manual : 0);
  const overBy = Math.max(0, cal - profile.calories);
  const reset = () => { setSelected(null); setManual(''); setBrand(null); setSearch(''); };

  const logIt = async () => {
    if (!cal) return;
    setSaving(true);
    await fetch('/api/tracker/me', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: selected?.label ?? 'Custom meal', cal, notes, isNightOut: false }),
    }).catch(() => {});
    setSaving(false);
    onLogged(overBy, false);
  };

  return (
    <div>
      <Heading title="Log your" em="Meal" sub="no judgment — let's work with it" />
      <button onClick={onNightOut} style={ghostBtn({ border: `1px solid ${PURPLE}`, color: PURPLE, marginBottom: 12 })}>🍺 Switch to Night Out mode</button>

      <div style={card({ background: cal > profile.calories ? 'rgba(240,79,79,0.08)' : 'var(--accent-dim)', border: `1px solid ${cal > profile.calories ? 'var(--red)' : 'var(--accent-mid)'}`, padding: '14px 16px' })}>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1"><div style={statNum}>{profile.calories.toLocaleString()}</div><div style={statLabel}>Daily target</div></div>
          <div className="text-[16px] font-semibold" style={{ color: 'var(--text3)' }}>vs</div>
          <div className="text-center flex-1"><div style={{ ...statNum, color: cal ? 'var(--red)' : 'var(--text3)' }}>{cal ? cal.toLocaleString() : '—'}</div><div style={statLabel}>This meal</div></div>
        </div>
      </div>

      <div className="flex gap-1.5 mb-3">
        {(['quick', 'fastfood'] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); reset(); }}
            className="flex-1 py-2.5 rounded-[9px] text-[13px] font-bold"
            style={{ background: tab === t ? 'var(--accent)' : 'var(--surface)', color: tab === t ? '#fff' : 'var(--text3)', border: tab === t ? 'none' : '1px solid var(--border)', cursor: 'pointer' }}>
            {t === 'quick' ? '⚡ Quick Picks' : '🍔 Fast Food'}
          </button>
        ))}
      </div>

      {tab === 'quick' && (
        <div style={card()}>
          <label style={label}>What did you eat?</label>
          <div className="flex flex-wrap gap-2">
            {MEAL_PRESETS.map((m, i) => {
              const active = selected?.label === m.label;
              return (
                <button key={i} onClick={() => m.cal === null ? setSelected(null) : setSelected({ label: m.label, cal: m.cal })}
                  className="px-3 py-2 rounded-lg text-[12px] font-medium"
                  style={{ border: `1px solid ${active ? 'var(--accent)' : 'var(--border2)'}`, background: active ? 'var(--accent-dim)' : 'var(--bg2)', color: active ? 'var(--accent-text)' : 'var(--text)', cursor: 'pointer' }}>
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'quick' && !selected && (
        <div style={card()}>
          <label style={label}>Estimated calories</label>
          <input type="number" style={input} placeholder="e.g. 950" value={manual} onChange={(e) => setManual(e.target.value)} />
          <div className="text-[12px] mt-2" style={{ color: 'var(--text3)' }}>Round up slightly — better to overestimate.</div>
        </div>
      )}

      {tab === 'fastfood' && !brand && (
        <div style={card()}>
          <label style={label}>Choose a restaurant</label>
          <div className="grid grid-cols-2 gap-2">
            {FAST_FOOD_BRANDS.map((br) => (
              <button key={br.id} onClick={() => { setBrand(br); setSelected(null); setSearch(''); }}
                className="flex items-center gap-2 px-3 py-3 rounded-[10px] text-left"
                style={{ border: '1px solid var(--border2)', background: 'var(--bg2)', cursor: 'pointer' }}>
                <span className="text-[22px]">{br.emoji}</span>
                <div><div className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{br.name}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text3)' }}>{br.items.length} items</div></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'fastfood' && brand && (
        <div style={card()}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><span className="text-[22px]">{brand.emoji}</span><span className="font-serif text-[18px]" style={{ color: 'var(--text)' }}>{brand.name}</span></div>
            <button onClick={() => { setBrand(null); setSelected(null); setSearch(''); }} className="text-[12px] px-3 py-1.5 rounded-[8px]" style={{ border: '1px solid var(--border2)', background: 'var(--bg2)', color: 'var(--text3)', cursor: 'pointer' }}>← Back</button>
          </div>
          <input type="text" style={{ ...input, marginBottom: 10 }} placeholder={`Search ${brand.name}…`} value={search} onChange={(e) => setSearch(e.target.value)} />
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {brand.items.filter((it) => it.name.toLowerCase().includes(search.toLowerCase())).map((item, i) => {
              const lbl = `${brand.emoji} ${brand.name} – ${item.name}`;
              const active = selected?.label === lbl;
              return (
                <div key={i} onClick={() => setSelected({ label: lbl, cal: item.cal })}
                  className="flex items-center justify-between px-2 py-2.5 rounded-lg mb-1 cursor-pointer"
                  style={{ background: active ? 'var(--accent-dim)' : 'var(--bg2)', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}` }}>
                  <span className="text-[14px]" style={{ color: 'var(--text)' }}>{item.name}</span>
                  <span className="font-serif text-[14px]" style={{ color: item.cal > 800 ? 'var(--red)' : item.cal > 500 ? 'var(--amber)' : 'var(--accent-text)' }}>{item.cal} kcal</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={card()}>
        <label style={label}>Notes (optional)</label>
        <input type="text" style={input} placeholder="e.g. Friday treat — worth it 🍟" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <button onClick={logIt} disabled={!cal || saving} style={primaryBtn({ background: overBy > 0 ? 'var(--amber)' : 'var(--accent)', opacity: cal && !saving ? 1 : 0.5 })}>
        {saving ? 'Saving…' : overBy > 0 ? `Calculate recovery (${overBy.toLocaleString()} over)` : 'Log this meal ✓'}
      </button>
    </div>
  );
}

/* ─────────────────────────── NIGHT OUT ─────────────────────────── */
function NightOutView({ profile, onLogged, onSkip }: {
  profile: TrackerProfile; onLogged: (over: number, nightOut: boolean) => void; onSkip: () => void;
}) {
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [food, setFood]     = useState(0);
  const [notes, setNotes]   = useState('');
  const [saving, setSaving] = useState(false);

  const drinkCal = DRINKS.reduce((s, d, i) => s + (counts[i] || 0) * d.cal, 0);
  const totalCal = drinkCal + food;
  const overBy = Math.max(0, totalCal - profile.calories);
  const totalDrinks = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalUnits = DRINKS.reduce((s, d, i) => s + (counts[i] || 0) * drinkUnits(d), 0);
  const inc = (i: number) => setCounts((p) => ({ ...p, [i]: (p[i] || 0) + 1 }));
  const dec = (i: number) => setCounts((p) => ({ ...p, [i]: Math.max(0, (p[i] || 0) - 1) }));

  const logIt = async () => {
    if (!totalCal) return;
    const list = DRINKS.map((d, i) => counts[i] ? `${counts[i]}x ${d.name}` : '').filter(Boolean).join(', ');
    setSaving(true);
    await fetch('/api/tracker/me', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: `🍺 Night out${list ? ` (${list})` : ''}`, cal: totalCal, notes, isNightOut: true }),
    }).catch(() => {});
    setSaving(false);
    onLogged(overBy, true);
  };

  return (
    <div>
      <Heading title="Night Out" em="Mode" sub="log the drinks, ditch the guilt" />

      <div style={card({ background: PURPLE_DIM, border: `1px solid ${PURPLE}66`, padding: 16 })}>
        <div className="flex items-center justify-between text-center">
          <div className="flex-1"><div style={{ ...statNum, color: PURPLE }}>{totalCal.toLocaleString()}</div><div style={statLabel}>Total kcal</div></div>
          <div className="flex-1"><div style={{ ...statNum, color: totalUnits > 14 ? 'var(--red)' : 'var(--text)' }}>{totalUnits.toFixed(1)}</div><div style={statLabel}>Units</div></div>
          <div className="flex-1"><div style={{ ...statNum, color: totalDrinks ? PURPLE : 'var(--text3)' }}>{totalDrinks}</div><div style={statLabel}>Drinks</div></div>
          <div className="flex-1"><div style={{ ...statNum, color: overBy > 0 ? 'var(--red)' : 'var(--accent-text)' }}>{overBy > 0 ? `+${overBy.toLocaleString()}` : 'OK'}</div><div style={statLabel}>vs target</div></div>
        </div>
      </div>

      <div style={card()}>
        <label style={label}>Add your drinks</label>
        {DRINKS.map((d, i) => (
          <div key={i} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < DRINKS.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div className="flex items-center gap-2.5">
              <span className="text-[22px]">{d.emoji}</span>
              <div><div className="text-[14px] font-medium" style={{ color: 'var(--text)' }}>{d.name}</div>
                <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{d.cal} kcal · {drinkUnits(d).toFixed(1)} units</div></div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => dec(i)} className="w-[30px] h-[30px] rounded-lg text-[16px]" style={{ border: '1px solid var(--border2)', background: 'var(--bg2)', color: 'var(--text)', cursor: 'pointer' }}>−</button>
              <span className="font-serif text-[16px] w-4 text-center" style={{ color: counts[i] ? PURPLE : 'var(--text3)' }}>{counts[i] || 0}</span>
              <button onClick={() => inc(i)} className="w-[30px] h-[30px] rounded-lg text-[16px] text-white" style={{ border: `1px solid ${PURPLE}`, background: counts[i] ? PURPLE : 'transparent', color: counts[i] ? '#fff' : PURPLE, cursor: 'pointer' }}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div style={card()}>
        <label style={label}>Late night food? (optional)</label>
        <div className="flex flex-wrap gap-2">
          {LATE_NIGHT_FOOD.map((f) => (
            <button key={f.label} onClick={() => setFood(f.cal)} className="px-3 py-2 rounded-lg text-[12px] font-medium"
              style={{ border: `1px solid ${food === f.cal ? PURPLE : 'var(--border2)'}`, background: food === f.cal ? PURPLE_DIM : 'var(--bg2)', color: food === f.cal ? PURPLE : 'var(--text)', cursor: 'pointer' }}>
              {f.label}{f.cal > 0 ? ` (${f.cal})` : ''}
            </button>
          ))}
        </div>
      </div>

      {totalUnits > 14 && (
        <div style={card({ background: 'rgba(240,79,79,0.08)', border: '1px solid rgba(240,79,79,0.25)' })}>
          <div className="flex items-center gap-2.5"><span className="text-[20px]">⚠️</span>
            <div className="text-[13px] leading-snug" style={{ color: 'var(--red)' }}>You&apos;re over the weekly 14-unit guideline. This is a calorie tracker, not a health judge — but worth knowing.</div></div>
        </div>
      )}

      <div style={card()}>
        <label style={label}>Notes (optional)</label>
        <input type="text" style={input} placeholder="e.g. Lads weekend, worth every pint 🍺" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <button onClick={logIt} disabled={!totalCal || saving} style={ghostBtn({ border: `1px solid ${PURPLE}`, color: PURPLE, opacity: totalCal && !saving ? 1 : 0.5, marginBottom: 8 })}>
        {saving ? 'Saving…' : 'Calculate recovery →'}
      </button>
      <button onClick={onSkip} style={ghostBtn({ fontSize: 13 })}>Skip — I&apos;ll track it myself</button>
    </div>
  );
}

/* ─────────────────────────── RECOVERY ─────────────────────────── */
function RecoveryView({ over, isNightOut, onDone }: { over: number; isNightOut: boolean; onDone: () => void }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const opts = recoveryOptions(over);
  const sev = over < 300 ? 'low' : over < 700 ? 'mid' : 'high';
  const hero = {
    low: { e: '😌', h: 'Barely a blip', b: "You're only slightly over. One lighter meal tomorrow and you're completely square." },
    mid: { e: '💪', h: 'Totally manageable', b: 'Good night. Spread across the week, this is a small, easy-to-fix adjustment.' },
    high: { e: isNightOut ? '🍺' : '🍽️', h: isNightOut ? 'Night out done right' : 'Big meal, no big deal',
      b: "Here's how to rebalance across the next few days without restricting hard." },
  }[sev];
  const accent = isNightOut ? PURPLE : 'var(--accent-text)';
  const toneColor = (t: RecoveryOption['tone']) => t === 'green' ? 'var(--accent-text)' : t === 'gold' ? 'var(--amber)' : 'var(--text3)';

  return (
    <div>
      <Heading title="Recovery" em="Plan" sub="your week is still on track" />
      <div style={card({ background: isNightOut ? PURPLE_DIM : 'var(--accent-dim)', border: `1px solid ${isNightOut ? `${PURPLE}55` : 'var(--accent-mid)'}`, textAlign: 'center', padding: '24px 16px' })}>
        <div className="text-[44px] mb-2">{hero.e}</div>
        <div className="font-serif text-[24px] mb-2" style={{ color: 'var(--text)' }}>{hero.h}</div>
        <div className="text-[14px] leading-relaxed" style={{ color: 'var(--text2)', marginBottom: over > 0 ? 16 : 0 }}>{hero.b}</div>
        {over > 0 && (
          <div className="rounded-[10px] p-3.5 text-left" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between mb-2"><span className="text-[13px]" style={{ color: 'var(--text3)' }}>Over daily target</span><span className="font-serif text-[16px]" style={{ color: 'var(--red)' }}>{over.toLocaleString()} kcal</span></div>
            <div className="flex justify-between"><span className="text-[13px]" style={{ color: 'var(--text3)' }}>Spread over 6 days</span><span className="font-serif text-[16px]" style={{ color: accent }}>{Math.round(over / 6)} kcal/day</span></div>
          </div>
        )}
      </div>

      {over > 0 && (
        <>
          <div className="text-[12px] uppercase tracking-[0.1em] mb-2.5" style={{ color: 'var(--text3)' }}>Choose your recovery</div>
          {opts.map((o, i) => (
            <div key={i} onClick={() => setChosen(i)} style={card({ border: `1px solid ${chosen === i ? toneColor(o.tone) : 'var(--border)'}`, cursor: 'pointer' })}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><span className="text-[22px]">{o.icon}</span>
                  <div><div className="font-serif text-[15px]" style={{ color: 'var(--text)' }}>{o.title}</div><div className="text-[13px] mt-0.5" style={{ color: 'var(--text3)' }}>{o.desc}</div></div></div>
                <span className="text-[10px] font-bold px-2 py-[3px] rounded-full uppercase tracking-[0.1em]" style={{ color: toneColor(o.tone), background: 'var(--bg3)' }}>{o.tag}</span>
              </div>
              {chosen === i && <div className="mt-3 pt-3 text-[13px] leading-relaxed" style={{ borderTop: '1px solid var(--border)', color: 'var(--text3)' }}>{o.tip}</div>}
            </div>
          ))}
        </>
      )}

      <div style={card({ background: 'var(--accent-dim)', border: '1px solid var(--accent-mid)' })}>
        <div className="text-[14px] leading-relaxed italic text-center" style={{ color: accent }}>
          {isNightOut
            ? '"A night out with the lads is part of life. Getting back to it tomorrow is what separates consistent lads from the ones who quit."'
            : '"Progress is built over months, not broken by one meal. Keep going."'}
        </div>
      </div>

      <button onClick={onDone} style={primaryBtn()}>Back to dashboard ✓</button>
    </div>
  );
}
