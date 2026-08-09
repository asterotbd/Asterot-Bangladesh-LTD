"use client"
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import createBrowserClient from '../../lib/supabaseBrowser'
import Button from '../../components/Button'

export default function LoginPage(){
  const router = useRouter()
  // Init browser client lazily on submit to avoid server-side calls during build
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|undefined>()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(undefined)
    const supabase = createBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else router.push('/account')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-[clamp(1rem,2vw,1.5rem)] pt-28 pb-[clamp(2rem,4vw,4rem)]">
      <form onSubmit={submit} className="w-full max-w-[min(44rem,100%)] rounded-[1.5rem] border border-white/10 bg-white/5 p-[clamp(1.25rem,2.5vw,2.5rem)] shadow-xl shadow-black/30">
        <h1 className="text-2xl font-semibold mb-4">Sign In</h1>
        <label className="block mb-2 text-sm font-medium text-gray-300" htmlFor="login-email">Email
          <input id="login-email" name="email" type="email" autoComplete="email" className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25" value={email} onChange={e=>setEmail(e.target.value)} required/>
        </label>
        <label className="block mb-4 text-sm font-medium text-gray-300" htmlFor="login-password">Password
          <input id="login-password" name="password" type="password" autoComplete="current-password" className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-gray-500 outline-none transition duration-200 focus:border-primary focus:ring-2 focus:ring-primary/25" value={password} onChange={e=>setPassword(e.target.value)} required/>
        </label>
        {error && <div className="text-red-400 mb-4 text-sm">{error}</div>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
      </form>
    </main>
  )
}
