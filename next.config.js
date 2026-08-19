/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

// Browser-side Supabase calls (GoTrue auth tokens) target the project host,
// which always lives under *.supabase.co. Dev also needs ws for HMR.
const cspConnectSrc = [
  "'self'",
  'https://*.supabase.co',
  'wss://*.supabase.co',
  ...(isProd ? [] : ['ws://localhost:*', 'http://localhost:*'])
].join(' ')

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is required by the Next.js App Router, which injects the
  // RSC flight payload as inline scripts (self.__next_f.push(...)); nonce
  // support is not available in this Next version.
  "script-src 'self' 'unsafe-inline'",
  // 'unsafe-inline' is required for framer-motion / inline style props.
  // https://fonts.googleapis.com serves the Google Fonts stylesheet.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // YouTube thumbnails are rendered via next/image (same-origin); the extra
  // hosts are kept defensively for any raw thumbnail URLs.
  "img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com https://*.ytimg.com",
  "media-src 'self' blob:",
  // YouTube iframe embeds (components/VideoGallery.tsx).
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
  `connect-src ${cspConnectSrc}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // The site is never embedded in third-party pages; blocks clickjacking.
  "frame-ancestors 'none'",
  ...(isProd ? ['upgrade-insecure-requests'] : [])
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: '*.ytimg.com' }
    ]
  },
  async headers() {
    const headers = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Autoplay is intentionally not restricted so YouTube embeds can play.
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
      { key: 'X-Frame-Options', value: 'DENY' }
    ]
    if (isProd) {
      headers.push({ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' })
    }
    return [{ source: '/:path*', headers }]
  }
}

module.exports = nextConfig