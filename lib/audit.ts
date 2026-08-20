import getAdminSupabase from './supabaseAdmin'
import { logError } from './api-utils'

// Best-effort audit logging for administrative actions.
//
// The audit_logs table is RLS-protected with no policies for anon/authenticated
// (see migration 015), so all writes go through the service-role client. Never
// store passwords, tokens, or secrets here.
export async function writeAuditLog(actorId: string, action: string, resource: string, resourceId?: string | null, meta?: Record<string, unknown>): Promise<void> {
  try {
    const admin = getAdminSupabase()
    await admin.from('audit_logs').insert({
      actor_id: actorId,
      action,
      resource,
      resource_id: resourceId ?? null,
      meta: meta ?? null,
      created_at: new Date().toISOString()
    })
  } catch (err) {
    logError('audit.write', err)
  }
}
