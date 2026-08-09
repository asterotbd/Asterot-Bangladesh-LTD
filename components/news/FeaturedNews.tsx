"use client"
import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import type { NewsArticle } from '../../lib/newsData'

const SLIDE_DURATION = 6000
const FADE_DURATION = 900

type FeaturedNewsProps = {
  articles: NewsArticle[]
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export default function FeaturedNews({ articles }: FeaturedNewsProps) {
  const reduceMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  const total = articles.length
  const paused = hovered || focused

  const goTo = useCallback(
    (index: number) => setActive(((index % total) + total) % total),
    [total]
  )

  const goNext = useCallback(() => goTo(active + 1), [active, goTo])
  const goPrev = useCallback(() => goTo(active - 1), [active, goTo])

  useEffect(() => {
    if (reduceMotion || paused || total < 2) return
    const timer = window.setTimeout(() => {
      setActive(index => (index + 1) % total)
    }, SLIDE_DURATION)
    return () => window.clearTimeout(timer)
  }, [active, paused, reduceMotion, total])

  if (total === 0) return null

  const current = articles[active]

  return (
    <section
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured news stories"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
    >
      {/* Header row: eyebrow + counter + controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
          Latest From Asterot
        </p>
        <div className="flex items-center gap-5">
          <p className="text-sm tabular-nums text-white/60" aria-live="polite">
            {pad(active + 1)}
            <span className="mx-1.5 text-white/30">/</span>
            {pad(total)}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous news story"
              className="news-nav-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next news story"
              className="news-nav-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Cinematic hero */}
      <div className="group relative mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl shadow-black/40 aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]">
        {articles.map((article, index) => {
          const isActive = index === active
          const pos = ((index - active) % total + total) % total
          const offsetX = pos === 1 ? 36 : pos === total - 1 ? -36 : 0

          return (
            <div
              key={article.slug}
              aria-hidden={!isActive}
              className="absolute inset-0"
              style={{
                opacity: isActive ? 1 : 0,
                transform: `translate3d(${offsetX}px, 0, 0)`,
                transition: `opacity ${FADE_DURATION}ms ease, transform ${FADE_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1)`
              }}
            >
              <Image
                src={article.image}
                alt={article.title}
                fill
                priority={index === 0}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 1200px"
                className={`object-cover ${isActive ? 'news-kenburns' : ''}`}
              />

              {/* Cinematic overlays */}
              <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.45)_38%,rgba(0,0,0,0.08)_68%,rgba(0,0,0,0.25)_100%),linear-gradient(to_right,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.15)_55%,transparent_100%)]" />
            </div>
          )
        })}

        {/* Story content */}
        <motion.div
          key={current.slug}
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-12"
        >
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.28em] text-white/70">
            <span className="font-semibold text-primary">{current.category}</span>
            <span aria-hidden="true" className="h-px w-6 bg-white/40" />
            <span className="tabular-nums">{current.date}</span>
          </div>

          <Link href={`/news/${current.slug}`} className="mt-4 block max-w-[min(64ch,100%)]">
            <h2 className="fluid-title font-bold leading-tight tracking-tight text-white transition-colors duration-300 group-hover:text-white sm:font-black">
              {current.title}
            </h2>
          </Link>

          <p className="mt-4 max-w-[min(56ch,100%)] text-sm leading-7 text-white/70 sm:text-base">
            {current.excerpt}
          </p>

          <Link
            href={`/news/${current.slug}`}
            className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white backdrop-blur-sm transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-black"
          >
            Read Story
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </motion.div>

        {/* Progress indicator */}
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
          <div
            key={active}
            className="news-progress-fill"
            style={{ animationPlayState: paused ? 'paused' : 'running' }}
          />
        </div>
      </div>
    </section>
  )
}
