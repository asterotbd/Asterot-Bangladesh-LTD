export const dynamic = 'force-dynamic'
import Container from '../../components/Container'
import RevealSection from '../../components/RevealSection'
import Link from 'next/link'
import type { Metadata } from 'next'
import { upcomingEvents as staticUpcoming, pastEvents as staticPast, documentationItems } from '../../lib/events'
import { getPublishedEvents, getEventCategories, isUpcoming, formatEventDate } from '../../lib/events-server'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Explore Asterot Bangladesh Limited\'s events — sports tournaments, corporate programs, entertainment shows and brand activations across Bangladesh.',
  alternates: {
    canonical: 'https://www.asterot.com/events'
  }
}

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

type DisplayEvent = {
  title: string
  description: string
  slug: string
  date?: string
}

export default async function EventsPage() {
  const [dbEvents, categories] = await Promise.all([getPublishedEvents(), getEventCategories()])
  const categoryNames = new Map(categories.map(c => [c.id, c.name_en]))

  const featured: DisplayEvent = dbEvents.length > 0
    ? {
        title: dbEvents[0].title_en,
        description: dbEvents[0].description_en || 'Details coming soon.',
        slug: dbEvents[0].slug,
        date: formatEventDate(dbEvents[0].date) || undefined
      }
    : {
        title: staticUpcoming[0].title,
        description: staticUpcoming[0].description,
        slug: staticUpcoming[0].slug,
        date: staticUpcoming[0].date
      }

  const upcomingCount = dbEvents.length > 0
    ? dbEvents.filter(isUpcoming).length
    : staticUpcoming.length
  const pastCount = dbEvents.length > 0
    ? dbEvents.filter(e => !isUpcoming(e)).length
    : staticPast.length

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
              <h2 className="mt-4 text-2xl font-semibold">{featured.title}</h2>
              <p className="mt-4 text-gray-300 leading-7">{featured.description}</p>
              {featured.date && <p className="mt-4 text-sm text-gray-400">{featured.date}</p>}
              <Link href={`/events/register/${featured.slug}`} className="btn btn-primary">
                Register your interest
              </Link>
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
            <Link href="/events/upcoming" className="group card-surface flex flex-col rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-2xl">📅</span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Upcoming Events</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-gray-400">See what Asterot has coming next — tournaments, conferences and more.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform duration-200 group-hover:translate-x-1">
                View Upcoming <span aria-hidden="true">→</span>
              </span>
            </Link>

            <Link href="/events/past" className="group card-surface flex flex-col rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-2xl">🕘</span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Past Events</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-gray-400">Highlights from events we have already delivered.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform duration-200 group-hover:translate-x-1">
                View Past <span aria-hidden="true">→</span>
              </span>
            </Link>

            <Link href="/events/documentation" className="group card-surface flex flex-col rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-2xl">🎬</span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">Event Documentation</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-gray-400">Photos and videos from our events and programs.</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform duration-200 group-hover:translate-x-1">
                View Gallery <span aria-hidden="true">→</span>
              </span>
            </Link>
          </div>
        </RevealSection>

        {/* Event categories */}
        <RevealSection className="pb-16 sm:pb-20">
          <div className="section-grid">
            {eventCategories.map(card => (
              <article key={card.title} className="card rounded-[2rem] border border-white/10 bg-white/5 p-8 transition hover:border-primary hover:bg-white/10">
                <h2 className="text-2xl font-semibold">{card.title}</h2>
                <p className="mt-3 text-gray-300 leading-7">{card.description}</p>
              </article>
            ))}
          </div>
        </RevealSection>

        {/* Quick stats */}
        <RevealSection className="pb-16 sm:pb-20">
          <div className="section-grid">
            <div className="rounded-[2rem] border border-white/10 bg-black/40 p-8">
              <p className="text-4xl font-black text-primary">{upcomingCount}</p>
              <h3 className="mt-2 font-semibold">Upcoming & Featured</h3>
              <p className="mt-2 text-sm text-gray-400">Events on the horizon</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-black/40 p-8">
              <p className="text-4xl font-black text-primary">{pastCount}</p>
              <h3 className="mt-2 font-semibold">Past Events</h3>
              <p className="mt-2 text-sm text-gray-400">Delivered highlights</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-black/40 p-8">
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
