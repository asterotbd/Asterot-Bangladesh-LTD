import Container from '../../components/Container'
import RevealSection from '../../components/RevealSection'
import Link from 'next/link'

const sections = [
  {
    title: 'Our Story',
    description: 'How Asterot began and the journey we are on — a movement driven by youth, ambition, and meaningful change.',
    href: '/about/our-story',
    icon: '📖'
  },
  {
    title: 'Mission & Vision',
    description: 'Why we exist and the future we are building — empowering young people and communities through meaningful action.',
    href: '/about/mission-vision',
    icon: '🎯'
  },
  {
    title: 'Our Values',
    description: 'The principles that guide everything we do — Youth, Innovation, Excellence, Integrity, Impact, and Growth.',
    href: '/about/values',
    icon: '💎'
  },
  {
    title: 'Leadership',
    description: 'Meet the people leading Asterot with vision, dedication, and a commitment to creating lasting impact.',
    href: '/about/leadership',
    icon: '👥'
  },
  {
    title: 'Future Vision',
    description: 'Where we are headed — from Bangladesh to the world, one step at a time.',
    href: '/about/future-vision',
    icon: '🚀'
  }
]

const partnerships = [
  {
    title: 'Partnerships',
    description: 'Asterot works with trusted sponsors and partners to deliver events that connect communities and support strategic objectives.'
  },
  {
    title: 'CSR & Sustainability',
    description: 'We are committed to responsible event delivery, community engagement, and sustainable practices that support people and local impact over time.'
  }
]

export default function AboutOverviewPage() {
  return (
    <main className="bg-black text-white">

      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.18),_transparent_22%),linear-gradient(180deg,#050507_0%,#09090f_100%)] py-24">
        <div className="ambient-layer">
          <div className="ambient-glow" />
          <div className="ambient-dots" />
        </div>
        <Container>
          <div className="hero-grid">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.35em] text-primary">About Us</p>
              <h1 className="max-w-[min(70ch,100%)] fluid-heading font-black leading-tight tracking-tight">Asterot Bangladesh Limited</h1>
              <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">Asterot is a premium event organization focused on delivering memorable sports events, corporate program experiences, entertainment productions, tournaments, conferences, branding activations and high-impact marketing events across Bangladesh.</p>
              <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">We combine strategic planning, polished production and collaborative partnerships to bring powerful leadership events to life for audiences, communities and organizations.</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 sm:p-10">
              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-primary">Our commitment</p>
                  <h2 className="mt-4 text-3xl font-semibold">Purpose-driven event excellence</h2>
                  <p className="mt-4 text-gray-300">Asterot builds premium experiences that uplift leadership, strengthen brands, and create meaningful community impact through events that matter.</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
                    <h3 className="font-semibold">Strategic planning</h3>
                    <p className="mt-2 text-sm text-gray-300">From concept to delivery, every event is designed with clear goals, strong production and measurable outcomes.</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
                    <h3 className="font-semibold">Collaborative partnerships</h3>
                    <p className="mt-2 text-sm text-gray-300">We work closely with sponsors, stakeholders and teams to deliver seamless experiences and trusted results.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Explore sections */}
      <Container>
        <section className="py-16 sm:py-20">
          <RevealSection>
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-primary">Explore Asterot</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Learn more about who we are</h2>
              <p className="mt-4 text-gray-300">Dive deeper into our story, mission, values, leadership, and vision for the future.</p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map(section => (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group card-surface flex flex-col rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-2xl">{section.icon}</span>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight">{section.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-gray-400">{section.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform duration-200 group-hover:translate-x-1">
                    Learn More <span aria-hidden="true">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </RevealSection>
        </section>

        {/* Partnerships + CSR */}
        <RevealSection className="section-grid pb-16 sm:pb-20">
          {partnerships.map(item => (
            <div key={item.title} className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10 sm:p-10">
              <h2 className="text-2xl font-semibold">{item.title}</h2>
              <p className="mt-4 text-gray-300 leading-7">{item.description}</p>
            </div>
          ))}
        </RevealSection>
      </Container>
    </main>
  )
}
