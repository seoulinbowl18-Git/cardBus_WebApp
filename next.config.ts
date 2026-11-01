import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Output mandiri: cocok untuk deploy Docker / Railway (node .next/standalone/server.js)
  output: 'standalone',
  images: {
    // Foto profil Google (photoUrl dari backend)
    remotePatterns: [{ protocol: 'https', hostname: 'lh3.googleusercontent.com' }],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
