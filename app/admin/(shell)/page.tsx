export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import createServerClient from '../../../lib/supabaseServer'
import { getUserRoles, requireAnyPermission } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions'
import { getAllEvents, formatEventDate, type DbEvent } from '../../../lib/events-server'
import { getAllNews, type DbNews } from '../../../lib/news-server'
import {
  getTotalRegistrations,
  getRegistrationCountsByStatus,
  getRecentRegistrations,
  type RecentRegistration
} from '../../../lib/registrations-server'
import { getTotalUserCount, getUserCountsByRole } from '../../../lib/users-server'
import { getCompanySnapshot, type CompanySnapshot } from '../../../lib/company-server'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrator',
  editor: 'Editor',
  coach: 'Coach',
  finance: 'Finance'
}

type EventMetrics = { total: number; published: number; draft: number; upcoming: number; past: number }
type RegistrationMetrics = { total: number; pending: number; confirmed: number; cancelled: number }
type NewsMetrics = { total: number; published: number; draft: number }
type UserMetrics = { total: number; byRole: { role: string; count: number }[] }

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatTime(value: string | null): string | null {
  if (!value) return null
  const match = value.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = match[2]
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${minutes} ${period}`
}

function formatDateTime(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-panel">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function OverviewCard({
  title,
  value,
  items,
  note
}: {
  title: string
  value: number | string
  items?: { label: string; value: number | string }[]
  note?: string
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-panel p-5 sm:p-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{title}</h3>
      <p className="mt-3 text-4xl font-bold tracking-tight text-white">{value}</p>
      {note ? (
        <p className="mt-3 text-sm text-amber-200/80">{note}</p>
      ) : items && items.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-white/5 pt-4">
          {items.map((item) => (
            <div key={item.label}>
              <p className="text-lg font-semibold text-white">{item.value}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  if (status === 'confirmed') {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
        Confirmed
      </span>
    )
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center rounded-full border border-rose-400/25 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-200">
        Cancelled
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
      Pending
    </span>
  )
}

function EmptyState({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-gray-500">{message}</p>
}

function ErrorState({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-amber-200/80">{message}</p>
}

function UpcomingEventRow({ event }: { event: DbEvent }) {
  const dateLine = [event.date ? formatEventDate(event.date) : null, formatTime(event.time)]
    .filter(Boolean)
    .join(' · ') || 'Date to be announced'
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-white">{event.title_en}</p>
        <p className="mt-0.5 text-sm text-gray-400">{dateLine}</p>
      </div>
      {event.location ? <span className="shrink-0 text-sm text-gray-500">{event.location}</span> : null}
    </li>
  )
}

function RegistrationRow({ registration }: { registration: RecentRegistration }) {
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium text-white">{registration.participant_name}</p>
        <p className="mt-0.5 truncate text-sm text-gray-400">
          {registration.event_title ?? 'Event not available'}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">{formatDateTime(registration.created_at)}</p>
      </div>
      <span className="shrink-0">
        <StatusBadge status={registration.status} />
      </span>
    </li>
  )
}

function NewsRow({ article }: { article: DbNews }) {
  const title = article.title_en || article.title_bn || article.slug
  const date = formatDateTime(article.published_at || article.created_at)
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <Link href={`/admin/news/${article.id}/edit`} className="group min-w-0">
        <p className="truncate font-medium text-white transition-colors group-hover:text-primary">{title}</p>
        <p className="mt-0.5 text-sm text-gray-400">{date}</p>
      </Link>
      {article.published ? (
        <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
          Published
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
          Draft
        </span>
      )}
    </li>
  )
}

function CompanySnapshotView({ company }: { company: CompanySnapshot }) {
  const hasData = Boolean(company.name || company.founded_year || company.tagline)
  if (!hasData) {
    return <EmptyState message="Company profile not set up yet." />
  }
  return (
    <dl className="space-y-5">
      {company.name && (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Company</dt>
          <dd className="mt-1 font-medium text-white">{company.name}</dd>
        </div>
      )}
      {company.founded_year && (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Founded</dt>
          <dd className="mt-1 font-medium text-white">{company.founded_year}</dd>
        </div>
      )}
      {company.tagline && (
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Tagline</dt>
          <dd className="mt-1 text-sm text-gray-300">{company.tagline}</dd>
        </div>
      )}
    </dl>
  )
}

export default async function AdminPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['dashboard.view'])

  const canEvents = hasPermission(permissions, 'events.view')
  const canRegistrations = hasPermission(permissions, 'events.registrations.view')
  const canNews = hasPermission(permissions, 'news.view')
  const canUsers = hasPermission(permissions, 'users.view')
  const canCompany = hasPermission(permissions, 'company.view')

  let roleNames: string[] = []
  try {
    roleNames = await getUserRoles(user.id)
  } catch {
    roleNames = []
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, display_name')
    .eq('id', user.id)
    .maybeSingle()
  const name = profile?.display_name || profile?.full_name || user.email?.split('@')[0] || 'Member'

  let events: EventMetrics | null = null
  let upcomingEvents: DbEvent[] = []
  if (canEvents) {
    try {
      const all = await getAllEvents()
      const today = todayISO()
      events = {
        total: all.length,
        published: all.filter((e) => e.published).length,
        draft: all.filter((e) => !e.published).length,
        upcoming: all.filter((e) => e.date && e.date >= today).length,
        past: all.filter((e) => e.date && e.date < today).length
      }
      upcomingEvents = all
        .filter((e) => e.date && e.date >= today)
        .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
        .slice(0, 5)
    } catch (err) {
      console.error('Dashboard events error', err)
    }
  }

  let registrations: RegistrationMetrics | null = null
  let recentRegistrations: RecentRegistration[] = []
  if (canRegistrations) {
    try {
      const [total, byStatus, recent] = await Promise.all([
        getTotalRegistrations(),
        getRegistrationCountsByStatus(),
        getRecentRegistrations(5)
      ])
      registrations = { total, ...byStatus }
      recentRegistrations = recent
    } catch (err) {
      console.error('Dashboard registrations error', err)
    }
  }

  let news: NewsMetrics | null = null
  let recentNews: DbNews[] = []
  if (canNews) {
    try {
      const all = await getAllNews()
      news = {
        total: all.length,
        published: all.filter((n) => n.published).length,
        draft: all.filter((n) => !n.published).length
      }
      recentNews = all.slice(0, 5)
    } catch (err) {
      console.error('Dashboard news error', err)
    }
  }

  let users: UserMetrics | null = null
  if (canUsers) {
    try {
      const [total, byRole] = await Promise.all([getTotalUserCount(), getUserCountsByRole()])
      users = { total, byRole }
    } catch (err) {
      console.error('Dashboard users error', err)
    }
  }

  let company: CompanySnapshot | null = null
  let companyFailed = false
  if (canCompany) {
    try {
      company = await getCompanySnapshot()
    } catch (err) {
      console.error('Dashboard company error', err)
      companyFailed = true
    }
  }

  const roleLabel = roleNames.map((r) => ROLE_LABELS[r] || r).join(', ')

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">
            {greeting()}, {name}.
          </p>
        </div>
        {roleLabel ? (
          <p className="text-sm text-gray-500">
            Role: <span className="text-gray-300">{roleLabel}</span>
          </p>
        ) : null}
      </header>

      {(canEvents || canRegistrations || canNews || canUsers) && (
        <section aria-label="Overview metrics">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Overview</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {canEvents && (
              <OverviewCard
                title="Events"
                value={events ? events.total : '—'}
                note={events ? undefined : 'Unable to load events.'}
                items={
                  events
                    ? [
                        { label: 'Published', value: events.published },
                        { label: 'Draft', value: events.draft },
                        { label: 'Upcoming', value: events.upcoming },
                        { label: 'Past', value: events.past }
                      ]
                    : undefined
                }
              />
            )}
            {canRegistrations && (
              <OverviewCard
                title="Registrations"
                value={registrations ? registrations.total : '—'}
                note={registrations ? undefined : 'Unable to load registrations.'}
                items={
                  registrations
                    ? [
                        { label: 'Pending', value: registrations.pending },
                        { label: 'Confirmed', value: registrations.confirmed },
                        { label: 'Cancelled', value: registrations.cancelled }
                      ]
                    : undefined
                }
              />
            )}
            {canNews && (
              <OverviewCard
                title="News"
                value={news ? news.total : '—'}
                note={news ? undefined : 'Unable to load news.'}
                items={
                  news
                    ? [
                        { label: 'Published', value: news.published },
                        { label: 'Draft', value: news.draft }
                      ]
                    : undefined
                }
              />
            )}
            {canUsers && (
              <OverviewCard
                title="Users"
                value={users ? users.total : '—'}
                note={users ? undefined : 'Unable to load users.'}
                items={users && users.byRole.length > 0
                  ? users.byRole.map((entry) => ({ label: ROLE_LABELS[entry.role] || entry.role, value: entry.count }))
                  : undefined}
              />
            )}
          </div>
        </section>
      )}

      {(canEvents || canRegistrations) && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-label="Events overview">
          {canEvents && (
            <Panel
              title="Upcoming Events"
              action={
                <Link href="/admin/events" className="text-xs font-medium text-primary hover:underline">
                  View all
                </Link>
              }
            >
              {upcomingEvents.length === 0 ? (
                <EmptyState message="No upcoming events" />
              ) : (
                <ul className="divide-y divide-white/5">
                  {upcomingEvents.map((event) => (
                    <UpcomingEventRow key={event.id} event={event} />
                  ))}
                </ul>
              )}
            </Panel>
          )}
          {canRegistrations && (
            <Panel title="Recent Registrations">
              {recentRegistrations.length === 0 ? (
                <EmptyState message="No registrations yet" />
              ) : (
                <ul className="divide-y divide-white/5">
                  {recentRegistrations.map((registration) => (
                    <RegistrationRow key={registration.id} registration={registration} />
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </section>
      )}

      {(canNews || canCompany) && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-label="Content overview">
          {canNews && (
            <Panel
              title="Recent News"
              action={
                <Link href="/admin/news" className="text-xs font-medium text-primary hover:underline">
                  View all
                </Link>
              }
            >
              {recentNews.length === 0 ? (
                <EmptyState message="No news articles yet" />
              ) : (
                <ul className="divide-y divide-white/5">
                  {recentNews.map((article) => (
                    <NewsRow key={article.id} article={article} />
                  ))}
                </ul>
              )}
            </Panel>
          )}
          {canCompany && (
            <Panel title="Company">
              {companyFailed ? (
                <ErrorState message="Unable to load company information." />
              ) : company ? (
                <CompanySnapshotView company={company} />
              ) : (
                <EmptyState message="Company profile not set up yet." />
              )}
            </Panel>
          )}
        </section>
      )}
    </div>
  )
}