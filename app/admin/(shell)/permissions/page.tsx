export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import createServerClient from '../../../../lib/supabaseServer'
import { requireAnyPermission } from '../../../../lib/auth'
import { listRoles } from '../../../../lib/users-server'
import PageHeader from '../../../../components/admin/PageHeader'
import { Panel, ErrorState } from '../../../../components/admin/Panel'
import PermissionMatrix from '../../../../components/admin/PermissionMatrix'

export default async function AdminPermissionsPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['roles.view'])
  const canManage = permissions.includes('roles.manage')

  let roles: Awaited<ReturnType<typeof listRoles>> | null = null
  let failed = false
  try {
    roles = await listRoles()
  } catch (err) {
    console.error('Admin permissions roles load error', err)
    failed = true
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="The permission matrix maps system roles to the permissions they grant across the admin."
      />

      {canManage && (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-400">
          Permissions are enforced server-side on every admin route and mutation. Hiding an action in the UI is never
          treated as security — the server independently verifies each request.
        </p>
      )}

      {failed ? (
        <Panel><ErrorState message="Unable to load roles." /></Panel>
      ) : !roles || roles.length === 0 ? (
        <Panel><ErrorState message="No roles found." /></Panel>
      ) : (
        <PermissionMatrix roles={roles.map((role) => role.name)} />
      )}
    </div>
  )
}