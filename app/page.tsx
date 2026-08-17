import Link from 'next/link'
import Container from '../components/Container'
import Hero from '../components/Hero'
import CompaniesMarquee from '../components/CompaniesMarquee'
import FeaturedEvent from '../components/FeaturedEvent'
import BangladeshReach from '../components/BangladeshReach'
import FAQPreview from '../components/FAQPreview'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Asterot Bangladesh Limited',
  description: 'Igniting Tomorrow\'s Leaders — Awaken Greatness',
  alternates: {
    canonical: 'https://www.asterot.com/'
  }
}

const capabilityAccents = {
  primary: {
    line: 'bg-gradient-to-r from-primary via-primary to-accent',
    dot: 'bg-primary',
    panel: 'border-primary/40 bg-primary/10 shadow-lg shadow-primary/10',
    hover: 'hover:border-primary/60 hover:bg-primary/20 hover:shadow-primary/25'
  },
  accent: {
    line: 'bg-gradient-to-r from-primary via-primary to-accent',
    dot: 'bg-primary',
    panel: 'border-primary/40 bg-primary/10 shadow-lg shadow-primary/10',
    hover: 'hover:border-primary/60 hover:bg-primary/20 hover:shadow-primary/25'
  },
  blue: {
    line: 'bg-gradient-to-r from-primary via-primary to-accent',
    dot: 'bg-primary',
    panel: 'border-primary/40 bg-primary/10 shadow-lg shadow-primary/10',
    hover: 'hover:border-primary/60 hover:bg-primary/20 hover:shadow-primary/25'
  },
  cyan: {
    line: 'bg-gradient-to-r from-primary via-primary to-accent',
    dot: 'bg-primary',
    panel: 'border-primary/40 bg-primary/10 shadow-lg shadow-primary/10',
    hover: 'hover:border-primary/60 hover:bg-primary/20 hover:shadow-primary/25'
  }
}

const services: { title: string; description: string; accent: keyof typeof capabilityAccents }[] = [
  { title: 'Event Strategy', description: 'Professional planning and production across sports, corporate, entertainment and brand campaigns.', accent: 'primary' },
  { title: 'Sports Tournaments', description: 'Organizing sports competitions and tournaments with operational precision.', accent: 'blue' },
  { title: 'Corporate Programs', description: 'Managing conferences, meetings, seminars and executive gatherings.', accent: 'cyan' },
  { title: 'Branded Experiences', description: 'Delivering activations, sponsorship campaigns and high-impact marketing events.', accent: 'accent' }
]

const featuredEventCategories = [
  'Sports tournaments and athletic events',
  'Corporate and conference programs',
  'Entertainment shows and live experiences',
  'Branding, marketing and sponsorship activations'
]

export default function Home() {
  return (
    <main className="bg-black text-white">

      <Hero />

      <section className="py-12 sm:py-16">
        <Container>
          <div className="rounded-full border border-white/10 bg-[rgba(13,13,18,0.55)] px-6 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-[14px] backdrop-saturate-150 sm:px-8">
            <CompaniesMarquee heading="Companies We've Worked With" />
          </div>
        </Container>
      </section>

      <FeaturedEvent />

      <BangladeshReach />

      <Container>
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 pt-16 shadow-2xl shadow-black/20 card-surface sm:p-10 sm:pt-20">
          <div className="mx-auto max-w-[min(70ch,100%)] text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-primary">About Asterot</p>
            <h2 className="mt-4 text-3xl font-semibold">Asterot Bangladesh Limited organizes premium events in Bangladesh</h2>
            <p className="mt-4 text-gray-300">Asterot runs professional events, sports competitions, corporate programs, tournaments, conferences, entertainment productions, branding and marketing activities.</p>
            <p className="mt-4 text-gray-400">The company delivers structured event management with a premium focus on partner support and audience experience.</p>
          </div>
        </section>

        <section className="section-grid py-16 sm:py-20">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 sm:p-10">
            <p className="text-sm uppercase tracking-[0.35em] text-primary">Core services</p>
            <h2 className="mt-4 text-3xl font-semibold">Capabilities</h2>
            <p className="mt-4 text-gray-300">Asterot provides a full range of event management capabilities for sports, corporate, entertainment and brand-focused programs.</p>
            <div className="gallery-grid mt-8">
              {services.map(service => {
                const a = capabilityAccents[service.accent]
                return (
                  <div key={service.title} className={`group relative overflow-hidden rounded-3xl border p-5 transition-all duration-300 ${a.panel} ${a.hover}`}>
                    <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-[3px] rounded-full ${a.line} shadow-[0_0_16px_rgba(255,22,90,0.45)]`} />
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${a.dot} shadow-[0_0_10px_rgba(255,22,90,0.65)]`} />
                      <h3 className="font-bold text-white transition-colors duration-300 group-hover:text-primary">{service.title}</h3>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">{service.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-8 rounded-[2rem] border border-white/10 bg-black/40 p-8 shadow-2xl shadow-black/20 sm:p-10">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-primary">Featured events</p>
              <h2 className="mt-4 text-3xl font-semibold">Event categories</h2>
              <p className="mt-4 text-gray-300">Asterot’s event portfolio centers on sports tournaments, corporate gatherings, entertainment programs and branding activations.</p>
            </div>
            <ul className="space-y-3">
              {featuredEventCategories.map((item, index) => (
                <li key={item} className="group flex items-center gap-4 rounded-3xl border border-primary/30 bg-primary/10 p-4 transition-colors duration-300 hover:border-primary/50 hover:bg-primary/15">
                  <span aria-hidden="true" className="h-6 w-1 shrink-0 rounded-full bg-primary transition-colors duration-300" />
                  <span aria-hidden="true" className="shrink-0 text-xs font-bold tabular-nums tracking-[0.2em] text-primary">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="min-w-0 font-semibold leading-snug text-white">{item}</h3>
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-primary/10 p-5">
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-primary" />
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">End-to-End Event Delivery</p>
                <p className="mt-2 text-sm leading-6 text-gray-300">From strategy and planning to execution, Asterot delivers complete event experiences built for impact.</p>
                <Link href="/events" className="group mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-accent">
                  Explore our events
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <FAQPreview />

        <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/20 sm:mb-12 sm:p-12">
          <div className="ambient-layer">
            <div className="ambient-glow" />
          </div>
          <p className="text-sm uppercase tracking-[0.35em] text-primary">Partner with Asterot</p>
          <h2 className="mt-4 text-balance text-4xl font-semibold">{"Let's deliver your next great event"}</h2>
          <p className="mx-auto mt-6 max-w-[min(65ch,100%)] text-gray-300">From tournaments and conferences to concerts and brand activations, we handle the planning and production end to end.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href="/events" className="btn btn-primary">View Events</a>
            <a href="/contact" className="btn btn-ghost">Contact Us</a>
          </div>
        </section>
      </Container>

    </main>
  )
}
