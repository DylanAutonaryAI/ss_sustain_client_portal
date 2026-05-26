'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import { useContent } from '@/context/ContentContext';
import type { Announcement } from '@/lib/types';

const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg2)',
  border: '1px solid var(--border2)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: '13px',
  outline: 'none',
  transition: 'border-color 0.15s',
  padding: '10px 13px',
  display: 'block',
};

function focus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  (e.target as HTMLElement).style.borderColor = 'var(--accent)';
}
function blur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  (e.target as HTMLElement).style.borderColor = 'var(--border2)';
}

function EditableRow({
  announcement,
  onSave,
  onDelete,
}: {
  announcement: Announcement;
  onSave: (id: string, title: string, body: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [title, setTitle] = useState(announcement.title);
  const [body, setBody] = useState(announcement.body);

  function handleSave() {
    if (!title.trim()) return;
    onSave(announcement.id, title, body);
    setEditing(false);
  }

  function handleCancel() {
    setTitle(announcement.title);
    setBody(announcement.body);
    setEditing(false);
  }

  if (editing) {
    return (
      <div
        className="rounded-r-[10px] px-5 py-4 mb-2.5"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--accent-mid)',
          borderLeft: `3px solid var(--accent)`,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          style={{ ...inputBase, marginBottom: 8 }}
          onFocus={focus}
          onBlur={blur}
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Message"
          rows={3}
          style={{ ...inputBase, resize: 'vertical', lineHeight: '1.7', marginBottom: 10 }}
          onFocus={focus}
          onBlur={blur}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-[7px] text-[12px] font-semibold text-white"
            style={{ background: 'var(--accent)', border: 'none', cursor: 'pointer' }}
          >
            Save changes
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-1.5 rounded-[7px] text-[12px]"
            style={{ background: 'none', border: '1px solid var(--border2)', color: 'var(--text3)', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-3.5 px-5 py-4 mb-2.5 rounded-r-[10px]"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${announcement.accentColor ?? 'var(--accent)'}`,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <span className="text-[16px] flex-shrink-0 mt-px">{announcement.icon}</span>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-semibold mb-[3px]" style={{ color: 'var(--text)' }}>
          {announcement.title}
        </h4>
        <p className="text-[12px] leading-[1.6]" style={{ color: 'var(--text2)' }}>
          {announcement.body}
        </p>
      </div>

      {/* Timestamp + actions */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
        <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--text3)' }}>
          {announcement.time}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-[11px] px-2 py-0.5 rounded-[5px] transition-all duration-150"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text3)', cursor: 'pointer' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; }}
        >
          Edit
        </button>
        {confirming ? (
          <div className="flex items-center gap-1">
            <span className="text-[11px]" style={{ color: 'var(--text3)' }}>Delete?</span>
            <button
              onClick={() => onDelete(announcement.id)}
              className="text-[11px] px-2 py-0.5 rounded-[5px] font-semibold text-white"
              style={{ background: 'var(--red)', border: 'none', cursor: 'pointer' }}
            >
              Yes
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-[11px] px-2 py-0.5 rounded-[5px]"
              style={{ background: 'none', border: '1px solid var(--border2)', color: 'var(--text3)', cursor: 'pointer' }}
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-[11px] px-2 py-0.5 rounded-[5px] transition-all duration-150"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text3)', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const { announcements: published, setAnnouncements: setPublished } = useContent();
  const [title, setTitle]   = useState('');
  const [body, setBody]     = useState('');
  const [posting, setPosting] = useState(false);

  function handlePublish() {
    if (!title.trim() || !body.trim()) return;
    const newAnnouncement: Announcement = {
      id: String(Date.now()),
      icon: '📣',
      title,
      body,
      time: 'Just now',
    };
    setPublished([newAnnouncement, ...published]);
    setTitle('');
    setBody('');
    setPosting(true);
    setTimeout(() => setPosting(false), 2000);
  }

  function handleSave(id: string, newTitle: string, newBody: string) {
    setPublished(published.map(a => a.id === id ? { ...a, title: newTitle, body: newBody } : a));
  }

  function handleDelete(id: string) {
    setPublished(published.filter(a => a.id !== id));
  }

  return (
    <>
      <Topbar title="Announcements" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Post <em className="italic" style={{ color: 'var(--accent-text)' }}>Announcement</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Write a message every client sees when they log in.
        </p>

        <div className="flex gap-8 items-start">
          {/* Compose form */}
          <div className="w-[420px] flex-shrink-0">
            <div
              className="rounded-xl p-[22px]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
            >
              <label className="block text-[11px] font-semibold uppercase tracking-[0.8px] mb-1.5" style={{ color: 'var(--text3)' }}>Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. New webinar dropping this Sunday"
                style={{ ...inputBase, marginBottom: 12 }}
                onFocus={focus}
                onBlur={blur}
              />
              <label className="block text-[11px] font-semibold uppercase tracking-[0.8px] mb-1.5" style={{ color: 'var(--text3)' }}>Message</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your update — this appears on every client's home screen immediately..."
                rows={5}
                style={{ ...inputBase, marginBottom: 12, resize: 'vertical', minHeight: '100px', lineHeight: '1.7' }}
                onFocus={focus}
                onBlur={blur}
              />
              <button
                onClick={handlePublish}
                className="px-[22px] py-2.5 rounded-[8px] text-[13px] font-semibold text-white transition-all duration-150"
                style={{ background: posting ? '#0d8f3e' : 'var(--accent)', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { if (!posting) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
              >
                {posting ? 'Published ✓' : 'Publish to all clients'}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px self-stretch" style={{ background: 'var(--border)' }} />

          {/* Published list */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Published</span>
              <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{published.length} announcement{published.length !== 1 ? 's' : ''}</span>
            </div>

            {published.length === 0 ? (
              <p className="text-[13px]" style={{ color: 'var(--text3)' }}>No announcements yet.</p>
            ) : (
              published.map(a => (
                <EditableRow
                  key={a.id}
                  announcement={a}
                  onSave={handleSave}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
