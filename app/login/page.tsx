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
    <div className="min-h-screen flex items-center justify-center px-[clamp(1rem,2vw,1.5rem)] pt-24 pb-[clamp(2rem,4vw,4rem)]">
      <form onSubmit={submit} className="w-full max-w-[min(44rem,100%)] bg-[#111111] p-[clamp(1.25rem,2.5vw,2.5rem)] rounded-[1.25rem] shadow-lg shadow-black/30">
        <h2 className="text-2xl font-semibold mb-4">Sign In</h2>
        <label className="block mb-2">Email
          <input className="w-full mt-1 p-2 bg-black border border-gray-700 rounded" value={email} onChange={e=>setEmail(e.target.value)} required/>
        </label>
        <label className="block mb-4">Password
          <input type="password" className="w-full mt-1 p-2 bg-black border border-gray-700 rounded" value={password} onChange={e=>setPassword(e.target.value)} required/>
        </label>
        {error && <div className="text-red-400 mb-2">{error}</div>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
      </form>
    </div>
  )
}
