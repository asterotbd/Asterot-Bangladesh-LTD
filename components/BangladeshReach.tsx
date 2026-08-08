"use client"
import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Container from './Container'
import RevealSection from './RevealSection'
import { bangladeshDivisions } from '../lib/bangladesh'

const HOLD_MS = 2800
const EASE = [0.22, 1, 0.36, 1]
const DIVISION_COUNT = bangladeshDivisions.length

export default function BangladeshReach() {
  const reduceMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const [supportsHover, setSupportsHover] = useState(false)
  // Single hover state. While the pointer is over a division the automatic
  // cycle is paused and the active index is locked to that division. Leaving
  // the map clears it so the cycle resumes from the current division. Desktop
  // hover only — touch devices keep the automatic animation untouched.
  const hoveredRef = useRef<string | null>(null)

  useEffect(() => {
    setSupportsHover(window.matchMedia('(hover: hover)').matches)
  }, [])

  // Single authoritative timing controller. The cycle is driven by exactly one
  // interval that advances an index; it never depends on an SVG animation
  // completing, so a failed/interrupted animation can never stop the sequence.
  useEffect(() => {
    if (reduceMotion) return

    const advance = () => {
      if (hoveredRef.current) return
      setActiveIndex(current => (current + 1) % DIVISION_COUNT)
    }

    let timer = window.setInterval(advance, HOLD_MS)

    // Pause while the tab is hidden and resume from the current division when
    // the user returns. Always clear before (re)creating so there can never be
    // two timers running at once.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        window.clearInterval(timer)
      } else {
        window.clearInterval(timer)
        timer = window.setInterval(advance, HOLD_MS)
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [reduceMotion])

  const active = bangladeshDivisions[activeIndex]

  const handlePointerEnter = (id: string) => {
    if (!supportsHover || hoveredRef.current === id) return
    hoveredRef.current = id
    setActiveIndex(bangladeshDivisions.findIndex(d => d.id === id))
  }

  const handlePointerLeave = () => {
    if (!supportsHover || hoveredRef.current === null) return
    hoveredRef.current = null
  }

  const trailPath = bangladeshDivisions
    .map(d => `${d.cx},${d.cy}`)
    .join(' ')

  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      <Container>
        <RevealSection className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          {/* Copy column */}
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-primary">Nationwide reach</p>
            <h2 className="mt-4 text-balance text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              We Serve
              <span className="block text-primary">Bangladesh</span>
            </h2>
            <p className="mt-6 max-w-[min(48ch,100%)] text-lg leading-8 text-gray-300">
              From Dhaka to every corner of Bangladesh, we create experiences that bring people together.
            </p>
            <p className="sr-only">
              Asterot serves all eight administrative divisions of Bangladesh: Dhaka, Chattogram, Rajshahi, Khulna, Barishal, Sylhet, Rangpur, and Mymensingh.
            </p>
          </div>

          {/* Map column */}
          <div className="relative">
            <div className="relative mx-auto w-full max-w-[min(30rem,100%)]">
              {/* Ambient glow behind map */}
              <div aria-hidden="true" className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_50%_50%,rgba(186,30,69,0.12),transparent_68%)]" />

              <svg
                viewBox="160 30 700 950"
                className="relative z-10 w-full overflow-visible"
                role="img"
                aria-label="Map of Bangladesh with eight divisions"
                onPointerLeave={handlePointerLeave}
                onPointerMove={(event) => {
                  if (event.target === event.currentTarget) handlePointerLeave()
                }}
              >
                <defs>
                  <linearGradient id="bd-active-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#BA1E45" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#BA1E45" stopOpacity="0.06" />
                  </linearGradient>
                  <radialGradient id="bd-pulse" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#BA1E45" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#BA1E45" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="bd-route-stroke" x1="0" y1="0" x2="700" y2="950" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                    <stop offset="50%" stopColor="#BA1E45" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Route light trail */}
                {!reduceMotion && (
                  <polyline
                    points={trailPath}
                    fill="none"
                    stroke="url(#bd-route-stroke)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="3 30"
                    className="bd-route"
                    opacity="0.55"
                    pointerEvents="none"
                  />
                )}

                {/* All divisions — together they form the complete country outline */}
                {bangladeshDivisions.map(division => (
                  <path
                    key={division.id}
                    d={division.path}
                    data-division={division.id}
                    aria-label={`${division.name} division`}
                    fill="#0B0B12"
                    stroke={division.id === active.id ? '#BA1E45' : 'rgba(255,255,255,0.12)'}
                    strokeWidth={division.id === active.id ? 4 : 2.5}
                    fillOpacity={division.id === active.id ? 1 : 1}
                    className="cursor-pointer transition-[stroke,stroke-width] duration-700"
                    opacity={division.id === active.id ? 1 : 0.85}
                    onPointerEnter={() => handlePointerEnter(division.id)}
                  />
                ))}

                {/* Active division illumination — keyed remount fades the new
                    highlight in; no exit animation is awaited, so the old one is
                    replaced immediately and exactly one division is ever active. */}
                <motion.path
                  key={active.id}
                  d={active.path}
                  fill="url(#bd-active-fill)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, ease: EASE }}
                  pointerEvents="none"
                />

                {/* Soft pulse from active center */}
                {!reduceMotion && (
                  <motion.circle
                    key={`pulse-${active.id}`}
                    cx={active.cx}
                    cy={active.cy}
                    r={24}
                    fill="url(#bd-pulse)"
                    initial={{ scale: 0.4, opacity: 0.9 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 1.8, ease: 'easeOut' }}
                    pointerEvents="none"
                  />
                )}

                {/* Active center point */}
                <motion.circle
                  key={`point-${active.id}`}
                  cx={active.cx}
                  cy={active.cy}
                  r={5.5}
                  fill="#fff"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  pointerEvents="none"
                />
              </svg>

              {/* Division name */}
              <div className="relative z-10 mt-6 flex items-center justify-center gap-6">
                <span aria-hidden="true" className="h-px w-8 bg-white/15" />
                <div className="text-center">
                  <p className="text-[0.6rem] font-medium uppercase tracking-[0.5em] text-white/40">
                    Asterot in
                  </p>
                  <div className="relative mt-1 flex h-10 items-center justify-center overflow-hidden">
                    <motion.p
                      key={active.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: EASE }}
                      className="text-2xl font-black tracking-[0.22em] text-white"
                    >
                      {active.name}
                    </motion.p>
                  </div>
                </div>
                <span aria-hidden="true" className="h-px w-8 bg-white/15" />
              </div>

              {/* Sequence indicator */}
              <p className="mt-3 text-center text-xs tabular-nums tracking-[0.3em] text-white/35">
                {String(activeIndex + 1).padStart(2, '0')}
                <span className="mx-1.5 text-white/20">/</span>
                {String(DIVISION_COUNT).padStart(2, '0')}
              </p>
            </div>
          </div>
        </RevealSection>
      </Container>
    </section>
  )
}
