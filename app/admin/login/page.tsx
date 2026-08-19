"use client"
export const dynamic = 'force-dynamic'
import LoginForm from '../../../components/LoginForm'

export default function AdminLoginPage(){
  return <LoginForm mode="admin" />
}