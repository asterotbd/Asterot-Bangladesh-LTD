"use client"
import { useRouter } from 'next/navigation'

type AdminEvent = {
  id: string
  title_en: string
  slug: string
  date: string | null
  published: boolean
}

export default function AdminEventsTable({ events }: { events: AdminEvent[] }) {
  const router = useRouter()

  const togglePublish = async (event: AdminEvent) => {
    const res = await fetch(`/api/admin/events/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !event.published })
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
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map(event => (
            <tr key={event.id} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3 font-medium text-white">{event.title_en}</td>
              <td className="px-4 py-3 text-gray-400">{event.slug}</td>
              <td className="px-4 py-3 text-gray-400">{event.date || '—'}</td>
              <td className="px-4 py-3">
                {event.published ? (
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
                  <a href={`/admin/events/${event.id}/edit`} className="text-primary font-medium hover:underline">Edit</a>
                  <button
                    type="button"
                    onClick={() => togglePublish(event)}
                    className="text-gray-300 font-medium hover:underline"
                  >
                    {event.published ? 'Unpublish' : 'Publish'}
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
