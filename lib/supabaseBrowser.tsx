"use client"
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'

export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase URL or publishable key in client environment')
  }
  return createSupabaseBrowserClient(supabaseUrl, supabaseKey)
}

export default createBrowserClient