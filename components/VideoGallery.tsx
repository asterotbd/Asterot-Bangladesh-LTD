"use client"
import { useState } from 'react'
import Image from 'next/image'
import MediaModal from './MediaModal'
import type { MediaVideo } from '../lib/media'

type VideoGalleryProps = {
  items: MediaVideo[]
  view?: 'grid' | 'list'
}

function PlayIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l10.56-6.86a1.04 1.04 0 0 0 0-1.76L9.56 4.26A1.04 1.04 0 0 0 8 5.14Z" />
    </svg>
  )
}

export default function VideoGallery({ items, view = 'grid' }: VideoGalleryProps) {
  const [activeVideo, setActiveVideo] = useState<number | null>(null)
  const open = activeVideo !== null
  const video = activeVideo !== null ? items[activeVideo] : null

  return (
    <>
      {items.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/5 p-12 text-center">
          <p className="text-gray-400">No videos are available in this category yet.</p>
        </div>
      ) : (
        <div className={view === 'grid'
          ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-4'
          : 'flex flex-col gap-4'}>
          {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveVideo(index)}
            aria-label={`Play video: ${item.title}`}
            className={`group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 text-left shadow-xl shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-black/30 focus-visible:outline-offset-4 ${
              view === 'grid'
                ? 'flex flex-col'
                : 'flex w-full flex-col sm:flex-row sm:items-stretch sm:rounded-[1.5rem]'
            }`}
          >
            <div className={`relative overflow-hidden ${view === 'grid' ? 'aspect-video' : 'aspect-video w-full sm:w-64 sm:shrink-0'}`}>
              <Image
                src={item.thumbnail}
                alt={`Thumbnail for ${item.title}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
              />
              <span aria-hidden="true" className="absolute inset-0 bg-black/35 transition-opacity duration-300 group-hover:bg-black/50" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-lg shadow-black/40 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-black">
                  <PlayIcon className="h-6 w-6 translate-x-0.5" />
                </span>
              </span>
              {item.duration ? (
                <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium tabular-nums text-white">
                  {item.duration}
                </span>
              ) : null}
            </div>
            <div className={`${view === 'grid' ? 'flex flex-1 flex-col p-5' : 'flex flex-1 flex-col justify-center p-5 sm:p-6'}`}>
              <h3 className="text-base font-semibold leading-snug text-white">{item.title}</h3>
              <p className="mt-2 text-xs uppercase tracking-[0.25em] text-primary">
                {item.category} <span className="text-gray-500">·</span> {item.year}
              </p>
            </div>
          </button>
          ))}
        </div>
      )}

      <MediaModal open={open} onClose={() => setActiveVideo(null)} label={`Video player: ${video?.title ?? ''}`}>
        {video ? (
          <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b0b10] shadow-2xl shadow-black/50">
            <div className="relative aspect-video w-full bg-black">
              {video.youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&playsinline=1`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="h-full w-full"
                />
              ) : (
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                  <Image src={video.thumbnail} alt="" aria-hidden="true" fill sizes="100vw" className="object-cover opacity-40" />
                  <div className="relative flex flex-col items-center text-center">
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white">
                      <PlayIcon className="h-7 w-7 translate-x-0.5" />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-white">{video.title}</p>
                    <p className="mt-2 max-w-[min(40ch,100%)] px-6 text-sm text-gray-400">
                      This video will premiere here soon. It will play automatically once it&apos;s published.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-white">{video.title}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.25em] text-primary">
                  {video.category} <span className="text-gray-500">·</span> {video.year}
                </p>
              </div>
              {video.duration ? (
                <p className="shrink-0 text-sm tabular-nums text-gray-400">{video.duration}</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </MediaModal>
    </>
  )
}
