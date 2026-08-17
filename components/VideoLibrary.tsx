"use client"
import { useMemo, useState } from 'react'
import RevealSection from './RevealSection'
import VideoGallery from './VideoGallery'
import MediaToolbar, { GridViewIcon, ListViewIcon } from './MediaToolbar'
import type { MediaVideo } from '../lib/media'

type VideoLibraryProps = {
  videos: MediaVideo[]
  categories: string[]
}

export default function VideoLibrary({ videos, categories }: VideoLibraryProps) {
  const allCategories = ['All Videos', ...categories]
  const [activeCategory, setActiveCategory] = useState('All Videos')
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid')

  const filtered = useMemo(
    () => (activeCategory === 'All Videos' ? videos : videos.filter(video => video.category === activeCategory)),
    [activeCategory, videos]
  )

  return (
    <RevealSection className="py-16 sm:py-20">
      <MediaToolbar
        categories={allCategories}
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
  )
}