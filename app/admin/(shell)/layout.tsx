import { redirect } from 'next/navigation'
import createServerClient from '../../../lib/supabaseServer'
import { getUserRoles } from '../../../lib/auth'
import { getPermissionsForRoles, hasPermission, type Permission } from '../../../lib/permissions'
import AdminShell, { type AdminNavItem } from '../../../components/admin/AdminShell'

export const metadata = { title: 'Admin' }

type NavItem = AdminNavItem & { permission: Permission }

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: 'dashboard', permission: 'dashboard.view' },
  { label: 'Homepage', href: '/admin/content/homepage', icon: 'homepage', group: 'Content', permission: 'content.view' },
  { label: 'About', href: '/admin/content/about', icon: 'content', group: 'Content', permission: 'content.view' },
  { label: 'Capabilities', href: '/admin/content/capabilities', icon: 'content', group: 'Content', permission: 'content.view' },
  { label: 'FAQ', href: '/admin/content/faq', icon: 'content', group: 'Content', permission: 'content.view' },
  { label: 'All Events', href: '/admin/events', icon: 'events', group: 'Events', permission: 'events.view' },
  { label: 'New Event', href: '/admin/events/new', icon: 'events', group: 'Events', permission: 'events.edit' },
  { label: 'Categories', href: '/admin/events/categories', icon: 'permissions', group: 'Events', permission: 'content.view' },
  { label: 'All News', href: '/admin/news', icon: 'news', group: 'News', permission: 'news.view' },
  { label: 'New Article', href: '/admin/news/new', icon: 'news', group: 'News', permission: 'news.edit' },
  { label: 'Library', href: '/admin/media', icon: 'media', group: 'Media', permission: 'media.view' },
  { label: 'Photo Albums', href: '/admin/media/albums', icon: 'albums', group: 'Media', permission: 'media.view' },
  { label: 'Videos', href: '/admin/media/videos', icon: 'videos', group: 'Media', permission: 'media.view' },
  { label: 'Messages', href: '/admin/messages', icon: 'messages', group: 'Messages', permission: 'contact.view' },
  { label: 'Company', href: '/admin/company', icon: 'company', group: 'Administration', permission: 'company.edit' },
  { label: 'Users', href: '/admin/users', icon: 'users', group: 'Administration', permission: 'users.view' },
  { label: 'Roles', href: '/admin/roles', icon: 'roles', group: 'Administration', permission: 'roles.view' },
  { label: 'Permissions', href: '/admin/permissions', icon: 'permissions', group: 'Administration', permission: 'roles.view' },
  { label: 'Activity', href: '/admin/activity', icon: 'activity', group: 'Administration', permission: 'activity.view' },
  { label: 'Settings', href: '/admin/settings', icon: 'settings', group: 'System', permission: 'settings.view' }
]

export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  let roles: string[] = []
  try {
    roles = await getUserRoles(user.id)
  } catch {
    roles = []
  }

  const permissions = getPermissionsForRoles(roles)
  const navItems: AdminNavItem[] = NAV_ITEMS.filter((item) => hasPermission(permissions, item.permission))
    .map(({ label, href, icon, group }) => ({ label, href, icon, group }))

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, display_name')
    .eq('id', user.id)
    .maybeSingle()

  const name = profile?.display_name || profile?.full_name || user.email || ''

  return (
    <AdminShell user={{ name, email: user.email || '', roles }} navItems={navItems}>
      {children}
    </AdminShell>
  )
}