"use client"
import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Container from './Container'
import RevealSection from './RevealSection'
import PhotoLightbox from './PhotoLightbox'
import type { PhotoAlbum } from '../lib/photoAlbums'
import { getAlbumPhotoCount } from '../lib/photoAlbums'

type PhotoAlbumPageProps = {
  album: PhotoAlbum
}

export default function PhotoAlbumPage({ album }: PhotoAlbumPageProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const count = getAlbumPhotoCount(album)
  const hasPhotos = count > 0

  const photos = useMemo(() => album.photos, [album.photos])

  return (
    <>
      <Container>
        <RevealSection className="py-16 sm:py-20">
          <Link
            href="/media/photos"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Albums
          </Link>

          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-primary">Album</span>
              <h1 className="fluid-title font-black leading-tight tracking-tight">{album.title}</h1>
              <p className="max-w-[min(52ch,100%)] text-gray-400">{album.description}</p>
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-primary">
              {hasPhotos ? `${count} ${count === 1 ? 'Photo' : 'Photos'}` : 'Coming Soon'}
            </p>
          </div>

          {hasPhotos ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`View photo ${index + 1} of ${album.title}`}
                  className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 text-left shadow-xl shadow-black/10 focus-visible:outline-offset-4"
                >
                  <Image
                    src={src}
                    alt={`${album.title} photo ${index + 1}`}
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    <span className="text-sm tabular-nums text-white/80">
                      {String(index + 1).padStart(2, '0')}
                      <span className="mx-1.5 text-white/30">/</span>
                      {String(count).padStart(2, '0')}
                    </span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-black">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-dashed border-white/10 bg-white/[0.03] px-6 py-24 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-7 w-7 text-primary">
                  <path d="M4 8h2l1.5-2.5h9L18 8h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </span>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">Coming Soon</p>
              <p className="max-w-[min(48ch,100%)] text-gray-400">
                Photos for this album will appear here once they are added.
              </p>
            </div>
          )}
        </RevealSection>
      </Container>

      <PhotoLightbox
        photos={photos}
        index={activeIndex}
        onClose={() => setActiveIndex(null)}
        onIndexChange={setActiveIndex}
        label={album.title}
      />
    </>
  )
}
