import type { Metadata } from 'next'
import Container from '../../components/Container'
import RevealSection from '../../components/RevealSection'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Projects — Asterot Bangladesh Limited',
  description: 'Upcoming Asterot projects and initiatives will be announced here as they are ready.',
  alternates: {
    canonical: 'https://www.asterot.com/projects'
  }
}

export default function ProjectsPage(){
  return (
    <main className="bg-black text-white">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.16),_transparent_26%),linear-gradient(180deg,#050507_0%,#09090f_100%)] py-24">
        <div className="ambient-layer">
          <div className="ambient-glow" />
          <div className="ambient-dots" />
        </div>
        <Container>
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-primary">Projects</span>
            <h1 className="fluid-title font-black leading-tight tracking-tight">Projects</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">Upcoming initiatives and special projects from Asterot.</p>
          </div>
        </Container>
      </section>

      <Container>
        <RevealSection className="py-16 sm:py-20">
          <div className="mx-auto max-w-[min(56ch,100%)] text-center">
            <h2 className="text-2xl font-semibold sm:text-3xl">Announcements are coming.</h2>
            <p className="mt-4 text-gray-300">
              Upcoming projects are currently being finalized. As soon as an initiative is ready to be shared,
              its details will be published here.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/media" className="btn btn-primary">Explore Media</Link>
              <Link href="/contact" className="btn btn-ghost">Contact Us</Link>
            </div>
          </div>
        </RevealSection>
      </Container>
    </main>
  )
}
