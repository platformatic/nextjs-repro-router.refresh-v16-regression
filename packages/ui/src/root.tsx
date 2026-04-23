import type React from 'react'

import { Footer } from './footer'

export function Root({
  children,
  version,
}: { children: React.ReactNode } & React.ComponentProps<typeof Footer>) {
  return (
    <html lang="en" className="[color-scheme:light_dark]">
      <body className="bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
        {children}
        <Footer version={version} />
      </body>
    </html>
  )
}
