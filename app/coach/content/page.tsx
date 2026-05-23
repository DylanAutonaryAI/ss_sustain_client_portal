'use client';

import { useState } from 'react';
import Topbar from '@/components/layout/Topbar';

interface ContentItem { id: string; title: string; meta: string; }
interface ContentBlock { id: string; label: string; items: ContentItem[]; addLabel: string; }

const initialBlocks: ContentBlock[] = [
  {
    id: 'training',
    label: 'Training Clips',
    addLabel: '+ Add video',
    items: [
      { id: '1', title: 'Incline DB Press — Full Form Guide', meta: 'Chest · 8 min' },
      { id: '2', title: 'Lat Pulldown — Scapular Control',   meta: 'Back · 6 min'  },
      { id: '3', title: 'Hack Squat — Setup & Execution',    meta: 'Legs · 10 min' },
    ],
  },
  {
    id: 'library',
    label: 'Resource Library',
    addLabel: '+ Add PDF',
    items: [
      { id: '4', title: 'The Sustain Way — Mindset Guide', meta: 'PDF · 12 pages' },
      { id: '5', title: 'Weekly Meal Prep Blueprint',      meta: 'PDF · 8 pages'  },
    ],
  },
  {
    id: 'webinars',
    label: 'Webinars',
    addLabel: '+ Add webinar',
    items: [
      { id: '6', title: 'Nutrition Deep Dive — Bulking Without Getting Fat', meta: 'Apr 20 · Upcoming' },
      { id: '7', title: 'Hitting Macros on a Budget',                        meta: 'Mar 15 · Recorded' },
    ],
  },
];

export default function ContentManagerPage() {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);

  const removeItem = (blockId: string, itemId: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, items: b.items.filter((it) => it.id !== itemId) } : b
      )
    );
  };

  return (
    <>
      <Topbar title="Content Manager" statusLabel="Coach Dashboard" />
      <div className="px-8 py-7 max-w-[720px]">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Content <em className="italic" style={{ color: 'var(--accent-text)' }}>Manager</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Control what appears in every section of the client portal.
        </p>

        {blocks.map((block) => (
          <div
            key={block.id}
            className="rounded-xl overflow-hidden mb-3.5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            <div
              className="flex items-center justify-between px-[18px] py-3.5"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <h3 className="text-[13px] font-semibold tracking-[0.2px]" style={{ color: 'var(--text)' }}>
                {block.label}
              </h3>
              <button
                className="px-3.5 py-1.5 rounded-[7px] text-[12px] font-semibold text-white transition-all duration-150"
                style={{ background: 'var(--accent)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.filter = ''; }}
              >
                {block.addLabel}
              </button>
            </div>
            {block.items.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-[18px] py-3 text-[13px]"
                style={{ borderBottom: i < block.items.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--accent)' }}
                />
                <span className="flex-1" style={{ color: 'var(--text)' }}>{item.title}</span>
                <span className="text-[11px]" style={{ color: 'var(--text3)' }}>{item.meta}</span>
                <div className="flex gap-1.5 ml-auto">
                  <button
                    className="px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all duration-150"
                    style={{ border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text3)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text2)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg3)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => removeItem(block.id, item.id)}
                    className="px-2.5 py-1 rounded-[6px] text-[11px] font-medium transition-all duration-150"
                    style={{ border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text3)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(240,79,79,0.3)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'; }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {block.items.length === 0 && (
              <div className="px-[18px] py-4 text-[13px]" style={{ color: 'var(--text3)' }}>No items yet.</div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
