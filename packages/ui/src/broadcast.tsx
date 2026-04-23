'use client'

import { useEffect } from 'react'

export type BroadcastEvent = { type: 'router-refresh' }

const CHANNEL_NAME = 'nextjs-repro-debug'

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  return new BroadcastChannel(CHANNEL_NAME)
}

export function sendBroadcastEvent(event: BroadcastEvent): void {
  const channel = getChannel()
  if (!channel) return
  try {
    // oxlint-disable-next-line unicorn/require-post-message-target-origin -- BroadcastChannel.postMessage does not accept targetOrigin
    channel.postMessage(event)
  } finally {
    channel.close()
  }
}

export function useBroadcastEvent(onEvent: (event: BroadcastEvent) => void): void {
  useEffect(() => {
    const channel = getChannel()
    if (!channel) return () => {}

    const handler = (message: MessageEvent<BroadcastEvent>) => {
      onEvent(message.data)
    }
    channel.addEventListener('message', handler)
    return () => {
      channel.removeEventListener('message', handler)
      channel.close()
    }
  }, [onEvent])
}
