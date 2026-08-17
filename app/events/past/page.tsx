export const dynamic = 'force-dynamic'
import Container from '../../../components/Container'
import RevealSection from '../../../components/RevealSection'
import Link from 'next/link'
import type { Metadata } from 'next'
import { pastEvents as staticPast } from '../../../lib/events'
import { getPublishedEvents, getEventCategories, isUpcoming, formatEventDate } from '../../../lib/events-server'

export const metadata: Metadata = {
  title: 'Past Events',
  description: 'Past events delivered by Asterot Bangladesh Limited — brand launches, sports days and community programs.',
  alternates: {
    canonical: 'https://www.asterot.com/events/past'
  }
}

type DisplayEvent = {
  category: string
  title: string
  description: string
  date?: string
}

export default async function PastEventsPage() {
  const [dbEvents, categories] = await Promise.all([getPublishedEvents(), getEventCategories()])
  const categoryNames = new Map(categories.map(c => [c.id, c.name_en]))

  const past = dbEvents.length > 0
    ? dbEvents
        .filter(e => !isUpcoming(e))
        .map(e => ({
          category: (e.category_id && categoryNames.get(e.category_id)) || 'Event',
          title: e.title_en,
          description: e.description_en || 'Details coming soon.',
          date: formatEventDate(e.date) || undefined
        }))
    : staticPast

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
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-primary">Events</span>
            <h1 className="fluid-title font-black leading-tight tracking-tight">Past Events</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">Highlights from the events Asterot has already delivered — moments that shaped our journey so far.</p>
          </div>
        </Container>
      </section>

      {/* Past events */}
      <Container>
        <RevealSection className="py-16 sm:py-20">
          {past.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {past.map(event => (
                <article key={event.title} className="card-surface rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">
                      Past
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gray-300">{event.category}</span>
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold tracking-tight">{event.title}</h2>
                  <p className="mt-3 text-gray-300 leading-7">{event.description}</p>
                  {event.date ? (
                    <p className="mt-4 text-sm text-primary">{event.date}</p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No past events to show yet.</p>
          )}
        </RevealSection>

        {/* Continue exploring */}
        <RevealSection className="pb-16 sm:pb-20">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[2rem] border border-white/10 bg-black/40 p-8">
            <div>
              <h2 className="text-2xl font-semibold">Explore more events</h2>
              <p className="mt-2 text-gray-400">See what is coming next and view event documentation.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/events/upcoming" className="btn btn-primary">
                Upcoming Events
              </Link>
              <Link href="/events/documentation" className="btn btn-ghost">
                Documentation
              </Link>
            </div>
          </div>
        </RevealSection>
      </Container>
    </main>
  )
}
