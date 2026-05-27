'use client';

import PortalTopbar from '@/components/layout/PortalTopbar';
import PdfRow from '@/components/ui/PdfRow';
import { useContent } from '@/context/ContentContext';

export default function LibraryPage() {
  const { pdfResources } = useContent();

  return (
    <>
      <PortalTopbar title="Resource Library" />
      <div className="px-8 py-7">
        <div className="font-serif text-[30px] tracking-[-0.5px] leading-[1.15] mb-1.5" style={{ color: 'var(--text)' }}>
          Resource <em className="italic" style={{ color: 'var(--accent-text)' }}>Library</em>
        </div>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text2)' }}>
          PDFs, guides and downloads — all in one place.
        </p>
        {pdfResources.length > 0 ? (
          pdfResources.map((pdf) => <PdfRow key={pdf.id} pdf={pdf} />)
        ) : (
          <div className="rounded-xl px-6 py-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-[13px]" style={{ color: 'var(--text3)' }}>No resources added yet.</p>
          </div>
        )}
      </div>
    </>
  );
}
