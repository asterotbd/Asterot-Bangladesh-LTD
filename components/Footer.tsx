"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const COMPANY = {
  name: 'Asterot Bangladesh Limited',
  phone: '+880 1325 274642',
  phoneHref: 'tel:+8801325274642',
  email: 'asterotbd@gmail.com',
  emailHref: 'mailto:asterotbd@gmail.com',
  location: '5B/5 Razia Sultana Road, Mohammadpur, Dhaka'
}

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' }
]

type SocialIconProps = { className?: string }

function FacebookIcon({ className = 'h-4 w-4' }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  )
}

function YoutubeIcon({ className = 'h-4 w-4' }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />
    </svg>
  )
}

const socials = [
  { label: 'Facebook', href: 'https://www.facebook.com/603661469488647/', Icon: FacebookIcon },
  { label: 'YouTube', href: 'https://www.youtube.com/@AsterotBangladesh', Icon: YoutubeIcon }
]

export default function Footer() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null
  return (
    <footer className="border-t border-white/10 bg-[#0b0b0c] text-left">
      {/* Big brand wordmark + horizontal contact */}
      <div className="container py-14 sm:py-16">
        <div className="flex flex-col items-center">
          <p className="text-center text-[clamp(2.75rem,9vw,7rem)] font-bold uppercase leading-none tracking-tight text-white">
            Asterot
          </p>
          <p className="mt-3 text-center text-[clamp(0.8rem,2vw,1.35rem)] font-semibold uppercase tracking-[0.35em] text-gray-400 sm:mt-4">
            Bangladesh Limited
          </p>

          <div className="mt-10 flex w-full flex-col items-center justify-center gap-6 border-t border-white/10 pt-10 sm:flex-row sm:gap-0 sm:pt-12">
            <div className="flex flex-col items-center gap-1.5 text-center sm:px-10">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Email</span>
              <a href={COMPANY.emailHref} className="text-sm text-gray-300 transition-colors hover:text-white focus-visible:text-white sm:text-base">
                {COMPANY.email}
              </a>
            </div>
            <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden="true" />
            <div className="flex flex-col items-center gap-1.5 text-center sm:px-10">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Phone</span>
              <a href={COMPANY.phoneHref} className="text-sm text-gray-300 transition-colors hover:text-white focus-visible:text-white sm:text-base">
                {COMPANY.phone}
              </a>
            </div>
            <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden="true" />
            <div className="flex flex-col items-center gap-1.5 text-center sm:px-10">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">Location</span>
              <p className="text-sm text-gray-300 sm:text-base">{COMPANY.location}</p>
            </div>
          </div>

          <Link
            href="/contact"
            className="btn btn-primary mt-10"
          >
            Contact Us
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-4 py-4 text-xs text-gray-500 sm:flex-row sm:gap-6">
          <p>&copy; {new Date().getFullYear()} {COMPANY.name}. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-end">
            {legalLinks.map(link => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-white focus-visible:text-white">
                {link.label}
              </Link>
            ))}
            <span className="hidden h-3.5 w-px bg-white/10 sm:block" aria-hidden="true" />
            <div className="flex items-center gap-4">
              {socials.map(social => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="text-gray-500 transition-colors hover:text-white focus-visible:text-white"
                >
                  <social.Icon />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
