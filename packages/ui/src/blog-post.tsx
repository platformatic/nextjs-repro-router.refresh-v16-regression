import { type Post } from './blog'

export function BlogPost({ post }: { post: Post }) {
  return (
    <div
      style={{ ['--card-accent' as string]: post.accent }}
      className="group block h-full overflow-hidden rounded-lg border border-gray-200 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--card-accent)] hover:shadow-[0_12px_32px_-12px_var(--card-accent)] dark:border-gray-800"
    >
      <div
        className="aspect-[1200/630] w-full bg-gray-100 dark:bg-gray-900"
        style={{ backgroundImage: `url("${post.image}")`, backgroundSize: 'cover' }}
        aria-hidden="true"
      />
      <div className="p-4">
        <h2 className="text-base leading-snug font-semibold group-hover:underline">{post.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm opacity-80">{post.description}</p>
      </div>
    </div>
  )
}
