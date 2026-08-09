"use client"

type NewsCategoryFilterProps = {
  categories: readonly string[]
  active: string
  onChange: (category: string) => void
}

export default function NewsCategoryFilter({ categories, active, onChange }: NewsCategoryFilterProps) {
  const options = ['All', ...categories]

  return (
    <div className="news-filter-scroll -mx-1 flex items-center gap-2 px-1 pb-1" role="group" aria-label="Filter news by category">
      {options.map(category => {
        const isActive = category === active
        return (
          <button
            key={category}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(category)}
            className={
              isActive
                ? 'inline-flex shrink-0 items-center rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black transition-colors duration-200'
                : 'inline-flex shrink-0 items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60 transition-colors duration-200 hover:bg-white/10 hover:text-white'
            }
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}
