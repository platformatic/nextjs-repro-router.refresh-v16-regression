import { type ReactNode } from 'react'

export function BlogPage({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  )
}
