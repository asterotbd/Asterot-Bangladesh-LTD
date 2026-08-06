"use client"
import { useState } from 'react'
import MediaModal from './MediaModal'
import { awakeningCup } from '../lib/awakening'

function PlayIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l10.56-6.86a1.04 1.04 0 0 0 0-1.76L9.56 4.26A1.04 1.04 0 0 0 8 5.14Z" />
    </svg>
  )
}

export default function AwakeningCupTeaser({ className = '' }: { className?: string }) {
  const [teaserOpen, setTeaserOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setTeaserOpen(true)} className={`btn btn-ghost group ${className}`}>
        <PlayIcon className="h-4 w-4" />
        Watch Teaser
      </button>

      <MediaModal open={teaserOpen} onClose={() => setTeaserOpen(false)} label={awakeningCup.teaserModalLabel}>
        <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b0b10] shadow-2xl shadow-black/50">
          <div className="relative aspect-video w-full overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(255,22,90,0.22),transparent_45%),linear-gradient(180deg,#050507_0%,#0b0b10_100%)]">
            <div className="ambient-layer">
              <div className="ambient-glow" />
              <div className="ambient-dots" />
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white">
                <PlayIcon className="h-7 w-7 translate-x-0.5" />
              </span>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.35em] text-primary">{awakeningCup.teaserModalHeading}</p>
              <p className="mt-3 max-w-[min(42ch,100%)] px-6 text-sm text-gray-300">{awakeningCup.teaserModalCopy}</p>
            </div>
          </div>
        </div>
      </MediaModal>
    </>
  )
}
