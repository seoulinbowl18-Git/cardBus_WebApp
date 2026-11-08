'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/icons';
import { ApiError } from '@/lib/api/client';
import { orderApi, userApi } from '@/lib/api/endpoints';
import { formatRupiah } from '@/lib/format';
import type { Order, SavedPassenger, UpdateProfileBody, User } from '@/lib/types';
import { useAuth } from '@/providers/auth-provider';
import { useUi } from '@/providers/ui-provider';

/** 6281234567890 → 081234567890 (tampilan saja). */
const localPhone = (p: string | null) => (p ? p.replace(/^62/, '0') : '');

/** Kecilkan foto ke 256×256 JPEG (backend menerima data URL maks. ±300 KB). */
async function toAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const s = Math.min(bitmap.width, bitmap.height);
  ctx.drawImage(bitmap, (bitmap.width - s) / 2, (bitmap.height - s) / 2, s, s, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Halaman Akun, mengikuti ProfileScreen di aplikasi mobile: header profil + statistik,
 * data pemesan, penumpang tersimpan, menu (promo, CS, pembatalan, legal), dan Keluar Akun.
 * Tamu tetap bisa membuka menu bantuan & dokumen legal.
 */
export default function AccountPage() {
  const { user, token, ready, setUser } = useAuth();
  const { toast, openCsHelp, confirmLogout } = useUi();
  const [busy, setBusy] = useState(false);
  const loggedIn = ready && !!token && !!user;

  /** Simpan sebagian profil ke backend (PUT /api/user/profile). */
  async function save(body: UpdateProfileBody, ok: string) {
    if (busy) return false;
    setBusy(true);
    try {
      const res = await userApi.updateProfile(body);
      setUser(res.user);
      toast(ok);
      return true;
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Gagal menyimpan. Coba lagi.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <ProfileHeader user={loggedIn ? user : null} busy={busy} onSave={save} />

      {loggedIn ? (
        <>
          <Card title="Data pemesan" subtitle="Dipakai untuk isi otomatis saat pesan tiket">
            <ProfileForm user={user} busy={busy} onSave={save} />
          </Card>
          <SavedPassengers user={user} busy={busy} onSave={save} />
        </>
      ) : (
        ready && (
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <p className="font-bold">Masuk untuk melihat tiket dan menyimpan data pemesan</p>
            <p className="mt-1 text-sm text-muted">Pakai nomor WhatsApp (kode OTP) atau akun Google.</p>
            <Link href="/masuk?next=/akun" className="mt-4 inline-block rounded-xl bg-brand px-6 py-2.5 font-bold text-white hover:bg-brand-dark">
              Masuk / Daftar
            </Link>
          </div>
        )
      )}

      <Menu>
        <MenuItem icon="share" title="Ajak Teman" subtitle="Bagikan kode referral, dapatkan voucher" href={loggedIn ? '/akun/ajak-teman' : '/masuk?next=/akun/ajak-teman'} />
        <MenuItem icon="voucher" title="Voucher & Kupon Saya" subtitle="Voucher aktif & klaim kode promo" href={loggedIn ? '/akun/voucher' : '/masuk?next=/akun/voucher'} />
        <MenuItem icon="gift" title="Promo" href="/promo" />
        <MenuItem icon="support" title="Hubungi CS" subtitle="WhatsApp, telepon, atau email" onClick={openCsHelp} />
      </Menu>

      <Menu>
        <MenuItem icon="refund" title="Tiket Cancel & Pengembalian Dana" href="/akun/pembatalan" />
        <MenuItem icon="doc" title="Syarat & Ketentuan" href="/syarat-ketentuan" />
        <MenuItem icon="shield" title="Kebijakan Privasi" href="/kebijakan-privasi" />
      </Menu>

      {loggedIn && (
        <button
          onClick={confirmLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-3.5 font-bold text-red-600 shadow-sm hover:bg-red-50"
        >
          <Icon name="logout" /> Keluar Akun
        </button>
      )}

      <p className="pt-2 text-center text-xs text-faint">CardBus Web · Tiket Bus, Lebih Mudah</p>
    </div>
  );
}

type SaveFn = (body: UpdateProfileBody, ok: string) => Promise<boolean>;

function ProfileHeader({ user, busy, onSave }: { user: User | null; busy: boolean; onSave: SaveFn }) {
  const { toast } = useUi();
  const fileRef = useRef<HTMLInputElement>(null);
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!user) return;
    orderApi.list().then(setOrders).catch(() => setOrders([]));
  }, [user]);

  const name = user?.name?.trim() || 'Pengguna CardBus';
  const contact = user ? localPhone(user.phone) || user.email || '' : 'Belum masuk';
  const badge = !user ? 'BELUM MASUK' : user.phone ? 'WHATSAPP TERVERIFIKASI' : 'AKUN GOOGLE';
  const active = orders?.filter((o) => o.ticketStatus === 'active').length ?? 0;
  const spent = orders?.filter((o) => o.status === 'paid').reduce((s, o) => s + o.total, 0) ?? 0;

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast('Pilih file gambar (JPG/PNG)');
    try {
      await onSave({ photoUrl: await toAvatarDataUrl(file) }, 'Foto profil disimpan');
    } catch {
      toast('Foto tidak dapat dibaca. Coba gambar lain.');
    }
  }

  return (
    <section className="-mx-4 -mt-8 rounded-b-[24px] bg-brand px-5 pb-5 pt-7 text-white sm:mx-0 sm:mt-0 sm:rounded-[24px]">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {user?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL / foto Google, bukan aset statis
            <img src={user.photoUrl} alt="" className="h-[70px] w-[70px] rounded-full border-2 border-white/70 object-cover" />
          ) : (
            <span className="grid h-[70px] w-[70px] place-items-center rounded-full border-2 border-white/70 bg-white/15 text-2xl font-extrabold">
              {user?.name?.trim()?.[0]?.toUpperCase() ?? <Icon name="person" className="h-8 w-8" />}
            </span>
          )}
          {user && (
            <>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                aria-label="Ganti foto profil"
                className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-brand bg-gold text-ink disabled:opacity-60"
              >
                <Icon name="camera" className="h-3.5 w-3.5" strokeWidth={2.4} />
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} className="hidden" />
            </>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-bold">{name}</p>
          <p className="truncate text-sm text-white/75">{contact}</p>
          <span className="mt-1.5 inline-block rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold">{badge}</span>
          {user?.photoUrl && (
            <button onClick={() => onSave({ photoUrl: null }, 'Foto profil dihapus')} disabled={busy} className="ml-3 text-xs text-gold underline">
              Hapus foto
            </button>
          )}
        </div>
      </div>
      {user && (
        <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 rounded-xl bg-white py-3 text-center text-ink">
          <Stat value={orders ? String(orders.length) : '…'} label="Pesanan" />
          <Stat value={orders ? String(active) : '…'} label="Tiket aktif" />
          <Stat value={orders ? formatRupiah(spent) : '…'} label="Total transaksi" />
        </div>
      )}
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-1">
      <p className="truncate text-base font-extrabold text-brand">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function Card({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const input = 'w-full rounded-lg border border-line px-3 py-2.5 outline-none focus:border-brand';

function ProfileForm({ user, busy, onSave }: { user: User; busy: boolean; onSave: SaveFn }) {
  const { toast } = useUi();
  const [name, setName] = useState(user.name ?? '');
  useEffect(() => setName(user.name ?? ''), [user.name]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, ' ');
    if (clean.length < 3) return toast('Isi nama minimal 3 huruf');
    onSave({ name: clean }, 'Profil disimpan');
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-xs text-muted">
        Nama lengkap
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Nama lengkap sesuai KTP" className={`${input} mt-1.5 text-sm text-ink`} />
      </label>
      <label className="block text-xs text-muted">
        {user.phone ? 'Nomor WhatsApp' : 'Email'}
        <span className="relative mt-1.5 block">
          <input value={user.phone ? localPhone(user.phone) : user.email ?? ''} readOnly className={`${input} bg-slate-50 pr-10 text-sm text-ink`} />
          <Icon name="verified" className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand" />
        </span>
      </label>
      <button disabled={busy} className="w-full rounded-lg bg-brand py-3 font-bold text-white hover:bg-brand-dark disabled:opacity-60">
        {busy ? 'Menyimpan…' : 'Simpan perubahan'}
      </button>
    </form>
  );
}

function SavedPassengers({ user, busy, onSave }: { user: User; busy: boolean; onSave: SaveFn }) {
  const { toast } = useUi();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const list = user.savedPassengers ?? [];
  const toBody = (l: SavedPassenger[]) => l.map((p) => ({ name: p.name, phone: p.phone || null }));

  async function add(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, ' ');
    if (clean.length < 3) return toast('Nama penumpang minimal 3 huruf');
    if (list.some((p) => p.name.toLowerCase() === clean.toLowerCase())) return toast(`${clean} sudah ada di daftar`);
    const ok = await onSave({ savedPassengers: [...toBody(list), { name: clean, phone: phone.trim() || null }] }, 'Penumpang disimpan');
    if (ok) {
      setName('');
      setPhone('');
      setAdding(false);
    }
  }

  return (
    <Card
      title="Penumpang tersimpan"
      subtitle="Pilih cepat nama penumpang saat checkout"
      action={!adding && (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-sm font-semibold text-brand">
          <Icon name="plus" className="h-4 w-4" /> Tambah
        </button>
      )}
    >
      {list.length === 0 && !adding && <p className="text-sm text-muted">Belum ada penumpang tersimpan.</p>}
      <ul className="divide-y divide-line">
        {list.map((p) => (
          <li key={p.name} className="flex items-center gap-3 py-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-soft font-bold text-brand">{p.name[0]?.toUpperCase()}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{p.name}</span>
              {p.phone && <span className="block text-xs text-muted">{localPhone(p.phone)}</span>}
            </span>
            <button
              onClick={() => onSave({ savedPassengers: toBody(list.filter((x) => x.name !== p.name)) }, `${p.name} dihapus`)}
              disabled={busy}
              aria-label={`Hapus ${p.name}`}
              className="rounded-full p-2 text-faint hover:bg-red-50 hover:text-red-600"
            >
              <Icon name="trash" className="h-[18px] w-[18px]" />
            </button>
          </li>
        ))}
      </ul>
      {adding && (
        <form onSubmit={add} className="mt-2 space-y-2 rounded-xl bg-[#f8fbfb] p-3">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Nama sesuai identitas" className={`${input} bg-white text-sm`} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Nomor HP (opsional)" className={`${input} bg-white text-sm`} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-muted">Batal</button>
            <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-60">Simpan Penumpang</button>
          </div>
        </form>
      )}
    </Card>
  );
}

function Menu({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-sm">{children}</div>;
}

function MenuItem(props: { icon: IconName; title: string; subtitle?: string; badge?: string; href?: string; onClick?: () => void }) {
  const body = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-soft text-brand"><Icon name={props.icon} className="h-[18px] w-[18px]" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{props.title}</span>
        {props.subtitle && <span className="block text-xs text-muted">{props.subtitle}</span>}
      </span>
      {props.badge && <span className="rounded-full bg-gold/30 px-2 py-0.5 text-[10px] font-bold text-ink">{props.badge}</span>}
      <Icon name="chevron" className="h-5 w-5 text-faint" />
    </>
  );
  const cls = 'flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50';
  return props.href ? <Link href={props.href} className={cls}>{body}</Link> : <button onClick={props.onClick} className={cls}>{body}</button>;
}
