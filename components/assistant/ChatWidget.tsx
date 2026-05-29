'use client';

import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useContent } from '@/context/ContentContext';
import { useCommunity } from '@/context/CommunityContext';
import { useMyPhaseWeek } from '@/lib/my-client';
import type { AssistantCatalog } from '@/lib/assistant/knowledge';

interface Msg { role: 'user' | 'assistant'; content: string }

const STORE_OPEN = 'ss-assistant-open';
const STORE_MSGS = 'ss-assistant-msgs';

const SUGGESTIONS = [
  'Where are the webinars?',
  'How do I message the community?',
  'What supplements should I take?',
  'How do I log a meal?',
];

// ─── tiny markdown: **bold** + [label](url) + newlines ───────────────────────
function Rich({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  const router = useRouter();
  const linkStyle: React.CSSProperties = { color: 'var(--accent-text)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' };

  const renderBold = (s: string, k: string) =>
    s.split(/\*\*(.+?)\*\*/g).map((part, i) =>
      i % 2 === 1 ? <strong key={`${k}b${i}`}>{part}</strong> : <Fragment key={`${k}s${i}`}>{part}</Fragment>,
    );

  const renderLine = (line: string, k: string) => {
    const out: React.ReactNode[] = [];
    const re = /\[([^\]]+)\]\(([^)]+)\)/g;
    let last = 0; let m: RegExpExecArray | null; let i = 0;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) out.push(<Fragment key={`${k}t${i}`}>{renderBold(line.slice(last, m.index), `${k}t${i}`)}</Fragment>);
      const label = m[1]; const url = m[2];
      if (url.startsWith('/')) {
        out.push(<a key={`${k}l${i}`} style={linkStyle} onClick={() => { onNavigate(); router.push(url); }}>{label}</a>);
      } else {
        out.push(<a key={`${k}l${i}`} style={linkStyle} href={url} target="_blank" rel="noopener noreferrer">{label}</a>);
      }
      last = m.index + m[0].length; i++;
    }
    if (last < line.length) out.push(<Fragment key={`${k}t${i}`}>{renderBold(line.slice(last), `${k}t${i}`)}</Fragment>);
    return out;
  };

  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {renderLine(line, `l${i}`)}
        </Fragment>
      ))}
    </>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-1 py-1" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--text3)', animation: 'blink 1.2s infinite', animationDelay: `${i * 0.2}s` }} />
      ))}
    </span>
  );
}

