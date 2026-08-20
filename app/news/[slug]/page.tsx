import Container from '../../../components/Container'
import RevealSection from '../../../components/RevealSection'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { newsArticles } from '../../../lib/newsData'
import { getPublishedNewsArticleBySlug, getNewsBySlug } from '../../../lib/news-server'

export const dynamic = 'force-dynamic'

// A slug owned by the database (a row exists with it, published or not) must
// never resolve to the static fallback. If the database row exists but is not
// published, the article 404s; only slugs the database does NOT own may fall
// back to the static catalog.
async function resolveArticle(slug: string): Promise<(typeof newsArticles)[number] | null> {
  const dbArticle = await getPublishedNewsArticleBySlug(slug)
  if (dbArticle) return dbArticle
  const owned = await getNewsBySlug(slug)
  if (owned) return null
  return newsArticles.find(a => a.slug === slug) ?? null
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await resolveArticle(params.slug)
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

const URL_PATTERN = /(https?:\/\/[^\s]+)/g

function linkify(text: string) {
  return text.split(URL_PATTERN).map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-4 transition-opacity hover:opacity-80"
      >
        {part}
      </a>
    ) : (
      part
    )
  )
}

export default async function NewsArticlePage({ params }: { params: { slug: string } }) {
  const article = await resolveArticle(params.slug)

  if (!article) {
    notFound()
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
                <p key={index}>{linkify(para)}</p>
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
