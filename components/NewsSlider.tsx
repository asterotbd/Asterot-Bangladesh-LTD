'use client'

import { useEffect, useRef, useState } from 'react'

export type NewsItem = {
  id: string
  title_en: string
  slug: string
  excerpt_en: string | null
  published_at: string | null
  category: { name_en: string | null } | null
  featured_image: { public_url: string | null, alt_en: string | null } | null
}

type NewsSliderProps = {
  latestNews: NewsItem[]
  announcements: NewsItem[]
}

const tabs = [
  { id: 'news', label: 'Latest News' },
  { id: 'announcements', label: 'Announcements' }
] as const

type TabId = typeof tabs[number]['id']

const formatDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default function NewsSlider({ latestNews, announcements }: NewsSliderProps) {
  const [activeTab, setActiveTab] = useState<TabId>('news')
  const [currentPage, setCurrentPage] = useState(0)
  const [slidesToShow, setSlidesToShow] = useState(1)
  const [isPaused, setIsPaused] = useState(false)
  const [motionAllowed, setMotionAllowed] = useState(true)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragStartX = useRef<number | null>(null)

  useEffect(() => {
    setMotionAllowed(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const items = activeTab === 'news' ? latestNews : announcements
  const pageCount = Math.max(1, Math.ceil(items.length / slidesToShow))

  useEffect(() => {
    const updateSlides = () => {
      const width = containerRef.current?.clientWidth ?? 0
      const columns = Math.max(1, Math.min(3, Math.floor(width / 420)))
      setSlidesToShow(columns)
    }

    updateSlides()

    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const observer = new ResizeObserver(() => updateSlides())
      observer.observe(containerRef.current)
      return () => observer.disconnect()
    }

    window.addEventListener('resize', updateSlides)
    return () => window.removeEventListener('resize', updateSlides)
  }, [])

  useEffect(() => {
    if (currentPage >= pageCount) {
      setCurrentPage(0)
    }
  }, [pageCount, currentPage])

  useEffect(() => {
    if (isPaused || items.length === 0 || pageCount <= 1) return
    const timer = window.setInterval(() => {
      setCurrentPage(page => (page + 1) % pageCount)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [isPaused, items.length, pageCount])

  const handlePrev = () => setCurrentPage(page => (page - 1 + pageCount) % pageCount)
  const handleNext = () => setCurrentPage(page => (page + 1) % pageCount)

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current === null) return
    const delta = event.clientX - dragStartX.current
    dragStartX.current = null
    if (delta < -40) handleNext()
    if (delta > 40) handlePrev()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      handlePrev()
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      handleNext()
    }
  }

  const trackWidth = `${(items.length * 100) / slidesToShow}%`
  const cardWidth = `${100 / slidesToShow}%`
  const translateX = `-${currentPage * 100}%`

  const showEmptyState = items.length === 0

  return (
    <section
      className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={containerRef}
    >
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-[min(45rem,100%)]">
          <p className="text-sm uppercase tracking-[0.4em] text-primary">News & announcements</p>
          <h2 className="mt-4 text-3xl font-semibold">Latest company updates</h2>
          <p className="mt-4 text-gray-300">Browse the latest published news and announcement highlights from Asterot’s CMS.</p>
        </div>
        <div className="inline-flex rounded-full bg-white/5 p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? 'bg-black text-white shadow-sm shadow-black/20' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="text-sm uppercase tracking-[0.3em] text-gray-400">
          {activeTab === 'news' ? `${items.length} item${items.length === 1 ? '' : 's'} in Latest News` : `${items.length} item${items.length === 1 ? '' : 's'} in Announcements`}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous slide"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition hover:bg-white/10"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next slide"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white transition hover:bg-white/10"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 p-1">
        {showEmptyState ? (
          <div className="min-h-[260px] rounded-[1.75rem] bg-black/50 p-[clamp(2rem,4vw,3.5rem)] text-center text-gray-300">
            <p className="text-base leading-7">Latest updates coming soon.</p>
          </div>
        ) : (
          <div
            className="flex gap-6"
            style={{
              width: trackWidth,
              transform: `translateX(${translateX})`,
              transition: motionAllowed ? 'transform 450ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
              touchAction: 'pan-y'
            }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => { dragStartX.current = null }}
          >
            {items.map(item => (
              <article
                key={item.id}
                className="flex-shrink-0 rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20"
                style={{ width: cardWidth }}
              >
                {item.featured_image?.public_url ? (
                  <div className="overflow-hidden rounded-[1.5rem] bg-slate-950">
                    <img
                      src={item.featured_image.public_url}
                      alt={item.featured_image.alt_en ?? item.title_en}
                      className="h-48 w-full object-cover transition duration-500 hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-[1.5rem] bg-white/5 text-gray-400">No image available</div>
                )}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">{item.category?.name_en ?? 'News'}</span>
                    {item.published_at ? (
                      <time className="text-xs uppercase tracking-[0.3em] text-gray-400" dateTime={item.published_at}>
                        {formatDate(item.published_at)}
                      </time>
                    ) : null}
                  </div>
                  <h3 className="text-xl font-semibold leading-tight text-white">{item.title_en}</h3>
                  {item.excerpt_en ? <p className="text-sm leading-6 text-gray-300">{item.excerpt_en}</p> : null}
                  <a
                    href={`/news/${item.slug}`}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    Read More
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-gray-300">Use left/right arrows, swipe on mobile, or keyboard focus to navigate.</div>
        <a href="/news" className="btn btn-primary">
          View All News
        </a>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {Array.from({ length: pageCount }, (_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setCurrentPage(index)}
            className={`h-2.5 w-8 rounded-full transition ${currentPage === index ? 'bg-white' : 'bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </section>
  )
}
