import { Root } from '@repo/ui/root'
import type { Metadata } from 'next'
import nextPkg from 'next/package.json' with { type: 'json' }

import './globals.css'

export const metadata = {
  title: `Next.js v${nextPkg.version}`,
} as const satisfies Metadata

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <Root version={nextPkg.version}>{children}</Root>
}
