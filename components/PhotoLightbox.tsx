"use client"
import { useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { useScrollLock } from '../hooks/useScrollLock'

type PhotoLightboxProps = {
  photos: string[]
  index: number | null
  onClose: () => void
  onIndexChange: (index: number) => void
  label: string
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

export default function PhotoLightbox({ photos, index, onClose, onIndexChange, label }: PhotoLightboxProps) {
  const open = index !== null
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const previousActiveRef = useRef<HTMLElement | null>(null)
  useScrollLock(open)

  // Move focus into the dialog when it opens and restore it when it closes.
  useEffect(() => {
    if (open) {
      previousActiveRef.current = document.activeElement as HTMLElement | null
      closeRef.current?.focus()
    } else if (previousActiveRef.current) {
      previousActiveRef.current.focus()
      previousActiveRef.current = null
    }
  }, [open])

  const showPrev = useCallback(() => {
    if (index === null || photos.length === 0) return
    onIndexChange((index - 1 + photos.length) % photos.length)
  }, [index, photos.length, onIndexChange])

  const showNext = useCallback(() => {
    if (index === null || photos.length === 0) return
    onIndexChange((index + 1) % photos.length)
  }, [index, photos.length, onIndexChange])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
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
  }, [open, onClose, showPrev, showNext])

  const activePhoto = index !== null ? photos[index] : null

  return (
    <AnimatePresence>
      {open && activePhoto ? (
        <motion.div
          key="lightbox"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onMouseDown={event => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              className="flex max-h-full max-w-full items-center justify-center"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={activePhoto}
                alt={`${label} photo ${index! + 1}`}
                width={1600}
                height={1200}
                priority
                sizes="100vw"
                className="max-h-[82vh] w-auto max-w-[min(92vw,1100px)] rounded-lg object-contain"
              />
            </motion.div>
          </AnimatePresence>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close viewer"
            ref={closeRef}
            className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white transition hover:bg-white/15"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <button
            type="button"
            onClick={showPrev}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white transition hover:bg-white/15"
          >
            <Chevron direction="left" />
          </button>

          <button
            type="button"
            onClick={showNext}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white transition hover:bg-white/15"
          >
            <Chevron direction="right" />
          </button>

          <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/10 bg-black/60 px-4 py-1.5 text-sm tabular-nums text-white/90">
            {index! + 1} / {photos.length}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
