'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

/**
 * A single company/partner logo entry for the marquee.
 *
 * To add a real logo later, provide `src` (a public URL/path such as
 * "/brand/partner-logo.svg") and optionally `href` (a link) and `alt`.
 * Entries without a `src` render as clearly-marked placeholders so you can
 * drop in real assets later.
 */
export type MarqueeLogo = {
  id: string
  /** Accessible / display name for the logo. Omit when the partner is not named publicly. */
  name?: string
  /** Public URL/path to the logo image. Omit to render a placeholder. */
  src?: string
  /** Optional override for the `<img>` alt text (falls back to `name`). */
  alt?: string
  /** Optional link the logo should point to. */
  href?: string
}

type CompaniesMarqueeProps = {
  /** Small label shown above the marquee bar. */
  heading?: string
  /** The list of company logos. Defaults to clearly-marked placeholders. */
  logos?: MarqueeLogo[]
  /** Extra classes for the section wrapper. */
  className?: string
  /** Duration (seconds) for one full loop of the duplicated sequence. */
  duration?: number
  /** Horizontal gap between logos (CSS length, e.g. "3rem"). */
  gap?: string
}

const DEFAULT_HEADING = "Companies We've Worked With"

/**
 * SPONSOR LOGOS — the real partner logos shown in the marquee.
 * Add or replace entries with `src` (a public URL/path) and optionally
 * `href` / `alt`. Do not invent company names here.
 */
const SPONSOR_LOGOS: MarqueeLogo[] = [
  { id: 'sponsor-1', src: '/media/photos/logo/sponsor-logo/1.png' },
  { id: 'sponsor-2', src: '/media/photos/logo/sponsor-logo/2.png' },
  { id: 'sponsor-3', src: '/media/photos/logo/sponsor-logo/3.png' },
  { id: 'sponsor-4', src: '/media/photos/logo/sponsor-logo/4.png' }
]

type LogoItemProps = {
  logo: MarqueeLogo
}

function LogoItem({ logo }: LogoItemProps) {
  const content = logo.src ? (
    <Image
      src={logo.src}
      alt={logo.alt ?? logo.name ?? ''}
      width={64}
      height={40}
      className="marquee__logo-image"
    />
  ) : (
    <span className="marquee__logo-placeholder">{logo.name ?? ''}</span>
  )

  if (logo.href) {
    return (
      <a
        href={logo.href}
        className="marquee__item"
        aria-label={logo.alt ?? logo.name ?? 'Partner link'}
      >
        {content}
      </a>
    )
  }

  return (
    <div className="marquee__item">
      {content}
    </div>
  )
}

export default function CompaniesMarquee({
  heading = DEFAULT_HEADING,
  logos = SPONSOR_LOGOS,
  className = '',
  duration = 45,
  gap
}: CompaniesMarqueeProps) {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [groupCount, setGroupCount] = useState(2)
  const [loopWidth, setLoopWidth] = useState<number | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const groupRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  // Measure the width of ONE complete logo group and the viewport. The track
  // needs enough duplicated groups to always cover the viewport (plus one
  // spare group) so the marquee never shows empty space.
  useEffect(() => {
    const viewport = viewportRef.current
    const group = groupRef.current
    if (!viewport || !group) return

    const measure = () => {
      const width = group.offsetWidth
      if (width <= 0) return
      setLoopWidth(width)
      setGroupCount(Math.max(2, Math.ceil(viewport.offsetWidth / width) + 1))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(group)
    return () => observer.disconnect()
  }, [logos])

  const marqueeStyle = {
    ...(loopWidth ? { '--loop-width': `${loopWidth}px` } : {}),
    ...(typeof duration === 'number' ? { '--marquee-duration': `${duration}s` } : {}),
    ...(gap ? { '--marquee-gap': gap } : {})
  } as React.CSSProperties

  // Respect prefers-reduced-motion: render a static, accessible layout.
  if (reducedMotion) {
    return (
      <section className={className} aria-label={heading}>
        <p className="text-center text-xs uppercase tracking-[0.4em] text-primary sm:text-sm">{heading}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {logos.map(logo => (
            <LogoItem key={logo.id} logo={logo} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className={className} aria-label={heading}>
      <p className="text-center text-xs uppercase tracking-[0.4em] text-primary sm:text-sm">{heading}</p>
      <div className="marquee mt-6" ref={viewportRef} style={marqueeStyle}>
        <div className="marquee__track">
          {Array.from({ length: groupCount }, (_, groupIndex) => (
            <div
              key={groupIndex}
              className="marquee__group"
              ref={groupIndex === 0 ? groupRef : undefined}
              aria-hidden={groupIndex > 0 ? 'true' : undefined}
            >
              {logos.map(logo => (
                <LogoItem key={`${logo.id}-${groupIndex}`} logo={logo} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
