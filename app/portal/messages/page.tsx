import Topbar from '@/components/layout/Topbar';
import MsgBubble from '@/components/ui/MsgBubble';
import { clientMessages } from '@/lib/mock-data/messages';

export default function MessagesPage() {
  return (
    <>
      <Topbar title="Coach Messages" statusLabel="Bulk · Week 8" />
      <div className="px-8 py-7 max-w-[720px]">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Coach <em className="italic" style={{ color: 'var(--accent-text)' }}>Messages</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          Personal notes from your coach — just for you.
        </p>
        {clientMessages.map((msg) => (
          <MsgBubble key={msg.id} msg={msg} />
        ))}
      </div>
    </>
  );
}
