/**
 * Login Google lewat Firebase Auth (project sama dengan mobile: cardbus-d6aa5).
 * Alurnya sama dengan AuthProvider.signInWithGoogle di mobile: Google → Firebase → ID token
 * Firebase → POST /api/auth/google → JWT backend. SDK dimuat dinamis hanya saat tombol diklik.
 */

// Ditulis literal agar Next.js menyisipkan nilainya saat build.
// Default = aplikasi Web "cardBus Web" di project cardbus-d6aa5. Nilai ini memang publik
// (ikut terkirim ke browser); keamanan dijaga oleh Authorized domains di Firebase dan
// verifikasi ID token di backend. Env NEXT_PUBLIC_FIREBASE_* tetap bisa menimpanya.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyD8sFYKp66AOSmmjw9yisCXRYCO6ZtQkDo',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'cardbus-d6aa5.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'cardbus-d6aa5',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:659374502720:web:a5ff2e43fc377d897640a5',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '659374502720',
};

export const isGoogleLoginEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.projectId);

/** Dilempar saat pengguna menutup jendela pilih akun (bukan error yang perlu ditampilkan). */
export class GoogleLoginCancelled extends Error {}

const MESSAGES: Record<string, string> = {
  'auth/unauthorized-domain': 'Domain ini belum diizinkan di Firebase (Authentication → Settings → Authorized domains).',
  'auth/popup-blocked': 'Pop-up diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.',
  'auth/network-request-failed': 'Gagal terhubung ke Google. Periksa koneksi internet.',
  'auth/operation-not-allowed': 'Login Google belum diaktifkan di Firebase (Authentication → Sign-in method).',
  'auth/invalid-api-key': 'Konfigurasi Firebase (API key) tidak valid.',
};

/** Buka pop-up pilih akun Google lalu kembalikan Firebase ID token. */
export async function getGoogleIdToken(): Promise<string> {
  if (!isGoogleLoginEnabled) throw new Error('Login Google belum dikonfigurasi');
  const [{ initializeApp, getApps }, { getAuth, GoogleAuthProvider, signInWithPopup, signOut }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ]);
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const cred = await signInWithPopup(auth, provider);
    return await cred.user.getIdToken();
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') throw new GoogleLoginCancelled();
    throw new Error(MESSAGES[code] ?? `Login Google gagal (${code || (e as Error).message})`);
  } finally {
    // Sesi web memakai JWT backend; sesi Firebase tidak perlu disimpan.
    await signOut(auth).catch(() => {});
  }
}
