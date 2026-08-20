export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import createServerClient from '../../../../../lib/supabaseServer'
import { requireAnyPermission } from '../../../../../lib/auth'
import { getContactMessage } from '../../../../../lib/contact-server'
import PageHeader from '../../../../../components/admin/PageHeader'
import StatusBadge from '../../../../../components/admin/StatusBadge'
import { Panel, ErrorState } from '../../../../../components/admin/Panel'
import MessageDetailActions from '../../../../../components/admin/MessageDetailActions'

const STATUS_TONE: Record<string, { tone: 'success' | 'warning' | 'info' | 'neutral' | 'primary'; label: string }> = {
  new: { tone: 'warning', label: 'New' },
  read: { tone: 'info', label: 'Read' },
  handled: { tone: 'success', label: 'Handled' },
  archived: { tone: 'neutral', label: 'Archived' }
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-gray-200">{value || '—'}</dd>
    </div>
  )
}

export default async function AdminMessageDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const permissions = await requireAnyPermission(user.id, ['contact.view'])
  const canManage = permissions.includes('contact.manage')

  let message: Awaited<ReturnType<typeof getContactMessage>> | null = null
  let failed = false
  try {
    message = await getContactMessage(params.id)
  } catch (err) {
    console.error('Admin message detail error', err)
    failed = true
  }

  const statusInfo = STATUS_TONE[message?.status ?? ''] ?? STATUS_TONE.new

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Message"
        description={
          <Link href="/admin/messages" className="text-sm font-medium text-primary hover:underline">
            ← Back to messages
          </Link>
        }
      />

      {failed ? (
        <Panel><ErrorState message="Unable to load this message." /></Panel>
      ) : !message ? (
        <Panel><ErrorState message="Message not found." /></Panel>
      ) : (
        <div className="space-y-6">
          <Panel
            title="Message"
            action={canManage ? <MessageDetailActions messageId={message.id} currentStatus={message.status ?? 'new'} /> : <StatusBadge tone={statusInfo.tone}>{statusInfo.label}</StatusBadge>}
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone={statusInfo.tone}>{statusInfo.label}</StatusBadge>
                <span className="text-xs text-gray-500">{formatDate(message.created_at)}</span>
              </div>
              <div className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-4 text-sm leading-relaxed text-gray-200">
                {message.message || 'No message body.'}
              </div>
            </div>
          </Panel>

          <Panel title="Contact Details">
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Name" value={message.name} />
              <Field label="Email" value={message.email} />
              <Field label="Phone" value={message.phone} />
              <Field label="Organization" value={message.organization} />
              <Field label="Subject" value={message.subject} />
              <Field label="Received" value={formatDate(message.created_at)} />
            </dl>
          </Panel>
        </div>
      )}
    </div>
  )
}