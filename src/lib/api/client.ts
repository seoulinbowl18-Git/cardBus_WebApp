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
  /** File mentah (mis. gambar); dikirim apa adanya dengan Content-Type dari file. */
  file?: Blob;
  signal?: AbortSignal;
}

/** Sesi satu klien: token Bearer + callback saat backend membalas 401 (token kedaluwarsa). */
interface Session {
  token: string | null;
  onUnauthorized: (() => void) | null;
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${config.apiBaseUrl}${path}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function request<T>(session: Session, method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const authToken = session.token;
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
        ...(opts.file && { 'Content-Type': opts.file.type }),
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: opts.file ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
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
    if (res.status === 401 && authToken) session.onUnauthorized?.();
    const msg =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : res.statusText || 'Terjadi kesalahan';
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

/**
 * Klien API dengan sesinya sendiri. Penumpang memakai `api` di bawah; Admin Pusat punya klien terpisah
 * (lib/api/admin.ts) agar token admin tidak pernah terkirim dari halaman penumpang dan sebaliknya.
 */
export function createApiClient() {
  const session: Session = { token: null, onUnauthorized: null };
  return {
    setToken: (token: string | null) => {
      session.token = token;
    },
    setUnauthorizedHandler: (fn: (() => void) | null) => {
      session.onUnauthorized = fn;
    },
    get: <T>(path: string, query?: Query, signal?: AbortSignal) => request<T>(session, 'GET', path, { query, signal }),
    post: <T>(path: string, body?: unknown) => request<T>(session, 'POST', path, { body: body ?? {} }),
    put: <T>(path: string, body?: unknown) => request<T>(session, 'PUT', path, { body: body ?? {} }),
    del: <T>(path: string) => request<T>(session, 'DELETE', path),
    upload: <T>(path: string, file: Blob) => request<T>(session, 'POST', path, { file }),
  };
}

const passenger = createApiClient();

export const api = { get: passenger.get, post: passenger.post, put: passenger.put };
/** Dipanggil AuthProvider saat login / logout. */
export const setAuthToken = passenger.setToken;
/** Callback saat backend membalas 401 (token kedaluwarsa) agar sesi dibersihkan. */
export const setUnauthorizedHandler = passenger.setUnauthorizedHandler;
