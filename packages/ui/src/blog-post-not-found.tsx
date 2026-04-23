import { type ReactNode } from 'react'

export function BlogPostNotFound({ backLink }: { backLink?: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[60svh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-xs font-semibold tracking-widest uppercase opacity-60">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Post not found</h1>
      <p className="mt-3 text-sm opacity-80">
        The post you are looking for does not exist, or has been unpublished.
      </p>
      {backLink && <div className="mt-6">{backLink}</div>}
    </div>
  )
}
