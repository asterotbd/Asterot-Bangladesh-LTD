"use client"
import { useMemo, useState } from 'react'
import Container from '../../../components/Container'
import RevealSection from '../../../components/RevealSection'
import PhotoGallery from '../../../components/PhotoGallery'
import MediaToolbar, { GridViewIcon, MasonryViewIcon } from '../../../components/MediaToolbar'
import { mediaPhotos } from '../../../lib/media'
import Link from 'next/link'

const categories = ['All', ...Array.from(new Set(mediaPhotos.map(photo => photo.category)))]

export default function MediaPhotosPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [activeView, setActiveView] = useState<'grid' | 'masonry'>('masonry')

  const filtered = useMemo(
    () => activeCategory === 'All' ? mediaPhotos : mediaPhotos.filter(photo => photo.category === activeCategory),
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
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-primary">Media · Photos</span>
            <h1 className="fluid-title font-black leading-tight tracking-tight">Photo Gallery</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">A look behind the scenes, our projects, people, and moments — filter by category or switch between grid and masonry views.</p>
          </div>
        </Container>
      </section>

      {/* Photos */}
      <Container>
        <RevealSection className="py-16">
          <MediaToolbar
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            viewOptions={[
              { id: 'masonry', label: 'Masonry', icon: <MasonryViewIcon /> },
              { id: 'grid', label: 'Grid', icon: <GridViewIcon /> }
            ]}
            activeView={activeView}
            onViewChange={view => setActiveView(view as 'grid' | 'masonry')}
            resultCount={filtered.length}
          />
          <div className="mt-10">
            <PhotoGallery items={filtered} view={activeView} />
          </div>
        </RevealSection>

        {/* Cross-link to videos */}
        <RevealSection className="pb-16">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[2rem] border border-white/10 bg-black/40 p-8">
            <div>
              <h2 className="text-2xl font-semibold">Looking for video?</h2>
              <p className="mt-2 text-gray-400">Watch our latest projects, stories, and behind-the-scenes moments.</p>
            </div>
            <Link href="/media/videos" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-black transition hover:bg-accent">
              Browse Videos
            </Link>
          </div>
        </RevealSection>
      </Container>
    </main>
  )
}
