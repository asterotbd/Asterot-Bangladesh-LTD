"use client"
import { useEffect, useRef } from 'react'
import { useScrollLock } from '../hooks/useScrollLock'

export default function Modal({ open, onClose, children }: { open: boolean, onClose: ()=>void, children: React.ReactNode }){
  // Keep onClose in a ref so inline parent callbacks don't retrigger the effect.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useScrollLock(open)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  if(!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40" style={{ maxInlineSize: 'min(45rem, 100%)' }}>{children}</div>
      <button onClick={onClose} className="sr-only">Close</button>
    </div>
  )
}
