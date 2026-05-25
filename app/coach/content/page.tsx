'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import { useContent } from '@/context/ContentContext';
import type { Supplement, MindsetTip, GymBagItem, ShoppingItem, ShoppingCategory, NonNegotiable } from '@/lib/types';

type Tab = 'supplements' | 'mindset' | 'gymbag' | 'shopping' | 'nonneg';

const TABS: { id: Tab; label: string }[] = [
  { id: 'supplements', label: 'Supplements' },
  { id: 'mindset',     label: 'Mindset Tips' },
  { id: 'gymbag',      label: 'Gym Bag' },
  { id: 'shopping',    label: 'Shopping' },
  { id: 'nonneg',      label: 'Non-Negotiables' },
];

// ─── Shared UI primitives ────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)',
  borderRadius: 8, padding: '8px 12px', fontSize: 13, width: '100%', outline: 'none',
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--text3)',
  textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 4,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 10 }}><label style={labelStyle}>{label}</label>{children}</div>;
}

function SaveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
      Save
    </button>
  );
}
function CancelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
      Cancel
    </button>
  );
}
function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
      Edit
    </button>
  );
}
function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border2)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(240,79,79,0.35)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; }}
    >Remove</button>
  );
}

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--accent-mid)', borderRadius: 10, padding: '16px 18px', marginBottom: 8 }}>
      {children}
    </div>
  );
}

function ItemRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
      {children}
    </div>
  );
}

function AddNewBtn({ onClick, label = '+ Add New' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      style={{ width: '100%', background: 'transparent', border: '1px dashed var(--border2)', borderRadius: 10, padding: '10px 16px', fontSize: 12, fontWeight: 600, color: 'var(--text3)', cursor: 'pointer', marginTop: 4 }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-mid)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-text)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; }}
    >{label}</button>
  );
}

// ─── Supplements Editor ───────────────────────────────────────────────────────

function SupplementsEditor() {
  const { supplements, setSupplements } = useContent();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const blank = (): Omit<Supplement, 'id'> => ({ icon: '', name: '', description: '', essential: true, url: '' });
  const [draft, setDraft] = useState(blank());

  const startEdit = (s: Supplement) => { setAddOpen(false); setEditingId(s.id); setDraft({ icon: s.icon, name: s.name, description: s.description, essential: s.essential, url: s.url ?? '' }); };
  const cancelEdit = () => { setEditingId(null); };
  const saveEdit = () => {
    if (!draft.name.trim()) return;
    setSupplements(supplements.map(s => s.id === editingId ? { ...s, ...draft } : s));
    setEditingId(null);
  };
  const startAdd = () => { setEditingId(null); setAddOpen(true); setDraft(blank()); };
  const saveAdd = () => {
    if (!draft.name.trim()) return;
    setSupplements([...supplements, { id: `supp-${Date.now()}`, ...draft }]);
    setAddOpen(false);
  };
  const remove = (id: string) => setSupplements(supplements.filter(s => s.id !== id));

  const Form = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <FormCard>
      <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 10, marginBottom: 10 }}>
        <Field label="Icon"><input value={draft.icon} onChange={e => setDraft(d => ({ ...d, icon: e.target.value }))} placeholder="💊" style={{ ...inputStyle, textAlign: 'center', fontSize: 18 }} /></Field>
        <Field label="Name"><input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Supplement name" style={inputStyle} /></Field>
      </div>
      <Field label="Description"><textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="Dosage and benefit..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
      <Field label="Buy Link (optional)"><input value={draft.url ?? ''} onChange={e => setDraft(d => ({ ...d, url: e.target.value }))} placeholder="https://..." style={inputStyle} /></Field>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
          <input type="checkbox" checked={draft.essential} onChange={e => setDraft(d => ({ ...d, essential: e.target.checked }))} style={{ accentColor: 'var(--accent)', width: 15, height: 15 }} />
          Mark as Essential
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8 }}><SaveBtn onClick={onSave} /><CancelBtn onClick={onCancel} /></div>
    </FormCard>
  );

  return (
    <div>
      {supplements.map(s => editingId === s.id ? (
        <Form key={s.id} onSave={saveEdit} onCancel={cancelEdit} />
      ) : (
        <ItemRow key={s.id}>
          <span style={{ fontSize: 20, width: 32, textAlign: 'center', flexShrink: 0 }}>{s.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 1 }}>{s.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text3)' }}>{s.description.slice(0, 80)}{s.description.length > 80 ? '…' : ''}</p>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: s.essential ? 'var(--accent-dim)' : 'var(--bg3)', color: s.essential ? 'var(--accent-text)' : 'var(--text3)', border: `1px solid ${s.essential ? 'var(--accent-mid)' : 'var(--border2)'}`, flexShrink: 0 }}>
            {s.essential ? 'Essential' : 'Optional'}
          </span>
          <div style={{ display: 'flex', gap: 6 }}><EditBtn onClick={() => startEdit(s)} /><RemoveBtn onClick={() => remove(s.id)} /></div>
        </ItemRow>
      ))}
      {!addOpen && <AddNewBtn onClick={startAdd} label="+ Add Supplement" />}
      {addOpen && <Form onSave={saveAdd} onCancel={() => setAddOpen(false)} />}
    </div>
  );
}

