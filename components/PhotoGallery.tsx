"use client"
import { useCallback, useEffect, useState } from 'react'
import MediaModal from './MediaModal'
import { mediaPhotos, type MediaPhoto } from '../lib/media'

type PhotoGalleryProps = {
  items?: MediaPhoto[]
  view?: 'masonry' | 'grid'
}

function CameraIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M4 8h2l1.5-2.5h9L18 8h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-6 w-6"
      style={direction === 'left' ? { transform: 'rotate(180deg)' } : undefined}
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

export default function PhotoGallery({ items = mediaPhotos, view = 'masonry' }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const open = activeIndex !== null

  const showPrev = useCallback(() => {
    setActiveIndex(current => (current === null ? current : (current - 1 + items.length) % items.length))
  }, [items.length])

  const showNext = useCallback(() => {
    setActiveIndex(current => (current === null ? current : (current + 1) % items.length))
  }, [items.length])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        showPrev()
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        showNext()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, showPrev, showNext])

  const activePhoto = activeIndex !== null ? items[activeIndex] : null

  const gridClass = view === 'grid'
    ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'
    : 'columns-1 gap-6 sm:columns-2 lg:columns-3 [column-fill:balance]'

  const cardClass = view === 'grid'
    ? 'group relative mb-0 block w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 text-left shadow-xl shadow-black/10 focus-visible:outline-offset-4 aspect-[4/3]'
    : 'group relative mb-6 block w-full break-inside-avoid overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 text-left shadow-xl shadow-black/10 focus-visible:outline-offset-4'

  return (
    <>
      <div className={gridClass}>
        {items.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`View photo: ${photo.title}`}
            className={cardClass}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              decoding="async"
              className={`w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] ${view === 'grid' ? 'absolute inset-0 h-full' : ''}`}
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{photo.title}</span>
                <span className="mt-1 block text-xs uppercase tracking-[0.25em] text-primary">{photo.category}</span>
              </span>
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-black">
                <CameraIcon className="h-5 w-5" />
              </span>
            </span>
          </button>
        ))}
      </div>

      <MediaModal open={open} onClose={() => setActiveIndex(null)} label={`Photo viewer: ${activePhoto?.title ?? ''}`}>
        {activePhoto ? (
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b0b10] shadow-2xl shadow-black/50">
            <div className="relative">
              <img src={activePhoto.src} alt={activePhoto.alt} className="max-h-[70vh] w-full bg-black object-contain" />
              <button
                type="button"
                onClick={showPrev}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white transition hover:bg-white/15"
              >
                <Chevron direction="left" />
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white transition hover:bg-white/15"
              >
                <Chevron direction="right" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-white">{activePhoto.title}</h3>
                <p className="mt-1 text-sm uppercase tracking-[0.25em] text-primary">{activePhoto.category}</p>
              </div>
              <p className="shrink-0 text-sm tabular-nums text-gray-400">
                {activeIndex !== null ? activeIndex + 1 : 0} / {items.length}
              </p>
            </div>
          </div>
        ) : null}
      </MediaModal>
    </>
  )
}
