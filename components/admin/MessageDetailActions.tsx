"use client"
import { useRouter } from 'next/navigation'
import ContactMessageActions from './ContactMessageActions'

export default function MessageDetailActions({ messageId, currentStatus }: { messageId: string; currentStatus: string }) {
  const router = useRouter()
  return <ContactMessageActions messageId={messageId} currentStatus={currentStatus} onDeleted={() => router.push('/admin/messages')} />
}