// ─── Mindset Tips Editor ──────────────────────────────────────────────────────

function MindsetEditor() {
  const { mindsetTips, setMindsetTips } = useContent();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const blank = (): Omit<MindsetTip, 'id'> => ({ title: '', body: '' });
  const [draft, setDraft] = useState(blank());

  const startEdit = (t: MindsetTip) => { setAddOpen(false); setEditingId(t.id); setDraft({ title: t.title, body: t.body }); };
  const saveEdit = () => {
    if (!draft.title.trim()) return;
    setMindsetTips(mindsetTips.map(t => t.id === editingId ? { ...t, ...draft } : t));
    setEditingId(null);
  };
  const saveAdd = () => {
    if (!draft.title.trim()) return;
    setMindsetTips([...mindsetTips, { id: `mind-${Date.now()}`, ...draft }]);
    setAddOpen(false);
  };
  const remove = (id: string) => setMindsetTips(mindsetTips.filter(t => t.id !== id));

  const Form = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <FormCard>
      <Field label="Title"><input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Tip title" style={inputStyle} /></Field>
      <Field label="Body"><textarea value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))} placeholder="Tip description..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
      <div style={{ display: 'flex', gap: 8 }}><SaveBtn onClick={onSave} /><CancelBtn onClick={onCancel} /></div>
    </FormCard>
  );

  return (
    <div>
      {mindsetTips.map((t, i) => editingId === t.id ? (
        <Form key={t.id} onSave={saveEdit} onCancel={() => setEditingId(null)} />
      ) : (
        <ItemRow key={t.id}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-dim)', flexShrink: 0, minWidth: 28 }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 1 }}>{t.title}</p>
            <p style={{ fontSize: 11, color: 'var(--text3)' }}>{t.body.slice(0, 90)}{t.body.length > 90 ? '…' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}><EditBtn onClick={() => startEdit(t)} /><RemoveBtn onClick={() => remove(t.id)} /></div>
        </ItemRow>
      ))}
      {!addOpen && <AddNewBtn onClick={() => { setEditingId(null); setAddOpen(true); setDraft(blank()); }} label="+ Add Tip" />}
      {addOpen && <Form onSave={saveAdd} onCancel={() => setAddOpen(false)} />}
    </div>
  );
}

// ─── Gym Bag Editor ───────────────────────────────────────────────────────────

function GymBagEditor() {
  const { gymBag, setGymBag } = useContent();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const blank = (): Omit<GymBagItem, 'id'> => ({ name: '', desc: '', linkLabel: '', linkUrl: '' });
  const [draft, setDraft] = useState(blank());

  const startEdit = (g: GymBagItem) => { setAddOpen(false); setEditingId(g.id); setDraft({ name: g.name, desc: g.desc, linkLabel: g.linkLabel, linkUrl: g.linkUrl }); };
  const saveEdit = () => {
    if (!draft.name.trim()) return;
    setGymBag(gymBag.map(g => g.id === editingId ? { ...g, ...draft } : g));
    setEditingId(null);
  };
  const saveAdd = () => {
    if (!draft.name.trim()) return;
    setGymBag([...gymBag, { id: `gym-${Date.now()}`, ...draft }]);
    setAddOpen(false);
  };
  const remove = (id: string) => setGymBag(gymBag.filter(g => g.id !== id));

  const Form = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <FormCard>
      <Field label="Item Name"><input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Lifting Belt" style={inputStyle} /></Field>
      <Field label="Description"><textarea value={draft.desc} onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))} placeholder="What it's used for..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
        <Field label="Link Label"><input value={draft.linkLabel} onChange={e => setDraft(d => ({ ...d, linkLabel: e.target.value }))} placeholder="View on Amazon" style={inputStyle} /></Field>
        <Field label="Link URL"><input value={draft.linkUrl} onChange={e => setDraft(d => ({ ...d, linkUrl: e.target.value }))} placeholder="https://..." style={inputStyle} /></Field>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}><SaveBtn onClick={onSave} /><CancelBtn onClick={onCancel} /></div>
    </FormCard>
  );

  return (
    <div>
      {gymBag.map(g => editingId === g.id ? (
        <Form key={g.id} onSave={saveEdit} onCancel={() => setEditingId(null)} />
      ) : (
        <ItemRow key={g.id}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 1 }}>{g.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text3)' }}>{g.desc.slice(0, 80)}{g.desc.length > 80 ? '…' : ''}</p>
            {g.linkUrl && <a href={g.linkUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--accent-text)', textDecoration: 'none' }}>{g.linkLabel || g.linkUrl} →</a>}
          </div>
          <div style={{ display: 'flex', gap: 6 }}><EditBtn onClick={() => startEdit(g)} /><RemoveBtn onClick={() => remove(g.id)} /></div>
        </ItemRow>
      ))}
      {!addOpen && <AddNewBtn onClick={() => { setEditingId(null); setAddOpen(true); setDraft(blank()); }} label="+ Add Item" />}
      {addOpen && <Form onSave={saveAdd} onCancel={() => setAddOpen(false)} />}
    </div>
  );
}

