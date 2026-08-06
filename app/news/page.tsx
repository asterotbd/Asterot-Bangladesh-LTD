import Container from '../../components/Container'
import RevealSection from '../../components/RevealSection'
import Link from 'next/link'
import { newsArticles } from '../../lib/newsData'

const categories = ['Latest News', 'Announcements', 'Articles / Updates'] as const

export default function NewsPage() {
  return (
    <main className="bg-black text-white">

      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,22,90,0.16),_transparent_26%),linear-gradient(180deg,#050507_0%,#09090f_100%)] py-24">
        <div className="ambient-layer">
          <div className="ambient-glow" />
          <div className="ambient-dots" />
        </div>
        <Container>
          <div className="max-w-3xl space-y-5">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.35em] text-primary">News</span>
            <h1 className="fluid-title font-black leading-tight tracking-tight">Latest Updates</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">News and insights on upcoming projects, partnerships and event activity from Asterot Bangladesh Limited.</p>
          </div>
        </Container>
      </section>

      {/* News articles list */}
      <Container>
        <RevealSection className="py-16 sm:py-20">
          <div className="grid gap-6 sm:grid-cols-2">
            {newsArticles.map(article => (
              <Link
                key={article.slug}
                href={`/news/${article.slug}`}
                className="group card-surface flex flex-col rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10 transition hover:border-primary hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-primary">{article.category}</span>
                  <span className="text-xs text-gray-400">{article.date}</span>
                </div>
                <h2 className="mt-5 text-xl font-semibold tracking-tight group-hover:text-primary">{article.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-gray-400">{article.excerpt}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform duration-200 group-hover:translate-x-1">
                  Read More <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </RevealSection>

        {/* News categories */}
        <RevealSection className="pb-16 sm:pb-20">
          <p className="text-sm uppercase tracking-[0.35em] text-primary">News Categories</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">Browse by category</h2>
          <div className="card-grid mt-8">
            {categories.map(category => {
              const count = newsArticles.filter(a => a.category === category).length
              return (
                <div key={category} className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
                  <h3 className="text-xl font-semibold">{category}</h3>
                  <p className="mt-2 text-sm text-gray-400">{count} article{count === 1 ? '' : 's'}</p>
                </div>
              )
            })}
          </div>
        </RevealSection>
      </Container>
    </main>
  )
}
