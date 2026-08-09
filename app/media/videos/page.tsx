"use client"
import { useMemo, useState } from 'react'
import Container from '../../../components/Container'
import RevealSection from '../../../components/RevealSection'
import VideoGallery from '../../../components/VideoGallery'
import MediaToolbar, { GridViewIcon, ListViewIcon } from '../../../components/MediaToolbar'
import { mediaVideos, videoCategories } from '../../../lib/media'
import Link from 'next/link'

const categories = ['All Videos', ...videoCategories]

export default function MediaVideosPage() {
  const [activeCategory, setActiveCategory] = useState('All Videos')
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid')

  const filtered = useMemo(
    () => activeCategory === 'All Videos' ? mediaVideos : mediaVideos.filter(video => video.category === activeCategory),
    [activeCategory]
  )

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
        <RevealSection className="py-16 sm:py-20">
          <MediaToolbar
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            viewOptions={[
              { id: 'grid', label: 'Grid', icon: <GridViewIcon /> },
              { id: 'list', label: 'List', icon: <ListViewIcon /> }
            ]}
            activeView={activeView}
            onViewChange={view => setActiveView(view as 'grid' | 'list')}
            resultCount={filtered.length}
          />
          <div className="mt-10">
            <VideoGallery items={filtered} view={activeView} />
          </div>
        </RevealSection>

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
