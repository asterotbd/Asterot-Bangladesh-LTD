import Container from '../../components/Container'
import RevealSection from '../../components/RevealSection'
import Link from 'next/link'
import { upcomingEvents, pastEvents, documentationItems } from '../../lib/events'

const eventCategories = [
  {
    title: 'Sports Events',
    description: 'Organizing sports events and tournaments to build competitive and community-driven experiences.',
  },
  {
    title: 'Corporate Events',
    description: 'Planning conferences, gatherings and corporate programs with premium execution.',
  },
  {
    title: 'Concerts & Live Performances',
    description: 'Producing entertainment programs and live performances for memorable audience engagement.',
  },
  {
    title: 'Branding & Marketing Activations',
    description: 'Delivering branding, marketing and sponsorship activations in support of event promotion.',
  }
]

export default function EventsPage() {
  return (
    <main className="bg-black text-white">

      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.16),_transparent_26%),linear-gradient(180deg,#050507_0%,#09090f_100%)] py-24">
        <div className="ambient-layer">
          <div className="ambient-glow" />
          <div className="ambient-dots" />
        </div>
        <Container>
          <div className="hero-grid">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-primary">Events</span>
              <h1 className="fluid-heading font-black leading-tight tracking-tight">Asterot event experiences</h1>
              <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">Asterot creates events across sports, corporate, entertainment and marketing categories, supported by strategic partnerships and premium execution.</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/20">
              <p className="text-sm uppercase tracking-[0.35em] text-primary">Featured event</p>
              <h2 className="mt-4 text-2xl font-semibold">{upcomingEvents[0].title}</h2>
              <p className="mt-4 text-gray-300 leading-7">{upcomingEvents[0].description}</p>
              <a href="/registration" className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-accent">
                Register your interest
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Explore events */}
      <Container>
        <RevealSection className="py-16">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-primary">Explore Events</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">Browse our event portfolio</h2>
            <p className="mt-4 text-gray-300">Discover upcoming programs, past highlights, and photo & video documentation.</p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/events/upcoming" className="group card-surface rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-2xl">📅</span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Upcoming Events</h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">See what Asterot has coming next — tournaments, conferences and more.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform duration-200 group-hover:translate-x-1">
                View Upcoming <span aria-hidden="true">→</span>
              </span>
            </Link>

            <Link href="/events/past" className="group card-surface rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-2xl">🕘</span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Past Events</h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">Highlights from events we have already delivered.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform duration-200 group-hover:translate-x-1">
                View Past <span aria-hidden="true">→</span>
              </span>
            </Link>

            <Link href="/events/documentation" className="group card-surface rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-2xl">🎬</span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Event Documentation</h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">Photos and videos from our events and programs.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform duration-200 group-hover:translate-x-1">
                View Gallery <span aria-hidden="true">→</span>
              </span>
            </Link>
          </div>
        </RevealSection>

        {/* Event categories */}
        <RevealSection className="pb-16">
          <div className="section-grid gap-6">
            {eventCategories.map(card => (
              <article key={card.title} className="rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:border-primary hover:bg-white/10">
                <h2 className="text-2xl font-semibold">{card.title}</h2>
                <p className="mt-3 text-gray-300 leading-7">{card.description}</p>
              </article>
            ))}
          </div>
        </RevealSection>

        {/* Quick stats */}
        <RevealSection className="pb-16">
          <div className="section-grid gap-6">
            <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
              <p className="text-4xl font-black text-primary">{upcomingEvents.length}</p>
              <h3 className="mt-2 font-semibold">Upcoming & Featured</h3>
              <p className="mt-2 text-sm text-gray-400">Events on the horizon</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
              <p className="text-4xl font-black text-primary">{pastEvents.length}</p>
              <h3 className="mt-2 font-semibold">Past Events</h3>
              <p className="mt-2 text-sm text-gray-400">Delivered highlights</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
              <p className="text-4xl font-black text-primary">{documentationItems.length}</p>
              <h3 className="mt-2 font-semibold">Documentation</h3>
              <p className="mt-2 text-sm text-gray-400">Photo & video entries</p>
            </div>
          </div>
        </RevealSection>
      </Container>
    </main>
  )
}
