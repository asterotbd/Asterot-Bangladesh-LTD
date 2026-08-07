"use client"
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

type SpotlightSlide = {
  src: string
  title: string
}

export const spotlightImages: SpotlightSlide[] = [
  { src: '/media/photos/spotlight/1.jpg', title: 'Together We Fall' },
  { src: '/media/photos/spotlight/2.jpg', title: 'Together We Fight' },
  { src: '/media/photos/spotlight/3.jpg', title: 'Together We Rise' },
  { src: '/media/photos/spotlight/4.jpg', title: 'Together We Build' },
  { src: '/media/photos/spotlight/5.jpg', title: 'Together We Grow' },
  { src: '/media/photos/spotlight/6.jpg', title: 'Together We Can' }
]

const SLIDE_DURATION = 5000
const FADE_DURATION = 900

type SpotlightSlideshowProps = {
  className?: string
}

export default function SpotlightSlideshow({ className = '' }: SpotlightSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex(index => (index + 1) % spotlightImages.length)
    }, SLIDE_DURATION)
    return () => window.clearInterval(timer)
  }, [])

  const active = spotlightImages[activeIndex]

  return (
    <div
      role="group"
      aria-roledescription="Spotlight slideshow"
      aria-label="Photo spotlight slideshow"
      className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-xl shadow-black/30 ${className}`}
    >
      <div className="relative aspect-[4/5] w-full">
        {spotlightImages.map((image, index) => (
          <Image
            key={image.src}
            src={image.src}
            alt={image.title}
            fill
            priority={index === 0}
            loading="eager"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 85vw, 1100px"
            aria-hidden={index !== activeIndex}
            className={`absolute inset-0 object-cover object-center transition-opacity ease-in-out ${index === activeIndex ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDuration: `${FADE_DURATION}ms` }}
          />
        ))}

        {/* Cinematic gradient overlays */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/85" />

        {/* Slide title */}
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <motion.h2
            key={activeIndex}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-[min(46ch,100%)] text-xl font-semibold leading-tight text-white sm:text-2xl"
          >
            {active.title}
          </motion.h2>
          <p className="mt-2 text-sm tabular-nums text-white/60">
            {String(activeIndex + 1).padStart(2, '0')}
            <span className="mx-1.5 text-white/30">/</span>
            {String(spotlightImages.length).padStart(2, '0')}
          </p>
        </div>

        {/* Slide progress indicator */}
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
          {reduceMotion ? (
            <div className="h-full w-full bg-primary" />
          ) : (
            <motion.div
              key={activeIndex}
              className="h-full w-full origin-left bg-primary"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: SLIDE_DURATION / 1000, ease: 'linear' }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
