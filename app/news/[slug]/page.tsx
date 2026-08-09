import Container from '../../../components/Container'
import RevealSection from '../../../components/RevealSection'
import Link from 'next/link'
import type { Metadata } from 'next'
import { newsArticles } from '../../../lib/newsData'

export function generateStaticParams() {
  return newsArticles.map(article => ({ slug: article.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = newsArticles.find(a => a.slug === params.slug)
  if (!article) {
    return { title: 'Article Not Found' }
  }
  return {
    title: article.title,
    description: article.excerpt,
    alternates: {
      canonical: `https://www.asterot.com/news/${article.slug}`
    }
  }
}

export default function NewsArticlePage({ params }: { params: { slug: string } }) {
  const article = newsArticles.find(a => a.slug === params.slug)

  if (!article) {
    return (
      <main className="bg-black text-white">
        <Container>
          <section className="py-28 text-center">
            <h1 className="text-4xl font-bold">Article not found</h1>
            <p className="mt-4 text-gray-300">The article you are looking for does not exist.</p>
            <Link href="/news" className="btn btn-primary mt-8">
              Back to News
            </Link>
          </section>
        </Container>
      </main>
    )
  }

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
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-primary">{article.category}</span>
              <span className="text-sm text-gray-400">{article.date}</span>
            </div>
            <h1 className="fluid-title font-black leading-tight tracking-tight">{article.title}</h1>
            <p className="max-w-[min(65ch,100%)] text-lg leading-8 text-gray-300">{article.excerpt}</p>
          </div>
        </Container>
      </section>

      {/* Article content */}
      <Container>
        <RevealSection className="py-16 sm:py-20">
          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10 sm:p-14">
            <div className="space-y-5 text-gray-300 leading-8">
              {article.content.map((para, index) => (
                <p key={index}>{para}</p>
              ))}
            </div>
          </article>
        </RevealSection>

        {/* Back to news */}
        <RevealSection className="pb-16 sm:pb-20">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[2rem] border border-white/10 bg-black/40 p-8">
            <div>
              <h2 className="text-2xl font-semibold">More news</h2>
              <p className="mt-2 text-gray-400">Browse the latest updates and announcements.</p>
            </div>
            <Link href="/news" className="btn btn-primary">
              Back to News
            </Link>
          </div>
        </RevealSection>
      </Container>
    </main>
  )
}
