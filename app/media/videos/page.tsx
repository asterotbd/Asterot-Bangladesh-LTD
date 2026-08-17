import Container from '../../../components/Container'
import RevealSection from '../../../components/RevealSection'
import VideoLibrary from '../../../components/VideoLibrary'
import Link from 'next/link'
import { getSyncedVideos } from '../../../lib/videos'

export const dynamic = 'force-dynamic'

export default async function MediaVideosPage() {
  const videos = await getSyncedVideos()
  const regularVideos = videos.filter(video => video.videoType !== 'short')
  const shorts = videos.filter(video => video.videoType === 'short')
  const categories = Array.from(new Set(regularVideos.map(video => video.category).filter(Boolean)))

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
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-primary">Media · Videos</span>
            <h1 className="fluid-title font-black leading-tight tracking-tight">Video Gallery</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">Watch our latest projects, stories, events, and behind-the-scenes moments — filter by category or switch between grid and list views.</p>
          </div>
        </Container>
      </section>

      {/* Videos */}
      <Container>
        <VideoLibrary videos={regularVideos} shorts={shorts} categories={categories} />

        {/* Cross-link to photos */}
        <RevealSection className="pb-16 sm:pb-20">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[2rem] border border-white/10 bg-black/40 p-8">
            <div>
              <h2 className="text-2xl font-semibold">Looking for photos?</h2>
              <p className="mt-2 text-gray-400">A look behind the scenes, our projects, people, and moments.</p>
            </div>
            <Link href="/media/photos" className="btn btn-primary">
              Browse Photos
            </Link>
          </div>
        </RevealSection>
      </Container>
    </main>
  )
}