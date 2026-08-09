import Container from '../../components/Container'
import RevealSection from '../../components/RevealSection'
import ContactForm from '../../components/ContactForm'
import ViewLocationButton from '../../components/ViewLocationButton'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contact Asterot Bangladesh Limited — email, phone and location in Dhaka for event inquiries and partnerships.',
  alternates: {
    canonical: 'https://www.asterot.com/contact'
  }
}

function IconBase({ className = 'h-5 w-5', children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  )
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </IconBase>
  )
}

function MailIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </IconBase>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </IconBase>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </IconBase>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </IconBase>
  )
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </IconBase>
  )
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
    </IconBase>
  )
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </IconBase>
  )
}

const helpCards = [
  {
    title: 'Events',
    description: 'Sports tournaments, concerts, corporate events, and other event management needs.',
    Icon: CalendarIcon
  },
  {
    title: 'Partnerships',
    description: 'Explore opportunities to work with Asterot as a partner, sponsor, vendor, or collaborator.',
    Icon: LinkIcon
  },
  {
    title: 'Business Inquiries',
    description: 'Discuss business opportunities, services, and future collaborations.',
    Icon: BriefcaseIcon
  },
  {
    title: 'General Inquiries',
    description: 'Have a question about Asterot? We\u2019re happy to hear from you.',
    Icon: HelpIcon
  }
]

const infoItemClass = 'group flex items-start gap-4 rounded-2xl border border-white/10 bg-black/30 p-4 transition-all duration-200 hover:translate-x-1 hover:border-primary/40 hover:bg-white/5'
const infoIconClass = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-black'
const infoLabelClass = 'block text-xs uppercase tracking-[0.2em] text-gray-400'
const infoValueClass = 'mt-1 block font-semibold text-white transition-colors duration-200 group-hover:text-white'

export default function ContactPage() {
  return (
    <main className="bg-black text-white">

      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.16),_transparent_26%),linear-gradient(180deg,#050507_0%,#09090f_100%)] py-24">
        <div className="ambient-layer">
          <div className="ambient-glow" />
          <div className="ambient-dots" />
        </div>
        <Container>
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-primary">
              Contact Us
            </span>
            <h1 className="fluid-title font-black leading-tight tracking-tight">Let&apos;s Start a Conversation</h1>
            <p className="max-w-[min(65ch,100%)] text-base leading-7 text-gray-300 sm:text-lg sm:leading-8">
              Have an event to plan, an idea to discuss, or a partnership opportunity? Whether you&apos;re looking for
              event management, sponsorship, collaboration, or simply want to know more about Asterot, our team is ready
              to hear from you.
            </p>
          </div>
        </Container>
      </section>

      {/* Main contact: info + form */}
      <section className="relative py-16 sm:py-20">
        <div className="ambient-layer">
          <div className="absolute -right-20 top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl ambient-float" />
        </div>
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Contact information */}
            <div className="lg:col-span-5">
              <RevealSection>
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 sm:p-8">
                  <p className="text-sm uppercase tracking-[0.35em] text-primary">Contact Information</p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight">Reach us directly</h2>
                  <p className="mt-3 text-gray-400">Prefer a direct line? Reach out to us any way you like.</p>

                  <ul className="mt-8 space-y-4">
                    <li>
                      <a href="tel:+8801325274642" className={infoItemClass}>
                        <span className={infoIconClass}>
                          <PhoneIcon />
                        </span>
                        <span className="min-w-0">
                          <span className={infoLabelClass}>Phone</span>
                          <span className={infoValueClass}>+880 1325-274642</span>
                        </span>
                      </a>
                    </li>
                    <li>
                      <a href="mailto:asterotbd@gmail.com" className={infoItemClass}>
                        <span className={infoIconClass}>
                          <MailIcon />
                        </span>
                        <span className="min-w-0">
                          <span className={infoLabelClass}>Email</span>
                          <span className={`${infoValueClass} break-all`}>asterotbd@gmail.com</span>
                        </span>
                      </a>
                    </li>
                    <li>
                      <div className={infoItemClass}>
                        <span className={infoIconClass}>
                          <MapPinIcon />
                        </span>
                        <span className="min-w-0">
                          <span className={infoLabelClass}>Office</span>
                          <span className={infoValueClass}>
                            5B/5 Razia Sultana Road
                            <br />
                            Mohammadpur, Dhaka, Bangladesh
                          </span>
                        </span>
                      </div>
                    </li>
                    <li>
                      <div className={infoItemClass}>
                        <span className={infoIconClass}>
                          <ClockIcon />
                        </span>
                        <span className="min-w-0">
                          <span className={infoLabelClass}>Office Hours</span>
                          <span className={infoValueClass}>
                            Sunday {'\u2013'} Thursday
                            <br />
                            10:00 AM {'\u2013'} 10:00 PM
                          </span>
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </RevealSection>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-7">
              <RevealSection>
                <ContactForm />
              </RevealSection>
            </div>
          </div>
        </Container>
      </section>

      {/* What can we help you with? */}
      <section className="py-16 sm:py-20">
        <Container>
          <RevealSection>
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-primary">How can we help?</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">What Can We Help You With?</h2>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {helpCards.map(card => (
                <div
                  key={card.title}
                  className="card-surface flex flex-col rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <card.Icon />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">{card.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-gray-400">{card.description}</p>
                </div>
              ))}
            </div>
          </RevealSection>
        </Container>
      </section>

      {/* Location */}
      <section className="pb-16 sm:pb-20">
        <Container>
          <RevealSection>
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/20">
              <div className="grid lg:grid-cols-2">
                <div className="p-8 sm:p-10">
                  <p className="text-sm uppercase tracking-[0.35em] text-primary">Visit Us</p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight">Asterot Bangladesh Limited</h2>
                  <p className="mt-4 text-gray-300">
                    5B/5 Razia Sultana Road
                    <br />
                    Mohammadpur, Dhaka, Bangladesh
                  </p>
                  <div className="mt-8">
                    <ViewLocationButton />
                  </div>
                </div>
                <div className="relative flex min-h-[16rem] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.12)_1px,_transparent_1px)] bg-[size:22px_22px] p-8">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,22,90,0.1),_transparent_55%)]" />
                  <div className="relative flex flex-col items-center text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/40 text-primary shadow-lg shadow-black/30">
                      <MapPinIcon className="h-6 w-6" />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-white">Asterot Bangladesh Limited</p>
                    <p className="mt-1 text-sm text-gray-400">5B/5 Razia Sultana Road, Mohammadpur, Dhaka</p>
                  </div>
                </div>
              </div>
            </div>
          </RevealSection>
        </Container>
      </section>
    </main>
  )
}
