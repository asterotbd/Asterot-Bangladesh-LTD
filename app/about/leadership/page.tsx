import Container from '../../../components/Container'
import RevealSection from '../../../components/RevealSection'
import Link from 'next/link'
import LeadershipPortrait from '../../../components/LeadershipPortrait'
import { leadershipMembers } from '../../../lib/leadership'

export default function LeadershipPage() {
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
            <h1 className="fluid-title font-black leading-tight tracking-tight">Leadership Team</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">
              The people leading Asterot with vision, dedication, and a commitment to creating lasting impact for young people and communities.
            </p>
          </div>
        </Container>
      </section>

      {/* Leadership grid */}
      <Container>
        <RevealSection className="py-16 sm:py-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {leadershipMembers.map(member => (
              <LeadershipPortrait key={member.name} name={member.name} role={member.role} image={member.image} />
            ))}
          </div>
        </RevealSection>

        {/* Continue exploring */}
        <RevealSection className="pb-16 sm:pb-20">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[2rem] border border-white/10 bg-black/40 p-8">
            <div>
              <h2 className="text-2xl font-semibold">Continue exploring</h2>
              <p className="mt-2 text-gray-400">Learn about our story and the future we are building.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/about/our-story" className="btn btn-primary">
                Our Story
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
