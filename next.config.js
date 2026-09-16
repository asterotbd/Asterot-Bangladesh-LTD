/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

// Media is served from Cloudflare R2 when NEXT_PUBLIC_R2_PUBLIC_URL is set.
// Both next/image and the CSP have to allow that exact host, and deriving it
// from the same variable the app builds URLs with keeps them from drifting.
const r2PublicUrl = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/+$/, '')
let r2Host = ''
if (r2PublicUrl) {
  try {
    r2Host = new URL(r2PublicUrl).host
  } catch {
    throw new Error(`NEXT_PUBLIC_R2_PUBLIC_URL is not a valid URL: ${r2PublicUrl}`)
  }
} else if (isProd) {
  // The local copies under public/media and public/images were removed once
  // their R2 counterparts were verified, so an unset public URL no longer
  // degrades to local files - it degrades to every image 404ing with no
  // other signal. Fail the build instead of shipping that.
  throw new Error(
    'NEXT_PUBLIC_R2_PUBLIC_URL is required for a production build.\n' +
    'Site media lives in Cloudflare R2 and is no longer committed under public/.\n' +
    'Set it in the Vercel project environment variables (and any other deploy target).'
  )
}

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
  //
  // 'unsafe-eval' is dev-only: the webpack dev build wraps every module in
  // eval(), so without it the browser blocks all client JS, React never
  // hydrates, and pages render as the un-animated (opacity:0) SSR output.
  // Production bundles never eval, so the relaxation stays out of prod.
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  // 'unsafe-inline' is required for framer-motion / inline style props.
  // https://fonts.googleapis.com serves the Google Fonts stylesheet.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // YouTube thumbnails are rendered via next/image (same-origin); the extra
  // hosts are kept defensively for any raw thumbnail URLs.
  `img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com https://*.ytimg.com${r2Host ? ` https://${r2Host}` : ''}`,
  `media-src 'self' blob:${r2Host ? ` https://${r2Host}` : ''}`,
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
      { protocol: 'https', hostname: '*.ytimg.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      ...(r2Host ? [{ protocol: 'https', hostname: r2Host }] : [])
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