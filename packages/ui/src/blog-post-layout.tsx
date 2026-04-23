import { type ReactNode } from 'react'

export function BlogPostLayout({
  backLink,
  children,
}: {
  backLink?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-svh">
      {backLink && <div className="mx-auto max-w-5xl px-6 pt-10">{backLink}</div>}
      <main>{children}</main>
    </div>
  )
}
