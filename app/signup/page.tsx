"use client"
export const dynamic = 'force-dynamic'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import createBrowserClient from '../../lib/supabaseBrowser'
import { isSafeInternalPath } from '../../lib/redirects'
import Button from '../../components/Button'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignupPage(){
  return (
    <Suspense>
      <SignupForm/>
    </Suspense>
  )
}

function SignupForm(){
  const router = useRouter()
  const searchParams = useSearchParams()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|undefined>()
  const [checkEmail, setCheckEmail] = useState<string|undefined>()

  const validate = () => {
    if (!fullName.trim()) return 'Please enter your full name.'
    if (!email.trim()) return 'Please enter your email address.'
    if (!EMAIL_RE.test(email.trim())) return 'Please enter a valid email address.'
    if (!password) return 'Please choose a password.'
    if (password.length < 8) return 'Password must be at least 8 characters long.'
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return 'Password must contain at least one letter and one number.'
    if (password !== confirm) return 'Passwords do not match.'
    return undefined
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(undefined)
    setCheckEmail(undefined)
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    const next = searchParams.get('next')
    const safeNext = isSafeInternalPath(next) ? (next as string) : null
    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        // Environment-aware: window.location.origin is the current site
        // (production https://www.asterot.com, local http://localhost:3000).
        // The `next` param survives email confirmation, otherwise we land on
        // the site root with an authenticated session.
        emailRedirectTo: `${window.location.origin}${safeNext ?? '/'}`
      }
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    if (!data.session) {
      setCheckEmail(email.trim())
      return
    }
    if (safeNext) router.push(safeNext)
    else router.push('/account')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-[clamp(1rem,2vw,1.5rem)] pt-28 pb-[clamp(2rem,4vw,4rem)]">
      <form onSubmit={submit} className="w-full max-w-[min(44rem,100%)] rounded-[1.5rem] border border-white/10 bg-white/5 p-[clamp(1.25rem,2.5vw,2.5rem)] shadow-xl shadow-black/30">
        <h1 className="text-2xl font-semibold mb-4">Create Account</h1>

        <label className="block mb-2 text-sm font-medium text-gray-300" htmlFor="signup-name">Full name
          <input id="signup-name" name="full_name" type="text" autoComplete="name" className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25" value={fullName} onChange={e=>setFullName(e.target.value)} required/>
        </label>

        <label className="block mb-2 text-sm font-medium text-gray-300" htmlFor="signup-email">Email
          <input id="signup-email" name="email" type="email" autoComplete="email" className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25" value={email} onChange={e=>setEmail(e.target.value)} required/>
        </label>

        <label className="block mb-2 text-sm font-medium text-gray-300" htmlFor="signup-password">Password
          <input id="signup-password" name="password" type="password" autoComplete="new-password" className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25" value={password} onChange={e=>setPassword(e.target.value)} required/>
        </label>

        <label className="block mb-4 text-sm font-medium text-gray-300" htmlFor="signup-confirm">Confirm password
          <input id="signup-confirm" name="confirm_password" type="password" autoComplete="new-password" className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25" value={confirm} onChange={e=>setConfirm(e.target.value)} required/>
        </label>

        {error && <div className="text-red-400 mb-4 text-sm">{error}</div>}

        {checkEmail && (
          <div className="text-primary mb-4 text-sm">
            Account created. We&apos;ve sent a confirmation link to <span className="font-medium">{checkEmail}</span> — please check your inbox (and spam folder) to verify your email, then sign in.
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</Button>

        <p className="mt-4 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </form>
    </main>
  )
}
