import type { Metadata } from 'next'
import Container from '../../components/Container'
import RevealSection from '../../components/RevealSection'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Our Works — Asterot Bangladesh Limited',
  description: 'Explore Asterot\'s delivered work — tournaments, corporate programs, entertainment shows and brand activations captured through event documentation.',
  alternates: {
    canonical: 'https://www.asterot.com/works'
  }
}

export default function WorksPage(){
  return (
    <main className="bg-black text-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.16),_transparent_26%),linear-gradient(180deg,#050507_0%,#09090f_100%)] py-24">
        <div className="ambient-layer">
          <div className="ambient-glow" />
          <div className="ambient-dots" />
        </div>
        <Container>
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-primary">Works</span>
            <h1 className="fluid-title font-black leading-tight tracking-tight">Our Works</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">The events and programs we deliver, documented and shared.</p>
          </div>
        </Container>
      </section>

      <Container>
        <RevealSection className="py-16 sm:py-20">
          <div className="mx-auto max-w-[min(56ch,100%)] text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">Our project portfolio is being organized here.</h2>
            <p className="mt-4 text-gray-300">
              While the portfolio listing is finalized, explore the galleries and videos that capture Asterot&apos;s
              tournaments, corporate programs and celebrations.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/events/documentation" className="btn btn-primary">Event Documentation</Link>
              <Link href="/media/photos" className="btn btn-ghost">Photo Galleries</Link>
              <Link href="/media/videos" className="btn btn-ghost">Videos</Link>
            </div>
          </div>
        </RevealSection>
      </Container>
    </main>
  )
}
