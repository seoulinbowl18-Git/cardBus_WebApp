'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/icons';
import { CS, csEmailUrl, csPhoneUrl, csWhatsappUrl } from '@/lib/cs';
import { useAuth } from './auth-provider';

/**
 * Elemen UI bersama, padanan widget mobile:
 * - toast()          → SnackBar
 * - openCsHelp()     → CsHelpSheet (WhatsApp / telepon / email)
 * - confirmLogout()  → dialog "Keluar Akun" di ProfileScreen
 */
interface UiState {
  toast: (message: string) => void;
  openCsHelp: () => void;
  confirmLogout: () => void;
}

const UiContext = createContext<UiState | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const router = useRouter();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'cs' | 'logout' | null>(null);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3200);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const value = useMemo<UiState>(
    () => ({ toast: setToastMsg, openCsHelp: () => setSheet('cs'), confirmLogout: () => setSheet('logout') }),
    [],
  );

  const close = useCallback(() => setSheet(null), []);

  function doLogout() {
    setSheet(null);
    logout();
    setToastMsg('Kamu sudah keluar dari akun');
    router.replace('/masuk');
  }

  return (
    <UiContext.Provider value={value}>
      {children}

      {sheet === 'cs' && (
        <Sheet title="Hubungi CS" onClose={close}>
          <CsItem href={csWhatsappUrl()} icon="support" title="Chat via WhatsApp" subtitle="Tim CS siap membantu kamu" external />
          <CsItem href={csPhoneUrl} icon="call" title="Telepon CS" subtitle={CS.phoneLabel} />
          <CsItem href={csEmailUrl} icon="mail" title="Kirim Email" subtitle={CS.email} />
        </Sheet>
      )}

      {sheet === 'logout' && (
        <Dialog onClose={close}>
          <h2 className="text-lg font-extrabold">Keluar Akun</h2>
          <p className="mt-2 text-sm text-muted">Apakah Anda yakin ingin keluar dari akun ini?</p>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={close} className="rounded-lg px-4 py-2 font-semibold text-muted hover:bg-slate-100">Batal</button>
            <button onClick={doLogout} className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">Keluar</button>
          </div>
        </Dialog>
      )}

      {toastMsg && (
        <div role="status" className="fixed inset-x-4 bottom-24 z-[60] mx-auto max-w-md rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lg sm:bottom-6">
          {toastMsg}
        </div>
      )}
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi harus dipakai di dalam <UiProvider>');
  return ctx;
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
}

/** Lembar dari bawah di HP, kotak di tengah di layar lebar. */
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal aria-label={title} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-[20px] bg-white pb-[max(12px,env(safe-area-inset-bottom))] pt-2 shadow-xl sm:rounded-[20px]">
        <div className="flex items-center px-5 pb-1 pt-2">
          <h2 className="flex-1 text-lg font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Tutup" className="rounded-full p-2 text-muted hover:bg-slate-100"><Icon name="close" /></button>
        </div>
        <div className="divide-y divide-line">{children}</div>
      </div>
    </div>
  );
}

function Dialog({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  useEscape(onClose);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-6" onClick={onClose}>
      <div role="alertdialog" aria-modal onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-[20px] bg-white p-6 shadow-xl">
        {children}
      </div>
    </div>
  );
}

function CsItem({ href, icon, title, subtitle, external }: { href: string; icon: IconName; title: string; subtitle: string; external?: boolean }) {
  return (
    <a href={href} {...(external && { target: '_blank', rel: 'noopener noreferrer' })} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50">
      <span className="text-brand"><Icon name={icon} /></span>
      <span className="flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted">{subtitle}</span>
      </span>
      <Icon name="chevron" className="h-5 w-5 text-faint" />
    </a>
  );
}
