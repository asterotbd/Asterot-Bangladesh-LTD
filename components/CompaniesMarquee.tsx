'use client'

import { useEffect, useState } from 'react'
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
  /** Accessible / display name for the logo. */
  name: string
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
 * PLACEHOLDER LOGOS — no real partner assets exist yet.
 * Replace these entries with real company logos by providing `src` (and
 * optionally `href` / `alt`). Do not invent company names here.
 */
const PLACEHOLDER_LOGOS: MarqueeLogo[] = [
  { id: 'placeholder-1', name: 'Partner Logo 01' },
  { id: 'placeholder-2', name: 'Partner Logo 02' },
  { id: 'placeholder-3', name: 'Partner Logo 03' },
  { id: 'placeholder-4', name: 'Partner Logo 04' },
  { id: 'placeholder-5', name: 'Partner Logo 05' },
  { id: 'placeholder-6', name: 'Partner Logo 06' }
]

type LogoItemProps = {
  logo: MarqueeLogo
}

function LogoItem({ logo }: LogoItemProps) {
  const content = logo.src ? (
    <Image
      src={logo.src}
      alt={logo.alt ?? logo.name}
      width={64}
      height={40}
      className="marquee__logo-image"
    />
  ) : (
    <span className="marquee__logo-placeholder">{logo.name}</span>
  )

  if (logo.href) {
    return (
      <a
        href={logo.href}
        className="marquee__item"
        aria-label={logo.name}
      >
        {content}
      </a>
    )
  }

  return (
    <div className="marquee__item" aria-hidden={undefined}>
      {content}
    </div>
  )
}

export default function CompaniesMarquee({
  heading = DEFAULT_HEADING,
  logos = PLACEHOLDER_LOGOS,
  className = '',
  duration = 45,
  gap
}: CompaniesMarqueeProps) {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  const marqueeStyle = {
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
      <div className="marquee mt-6" style={marqueeStyle}>
        <div className="marquee__track">
          <div className="marquee__group">
            {logos.map(logo => (
              <LogoItem key={logo.id} logo={logo} />
            ))}
          </div>
          <div className="marquee__group" aria-hidden="true">
            {logos.map(logo => (
              <LogoItem key={`${logo.id}-clone`} logo={logo} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
