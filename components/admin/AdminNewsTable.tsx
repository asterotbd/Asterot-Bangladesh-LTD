"use client"
import { useRouter } from 'next/navigation'

type AdminNews = {
  id: string
  title_en: string
  slug: string
  published: boolean
  published_at: string | null
  updated_at: string | null
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminNewsTable({ news }: { news: AdminNews[] }) {
  const router = useRouter()

  const togglePublish = async (item: AdminNews) => {
    const res = await fetch(`/api/admin/news/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !item.published })
    })
    if (res.ok) router.refresh()
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[42rem] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-[0.2em] text-gray-400">
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Slug</th>
            <th className="px-4 py-3">Published</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {news.map(item => (
            <tr key={item.id} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3 font-medium text-white">{item.title_en}</td>
              <td className="px-4 py-3 text-gray-400">{item.slug}</td>
              <td className="px-4 py-3 text-gray-400">{formatDate(item.published_at)}</td>
              <td className="px-4 py-3">
                {item.published ? (
                  <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                    Draft
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-3">
                  <a href={`/admin/news/${item.id}/edit`} className="text-primary font-medium hover:underline">Edit</a>
                  <button
                    type="button"
                    onClick={() => togglePublish(item)}
                    className="text-gray-300 font-medium hover:underline"
                  >
                    {item.published ? 'Unpublish' : 'Publish'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