// ─── Shopping Editor ──────────────────────────────────────────────────────────

const SHOPPING_CATS: ShoppingCategory[] = ['Protein', 'Carbs', 'Fats', 'Other'];

function ShoppingEditor() {
  const { shopping, setShopping } = useContent();
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<{ name: string; category: ShoppingCategory }>({ name: '', category: 'Protein' });

  const saveAdd = () => {
    if (!draft.name.trim()) return;
    setShopping([...shopping, { id: `shop-${Date.now()}`, name: draft.name.trim(), category: draft.category }]);
    setDraft({ name: '', category: 'Protein' });
    setAddOpen(false);
  };
  const remove = (id: string) => setShopping(shopping.filter(i => i.id !== id));

  return (
    <div>
      {SHOPPING_CATS.map(cat => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{cat}</p>
          {shopping.filter(i => i.category === cat).map(item => (
            <ItemRow key={item.id}>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text)' }}>{item.name}</span>
              <RemoveBtn onClick={() => remove(item.id)} />
            </ItemRow>
          ))}
          {shopping.filter(i => i.category === cat).length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 0' }}>No items.</p>
          )}
        </div>
      ))}
      {!addOpen ? (
        <AddNewBtn onClick={() => setAddOpen(true)} label="+ Add Item" />
      ) : (
        <FormCard>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: 10 }}>
            <Field label="Item Name"><input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Chicken Breast" style={inputStyle} /></Field>
            <Field label="Category">
              <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value as ShoppingCategory }))} style={inputStyle}>
                {SHOPPING_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 8 }}><SaveBtn onClick={saveAdd} /><CancelBtn onClick={() => setAddOpen(false)} /></div>
        </FormCard>
      )}
    </div>
  );
}

// ─── Non-Negotiables Editor ───────────────────────────────────────────────────

function NonNegEditor() {
  const { nonNeg, setNonNeg } = useContent();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const blank = (): Omit<NonNegotiable, 'id'> => ({ label: '', desc: '' });
  const [draft, setDraft] = useState(blank());

  const startEdit = (n: NonNegotiable) => { setAddOpen(false); setEditingId(n.id); setDraft({ label: n.label, desc: n.desc }); };
  const saveEdit = () => {
    if (!draft.label.trim()) return;
    setNonNeg(nonNeg.map(n => n.id === editingId ? { ...n, ...draft } : n));
    setEditingId(null);
  };
  const saveAdd = () => {
    if (!draft.label.trim()) return;
    setNonNeg([...nonNeg, { id: `nn-${Date.now()}`, ...draft }]);
    setAddOpen(false);
  };
  const remove = (id: string) => setNonNeg(nonNeg.filter(n => n.id !== id));

  const Form = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <FormCard>
      <Field label="Label"><input value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} placeholder="e.g. Steps" style={inputStyle} /></Field>
      <Field label="Description"><input value={draft.desc} onChange={e => setDraft(d => ({ ...d, desc: e.target.value }))} placeholder="e.g. Meeting your daily step target" style={inputStyle} /></Field>
      <div style={{ display: 'flex', gap: 8 }}><SaveBtn onClick={onSave} /><CancelBtn onClick={onCancel} /></div>
    </FormCard>
  );

  return (
    <div>
      {nonNeg.map((n, i) => editingId === n.id ? (
        <Form key={n.id} onSave={saveEdit} onCancel={() => setEditingId(null)} />
      ) : (
        <ItemRow key={n.id}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-text)', minWidth: 20, flexShrink: 0 }}>{i + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 1 }}>{n.label}</p>
            <p style={{ fontSize: 11, color: 'var(--text3)' }}>{n.desc}</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}><EditBtn onClick={() => startEdit(n)} /><RemoveBtn onClick={() => remove(n.id)} /></div>
        </ItemRow>
      ))}
      {!addOpen && <AddNewBtn onClick={() => { setEditingId(null); setAddOpen(true); setDraft(blank()); }} label="+ Add Item" />}
      {addOpen && <Form onSave={saveAdd} onCancel={() => setAddOpen(false)} />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentManagerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('supplements');

  return (
    <>
      <Topbar title="Content Manager" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7 max-w-[760px]">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Content <em className="italic" style={{ color: 'var(--accent-text)' }}>Manager</em>
        </div>
        <p className="text-[13px] mb-6" style={{ color: 'var(--text2)' }}>
          Changes save instantly and appear on the client portal in real time.
        </p>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: activeTab === tab.id ? 'var(--accent)' : 'var(--surface)',
                color: activeTab === tab.id ? '#fff' : 'var(--text2)',
                border: activeTab === tab.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active editor */}
        {activeTab === 'supplements' && <SupplementsEditor />}
        {activeTab === 'mindset'     && <MindsetEditor />}
        {activeTab === 'gymbag'      && <GymBagEditor />}
        {activeTab === 'shopping'    && <ShoppingEditor />}
        {activeTab === 'nonneg'      && <NonNegEditor />}
      </div>
    </>
  );
}
