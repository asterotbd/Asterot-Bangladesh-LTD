import Container from '../../../components/Container'
import RevealSection from '../../../components/RevealSection'
import SpotlightSlideshow from '../../../components/SpotlightSlideshow'
import PhotoAlbumsGrid from '../../../components/PhotoAlbumsGrid'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Photos',
  description: 'Photo albums from Asterot Bangladesh Limited events — tournaments, corporate events, backstage stories, the crew and more.',
  alternates: {
    canonical: 'https://www.asterot.com/media/photos'
  }
}

export default function MediaPhotosPage() {
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
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-primary">Media · Photos</span>
            <h1 className="fluid-title font-black leading-tight tracking-tight">Photo Gallery</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">A look behind the scenes, our projects, people, and moments — organized into albums from tournaments, corporate events, celebrations, and more.</p>
          </div>
        </Container>
      </section>

      {/* Spotlight */}
      <Container>
        <RevealSection className="py-16 sm:py-20">
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-primary">Spotlight</span>
              <h2 className="fluid-title font-black leading-tight tracking-tight">A Story of Growth</h2>
            </div>
            <p className="max-w-[min(52ch,100%)] text-gray-400 sm:text-right">Six chapters. One journey. From falling to fighting, rising to building — growing together until we can.</p>
          </div>
          <SpotlightSlideshow />
        </RevealSection>
      </Container>

      {/* Photos */}
      <Container>
        <RevealSection className="py-16 sm:py-20">
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-primary">Photo Albums</span>
              <h2 className="fluid-title font-black leading-tight tracking-tight">Browse Our Albums</h2>
            </div>
            <p className="max-w-[min(52ch,100%)] text-gray-400 sm:text-right">Organized collections from tournaments, events, celebrations, and everything in between.</p>
          </div>
          <PhotoAlbumsGrid />
        </RevealSection>

        {/* Cross-link to videos */}
        <RevealSection className="pb-16 sm:pb-20">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[2rem] border border-white/10 bg-black/40 p-8">
            <div>
              <h2 className="text-2xl font-semibold">Looking for video?</h2>
              <p className="mt-2 text-gray-400">Watch our latest projects, stories, and behind-the-scenes moments.</p>
            </div>
            <Link href="/media/videos" className="btn btn-primary">
              Browse Videos
            </Link>
          </div>
        </RevealSection>
      </Container>
    </main>
  )
}
