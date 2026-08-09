import Container from '../../components/Container'
import RevealSection from '../../components/RevealSection'
import FeaturedNews from '../../components/news/FeaturedNews'
import LatestStories from '../../components/news/LatestStories'
import { newsArticles, newsCategories } from '../../lib/newsData'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'News',
  description: 'Latest news, announcements, updates and stories from Asterot Bangladesh Limited.',
  alternates: {
    canonical: 'https://www.asterot.com/news'
  }
}

const featuredArticles = newsArticles.filter(article => article.featured)
const nonFeaturedArticles = newsArticles.filter(article => !article.featured)
const latestArticles = nonFeaturedArticles.length > 0 ? nonFeaturedArticles : newsArticles

export default function NewsPage() {
  return (
    <main className="news-page bg-black text-white">
      {/* Scoped ambient background — exists only on /news */}
      <div aria-hidden="true" className="news-page-bg">
        <div className="news-orb news-orb-a" />
        <div className="news-orb news-orb-b" />
        <div className="news-orb news-orb-c" />
        <div className="news-grain" />
      </div>

      <Container>
        <div className="relative">
          {/* Page header */}
          <RevealSection className="pt-24 sm:pt-28">
            <header className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-primary">
                News
              </span>
              <h1 className="fluid-heading mt-6 font-black leading-tight tracking-tight">Latest Updates</h1>
              <p className="mt-5 max-w-[min(62ch,100%)] text-lg leading-8 text-white/60">
                News and insights on upcoming projects, partnerships and event activity from Asterot Bangladesh Limited.
              </p>
            </header>
          </RevealSection>

          {/* Featured news rotator */}
          <RevealSection className="mt-12 sm:mt-16">
            <FeaturedNews articles={featuredArticles} />
          </RevealSection>

          {/* Latest stories + category filter */}
          <RevealSection className="py-20 sm:py-28">
            <LatestStories articles={latestArticles} categories={newsCategories} />
          </RevealSection>
        </div>
      </Container>
    </main>
  )
}
