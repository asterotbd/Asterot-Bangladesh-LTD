"use client"
import Link from 'next/link'
import AlbumSlideshow from './AlbumSlideshow'
import type { PhotoAlbum } from '../lib/photoAlbums'

type PhotoAlbumCardProps = {
  album: PhotoAlbum
}

export default function PhotoAlbumCard({ album }: PhotoAlbumCardProps) {
  const count = album.photos.length
  const hasPhotos = count > 0
  const countLabel = count === 1 ? '1 PHOTO' : `${count} PHOTOS`

  return (
    <Link
      href={`/media/photos/${album.slug}`}
      aria-label={`Open ${album.title} album`}
      className="group relative block aspect-[3/4] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-xl shadow-black/20 focus-visible:outline-offset-4"
    >
      {hasPhotos ? (
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
          <AlbumSlideshow photos={album.photos} alt={album.title} />
        </div>
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(160deg,#16161d_0%,#0b0b10_55%,#050507_100%)]" />
      )}

      {!hasPhotos && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            Coming Soon
          </span>
        </div>
      )}

      {/* Cinematic gradient overlay */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

      {/* Hover dark overlay */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/25" />

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          {hasPhotos ? countLabel : 'Coming Soon'}
        </p>
        <div className="mt-1.5 flex items-end justify-between gap-3">
          <h3 className="text-xl font-semibold leading-tight text-white transition-colors duration-300 group-hover:text-accent sm:text-2xl">
            {album.title}
          </h3>
          <span
            aria-hidden="true"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all duration-300 group-hover:translate-x-1 group-hover:border-primary group-hover:bg-primary group-hover:text-black"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  )
}
