const TONE: Record<string, string> = {
  success: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  warning: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
  danger: 'border-rose-400/25 bg-rose-400/10 text-rose-200',
  info: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
  neutral: 'border-white/10 bg-white/5 text-gray-300',
  primary: 'border-primary/25 bg-primary/10 text-primary'
}

export default function StatusBadge({ tone = 'neutral', children }: { tone?: keyof typeof TONE; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${TONE[tone]}`}>
      {children}
    </span>
  )
}
