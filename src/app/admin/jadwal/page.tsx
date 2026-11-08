import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TripList } from './trip-list';

export const metadata: Metadata = { title: 'Jadwal' };

export default function AdminTripsPage() {
  return (
    <Suspense>
      <TripList />
    </Suspense>
  );
}
