'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';
import AnnounceStrip from '@/components/ui/AnnounceStrip';
import { announcements as initial } from '@/lib/mock-data/announcements';
import type { Announcement } from '@/lib/types';

export default function AnnouncementsPage() {
  const [title, setTitle]   = useState('');
  const [body, setBody]     = useState('');
  const [published, setPublished] = useState<Announcement[]>(initial);
  const [posting, setPosting]     = useState(false);

  const handlePublish = () => {
    if (!title.trim() || !body.trim()) return;
    const newAnnouncement: Announcement = {
      id: String(Date.now()),
      icon: '📣',
      title,
      body,
      time: 'Just now',
    };
    setPublished((prev) => [newAnnouncement, ...prev]);
    setTitle('');
    setBody('');
    setPosting(true);
    setTimeout(() => setPosting(false), 2000);
  };

  const inputBase = {
    width: '100%',
    background: 'var(--bg2)',
    border: '1px solid var(--border2)',
    borderRadius: '8px',
    color: 'var(--text)',
    fontFamily: 'inherit',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.15s',
  };

  return (
    <>
      <Topbar title="Announcements" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7 max-w-[720px]">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Post <em className="italic" style={{ color: 'var(--accent-text)' }}>Announcement</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Write a message every client sees when they log in.
        </p>

        <div
          className="rounded-xl p-[22px] mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <label className="block text-[11px] font-semibold uppercase tracking-[0.8px] mb-1.5" style={{ color: 'var(--text3)' }}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New webinar dropping this Sunday"
            style={{ ...inputBase, padding: '10px 13px', marginBottom: '12px', display: 'block' }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent)'; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = 'var(--border2)'; }}
          />
          <label className="block text-[11px] font-semibold uppercase tracking-[0.8px] mb-1.5" style={{ color: 'var(--text3)' }}>Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your update — this appears on every client's home screen immediately..."
            rows={4}
            style={{ ...inputBase, padding: '10px 13px', marginBottom: '12px', display: 'block', resize: 'vertical', minHeight: '85px', lineHeight: '1.7' }}
            onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'; }}
            onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border2)'; }}
          />
          <button
            onClick={handlePublish}
            className="px-[22px] py-2.5 rounded-[8px] text-[13px] font-semibold text-white transition-all duration-150"
            style={{ background: posting ? '#0d8f3e' : 'var(--accent)' }}
            onMouseEnter={(e) => { if (!posting) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
          >
            {posting ? 'Published ✓' : 'Publish to all clients'}
          </button>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="font-serif text-[16px] tracking-[-0.2px]" style={{ color: 'var(--text)' }}>Published</span>
        </div>
        {published.map((a) => (
          <AnnounceStrip key={a.id} announcement={a} />
        ))}
      </div>
    </>
  );
}
