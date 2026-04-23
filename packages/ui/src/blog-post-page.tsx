import { type ReactNode } from 'react'

import { type Post } from './blog'

export function BlogPostPage({ post, children }: { post: Post; children?: ReactNode }) {
  return (
    <article className="mx-auto max-w-5xl px-6 pt-6 pb-12">
      <div
        className="mb-8 aspect-[1200/630] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900"
        style={{ backgroundImage: `url("${post.image}")`, backgroundSize: 'cover' }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">{post.title}</h1>
        <p className="mt-3 text-base opacity-80">{post.description}</p>

        <div className="prose prose-sm mt-10 max-w-none space-y-4 text-sm leading-7 opacity-90">
          <p>
            This is placeholder body copy. In a real post there would be an argument here, built one
            paragraph at a time, with the kind of small detours that make a technical essay feel
            like it was written by an actual human.
          </p>
          <p>
            The repository this page lives in exists to demonstrate behavior of the Next.js router,
            so the content is intentionally boring. Any similarity to real insight is entirely
            coincidental, if occasionally welcome.
          </p>
          <p>
            If you are reading this from a prefetch-triggered hover, congratulations, the link
            worked. If you are reading it after a full navigation, that also counts, and you have
            learned something about how caches behave under load.
          </p>
        </div>
      </div>

      {children && (
        <section className="mt-16 border-t border-gray-200 pt-8 dark:border-gray-800">
          <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase opacity-70">
            More posts
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">{children}</div>
        </section>
      )}
    </article>
  )
}