export default function ChatWidget() {
  const { user } = useAuth();
  const content = useContent();
  const { events } = useCommunity();
  const { statusLabel } = useMyPhaseWeek();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore state after mount (avoids SSR/localStorage mismatch).
  useEffect(() => {
    setMounted(true);
    try {
      setOpen(sessionStorage.getItem(STORE_OPEN) === '1');
      const saved = sessionStorage.getItem(STORE_MSGS);
      if (saved) setMessages(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { if (mounted) try { sessionStorage.setItem(STORE_OPEN, open ? '1' : '0'); } catch {} }, [open, mounted]);
  useEffect(() => { if (mounted) try { sessionStorage.setItem(STORE_MSGS, JSON.stringify(messages.slice(-30))); } catch {} }, [messages, mounted]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, open]);

  const buildCatalog = useCallback((): AssistantCatalog => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      trainingClips: content.trainingVideos.map((v) => v.title),
      posingVideos: content.posingVideos.map((v) => v.label),
      posingTips: content.posingTips.map((t) => t.key),
      mindset: content.mindsetTips.map((m) => m.title),
      supplements: content.supplements.map((s) => ({ name: s.name, essential: s.essential, description: s.description })),
      recommendations: [...content.gymBag.map((g) => g.name), ...content.nonNeg.map((n) => n.label)],
      webinars: content.webinars.map((w) => w.title),
      library: content.pdfResources.map((p) => p.title),
      events: events.filter((e) => e.date >= today).slice(0, 6).map((e) => ({ title: e.title, date: e.date, time: e.time })),
    };
  }, [content, events]);

  const setLastAssistant = (arr: Msg[], text: string): Msg[] => {
    const copy = arr.slice();
    for (let i = copy.length - 1; i >= 0; i--) {
      if (copy[i].role === 'assistant') { copy[i] = { ...copy[i], content: text }; break; }
    }
    return copy;
  };

  const send = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (!q || streaming) return;
    const history = [...messages, { role: 'user' as const, content: q }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          catalog: buildCatalog(),
          client: { name: user?.name, phaseWeek: statusLabel },
        }),
      });
      if (!res.ok || !res.body) {
        const msg = res.status === 503
          ? "I'm not switched on just yet — Sam needs to finish setting me up."
          : 'Sorry, I could not respond just now. Please try again.';
        setMessages((m) => setLastAssistant(m, msg));
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => setLastAssistant(m, acc));
      }
    } catch {
      setMessages((m) => setLastAssistant(m, 'Sorry, something went wrong. Please try again.'));
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming, buildCatalog, user, statusLabel]);

  // Any close = full wipe. Re-opening always starts a brand-new chat.
  const closeChat = useCallback(() => {
    setOpen(false);
    setMessages([]);
    setInput('');
    try { sessionStorage.removeItem(STORE_MSGS); } catch { /* ignore */ }
  }, []);

  // Play the exit animation first (panel stays mounted), then finishClose runs
  // the full wipe when the close keyframe ends. beginClose is idempotent.
  const beginClose = useCallback(() => { setClosing(true); }, []);
  const finishClose = useCallback(() => { setClosing(false); closeChat(); }, [closeChat]);

  if (!mounted) return null;

  const firstName = user?.name?.split(' ')[0] || 'there';
  const lastIsEmptyAssistant = messages.length > 0
    && messages[messages.length - 1].role === 'assistant'
    && messages[messages.length - 1].content === '';

  // ─── Launcher ───────────────────────────────────────────────────────────────
  if (!open && !closing) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open the SS Sustain assistant"
        className="fixed bottom-5 right-5 z-[70] w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-150"
        style={{ background: 'var(--accent)', boxShadow: '0 8px 28px rgba(32,182,35,0.45)', border: 'none', cursor: 'pointer' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.06)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </button>
    );
  }

  // ─── Panel ────────────────────────────────────────────────────────────────
  const bubbleBase = 'max-w-[80%] px-3.5 py-2.5 text-[13px] leading-[1.55] rounded-[14px]';

  return (
    <div
      className={`fixed bottom-5 right-5 z-[70] flex flex-col overflow-hidden ${closing ? 'animate-chat-close' : 'animate-chat-open'}`}
      onAnimationEnd={(e) => {
        if (e.target !== e.currentTarget) return;          // ignore bubbled child animations (e.g. typing dots)
        if (e.animationName === 'chatPanelOut') finishClose();
      }}
      style={{
        width: 'min(380px, calc(100vw - 2rem))',
        height: 'min(600px, calc(100vh - 2.5rem))',
        background: 'var(--surface)',
        border: '1px solid var(--border2)',
        borderRadius: 18,
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #16c45a, #0d8f3e)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.18)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15l-1.9-4.1L5.5 9l4.6-1.4L12 3z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-white leading-tight">Sustain Assistant</div>
          <div className="text-[11px] text-white/80 leading-tight">Your portal guide · replies instantly</div>
        </div>
        <button
          onClick={beginClose}
          aria-label="Close assistant"
          className="w-7 h-7 rounded-full flex items-center justify-center text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ background: 'var(--bg)' }}>
        {/* Welcome */}
        <div className={`${bubbleBase} self-start`} style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
          Hi {firstName}! 👋 I&apos;m your SS Sustain guide. Ask me where to find anything in the portal, or how something works.
        </div>
        {messages.length === 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-left text-[12.5px] px-3 py-2 rounded-[10px] transition-colors duration-150"
                style={{ background: 'var(--surface)', border: '1px solid var(--accent-mid)', color: 'var(--accent-text)', cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-dim)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface)'; }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => {
          if (m.role === 'user') {
            return (
              <div key={i} className={`${bubbleBase} self-end text-white`} style={{ background: 'var(--accent)' }}>
                {m.content}
              </div>
            );
          }
          const isStreamingThis = i === messages.length - 1 && lastIsEmptyAssistant;
          return (
            <div key={i} className={`${bubbleBase} self-start`} style={{ background: 'var(--bg2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              {isStreamingThis ? <Dots /> : <Rich text={m.content} onNavigate={finishClose} />}
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="flex items-end gap-2 px-3 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
          rows={1}
          placeholder="Ask me anything…"
          className="flex-1 resize-none px-3 py-2 rounded-[10px] text-[13px] outline-none leading-[1.5]"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'var(--text)', maxHeight: 96, fontFamily: 'inherit' }}
          onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent)'; }}
          onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border2)'; }}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || streaming}
          aria-label="Send message"
          className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-all duration-150 disabled:opacity-40"
          style={{ background: 'var(--accent)', border: 'none', cursor: input.trim() && !streaming ? 'pointer' : 'default' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
