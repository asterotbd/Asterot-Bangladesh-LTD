import Container from '../../../components/Container'
import RevealSection from '../../../components/RevealSection'
import Link from 'next/link'
import { mission, vision, promise } from '../../../lib/about'

export default function MissionVisionPage() {
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
              About Us
            </span>
            <h1 className="fluid-title font-black leading-tight tracking-tight">Mission & Vision</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">
              Why we exist, what we are building, and the promise that drives everything we do.
            </p>
          </div>
        </Container>
      </section>

      {/* Mission, Vision, Promise */}
      <Container>
        <RevealSection className="py-16">
          <div className="section-grid gap-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-xl shadow-black/10">
              <p className="text-sm uppercase tracking-[0.35em] text-primary">Our Mission</p>
              <h2 className="mt-4 text-2xl font-semibold">Why we exist</h2>
              <p className="mt-4 text-gray-300 leading-8">{mission}</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-black/40 p-10 shadow-xl shadow-black/10">
              <p className="text-sm uppercase tracking-[0.35em] text-primary">Our Vision</p>
              <h2 className="mt-4 text-2xl font-semibold">What we are building</h2>
              <p className="mt-4 text-gray-300 leading-8">{vision}</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-xl shadow-black/10">
              <p className="text-sm uppercase tracking-[0.35em] text-primary">Our Promise</p>
              <h2 className="mt-4 text-2xl font-semibold">Our commitment</h2>
              <p className="mt-4 text-gray-300 leading-8">{promise}</p>
            </div>
          </div>
        </RevealSection>

        {/* Continue exploring */}
        <RevealSection className="pb-16">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[2rem] border border-white/10 bg-black/40 p-8">
            <div>
              <h2 className="text-2xl font-semibold">Continue exploring</h2>
              <p className="mt-2 text-gray-400">Discover our values and the people leading the way.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/about/values" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-accent">
                Our Values
              </Link>
              <Link href="/about/leadership" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Leadership
              </Link>
            </div>
          </div>
        </RevealSection>
      </Container>
    </main>
  )
}
