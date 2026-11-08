import type { Metadata } from 'next';
import { LegalDocumentView } from '@/components/legal-document';
import { TERMS } from '@/lib/legal';

export const metadata: Metadata = { title: TERMS.title };

export default function TermsPage() {
  return <LegalDocumentView doc={TERMS} />;
}
