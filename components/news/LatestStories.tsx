"use client"
import { useState } from 'react'
import NewsCategoryFilter from './NewsCategoryFilter'
import NewsGrid from './NewsGrid'
import type { NewsArticle } from '../../lib/newsData'

type LatestStoriesProps = {
  articles: NewsArticle[]
  categories: readonly string[]
}

export default function LatestStories({ articles, categories }: LatestStoriesProps) {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered =
    activeCategory === 'All'
      ? articles
      : articles.filter(article => article.category === activeCategory)

  return (
    <section aria-labelledby="latest-stories-heading">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 border-b border-white/10 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">News Archive</p>
          <h2 id="latest-stories-heading" className="fluid-title mt-3 font-bold tracking-tight">
            Latest Stories
          </h2>
        </div>
        <NewsCategoryFilter categories={categories} active={activeCategory} onChange={setActiveCategory} />
      </div>

      <div className="mt-10">
        <NewsGrid articles={filtered} />
      </div>
    </section>
  )
}
