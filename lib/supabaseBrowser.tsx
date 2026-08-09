"use client"
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'

export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  return createBrowserSupabaseClient({ supabaseUrl, supabaseKey })
}

export default createBrowserClient
