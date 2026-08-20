export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { requireAnyPermission, getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions'
import { listCategories } from '../../../../../lib/categories-server'
import PageHeader from '../../../../../components/admin/PageHeader'
import { Panel, ErrorState, EmptyState } from '../../../../../components/admin/Panel'
import CategoriesForm from '../../../../../components/admin/CategoriesForm'

export default async function AdminCategoriesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['content.view'])
  const canEdit = hasPermission(permissions, 'content.edit')
  const canDelete = hasPermission(permissions, 'content.delete')

  let categories: Awaited<ReturnType<typeof listCategories>> = []
  let failed = false
  try {
    categories = await listCategories()
  } catch (err) {
    console.error('Admin categories load error', err)
    failed = true
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Event Categories"
        description="Manage the categories used to organize events and news."
      />

      {failed ? (
        <Panel><ErrorState message="Unable to load categories." /></Panel>
      ) : (
        <>
          {categories.length === 0 && (
            <Panel><EmptyState message="No categories yet. Create one below." /></Panel>
          )}
          <CategoriesForm categories={categories} canEdit={canEdit} canDelete={canDelete} />
        </>
      )}
    </div>
  )
}