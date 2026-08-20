export function EmptyState({ message }: { message: string }) {
  return <p className="py-12 text-center text-sm text-gray-500">{message}</p>
}

export function ErrorState({ message }: { message: string }) {
  return <p className="py-12 text-center text-sm text-amber-200/80">{message}</p>
}

export function Panel({ title, description, action, children, className = '' }: { title?: string; description?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-panel ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">{title}</h2>
            {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}
