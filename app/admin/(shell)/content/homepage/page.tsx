export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import createServerClient from '../../../../../lib/supabaseServer'
import { requireAnyPermission } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions'
import { listHomepageSections, HOMEPAGE_SECTION_KEYS } from '../../../../../lib/homepage-server'
import { getPublishedEvents } from '../../../../../lib/events-server'
import PageHeader from '../../../../../components/admin/PageHeader'
import { Panel, ErrorState } from '../../../../../components/admin/Panel'
import HomepageForm from '../../../../../components/admin/HomepageForm'

export default async function AdminHomepagePage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['content.view'])
  const canEdit = hasPermission(permissions, 'content.edit')

  let sections: Awaited<ReturnType<typeof listHomepageSections>> = []
  let events: Awaited<ReturnType<typeof getPublishedEvents>> = []
  let failed = false
  try {
    ;[sections, events] = await Promise.all([listHomepageSections(), getPublishedEvents()])
  } catch (err) {
    console.error('Admin homepage content load error', err)
    failed = true
  }

  const sectionMap = new Map(sections.map((s) => [s.section_key, s]))
  const sectionsInOrder = HOMEPAGE_SECTION_KEYS.map((key) => sectionMap.get(key) ?? null)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Homepage Content"
        description="Edit the text, imagery, and visibility of each homepage section. Changes apply to the public homepage immediately when visible."
      />

      {failed ? (
        <Panel><ErrorState message="Unable to load homepage content." /></Panel>
      ) : (
        <>
          {sectionsInOrder.every((s) => !s) && (
            <Panel>
              <p className="text-sm text-gray-400">
                No homepage sections have been created yet. Fill in the sections below and save to create them.
              </p>
            </Panel>
          )}
          <HomepageForm sections={sectionsInOrder} events={events} canEdit={canEdit} />
        </>
      )}
    </div>
  )
}