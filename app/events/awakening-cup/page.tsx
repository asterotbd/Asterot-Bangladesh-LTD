import Link from 'next/link'
import Container from '../../../components/Container'
import RevealSection from '../../../components/RevealSection'
import AwakeningCupTeaser from '../../../components/AwakeningCupTeaser'
import {
  awakeningCup,
  awakeningVision,
  awakeningExpect,
  awakeningMovement,
  awakeningStayUpdated,
  awakeningCallout
} from '../../../lib/awakening'

const visionIcons = ['◆', '◎', '▲']

export default function AwakeningCupPage() {
  return (
    <main className="bg-black text-white">

      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.18),_transparent_26%),linear-gradient(180deg,#050507_0%,#09090f_100%)] py-24">
        <div className="ambient-layer">
          <div className="ambient-glow" />
          <div className="ambient-dots" />
          <div className="absolute right-8 top-16 h-44 w-44 rounded-full bg-primary/15 blur-3xl ambient-float" />
        </div>
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {awakeningCup.eyebrow}
            </span>
            <h1 className="mt-8 fluid-heading font-black leading-tight tracking-tight">{awakeningCup.title}</h1>
            <p className="mx-auto mt-6 max-w-[min(58ch,100%)] text-lg leading-8 text-gray-300">{awakeningCup.subtitle}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a href="#stay-updated" className="btn btn-primary btn-lg">Stay Updated</a>
              <AwakeningCupTeaser className="btn-lg" />
            </div>
          </div>
        </Container>
      </section>

      {/* Vision */}
      <Container>
        <RevealSection className="py-16 sm:py-20">
          <div className="section-grid items-stretch">
            <div className="flex flex-col justify-center rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 sm:p-10">
              <p className="text-sm uppercase tracking-[0.35em] text-primary">{awakeningVision.eyebrow}</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{awakeningVision.title}</h2>
              <p className="mt-5 text-base leading-8 text-gray-300">{awakeningVision.body}</p>
            </div>

            <div className="grid gap-6">
              {awakeningVision.points.map((point, index) => (
                <div key={point.title} className="card-inner flex items-start gap-4 p-6">
                  <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-primary/15 text-sm text-primary" aria-hidden="true">
                    {visionIcons[index % visionIcons.length]}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{point.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-400">{point.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>
      </Container>

      {/* What to Expect */}
      <Container>
        <RevealSection className="pb-16 sm:pb-20">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.35em] text-primary">What to Expect</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">A national stage, built for the next generation</h2>
            <p className="mt-4 text-gray-300">The Awakening Cup is designed to feel premium from the first teaser to the final whistle — an experience that plays out like cinema.</p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {awakeningExpect.map(item => (
              <article key={item.title} className="card-surface flex flex-col rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-2xl" aria-hidden="true">✦</span>
                <h3 className="mt-5 text-xl font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-gray-400">{item.body}</p>
              </article>
            ))}

            <article className="flex flex-col justify-center rounded-[2rem] border border-dashed border-white/15 bg-black/30 p-8 text-center">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-gray-500">And more to be revealed</p>
              <p className="mt-3 text-2xl font-black tracking-tight text-primary">Stay locked in</p>
              <p className="mx-auto mt-3 max-w-[min(38ch,100%)] text-sm leading-6 text-gray-400">New chapters of the Awakening Cup are announced in the lead-up to the event.</p>
            </article>
          </div>
        </RevealSection>
      </Container>

      {/* The Movement */}
      <Container>
        <RevealSection className="pb-16 sm:pb-20">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,22,90,0.18),transparent_40%),linear-gradient(160deg,#050507_0%,#0a0a11_55%,#12060c_100%)] p-8 text-center shadow-2xl shadow-black/30 sm:p-14">
            <div className="ambient-layer">
              <div className="ambient-glow" />
            </div>
            <div className="relative z-10">
              <p className="text-sm uppercase tracking-[0.35em] text-primary">{awakeningMovement.eyebrow}</p>
              <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{awakeningMovement.title}</h2>
              <p className="mx-auto mt-5 max-w-[min(62ch,100%)] text-base leading-8 text-gray-300">{awakeningMovement.body}</p>
            </div>
          </div>
        </RevealSection>
      </Container>

      {/* Stay Updated */}
      <Container>
        <RevealSection className="pb-16 sm:pb-20" >
          <div id="stay-updated" className="mx-auto max-w-3xl scroll-mt-32 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-primary">{awakeningStayUpdated.eyebrow}</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{awakeningStayUpdated.title}</h2>
            <p className="mx-auto mt-4 max-w-[min(52ch,100%)] text-gray-300">{awakeningStayUpdated.body}</p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a href="mailto:asterotbd@gmail.com?subject=The%20Awakening%20Cup" className="btn btn-primary">Join the Movement</a>
              <AwakeningCupTeaser />
            </div>
            <p className="mt-6 text-xs uppercase tracking-[0.25em] text-gray-500">For now, the countdown stays locked.</p>
          </div>
        </RevealSection>
      </Container>

      {/* Final callout */}
      <section className="py-24 lg:py-[120px]">
        <Container>
          <RevealSection>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="fluid-title font-black tracking-tight text-white">{awakeningCallout}</h2>
              <Link href="/events" className="btn btn-ghost mt-8">Back to All Events</Link>
            </div>
          </RevealSection>
        </Container>
      </section>
    </main>
  )
}
