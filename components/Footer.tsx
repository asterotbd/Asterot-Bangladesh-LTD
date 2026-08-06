import Link from 'next/link'

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

function InstagramIcon({ className = 'h-4 w-4' }: SocialIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07ZM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38A5.88 5.88 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13a5.88 5.88 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.13-1.38 5.88 5.88 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.13A5.88 5.88 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84A6.16 6.16 0 1 0 18.16 12 6.16 6.16 0 0 0 12 5.84Zm0 10.15A3.99 3.99 0 1 1 16 12a3.99 3.99 0 0 1-4 3.99Zm6.41-10.4a1.44 1.44 0 1 1-1.44-1.44 1.44 1.44 0 0 1 1.44 1.44Z" />
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
  { label: 'Instagram', href: 'https://instagram.com', Icon: InstagramIcon },
  { label: 'YouTube', href: 'https://www.youtube.com/@asterot-gw8dt', Icon: YoutubeIcon }
]

export default function Footer() {
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
