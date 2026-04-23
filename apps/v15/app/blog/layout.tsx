import { type ReactNode } from 'react'

import { MessageReceiver } from './message-receiver'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <MessageReceiver />
    </>
  )
}
