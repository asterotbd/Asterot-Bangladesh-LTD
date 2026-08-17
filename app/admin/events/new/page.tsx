export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import createServerClient from '../../../../lib/supabaseServer'
import { getUserRoles } from '../../../../lib/auth'
import { getEventCategories, EVENT_ADMIN_ROLES } from '../../../../lib/events-server'
import AdminEventForm from '../../../../components/AdminEventForm'

export default async function AdminEventNewPage(){
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session || !session.user) redirect('/admin/login')
  const roles = await getUserRoles(session.user.id)
  if (!roles.some((r: any) => EVENT_ADMIN_ROLES.includes(String(r)))) redirect('/account')

  const categories = await getEventCategories()

  return (
    <div className="py-16">
      <h1 className="text-2xl font-semibold mb-6">New Event</h1>
      <AdminEventForm categories={categories as any[]} />
    </div>
  )
}
