import Container from '../../../components/Container'
import RevealSection from '../../../components/RevealSection'
import Link from 'next/link'
import type { Metadata } from 'next'
import { storyParagraphs } from '../../../lib/about'
import { getPublicCompanyInfo } from '../../../lib/about-server'

export const metadata: Metadata = {
  title: 'Our Story',
  description: 'The story of Asterot Bangladesh Limited — a youth-driven organization building events and opportunities across Bangladesh.',
  alternates: {
    canonical: 'https://www.asterot.com/about/our-story'
  }
}

export const dynamic = 'force-dynamic'

export default async function OurStoryPage() {
  let company: Awaited<ReturnType<typeof getPublicCompanyInfo>> = null
  try {
    company = await getPublicCompanyInfo()
  } catch (err) {
    console.error('Company info load error', err)
  }

  const paragraphs = company?.story_en
    ? company.story_en.split(/\n+/).map((p) => p.trim()).filter(Boolean)
    : storyParagraphs

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
            <h1 className="fluid-title font-black leading-tight tracking-tight">Our Story</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">
              The journey of Asterot Bangladesh Limited — from a bold idea to a movement driven by youth, ambition, and meaningful change.
            </p>
          </div>
        </Container>
      </section>

      {/* Story content */}
      <Container>
        <RevealSection className="py-16 sm:py-20">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10 sm:p-14">
            <p className="text-sm uppercase tracking-[0.35em] text-primary">Who we are</p>
            <div className="mt-6 space-y-5 text-gray-300 leading-8">
              {paragraphs.map((para, index) => (
                <p key={index}>{para}</p>
              ))}
              <p className="pt-2 text-base font-semibold text-white">
                Asterot Bangladesh Limited — Igniting Change with Every Step.
              </p>
            </div>
          </div>
        </RevealSection>

        {/* Continue exploring */}
        <RevealSection className="pb-16 sm:pb-20">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[2rem] border border-white/10 bg-black/40 p-8">
            <div>
              <h2 className="text-2xl font-semibold">Continue exploring</h2>
              <p className="mt-2 text-gray-400">Discover our mission, values, leadership, and vision for the future.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/about/mission-vision" className="btn btn-primary">
                Mission & Vision
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
