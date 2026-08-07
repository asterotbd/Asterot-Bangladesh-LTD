"use client"
import { useEffect, useRef } from 'react'

type DismissHandlers = {
  onOutside: () => void
  onEscape: () => void
}

/**
 * Calls `onOutside` when a pointer goes down outside the given element and
 * `onEscape` when Escape is pressed, but only while `active` is true.
 * Every listener added here is removed when the effect cleans up.
 */
export function useDismiss(
  ref: { current: HTMLElement | null },
  active: boolean,
  { onOutside, onEscape }: DismissHandlers
) {
  const outsideRef = useRef(onOutside)
  outsideRef.current = onOutside
  const escapeRef = useRef(onEscape)
  escapeRef.current = onEscape

  useEffect(() => {
    if (!active) return

    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        outsideRef.current()
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        escapeRef.current()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [active, ref])
}
