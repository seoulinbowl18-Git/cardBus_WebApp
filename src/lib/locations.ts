'use client';

import { useEffect, useState } from 'react';
import { locationApi } from './api/endpoints';
import FALLBACK from './locations-fallback.json';
import type { LocationPoint, Locations } from './types';

/**
 * Daftar kota & titik naik/turun. Sumber utama GET /api/locations (dari rute jadwal aktif di
 * backend Railway). Bila backend belum punya endpoint itu atau sedang tidak terjangkau, dipakai
 * salinan data armada yang sama (locations-fallback.json) agar pemilih tetap bisa dipakai.
 */
let cached: Promise<Locations> | null = null;

function load(): Promise<Locations> {
  cached ??= locationApi.list().catch(() => {
    cached = null; // coba lagi lain kali
    return FALLBACK as Locations;
  });
  return cached;
}

export function useLocations() {
  const [data, setData] = useState<Locations | null>(null);
  useEffect(() => {
    let alive = true;
    load().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, []);
  return data;
}

/** Pilihan di kotak "Dari" / "Ke": kota saja (semua titik) atau titik tertentu di kota itu. */
export interface Place {
  city: string;
  point: string | null;
}

export interface CityGroup {
  city: string;
  /** Kota cocok dengan kata kunci (baris "Semua titik di …" ditampilkan). */
  cityMatch: boolean;
  points: LocationPoint[];
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/**
 * Kelompokkan titik per kota untuk daftar pilihan, disaring kata kunci (nama kota, titik, atau area).
 * `kind` = titik naik (board) atau titik turun (drop). Kota yang sedang dipilih ditaruh paling atas.
 */
export function groupPlaces(data: Locations, kind: 'board' | 'drop', q: string, current?: string): CityGroup[] {
  const key = norm(q);
  const groups: CityGroup[] = [];
  for (const { name: city } of data.cities) {
    const pts = data.points.filter((p) => p.city === city && p[kind]);
    if (!pts.length) continue;
    const cityMatch = !key || norm(city).includes(key);
    const matched = cityMatch ? pts : pts.filter((p) => norm(p.name).includes(key) || norm(p.area).includes(key));
    if (cityMatch || matched.length) groups.push({ city, cityMatch, points: matched });
  }
  if (current) {
    const i = groups.findIndex((g) => g.city === current);
    if (i > 0) groups.unshift(...groups.splice(i, 1));
  }
  return groups;
}

/** Titik masih bisa dipakai untuk arah lain? (dipakai saat menukar asal & tujuan) */
export function pointAllowed(data: Locations | null, place: Place, kind: 'board' | 'drop'): string | null {
  if (!place.point || !data) return place.point;
  return data.points.some((p) => p.city === place.city && p.name === place.point && p[kind]) ? place.point : null;
}
