import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminLoginForm } from './admin-login-form';

export const metadata: Metadata = { title: 'Masuk' };

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
