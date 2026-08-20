export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { requireAnyPermission, getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions'
import { getCompanyInfo, listLeadership } from '../../../../../lib/about-server'
import PageHeader from '../../../../../components/admin/PageHeader'
import { Panel, ErrorState } from '../../../../../components/admin/Panel'
import AboutForm from '../../../../../components/admin/AboutForm'

export default async function AdminAboutPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['content.view'])
  const canEdit = hasPermission(permissions, 'content.edit')

  let company: Awaited<ReturnType<typeof getCompanyInfo>> = null
  let leaders: Awaited<ReturnType<typeof listLeadership>> = []
  let failed = false
  try {
    ;[company, leaders] = await Promise.all([getCompanyInfo(), listLeadership()])
  } catch (err) {
    console.error('Admin about load error', err)
    failed = true
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="About"
        description="Manage company information, story, approach, and leadership team."
      />

      {failed ? (
        <Panel><ErrorState message="Unable to load About content." /></Panel>
      ) : (
        <AboutForm company={company} leaders={leaders} canEdit={canEdit} />
      )}
    </div>
  )
}