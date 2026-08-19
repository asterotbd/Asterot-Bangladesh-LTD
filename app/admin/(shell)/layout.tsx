import { redirect } from 'next/navigation'
import createServerClient from '../../../lib/supabaseServer'
import { getUserRoles } from '../../../lib/auth'
import { getPermissionsForRoles, hasPermission, type Permission } from '../../../lib/permissions'
import AdminShell, { type AdminNavItem } from '../../../components/admin/AdminShell'

export const metadata = { title: 'Admin' }

type NavItem = AdminNavItem & { permission: Permission }

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: 'dashboard', permission: 'dashboard.view' },
  { label: 'Events', href: '/admin/events', icon: 'events', permission: 'events.view' },
  { label: 'News', href: '/admin/news', icon: 'news', permission: 'news.view' },
  { label: 'Company', href: '/admin/company', icon: 'company', permission: 'company.edit' },
  { label: 'Users', href: '/admin/users', icon: 'users', permission: 'users.view' },
  { label: 'Roles', href: '/admin/roles', icon: 'roles', permission: 'roles.view' }
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
    .map(({ label, href, icon }) => ({ label, href, icon }))

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