'use client';

// Turn a supported video share URL into its embeddable player URL, so it plays
// INLINE (its own thumbnail + play) instead of opening a new tab. Supports Loom
// and YouTube — YouTube "unlisted" videos embed identically to public ones, so
// nothing special is needed for them. Handles watch?v=, youtu.be, /embed/,
// /live/ and /shorts/ forms (with any extra query params). Anything else
// (Fathom, Vimeo, a raw file…) returns null → the card falls back to
// click-to-open-in-a-new-tab.
function toEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const loom = url.match(/loom\.com\/share\/([a-zA-Z0-9-]+)/);
  if (loom) return `https://www.loom.com/embed/${loom[1]}`;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return null;
}

interface VideoCardProps {
  tag: string;
  title: string;
  meta: string;
  url?: string;
  /** Play the video inline (embedded Loom player) instead of opening a new tab. */
  embed?: boolean;
}

export default function VideoCard({ tag, title, meta, url, embed }: VideoCardProps) {
  const embedUrl = embed ? toEmbedUrl(url) : null;

  // Embedded mode: render the player (Loom or YouTube) inline so it shows its own
  // thumbnail and plays in place.
  if (embedUrl) {
    return (
      <div
        className="rounded-[10px] overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="aspect-video relative" style={{ background: 'var(--bg3)' }}>
          {tag && (
            <span
              className="absolute top-2 left-2 text-[9px] font-semibold tracking-[1px] uppercase px-[7px] py-[3px] rounded-[4px] z-10"
              style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--accent-text)' }}
            >
              {tag}
            </span>
          )}
          <iframe
            src={embedUrl}
            title={title}
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            style={{ border: 0 }}
          />
        </div>
        <div className="p-3">
          <h4 className="text-[12px] font-medium mb-[2px] leading-[1.4]" style={{ color: 'var(--text)' }}>
            {title}
          </h4>
          <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{meta}</p>
        </div>
      </div>
    );
  }

  const handleClick = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="rounded-[10px] overflow-hidden transition-all duration-150"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        cursor: url ? 'pointer' : 'default',
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!url) return;
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'var(--accent-mid)';
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = 'var(--shadow)';
        const circle = el.querySelector('.play-circle') as HTMLDivElement | null;
        if (circle) circle.style.transform = 'scale(1.08)';
      }}
      onMouseLeave={(e) => {
        if (!url) return;
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'var(--border)';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'var(--shadow-sm)';
        const circle = el.querySelector('.play-circle') as HTMLDivElement | null;
        if (circle) circle.style.transform = 'scale(1)';
      }}
    >
      <div
        className="aspect-video flex items-center justify-center relative overflow-hidden"
        style={{ background: 'var(--bg3)' }}
      >
        {tag && (
          <span
            className="absolute top-2 left-2 text-[9px] font-semibold tracking-[1px] uppercase px-[7px] py-[3px] rounded-[4px] z-10"
            style={{ background: 'rgba(0,0,0,0.6)', color: 'var(--accent-text)' }}
          >
            {tag}
          </span>
        )}
        <div
          className="play-circle w-9 h-9 rounded-full flex items-center justify-center z-10 transition-transform duration-200"
          style={{ background: url ? 'var(--accent)' : 'var(--border2)' }}
        >
          <div
            className="ml-[2px]"
            style={{
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: '10px solid #fff',
            }}
          />
        </div>
      </div>
      <div className="p-3">
        <h4 className="text-[12px] font-medium mb-[2px] leading-[1.4]" style={{ color: 'var(--text)' }}>
          {title}
        </h4>
        <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{meta}</p>
      </div>
    </div>
  );
}
