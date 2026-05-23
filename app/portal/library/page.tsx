import Topbar from '@/components/layout/Topbar';
import PdfRow from '@/components/ui/PdfRow';
import { pdfResources } from '@/lib/mock-data/library';

export default function LibraryPage() {
  return (
    <>
      <Topbar title="Resource Library" statusLabel="Bulk · Week 8" />
      <div className="px-8 py-7 max-w-[720px]">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Resource <em className="italic" style={{ color: 'var(--accent-text)' }}>Library</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          PDFs, guides and downloads — all in one place.
        </p>
        {pdfResources.map((pdf) => (
          <PdfRow key={pdf.id} pdf={pdf} />
        ))}
      </div>
    </>
  );
}
