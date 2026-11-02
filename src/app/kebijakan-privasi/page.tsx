import type { Metadata } from 'next';
import { LegalDocumentView } from '@/components/legal-document';
import { PRIVACY } from '@/lib/legal';

export const metadata: Metadata = { title: PRIVACY.title };

export default function PrivacyPage() {
  return <LegalDocumentView doc={PRIVACY} />;
}
