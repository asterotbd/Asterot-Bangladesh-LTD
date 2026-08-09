import Container from '../../../components/Container'
import RevealSection from '../../../components/RevealSection'
import Link from 'next/link'
import type { Metadata } from 'next'
import { futureVisionParagraphs, futureVisionTagline } from '../../../lib/about'

export const metadata: Metadata = {
  title: 'Future Vision',
  description: 'Asterot Bangladesh Limited\'s roadmap — from its foundation in Dhaka to expansion across Bangladesh and beyond.',
  alternates: {
    canonical: 'https://www.asterot.com/about/future-vision'
  }
}

const roadmapStages = [
  {
    phase: 'Completed',
    title: 'Foundation in Dhaka',
    description: 'Building a strong event management presence in Dhaka, delivering premium sports, corporate, and entertainment events.',
    status: 'completed'
  },
  {
    phase: 'Current',
    title: 'Expansion Across Bangladesh',
    description: 'Strengthening regional presence and partnerships across Bangladesh, creating opportunities in more communities.',
    status: 'current'
  },
  {
    phase: 'Future',
    title: 'International Markets',
    description: 'Reaching international markets through innovation, partnerships, and bold new ideas.',
    status: 'planned'
  }
]

export default function FutureVisionPage() {
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
            <h1 className="fluid-title font-black leading-tight tracking-tight">Future Vision</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">
              Where we are headed — from Bangladesh to the world, one step at a time.
            </p>
          </div>
        </Container>
      </section>

      {/* Vision content */}
      <Container>
        <RevealSection className="py-16 sm:py-20">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10 sm:p-14">
            <p className="text-sm uppercase tracking-[0.35em] text-primary">Our Journey</p>
            <div className="mt-6 space-y-5 text-gray-300 leading-8">
              {futureVisionParagraphs.map((para, index) => (
                <p key={index}>{para}</p>
              ))}
              <p className="pt-2 text-base font-semibold text-white">{futureVisionTagline}</p>
            </div>
          </div>
        </RevealSection>

        {/* Roadmap */}
        <RevealSection className="pb-16 sm:pb-20">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-primary">Roadmap</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">From where we are to where we are going</h2>
            <p className="mt-4 text-gray-300">A clear view of our current stage and the planned milestones ahead.</p>
          </div>

          <div className="mt-10 space-y-6">
            {roadmapStages.map((stage, index) => (
              <div key={stage.phase} className="relative flex gap-6">
                {/* Timeline line */}
                {index < roadmapStages.length - 1 ? (
                  <div className="absolute left-[1.35rem] top-14 bottom-0 w-px bg-white/10" />
                ) : null}

                {/* Marker */}
                <div className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                  stage.status === 'current'
                    ? 'border-primary bg-primary text-black'
                    : 'border-white/15 bg-black/40 text-gray-400'
                }`}>
                  {index + 1}
                </div>

                {/* Card */}
                <div className={`flex-1 rounded-[2rem] border p-8 shadow-xl shadow-black/10 ${
                  stage.status === 'current'
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-white/10 bg-white/5'
                }`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                      stage.status === 'current'
                        ? 'bg-primary text-black'
                        : 'bg-white/10 text-gray-300'
                    }`}>
                      {stage.phase}
                    </span>
                    <h3 className="text-xl font-semibold tracking-tight">{stage.title}</h3>
                  </div>
                  <p className="mt-4 text-gray-300 leading-7">{stage.description}</p>
                </div>
              </div>
            ))}
          </div>
        </RevealSection>

        {/* Continue exploring */}
        <RevealSection className="pb-16 sm:pb-20">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[2rem] border border-white/10 bg-black/40 p-8">
            <div>
              <h2 className="text-2xl font-semibold">Continue exploring</h2>
              <p className="mt-2 text-gray-400">Discover our story and the values that guide us.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/about/our-story" className="btn btn-primary">
                Our Story
              </Link>
              <Link href="/about/values" className="btn btn-ghost">
                Our Values
              </Link>
            </div>
          </div>
        </RevealSection>
      </Container>
    </main>
  )
}
