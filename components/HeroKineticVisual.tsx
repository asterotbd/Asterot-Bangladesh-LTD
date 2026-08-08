"use client"
import { motion, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import type { MotionValue } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1]

type HeroKineticVisualProps = {
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
}

const PARTICLES = [
  { top: '18%', left: '22%', size: 3, duration: 11, delay: 0 },
  { top: '30%', left: '82%', size: 2, duration: 14, delay: 2 },
  { top: '62%', left: '88%', size: 2, duration: 10, delay: 4 },
  { top: '74%', left: '30%', size: 3, duration: 15, delay: 1 },
  { top: '48%', left: '8%', size: 2, duration: 12, delay: 3 },
  { top: '12%', left: '58%', size: 2, duration: 13, delay: 5 }
]

export default function HeroKineticVisual({ mouseX, mouseY }: HeroKineticVisualProps) {
  const reduceMotion = useReducedMotion()

  const depthA = useSpring(mouseX, { stiffness: 50, damping: 22 })
  const depthB = useSpring(mouseY, { stiffness: 50, damping: 22 })
  const xA = useTransform(depthA, [-0.5, 0.5], [-7, 7])
  const yA = useTransform(depthB, [-0.5, 0.5], [-5, 5])
  const xB = useTransform(depthA, [-0.5, 0.5], [-12, 12])
  const yB = useTransform(depthB, [-0.5, 0.5], [-8, 8])
  const xC = useTransform(depthA, [-0.5, 0.5], [-4, 4])
  const yC = useTransform(depthB, [-0.5, 0.5], [-3, 3])

  return (
    <div className="relative mx-auto aspect-square w-[min(30rem,56vw)] max-w-full" aria-hidden="true">
      {/* Subtle atmospheric glow behind the sculpture */}
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(186,30,69,0.08),transparent_62%)]" />

      <svg
        viewBox="0 0 400 400"
        className="relative z-10 h-full w-full overflow-visible"
        fill="none"
      >
        <defs>
          <linearGradient id="kg-arc" x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.02" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="kg-arc-accent" x1="400" y1="0" x2="0" y2="400" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#BA1E45" stopOpacity="0.02" />
            <stop offset="48%" stopColor="#BA1E45" stopOpacity="0.5" />
            <stop offset="52%" stopColor="#BA1E45" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#BA1E45" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="kg-pulse" x1="0" y1="0" x2="400" y2="400" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="50%" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="kg-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Deep layer — slow counter-rotating arc */}
        <motion.g style={reduceMotion ? undefined : { x: xA, y: yA }}>
          <g className="kinetic-arc-b">
            <path
              d="M 132 84 A 140 140 0 0 1 316 150"
              stroke="url(#kg-arc)"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.6"
            />
          </g>
        </motion.g>

        {/* Mid layer — main slow rotating arc */}
        <motion.g style={reduceMotion ? undefined : { x: xB, y: yB }}>
          <g className="kinetic-arc-a">
            <path
              d="M 74 200 A 126 126 0 0 1 308 92"
              stroke="url(#kg-arc)"
              strokeWidth="1.25"
              strokeLinecap="round"
              opacity="0.75"
            />
          </g>
        </motion.g>

        {/* Accent arc — subtle burgundy */}
        <motion.g style={reduceMotion ? undefined : { x: xB, y: yB }}>
          <g className="kinetic-arc-a" style={{ animationDuration: '31s' }}>
            <path
              d="M 260 336 A 140 140 0 0 1 88 274"
              stroke="url(#kg-arc-accent)"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.55"
            />
          </g>
        </motion.g>

        {/* Near layer — soft drifting arc */}
        <motion.g style={reduceMotion ? undefined : { x: xC, y: yC }}>
          <g className="kinetic-arc-c">
            <path
              d="M 150 318 A 92 92 0 0 1 262 108"
              stroke="url(#kg-arc)"
              strokeWidth="1.75"
              strokeLinecap="round"
              opacity="0.5"
            />
          </g>
        </motion.g>

        {/* Traveling light pulse along the main arc */}
        <g className="kinetic-pulse">
          <path
            d="M 74 200 A 126 126 0 0 1 308 92"
            stroke="url(#kg-pulse)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* Calm central core */}
        <circle cx="200" cy="200" r="30" fill="url(#kg-core)" opacity="0.5" />
        <circle cx="200" cy="200" r="2" fill="#fff" opacity="0.85" />
      </svg>

      {/* Floating light dust */}
      {PARTICLES.map((p, index) => (
        <span
          key={index}
          className="kinetic-particle absolute rounded-full bg-white/50"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            ['--drift-duration' as string]: `${p.duration}s`,
            ['--drift-delay' as string]: `${p.delay}s`
          }}
        />
      ))}
    </div>
  )
}
