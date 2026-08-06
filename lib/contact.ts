import { createBrowserClient } from './supabaseBrowser'

export type ContactFormPayload = {
  name: string
  email: string
  phone?: string
  organization?: string
  subject: string
  message: string
}

export type SubmitContactResult = {
  ok: boolean
  error?: string
}

/**
 * Single integration point for the contact form.
 *
 * Inserts the message into the `contact_messages` table via Supabase.
 * Returns `{ ok: true }` on success, or `{ ok: false, error }` on failure.
 */
export async function submitContactMessage(payload: ContactFormPayload): Promise<SubmitContactResult> {
  const supabase = createBrowserClient()

  const { error } = await supabase
    .from('contact_messages')
    .insert({
      name: payload.name,
      email: payload.email,
      phone: payload.phone || null,
      organization: payload.organization || null,
      subject: payload.subject,
      message: payload.message,
      status: 'new'
    })

  if (error) {
    console.error('submitContactMessage error', error.message)
    return {
      ok: false,
      error: 'There was a problem sending your message. Please try again or reach us directly at asterotbd@gmail.com.'
    }
  }

  return { ok: true }
}
