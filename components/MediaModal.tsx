"use client"
import { useEffect, useRef } from 'react'
import { useScrollLock } from '../hooks/useScrollLock'

type MediaModalProps = {
  open: boolean
  onClose: () => void
  label: string
  children: React.ReactNode
}

export default function MediaModal({ open, onClose, label, children }: MediaModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const previousActive = useRef<HTMLElement | null>(null)
  // Keep onClose in a ref so inline parent callbacks don't retrigger the effect.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useScrollLock(open)

  useEffect(() => {
    if (!open) return

    previousActive.current = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      previousActive.current?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-[min(56rem,100%)]">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute -top-3 right-0 z-20 inline-flex h-11 w-11 translate-y-[-100%] items-center justify-center rounded-full border border-white/15 bg-black/70 text-white transition hover:bg-white/10 sm:translate-y-0 sm:top-4 sm:right-4"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="h-5 w-5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}
