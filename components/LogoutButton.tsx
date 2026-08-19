"use client"
import { logout } from '../lib/logout'

export default function LogoutButton({ className = 'text-primary' }: { className?: string }) {
  return (
    <button type="button" onClick={() => void logout()} className={`${className} cursor-pointer`}>
      Logout
    </button>
  )
}