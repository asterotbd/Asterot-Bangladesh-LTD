import Link from 'next/link'
import Image from 'next/image'

type BrandLogoProps = {
  className?: string
  size?: 'navigation' | 'footer'
  priority?: boolean
}

export default function BrandLogo({ className = '', size = 'navigation', priority = false }: BrandLogoProps) {
  const imageClass = size === 'footer' ? 'h-16' : 'h-8'
  const textClass = size === 'footer'
    ? 'text-base tracking-[0.3em]'
    : 'text-xs tracking-[0.2em]'

  return (
    <Link href="/" aria-label="Asterot home" className={`inline-flex items-center gap-3 transition-opacity duration-200 hover:opacity-90 ${className}`}>
      <Image
        src="/brand/asterot-logo-white.svg"
        alt="Asterot Bangladesh Limited"
        width={size === 'footer' ? 44 : 22}
        height={size === 'footer' ? 64 : 32}
        priority={priority}
        className={`${imageClass} w-auto object-contain`}
      />
      <span className={`font-semibold uppercase text-white ${textClass}`}>Asterot</span>
    </Link>
  )
}
