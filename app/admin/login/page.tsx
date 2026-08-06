"use client"
export const dynamic = 'force-dynamic'
import LoginPage from '../../login/page'

export default function AdminLoginPage(){
  // Reuse login UI; after login server-side will redirect based on role
  return <LoginPage />
}
