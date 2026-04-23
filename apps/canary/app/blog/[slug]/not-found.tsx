import { BlogPostNotFound } from '@repo/ui/blog-post-not-found'
import Link from 'next/link'

export default function NotFound() {
  return (
    <BlogPostNotFound
      backLink={
        <Link
          href="/blog"
          className="inline-flex h-10 items-center justify-center rounded-full border border-black/[0.08] px-4 text-sm font-medium transition hover:bg-neutral-100 dark:border-white/[0.145] dark:hover:bg-neutral-900"
        >
          Back to Blog
        </Link>
      }
    />
  )
}
