'use client'

import { useState } from 'react'
import Container from '../../../components/Container'
import RevealSection from '../../../components/RevealSection'
import Link from 'next/link'
import { documentationItems } from '../../../lib/events'

type Filter = 'All' | 'Photo' | 'Video'

export default function EventDocumentationPage() {
  const [filter, setFilter] = useState<Filter>('All')

  const filteredItems = filter === 'All'
    ? documentationItems
    : documentationItems.filter(item => item.type === filter)

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
            <h1 className="fluid-title font-black leading-tight tracking-tight">Event Documentation</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">Photos and videos from our events and programs — captured to preserve the moments that matter.</p>
          </div>
        </Container>
      </section>

      {/* Filters */}
      <Container>
        <RevealSection className="pt-16">
          <div className="flex flex-wrap items-center gap-3">
            {(['All', 'Photo', 'Video'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold transition ${
                  filter === f
                    ? 'bg-primary text-black'
                    : 'border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </RevealSection>

        {/* Gallery grid */}
        <RevealSection className="pt-10 pb-16 sm:pb-20">
          <div className="gallery-grid">
            {filteredItems.map(item => (
              <article key={item.title} className="card-surface flex flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-xl shadow-black/10">
                <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.12),_transparent_60%)]">
                  <span className="text-5xl">{item.type === 'Photo' ? '📷' : '🎬'}</span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gray-300">{item.type}</span>
                  </div>
                  <h2 className="mt-4 text-lg font-semibold tracking-tight">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{item.caption}</p>
                </div>
              </article>
            ))}
          </div>
        </RevealSection>

        {/* Continue exploring */}
        <RevealSection className="pb-16 sm:pb-20">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[2rem] border border-white/10 bg-black/40 p-8">
            <div>
              <h2 className="text-2xl font-semibold">Explore more events</h2>
              <p className="mt-2 text-gray-400">See upcoming programs and past highlights.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/events/upcoming" className="btn btn-primary">
                Upcoming Events
              </Link>
              <Link href="/events/past" className="btn btn-ghost">
                Past Events
              </Link>
            </div>
          </div>
        </RevealSection>
      </Container>
    </main>
  )
}
