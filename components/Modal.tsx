"use client"
import { useEffect } from 'react'

export default function Modal({ open, onClose, children }: { open: boolean, onClose: ()=>void, children: React.ReactNode }){
  useEffect(() => {
    if(open) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if(!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/40" style={{ maxInlineSize: 'min(45rem, 100%)' }}>{children}</div>
      <button onClick={onClose} className="sr-only">Close</button>
    </div>
  )
}
