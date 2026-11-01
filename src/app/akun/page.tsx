'use client';

import { useState, type FormEvent } from 'react';
import { RequireAuth } from '@/components/require-auth';
import { ApiError } from '@/lib/api/client';
import { userApi } from '@/lib/api/endpoints';
import { useAuth } from '@/providers/auth-provider';

function ProfileForm() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await userApi.updateProfile({ name });
      setUser(res.user);
      setMsg('Profil tersimpan');
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="max-w-md space-y-3 rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{user?.phone ?? user?.email}</p>
      <label className="flex flex-col gap-1 text-sm">
        Nama
        <input value={name} onChange={(e) => setName(e.target.value)} minLength={3} maxLength={60} required className="rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <button disabled={busy} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-60">Simpan</button>
      {msg && <p className="text-sm">{msg}</p>}
    </form>
  );
}

export default function AccountPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Akun</h1>
      <RequireAuth>
        <ProfileForm />
      </RequireAuth>
    </section>
  );
}
