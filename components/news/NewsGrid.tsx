"use client"
import NewsCard from './NewsCard'
import type { NewsArticle } from '../../lib/newsData'

type NewsGridProps = {
  articles: NewsArticle[]
}

export default function NewsGrid({ articles }: NewsGridProps) {
  if (articles.length === 0) {
    return (
      <p className="rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center text-sm text-white/50">
        No stories in this category yet.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map(article => (
        <NewsCard key={article.slug} article={article} />
      ))}
    </div>
  )
}
