"use client"

type ViewOption = {
  id: string
  label: string
  icon?: React.ReactNode
}

type MediaToolbarProps = {
  categories: string[]
  activeCategory: string
  onCategoryChange: (category: string) => void
  viewOptions: ViewOption[]
  activeView: string
  onViewChange: (view: string) => void
  resultCount: number
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}

function MasonryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
      <rect x="3" y="3" width="7" height="12" rx="1.5" />
      <rect x="14" y="3" width="7" height="8" rx="1.5" />
      <rect x="14" y="15" width="7" height="6" rx="1.5" />
      <rect x="3" y="19" width="7" height="2" rx="1" />
    </svg>
  )
}

export function GridViewIcon() {
  return <GridIcon />
}

export function ListViewIcon() {
  return <ListIcon />
}

export function MasonryViewIcon() {
  return <MasonryIcon />
}

export default function MediaToolbar({
  categories,
  activeCategory,
  onCategoryChange,
  viewOptions,
  activeView,
  onViewChange,
  resultCount
}: MediaToolbarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {categories.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              activeCategory === category
                ? 'border-primary bg-primary text-black'
                : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/25 hover:text-white'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500">{resultCount} item{resultCount === 1 ? '' : 's'}</p>
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
          {viewOptions.map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => onViewChange(option.id)}
              aria-label={`${option.label} view`}
              title={option.label}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
                activeView === option.id ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {option.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
