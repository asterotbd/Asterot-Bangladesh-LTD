"use client"
import { useEffect, useState } from 'react'
import Image from 'next/image'

const SLIDE_DURATION = 5000
const FADE_DURATION = 900

type AlbumSlideshowProps = {
  photos: string[]
  alt: string
  priority?: boolean
}

export default function AlbumSlideshow({ photos, alt, priority = false }: AlbumSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (photos.length < 2) return
    const timer = window.setInterval(() => {
      setActiveIndex(index => (index + 1) % photos.length)
    }, SLIDE_DURATION)
    return () => window.clearInterval(timer)
  }, [photos.length])

  if (photos.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden">
      {photos.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={`${alt} ${index + 1}`}
          fill
          priority={priority && index === 0}
          loading={index === 0 ? 'eager' : 'lazy'}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          aria-hidden={index !== activeIndex}
          className={`absolute inset-0 object-cover object-center transition-opacity ease-in-out ${index === activeIndex ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDuration: `${FADE_DURATION}ms` }}
        />
      ))}
    </div>
  )
}
