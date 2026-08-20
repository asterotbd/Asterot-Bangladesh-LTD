import Link from 'next/link'

function buildPageHref(base: string, page: number): string {
  return `${base}${base.includes('?') ? '&' : '?'}page=${page}`
}

function buildPageWindow(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const window: (number | 'ellipsis')[] = [1]
  if (current - 2 > 2) window.push('ellipsis')
  for (let n = Math.max(2, current - 2); n <= Math.min(total - 1, current + 2); n++) window.push(n)
  if (current + 2 < total - 1) window.push('ellipsis')
  window.push(total)
  return window
}

export default function Pagination({ page, totalPages, baseUrl }: { page: number; totalPages: number; baseUrl: string }) {
  if (totalPages <= 1) return null
  const pageClass = 'inline-flex min-w-9 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors'
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={buildPageHref(baseUrl, page - 1)} className={`${pageClass} border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10`}>
          Previous
        </Link>
      )}
      {buildPageWindow(page, totalPages).map((entry, index) =>
        entry === 'ellipsis' ? (
          <span key={`ellipsis-${index}`} className="px-2 py-2 text-sm text-gray-500">
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={buildPageHref(baseUrl, entry)}
            aria-current={entry === page ? 'page' : undefined}
            className={`${pageClass} ${
              entry === page ? 'bg-primary text-white' : 'border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            {entry}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link href={buildPageHref(baseUrl, page + 1)} className={`${pageClass} border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10`}>
          Next
        </Link>
      )}
    </nav>
  )
}
