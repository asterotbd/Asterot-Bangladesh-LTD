import Link from 'next/link'
import Container from './Container'
import RevealSection from './RevealSection'
import AwakeningCupTeaser from './AwakeningCupTeaser'
import { awakeningCup } from '../lib/awakening'

const particles = Array.from({ length: 14 }, (_, i) => ({
  left: `${6 + ((i * 37) % 88)}%`,
  size: `${3 + ((i * 7) % 3)}px`,
  delay: `${(i * 1.7) % 14}s`,
  duration: `${11 + ((i * 5) % 7)}s`,
  opacity: 0.35 + ((i * 11) % 45) / 100,
  drift: `${(i % 2 === 0 ? 1 : -1) * (8 + ((i * 3) % 16))}px`
}))

function LockIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="4" y="11" width="16" height="10" rx="2.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export default function FeaturedEvent() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-[120px]">
      <div className="ambient-layer">
        <div className="ambient-glow" />
      </div>

      <Container>
        <div className="mx-auto max-w-7xl">
          <RevealSection>
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-primary">{awakeningCup.sectionTitle}</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">A national moment, on its way</h2>
            </div>

            {/* Cinematic hero card */}
            <div className="relative mt-10 overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl shadow-black/50">
              {/* Dark gradient base */}
              <div className="absolute inset-0 featured-gradient bg-[radial-gradient(circle_at_top_left,rgba(255,22,90,0.22),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(255,45,109,0.14),transparent_40%),linear-gradient(160deg,#050507_0%,#0a0a11_45%,#12060c_100%)]" aria-hidden="true" />

              {/* Soft crimson glow */}
              <div className="ambient-layer">
                <div className="ambient-glow" />
                <div className="absolute -right-16 top-0 h-80 w-80 rounded-full bg-primary/20 blur-3xl ambient-float" />
                <div className="absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-accent/10 blur-3xl ambient-float" />
              </div>

              {/* Rising particles */}
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                {particles.map((particle, index) => (
                  <span
                    key={index}
                    className="featured-particle"
                    style={{
                      left: particle.left,
                      ['--particle-size' as string]: particle.size,
                      ['--particle-opacity' as string]: particle.opacity,
                      ['--particle-delay' as string]: particle.delay,
                      ['--particle-duration' as string]: particle.duration,
                      ['--particle-drift' as string]: particle.drift
                    }}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-10">
                <div className="p-8 sm:p-12 lg:p-14">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {awakeningCup.eyebrow}
                  </span>

                  <h3 className="mt-6 fluid-title font-black leading-tight tracking-tight">
                    {awakeningCup.title}
                  </h3>

                  <p className="mt-5 text-lg font-medium leading-relaxed text-white/90">{awakeningCup.subtitle}</p>
                  <p className="mt-4 max-w-[min(58ch,100%)] text-base leading-7 text-gray-300">{awakeningCup.description}</p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {awakeningCup.chips.map(chip => (
                      <span
                        key={chip}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {chip}
                      </span>
                    ))}
                  </div>

                  <div className="mt-10 flex flex-wrap gap-4">
                    <Link href="/events/awakening-cup" className="btn btn-primary btn-lg">
                      Explore Event
                      <span aria-hidden="true">→</span>
                    </Link>
                    <AwakeningCupTeaser className="btn-lg" />
                  </div>
                </div>

                {/* Countdown placeholder card */}
                <div className="p-8 sm:p-12 lg:py-14 lg:pr-14 lg:pl-0">
                  <div className="flex h-full flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-black/40 p-8 text-center shadow-xl shadow-black/30 backdrop-blur-sm">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-primary">
                      <LockIcon className="h-6 w-6" />
                    </span>
                    <p className="mt-6 text-sm font-semibold uppercase tracking-[0.35em] text-primary">Reveal locked</p>
                    <h4 className="mt-4 text-2xl font-semibold leading-snug tracking-tight text-white">{awakeningCup.countdownTitle}</h4>
                    <p className="mt-4 text-sm leading-6 text-gray-400">Every detail drops when the moment is right — no leaks, no spoilers.</p>
                    <div className="mt-8 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-gray-500">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden="true" />
                      Stay tuned
                    </div>
                  </div>
                </div>
              </div>

              {/* Teaser line */}
              <div className="relative z-10 border-t border-white/10 px-8 py-6 text-center sm:px-12">
                <p className="text-sm font-medium uppercase tracking-[0.35em] text-gray-300">
                  {awakeningCup.teaserLine}
                </p>
              </div>
            </div>
          </RevealSection>
        </div>
      </Container>
    </section>
  )
}
