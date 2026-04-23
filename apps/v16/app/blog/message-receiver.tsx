'use client'

import { useBroadcastEvent } from '@repo/ui/broadcast'
import { useRouter } from 'next/navigation'

export function MessageReceiver() {
  const router = useRouter()
  useBroadcastEvent((event) => {
    if (event.type === 'router-refresh') {
      router.refresh()
    }
  })
  return null
}
