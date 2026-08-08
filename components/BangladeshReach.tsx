"use client"
import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Container from './Container'
import RevealSection from './RevealSection'
import {
  bangladeshDivisions,
  bangladeshSequence,
  bangladeshSilhouette
} from '../lib/bangladesh'

const HOLD_MS = 2800
const EASE = [0.22, 1, 0.36, 1]

function getDivision(id: string) {
  return bangladeshDivisions.find(d => d.id === id) ?? bangladeshDivisions[0]
}

export default function BangladeshReach() {
  const reduceMotion = useReducedMotion()
  const [activeId, setActiveId] = useState(bangladeshSequence[0])

  useEffect(() => {
    if (reduceMotion) return
    const timer = window.setInterval(() => {
      setActiveId(current => {
        const index = bangladeshSequence.indexOf(current)
        return bangladeshSequence[(index + 1) % bangladeshSequence.length]
      })
    }, HOLD_MS)
    return () => window.clearInterval(timer)
  }, [reduceMotion])

  const active = getDivision(activeId)
  const activeIndex = bangladeshSequence.indexOf(activeId)

  const trailPath = bangladeshSequence
    .map(id => {
      const d = getDivision(id)
      return `${d.cx},${d.cy}`
    })
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
                  />
                )}

                {/* Base silhouette */}
                <path
                  d={bangladeshSilhouette}
                  fill="#0A0A0F"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="3"
                />

                {/* All divisions, subdued */}
                {bangladeshDivisions.map(division => (
                  <path
                    key={division.id}
                    d={division.path}
                    fill="#0B0B12"
                    stroke={division.id === activeId ? '#BA1E45' : 'rgba(255,255,255,0.12)'}
                    strokeWidth={division.id === activeId ? 4 : 2.5}
                    fillOpacity={division.id === activeId ? 1 : 1}
                    className="transition-[stroke,stroke-width] duration-700"
                    opacity={division.id === activeId ? 1 : 0.85}
                  />
                ))}

                {/* Active division illumination */}
                <AnimatePresence mode="wait">
                  <motion.path
                    key={active.id}
                    d={active.path}
                    fill="url(#bd-active-fill)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: EASE }}
                  />
                </AnimatePresence>

                {/* Soft pulse from active center */}
                <AnimatePresence>
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
                    />
                  )}
                </AnimatePresence>

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
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={active.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.6, ease: EASE }}
                        className="text-2xl font-black tracking-[0.22em] text-white"
                      >
                        {active.name}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
                <span aria-hidden="true" className="h-px w-8 bg-white/15" />
              </div>

              {/* Sequence indicator */}
              <p className="mt-3 text-center text-xs tabular-nums tracking-[0.3em] text-white/35">
                {String(activeIndex + 1).padStart(2, '0')}
                <span className="mx-1.5 text-white/20">/</span>
                {String(bangladeshSequence.length).padStart(2, '0')}
              </p>
            </div>
          </div>
        </RevealSection>
      </Container>
    </section>
  )
}
