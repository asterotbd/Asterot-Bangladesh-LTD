"use client"
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1]

const headlineLines = ['IGNITING', "TOMORROW'S", 'LEADERS']

export default function Hero() {
  const reduceMotion = useReducedMotion()

  const fadeUp = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.75, ease: EASE, delay }
  })

  return (
    <section className="relative flex min-h-[92svh] flex-col overflow-hidden bg-black">
      {/* Ambient lighting */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(186,30,69,0.18),transparent_36%),radial-gradient(circle_at_72%_18%,rgba(186,30,69,0.07),transparent_30%),linear-gradient(180deg,#000000_0%,#050507_100%)]" />
      </div>

      <div className="container relative z-10 flex flex-1 flex-col justify-center py-24">
        {/* Eyebrow */}
        <motion.div {...fadeUp(0.05)} className="flex items-center gap-4">
          <motion.span
            initial={reduceMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
            className="h-px w-10 origin-left bg-[#BA1E45]"
          />
          <span className="text-xs font-semibold uppercase tracking-[0.45em] text-primary">
            Premium Event Experiences
          </span>
        </motion.div>

        {/* Headline */}
        <h1 className="mt-6 font-black leading-[0.92] tracking-tight text-white">
          {headlineLines.map((line, index) => (
            <motion.span
              key={line}
              {...fadeUp(0.12 + index * 0.08)}
              className="block text-[clamp(3.25rem,10vw,8.5rem)]"
            >
              {line}
            </motion.span>
          ))}
        </h1>

        {/* Copy + buttons (left) · vertical accent (right) */}
        <div className="mt-10 flex items-end justify-between gap-12">
          <div className="max-w-[min(52ch,100%)]">
            <motion.p {...fadeUp(0.42)} className="text-lg leading-8 text-gray-300">
              We create experiences that move people.
            </motion.p>
            <motion.div {...fadeUp(0.5)} className="mt-8 flex flex-wrap gap-4">
              <Link href="/events" className="btn btn-primary">
                Explore Events
              </Link>
              <Link href="/about" className="btn btn-ghost">
                Discover Asterot
              </Link>
            </motion.div>
          </div>

          <div className="hidden items-center gap-6 pb-2 lg:flex" aria-hidden="true">
            <span className="h-16 w-px bg-gradient-to-b from-[#BA1E45]/70 to-white/10" />
            <span className="text-[0.6rem] font-medium uppercase tracking-[0.5em] text-white/40 [writing-mode:vertical-rl]">
              Asterot — Premium Event Experiences
            </span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-col items-center gap-2 text-white/40"
        aria-hidden="true"
      >
        <span className="text-[0.6rem] font-medium uppercase tracking-[0.45em]">SCROLL</span>
        <motion.span
          animate={reduceMotion ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="text-xs"
        >
          ↓
        </motion.span>
      </motion.div>
    </section>
  )
}
