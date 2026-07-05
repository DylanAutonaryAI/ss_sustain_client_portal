/** @type {import('next').NextConfig} */

// Security headers applied to every response. Deliberately conservative so
// nothing breaks: `frame-ancestors 'none'` / X-Frame-Options only control who
// may EMBED us (we embed Loom, not the reverse), and the Permissions-Policy
// only disables features the app never uses (camera/mic/geolocation) — it does
// NOT touch fullscreen/autoplay, which the Loom video embeds rely on.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
];

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xvlyuooologqsrbeeigm.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
