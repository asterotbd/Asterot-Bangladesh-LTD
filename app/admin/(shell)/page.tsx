export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, getCurrentProfile, getUserRoles, requireAnyPermission } from '../../../lib/auth'
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
import { listContactMessages } from '../../../lib/contact-server'
import { listMedia } from '../../../lib/media-server'
import { listAuditLogs } from '../../../lib/activity-server'
import { listSettings } from '../../../lib/settings-server'

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
type ContactMetrics = { total: number; new: number }
type MediaMetrics = { total: number }
type ActivityMetrics = { total: number }
type SettingsMetrics = { total: number }

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

function ModuleCard({
  href,
  title,
  description,
  icon
}: {
  href: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-panel p-4 transition-colors hover:border-white/20 hover:bg-white/[0.03]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-medium text-white transition-colors group-hover:text-primary">{title}</span>
        <span className="mt-0.5 block text-sm text-gray-400">{description}</span>
      </span>
    </Link>
  )
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
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['dashboard.view'])

  const canEvents = hasPermission(permissions, 'events.view')
  const canRegistrations = hasPermission(permissions, 'events.registrations.view')
  const canNews = hasPermission(permissions, 'news.view')
  const canUsers = hasPermission(permissions, 'users.view')
  const canCompany = hasPermission(permissions, 'company.view')
  const canContact = hasPermission(permissions, 'contact.view')
  const canMedia = hasPermission(permissions, 'media.view')
  const canActivity = hasPermission(permissions, 'activity.view')
  const canSettings = hasPermission(permissions, 'settings.view')
  const canRoles = hasPermission(permissions, 'roles.view')

  let roleNames: string[] = []
  try {
    roleNames = await getUserRoles(user.id)
  } catch {
    roleNames = []
  }

  const profile = await getCurrentProfile(user.id)
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

  let contact: ContactMetrics | null = null
  if (canContact) {
    try {
      const [result, fresh] = await Promise.all([
        listContactMessages({ page: 1, perPage: 1 }),
        listContactMessages({ page: 1, perPage: 1, status: 'new' })
      ])
      contact = { total: result.total, new: fresh.total }
    } catch (err) {
      console.error('Dashboard contact error', err)
    }
  }

  let media: MediaMetrics | null = null
  if (canMedia) {
    try {
      const result = await listMedia({ page: 1, perPage: 1 })
      media = { total: result.total }
    } catch (err) {
      console.error('Dashboard media error', err)
    }
  }

  let activity: ActivityMetrics | null = null
  if (canActivity) {
    try {
      const result = await listAuditLogs({ page: 1, perPage: 1 })
      activity = { total: result.total }
    } catch (err) {
      console.error('Dashboard activity error', err)
    }
  }

  let settings: SettingsMetrics | null = null
  if (canSettings) {
    try {
      const result = await listSettings()
      settings = { total: result.length }
    } catch (err) {
      console.error('Dashboard settings error', err)
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
            {canContact && (
              <OverviewCard
                title="Messages"
                value={contact ? contact.total : '—'}
                note={contact ? undefined : 'Unable to load messages.'}
                items={contact
                  ? [
                      { label: 'New', value: contact.new },
                      { label: 'All', value: contact.total }
                    ]
                  : undefined}
              />
            )}
            {canMedia && (
              <OverviewCard
                title="Media"
                value={media ? media.total : '—'}
                note={media ? undefined : 'Unable to load media.'}
              />
            )}
            {canActivity && (
              <OverviewCard
                title="Activity"
                value={activity ? activity.total : '—'}
                note={activity ? undefined : 'Unable to load activity.'}
              />
            )}
            {canSettings && (
              <OverviewCard
                title="Settings"
                value={settings ? settings.total : '—'}
                note={settings ? undefined : 'Unable to load settings.'}
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

      <section aria-label="Module shortcuts">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Modules</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {canContact && (
            <ModuleCard
              href="/admin/messages"
              title="Contact Messages"
              description="Inbox from the contact form"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" />
                  <path d="M8 9h8M8 13h5" />
                </svg>
              }
            />
          )}
          {canMedia && (
            <ModuleCard
              href="/admin/media"
              title="Media Library"
              description="Photos, videos, and embeds"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="8.5" cy="10" r="1.5" />
                  <path d="M21 15l-5-5-5 5" />
                </svg>
              }
            />
          )}
          {canActivity && (
            <ModuleCard
              href="/admin/activity"
              title="Activity Log"
              description="Audit trail of admin actions"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                  <path d="M22 12h-4l-3 8-6-16-3 8H2" />
                </svg>
              }
            />
          )}
          {canSettings && (
            <ModuleCard
              href="/admin/settings"
              title="Settings"
              description="Site-wide key/value configuration"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              }
            />
          )}
          {canRoles && (
            <ModuleCard
              href="/admin/permissions"
              title="Roles & Permissions"
              description="Matrix and role descriptions"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <path d="M8 9h8M8 13h8M8 17h5" />
                </svg>
              }
            />
          )}
        </div>
      </section>
    </div>
  )
}