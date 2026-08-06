"use client"
import { useEffect, useRef, useState } from 'react'

type Props = {
  children: React.ReactNode
  className?: string
  id?: string
  threshold?: number
  rootMargin?: string
}

export default function RevealSection({ children, className = '', id, threshold = 0.12, rootMargin = '0px 0px -10% 0px' }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current || typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return (
    <div ref={ref} id={id} className={`section-reveal ${visible ? 'visible' : ''} ${className}`}>
      {children}
    </div>
  )
}
