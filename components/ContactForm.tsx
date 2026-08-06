"use client"
import { useState } from 'react'
import { submitContactMessage } from '../lib/contact'

type Values = {
  name: string
  email: string
  phone: string
  organization: string
  subject: string
  message: string
}

type FieldName = keyof Values

type Errors = Partial<Record<FieldName, string>>

type Status =
  | { type: 'idle' }
  | { type: 'sending' }
  | { type: 'success' }
  | { type: 'error'; message: string }

const INITIAL_VALUES: Values = {
  name: '',
  email: '',
  phone: '',
  organization: '',
  subject: '',
  message: ''
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+()\-\s\d]{7,20}$/

function validate(values: Values): Errors {
  const errors: Errors = {}

  if (!values.name.trim()) {
    errors.name = 'Please enter your full name.'
  }

  if (!values.email.trim()) {
    errors.email = 'Please enter your email address.'
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.'
  }

  if (values.phone.trim() && !PHONE_RE.test(values.phone.trim())) {
    errors.phone = 'Please enter a valid phone number.'
  }

  if (!values.subject.trim()) {
    errors.subject = 'Please enter a subject.'
  }

  if (!values.message.trim()) {
    errors.message = 'Please enter a message.'
  } else if (values.message.trim().length < 10) {
    errors.message = 'Your message should be at least 10 characters.'
  }

  return errors
}

const FIELD_ORDER: FieldName[] = ['name', 'email', 'phone', 'organization', 'subject', 'message']

function inputClass(hasError: boolean) {
  return `w-full rounded-xl border bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:ring-2 ${
    hasError
      ? 'border-red-500/60 focus:border-red-400 focus:ring-red-400/25'
      : 'border-white/10 focus:border-primary focus:bg-black/60 focus:ring-primary/25'
  }`
}

function FieldLabel({ htmlFor, label, required }: { htmlFor: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-gray-300">
      {label}
      {required ? <span className="text-primary" aria-hidden="true"> *</span> : null}
    </label>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="mt-2 text-sm text-red-400">
      {message}
    </p>
  )
}

export default function ContactForm() {
  const [values, setValues] = useState<Values>(INITIAL_VALUES)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>({ type: 'idle' })

  const setValue = (field: FieldName) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const nextErrors = validate(values)
    setErrors(nextErrors)

    const firstInvalid = FIELD_ORDER.find(field => nextErrors[field])
    if (firstInvalid) {
      document.getElementById(`contact-${firstInvalid}`)?.focus()
      return
    }

    setStatus({ type: 'sending' })
    const result = await submitContactMessage({
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || undefined,
      organization: values.organization.trim() || undefined,
      subject: values.subject.trim(),
      message: values.message.trim()
    })

    if (result.ok) {
      setStatus({ type: 'success' })
      setValues(INITIAL_VALUES)
      setErrors({})
    } else {
      setStatus({ type: 'error', message: result.error || 'Something went wrong. Please try again.' })
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 sm:p-8">
      <h2 className="text-2xl font-semibold tracking-tight">Send us a message</h2>
      <p className="mt-2 text-sm text-gray-400">Fill in the form and our team will get back to you.</p>

      <div className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="contact-name" label="Full Name" required />
            <input
              id="contact-name"
              type="text"
              value={values.name}
              onChange={setValue('name')}
              placeholder="Your full name"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'contact-name-error' : undefined}
              className={inputClass(Boolean(errors.name))}
            />
            <FieldError id="contact-name-error" message={errors.name} />
          </div>

          <div>
            <FieldLabel htmlFor="contact-email" label="Email Address" required />
            <input
              id="contact-email"
              type="email"
              value={values.email}
              onChange={setValue('email')}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'contact-email-error' : undefined}
              className={inputClass(Boolean(errors.email))}
            />
            <FieldError id="contact-email-error" message={errors.email} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="contact-phone" label="Phone Number" />
            <input
              id="contact-phone"
              type="tel"
              value={values.phone}
              onChange={setValue('phone')}
              placeholder="+880 1XXX-XXXXXX"
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
              className={inputClass(Boolean(errors.phone))}
            />
            <FieldError id="contact-phone-error" message={errors.phone} />
          </div>

          <div>
            <FieldLabel htmlFor="contact-organization" label="Organization / Company" />
            <input
              id="contact-organization"
              type="text"
              value={values.organization}
              onChange={setValue('organization')}
              placeholder="Company name (optional)"
              autoComplete="organization"
              className={inputClass(false)}
            />
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="contact-subject" label="Subject" required />
          <input
            id="contact-subject"
            type="text"
            value={values.subject}
            onChange={setValue('subject')}
            placeholder="How can we help?"
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
            className={inputClass(Boolean(errors.subject))}
          />
          <FieldError id="contact-subject-error" message={errors.subject} />
        </div>

        <div>
          <FieldLabel htmlFor="contact-message" label="Message" required />
          <textarea
            id="contact-message"
            value={values.message}
            onChange={setValue('message')}
            placeholder="Tell us a little about your event, idea, or partnership..."
            rows={6}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'contact-message-error' : undefined}
            className={`${inputClass(Boolean(errors.message))} min-h-[8.5rem] resize-y`}
          />
          <FieldError id="contact-message-error" message={errors.message} />
        </div>
      </div>

      <div className="mt-8">
        <button
          type="submit"
          disabled={status.type === 'sending'}
          className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {status.type === 'sending' ? 'Sending...' : 'Send Message'}
          {status.type !== 'sending' ? <span aria-hidden="true">→</span> : null}
        </button>
      </div>

      <div aria-live="polite">
        {status.type === 'success' ? (
          <p className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            Thank you for reaching out! Your message has been sent and our team will get back to you soon.
          </p>
        ) : null}

        {status.type === 'error' ? (
          <p className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            {status.message}
          </p>
        ) : null}
      </div>
    </form>
  )
}
