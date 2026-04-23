import { fetchPosts, tagPrefixes } from '@repo/ui/blog'
import { BlogPage } from '@repo/ui/blog-page'
import { BlogPost } from '@repo/ui/blog-post'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'

// Simulates data fetching, and sets `t:post` as a `revalidateTag` tag
const fetchCachedPosts = unstable_cache(fetchPosts, [], { tags: [`${tagPrefixes.type}post`] })

export default async function Page() {
  const { data: posts } = await fetchCachedPosts()
  return (
    <BlogPage>
      {posts.map((post) => (
        <Link key={post.slug} href={`/blog/${post.slug}`}>
          <BlogPost post={post} />
        </Link>
      ))}
    </BlogPage>
  )
}
