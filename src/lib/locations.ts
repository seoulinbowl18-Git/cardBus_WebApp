'use client';

import { useEffect, useState } from 'react';
import { locationApi } from './api/endpoints';
import CURATED from '@/data/pickup-points.json';
import FALLBACK from './locations-fallback.json';
import type { LocationPoint, Locations } from './types';

/**
 * Daftar kota & titik naik/turun. Sumber utama GET /api/locations (dari rute jadwal aktif di
 * backend Railway). Bila backend belum punya endpoint itu atau sedang tidak terjangkau, dipakai
 * salinan data armada yang sama (locations-fallback.json) agar pemilih tetap bisa dipakai.
 * Keduanya lalu dilengkapi titik kurasi dari src/data/pickup-points.json (lihat withCurated).
 */
/** Pembanding teks: tanpa beda huruf besar/kecil & aksen. */
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

let cached: Promise<Locations> | null = null;

function load(): Promise<Locations> {
  cached ??= locationApi
    .list()
    .catch(() => {
      cached = null; // coba lagi lain kali
      return FALLBACK as Locations;
    })
    .then(withCurated);
  return cached;
}

interface CuratedData {
  cities: { name: string; aliases?: string[]; points: { name: string; area: string; board: boolean; drop: boolean }[] }[];
}

/**
 * Gabungkan titik kurasi ke data lokasi tanpa duplikat. Titik yang sudah ada (nama sama di kota yang
 * sama, tidak peka huruf besar/kecil) tetap memakai data jadwal dari backend (board/drop/routes); hanya
 * label wilayahnya yang memakai versi kurasi (mis. "Yogyakarta", bukan "Yogyakarta (Jogja)"). Titik baru ditambahkan di akhir daftar kotanya dengan routes 0 dan scheduled=false.
 * Kota baru ditambahkan bila belum ada; alias kota digabung untuk pencarian.
 */
export function withCurated(base: Locations, curated: CuratedData = CURATED as CuratedData): Locations {
  const cities = base.cities.map((c) => ({ ...c }));
  const points = [...base.points];
  const index = new Map(points.map((p, i) => [`${norm(p.city)}|${norm(p.name)}`, i]));
  for (const c of curated.cities) {
    let city = cities.find((x) => norm(x.name) === norm(c.name));
    if (!city) {
      city = { name: c.name, routes: 0 };
      cities.push(city);
    }
    if (c.aliases?.length) city.aliases = [...new Set([...(city.aliases ?? []), ...c.aliases])];
    for (const p of c.points) {
      const key = `${norm(city.name)}|${norm(p.name)}`;
      const at = index.get(key);
      if (at !== undefined) {
        if (p.area) points[at] = { ...points[at], area: p.area };
        continue;
      }
      index.set(key, points.length);
      points.push({ name: p.name, city: city.name, area: p.area || city.name, board: p.board, drop: p.drop, routes: 0, scheduled: false });
    }
  }
  return { cities, points };
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

/**
 * Kelompokkan titik per kota untuk daftar pilihan, disaring kata kunci (nama kota, titik, atau area).
 * `kind` = titik naik (board) atau titik turun (drop). Kota yang sedang dipilih ditaruh paling atas.
 */
export function groupPlaces(data: Locations, kind: 'board' | 'drop', q: string, current?: string): CityGroup[] {
  const key = norm(q);
  const groups: CityGroup[] = [];
  for (const { name: city, aliases = [] } of data.cities) {
    const pts = data.points.filter((p) => p.city === city && p[kind]);
    if (!pts.length) continue;
    // Cocok dengan nama kota atau aliasnya (mis. "kota malang", "kota yogyakarta")
    const cityMatch = !key || [city, ...aliases].some((n) => norm(n).includes(key));
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
