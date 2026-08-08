"use client"
import Link from 'next/link'
import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import HeroKineticVisual from './HeroKineticVisual'

const EASE = [0.22, 1, 0.36, 1]

function ArrowIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

export default function Hero() {
  const reduceMotion = useReducedMotion()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 50, damping: 24 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 24 })

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    if (reduceMotion) return
    const rect = event.currentTarget.getBoundingClientRect()
    mouseX.set((event.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((event.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const fadeUp = (delay: number, y = 22) => ({
    initial: reduceMotion ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: EASE, delay }
  })

  return (
    <section
      className="relative flex min-h-[92svh] flex-col overflow-hidden bg-black"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Restrained ambient backdrop */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(186,30,69,0.09),transparent_38%),radial-gradient(circle_at_84%_86%,rgba(186,30,69,0.05),transparent_42%)]" />
      </div>

      <div className="container relative z-10 flex flex-1 items-center py-24">
        <div className="grid w-full items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
          {/* Text column */}
          <div className="max-w-[min(60ch,100%)]">
            {/* Eyebrow */}
            <motion.div {...fadeUp(0.05, 14)} className="flex items-center gap-4">
              <motion.span
                initial={reduceMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
                className="h-px w-9 origin-left bg-[#BA1E45]"
              />
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.4em] text-white/60">
                Asterot Bangladesh Limited
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="mt-8 font-black tracking-tight text-white">
              <motion.span
                {...fadeUp(0.12)}
                className="block text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.02em]"
              >
                Igniting Change
              </motion.span>
              <motion.span
                {...fadeUp(0.2)}
                className="mt-3 block text-[clamp(1.4rem,3vw,2.4rem)] font-extralight leading-snug tracking-[-0.01em] text-white/70"
              >
                with every step.
              </motion.span>
            </h1>

            {/* Supporting copy */}
            <motion.p {...fadeUp(0.32)} className="mt-9 max-w-[min(52ch,100%)] text-base leading-7 text-gray-400 sm:text-lg sm:leading-8">
              Asterot is a premium event production company in Bangladesh — orchestrating sports, corporate, and entertainment experiences with precision and polish.
            </motion.p>

            {/* CTAs */}
            <motion.div {...fadeUp(0.44)} className="mt-11 flex flex-wrap items-center gap-4">
              <Link href="/events" className="btn btn-primary btn-smooth group">
                Explore What We Do
                <ArrowIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link href="/about" className="btn btn-ghost btn-smooth">
                Learn More
              </Link>
            </motion.div>
          </div>

          {/* Abstract visual column (desktop) */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, ease: EASE, delay: 0.3 }}
            className="hidden items-center justify-center lg:flex"
          >
            <HeroKineticVisual mouseX={springX} mouseY={springY} />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.85 }}
        className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-3 text-white/40"
        aria-hidden="true"
      >
        <span className="text-[0.6rem] font-medium uppercase tracking-[0.5em]">SCROLL</span>
        <span className="relative block h-9 w-px overflow-hidden bg-white/10">
          <span className="hero-scroll-line absolute inset-x-0 top-0 h-full bg-white/60" />
        </span>
      </motion.div>
    </section>
  )
}
