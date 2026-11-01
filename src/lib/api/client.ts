import { config } from '@/lib/config';

/** Sama dengan ApiException di mobile: statusCode 0 = tidak ada respons (jaringan/timeout). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Query = Record<string, string | number | undefined | null>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
}

let authToken: string | null = null;
/** Dipanggil AuthProvider saat login / logout. */
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

let onUnauthorized: (() => void) | null = null;
/** Callback saat backend membalas 401 (token kedaluwarsa) agar sesi dibersihkan. */
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${config.apiBaseUrl}${path}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, opts.query);
  // Timeout manual (AbortSignal.any belum didukung semua browser)
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, config.apiTimeoutMs);
  opts.signal?.addEventListener('abort', () => controller.abort(), { once: true });

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(opts.body !== undefined && { 'Content-Type': 'application/json' }),
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (e) {
    throw new ApiError(0, `Tidak dapat terhubung ke server (${timedOut ? 'waktu habis' : (e as Error).message})`);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Mis. halaman HTML 502 dari Railway
      throw new ApiError(res.status, `HTTP ${res.status}: respons bukan JSON`);
    }
  }

  if (!res.ok) {
    if (res.status === 401 && authToken) onUnauthorized?.();
    const msg =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : res.statusText || 'Terjadi kesalahan';
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>('GET', path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body: body ?? {} }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body: body ?? {} }),
};
