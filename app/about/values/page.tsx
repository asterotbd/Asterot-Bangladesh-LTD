import Container from '../../../components/Container'
import RevealSection from '../../../components/RevealSection'
import Link from 'next/link'
import { values } from '../../../lib/about'

export default function ValuesPage() {
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
            <h1 className="fluid-title font-black leading-tight tracking-tight">Our Values</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">
              The principles that guide everything we do — from the smallest task to the biggest event.
            </p>
          </div>
        </Container>
      </section>

      {/* Values grid */}
      <Container>
        <RevealSection className="py-16 sm:py-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map(value => (
              <div key={value.title} className="card-surface rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
                <h2 className="text-xl font-semibold tracking-tight">{value.title}</h2>
                <p className="mt-3 text-sm leading-7 text-gray-300">{value.description}</p>
              </div>
            ))}
          </div>
        </RevealSection>

        {/* Continue exploring */}
        <RevealSection className="pb-16 sm:pb-20">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[2rem] border border-white/10 bg-black/40 p-8">
            <div>
              <h2 className="text-2xl font-semibold">Continue exploring</h2>
              <p className="mt-2 text-gray-400">Meet the leadership team and see our vision for the future.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/about/leadership" className="btn btn-primary">
                Leadership
              </Link>
              <Link href="/about/future-vision" className="btn btn-ghost">
                Future Vision
              </Link>
            </div>
          </div>
        </RevealSection>
      </Container>
    </main>
  )
}
