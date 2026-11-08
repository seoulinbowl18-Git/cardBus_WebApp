import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminSessionProvider } from '@/providers/admin-session';

export const metadata: Metadata = {
  title: { default: 'Admin Pusat', template: '%s | Admin Pusat CardBus' },
  robots: { index: false, follow: false },
};

/** Panel pemilik CardBus. Terpisah dari tampilan penumpang (app/(public)): layout, sesi, dan menu sendiri. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSessionProvider>
      <AdminShell>{children}</AdminShell>
    </AdminSessionProvider>
  );
}
