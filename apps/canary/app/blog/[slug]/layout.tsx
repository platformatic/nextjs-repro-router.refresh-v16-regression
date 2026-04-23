import { BlogPostLayout } from '@repo/ui/blog-post-layout'
import Link from 'next/link'
import { type ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <BlogPostLayout
      backLink={
        <Link href="/blog" className="inline-block opacity-60 transition hover:opacity-100">
          <h2 className="text-xl font-semibold tracking-tight">Blog</h2>
        </Link>
      }
    >
      {children}
    </BlogPostLayout>
  )
}
