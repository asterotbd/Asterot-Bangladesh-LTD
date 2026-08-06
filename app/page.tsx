import Container from '../components/Container'
import NewsSlider from '../components/NewsSlider'
import RevealSection from '../components/RevealSection'
import CompaniesMarquee from '../components/CompaniesMarquee'
import { newsArticles } from '../lib/newsData'
import type { NewsItem } from '../components/NewsSlider'

const services = [
  { title: 'Event Strategy', description: 'Professional planning and production across sports, corporate, entertainment and brand campaigns.' },
  { title: 'Sports Tournaments', description: 'Organizing sports competitions and tournaments with operational precision.' },
  { title: 'Corporate Programs', description: 'Managing conferences, meetings, seminars and executive gatherings.' },
  { title: 'Branded Experiences', description: 'Delivering activations, sponsorship campaigns and high-impact marketing events.' }
]

const featuredEventCategories = [
  'Sports tournaments and athletic events',
  'Corporate and conference programs',
  'Entertainment shows and live experiences',
  'Branding, marketing and sponsorship activations'
]

const toNewsItem = (article: typeof newsArticles[number]): NewsItem => ({
  id: article.slug,
  title_en: article.title,
  slug: article.slug,
  excerpt_en: article.excerpt,
  published_at: article.date,
  category: { name_en: article.category },
  featured_image: null
})

export default function Home() {
  const items = newsArticles.map(toNewsItem)
  const latestNews = items.filter(item => item.category?.name_en?.toLowerCase().includes('latest'))
  const announcements = items.filter(item => item.category?.name_en?.toLowerCase() === 'announcements')

  return (
    <main className="bg-black text-white">

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.18),_transparent_22%),linear-gradient(180deg,#050507_0%,#09090f_100%)] py-24">
        <div className="ambient-layer">
          <div className="ambient-glow" />
          <div className="ambient-dots" />
          <div className="absolute right-0 top-10 h-36 w-36 rounded-full bg-primary/10 blur-3xl ambient-float" />
          <div className="absolute left-4 bottom-10 h-28 w-28 rounded-full bg-white/5 blur-3xl ambient-float" />
        </div>
        <Container>
          <div className="hero-grid">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-gray-300">Premium event leadership</span>
              <h1 className="max-w-[min(70ch,100%)] fluid-heading font-black leading-tight tracking-tight">Asterot Bangladesh Limited</h1>
              <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">Asterot delivers premium event production across sports, corporate programs, concerts, tournaments, conferences, branding and marketing activations in Bangladesh.</p>
              <div className="flex flex-wrap gap-4">
                <a href="/events" className="btn btn-primary">Explore Events</a>
                <a href="/about" className="btn btn-ghost">Learn About Us</a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 shadow-2xl shadow-black/20">
              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-primary">Why Asterot</p>
                  <h2 className="mt-4 text-3xl font-semibold">Events that awaken leadership</h2>
                  <p className="mt-4 text-gray-300">Asterot focuses on polished execution, strong partner collaboration and modern production for every event.</p>
                </div>

                <div className="gallery-grid">
                  {services.map(service => (
                    <div key={service.title} className="rounded-3xl border border-white/10 bg-black/40 p-5">
                      <h3 className="font-semibold">{service.title}</h3>
                      <p className="mt-2 text-sm text-gray-300">{service.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container>
          <div className="rounded-full border border-white/10 bg-[rgba(13,13,18,0.55)] px-6 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-[14px] backdrop-saturate-150 sm:px-8">
            <CompaniesMarquee heading="Companies We've Worked With" />
          </div>
        </Container>
      </section>

      <Container>
        <section className="py-16 sm:py-20">
          <RevealSection>
            <NewsSlider latestNews={latestNews} announcements={announcements} />
          </RevealSection>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 card-surface sm:p-10">
          <div className="mx-auto max-w-[min(70ch,100%)] text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-primary">About Asterot</p>
            <h2 className="mt-4 text-3xl font-semibold">Asterot Bangladesh Limited organizes premium events in Bangladesh</h2>
            <p className="mt-4 text-gray-300">Asterot runs professional events, sports competitions, corporate programs, tournaments, conferences, entertainment productions, branding and marketing activities.</p>
            <p className="mt-4 text-gray-400">The company delivers structured event management with a premium focus on partner support and audience experience.</p>
          </div>
        </section>

        <section className="section-grid py-16 sm:py-20">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 sm:p-10">
            <p className="text-sm uppercase tracking-[0.35em] text-primary">Core services</p>
            <h2 className="mt-4 text-3xl font-semibold">Capabilities</h2>
            <p className="mt-4 text-gray-300">Asterot provides a full range of event management capabilities for sports, corporate, entertainment and brand-focused programs.</p>
            <div className="gallery-grid mt-8">
              {services.map(service => (
                <div key={service.title} className="rounded-3xl border border-white/10 bg-black/40 p-5">
                  <h3 className="font-semibold">{service.title}</h3>
                  <p className="mt-2 text-sm text-gray-300">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-black/40 p-8 shadow-2xl shadow-black/20 sm:p-10">
            <p className="text-sm uppercase tracking-[0.35em] text-primary">Featured events</p>
            <h2 className="mt-4 text-3xl font-semibold">Event categories</h2>
            <p className="mt-4 text-gray-300">Asterot’s event portfolio centers on sports tournaments, corporate gatherings, entertainment programs and branding activations.</p>
            <ul className="mt-8 space-y-4 text-gray-300">
              {featuredEventCategories.map(item => (
                <li key={item} className="rounded-3xl border border-white/10 bg-white/5 p-4">{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl shadow-black/20 sm:p-12">
          <div className="ambient-layer">
            <div className="ambient-glow" />
          </div>
          <p className="text-sm uppercase tracking-[0.35em] text-primary">Partner with Asterot</p>
          <h2 className="mt-4 text-balance text-4xl font-semibold">Let's deliver your next great event</h2>
          <p className="mx-auto mt-6 max-w-[min(65ch,100%)] text-gray-300">From tournaments and conferences to concerts and brand activations, we handle the planning and production end to end.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a href="/events" className="btn btn-primary">View Events</a>
            <a href="/contact" className="btn btn-ghost">Contact Us</a>
          </div>
        </section>
      </Container>

    </main>
  )
}
