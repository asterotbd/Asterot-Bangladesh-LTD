import Image from 'next/image'
import Link from 'next/link'
import type { NewsArticle } from '../../lib/newsData'

type NewsCardProps = {
  article: NewsArticle
}

export default function NewsCard({ article }: NewsCardProps) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group card-surface flex flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-xl shadow-black/10 transition-colors duration-300 hover:border-white/20"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={article.image}
          alt={article.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            {article.category}
          </span>
          <span className="text-xs text-white/50">{article.date}</span>
        </div>

        <h3 className="mt-4 text-lg font-semibold leading-snug tracking-tight text-white transition-colors duration-300 group-hover:text-primary sm:text-xl">
          {article.title}
        </h3>

        <p className="mt-2.5 line-clamp-3 text-sm leading-6 text-white/55">{article.excerpt}</p>

        <span className="mt-5 inline-flex items-center gap-2 pt-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          Read Story
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  )
}
