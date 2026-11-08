import { BottomNav } from '@/components/bottom-nav';
import { SiteHeader } from '@/components/site-header';
import { AuthProvider } from '@/providers/auth-provider';
import { UiProvider } from '@/providers/ui-provider';

/** Tampilan penumpang (semua halaman selain /admin): header, menu bawah HP, dan sesi penumpang. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UiProvider>
        <SiteHeader />
        {/* pb-28 di HP: ruang untuk menu bawah */}
        <main className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:pb-12">{children}</main>
        <BottomNav />
      </UiProvider>
    </AuthProvider>
  );
}
