"use client"
import { useState } from 'react'
import MediaModal from './MediaModal'
import { upcomingProject } from '../lib/media'

function PlayIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l10.56-6.86a1.04 1.04 0 0 0 0-1.76L9.56 4.26A1.04 1.04 0 0 0 8 5.14Z" />
    </svg>
  )
}

export default function MediaTrailer() {
  const [trailerOpen, setTrailerOpen] = useState(false)

  return (
    <section className="relative overflow-hidden bg-black pt-28 sm:pt-32">
      <div className="ambient-layer">
        <div className="ambient-glow" />
        <div className="ambient-dots" />
      </div>

      <div className="container">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl shadow-black/50">
          {/* Poster / video area */}
          <div className="relative aspect-video w-full overflow-hidden">
            <img
              src={upcomingProject.posterSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Cinematic overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/20" aria-hidden="true" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,22,90,0.22),transparent_45%)]" aria-hidden="true" />

            {/* Centered play affordance (visual anchor) */}
            <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <div className="pointer-events-none h-24 w-24 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm" />
            </div>

            {/* Overlay content */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-10 lg:p-14">
              <div className="max-w-2xl space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white">
                    Upcoming Project
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] text-gray-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {upcomingProject.statusLabel}
                  </span>
                </div>

                <h1 className="fluid-title font-black leading-tight tracking-tight text-white">
                  {upcomingProject.title}
                </h1>

                <p className="max-w-[min(60ch,100%)] text-base leading-7 text-gray-300 sm:text-lg">
                  {upcomingProject.description}
                </p>

                <button
                  type="button"
                  onClick={() => setTrailerOpen(true)}
                  className="btn-smooth group inline-flex items-center gap-3 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-black hover:bg-accent"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/20 transition-transform duration-300 group-hover:scale-110">
                    <PlayIcon className="h-4 w-4 translate-x-px" />
                  </span>
                  Watch Trailer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MediaModal open={trailerOpen} onClose={() => setTrailerOpen(false)} label={`Trailer: ${upcomingProject.title}`}>
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b0b10] shadow-2xl shadow-black/50">
          <div className="relative aspect-video w-full bg-black">
            {upcomingProject.trailerSrc ? (
              <video controls autoPlay playsInline className="h-full w-full" poster={upcomingProject.posterSrc}>
                <track kind="captions" label="Captions" srcLang="en" />
              </video>
            ) : (
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
                <img src={upcomingProject.posterSrc} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" aria-hidden="true" />
                <div className="relative flex flex-col items-center text-center">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white">
                    <PlayIcon className="h-7 w-7 translate-x-0.5" />
                  </span>
                  <p className="mt-5 text-sm font-semibold uppercase tracking-[0.35em] text-primary">Trailer coming soon</p>
                  <p className="mt-3 max-w-[min(42ch,100%)] px-6 text-sm text-gray-300">
                    The official trailer for {upcomingProject.title} will premiere here. Watch this space.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </MediaModal>
    </section>
  )
}
