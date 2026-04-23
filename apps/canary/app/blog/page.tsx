import { fetchPosts } from '@repo/ui/blog'
import { BlogPage } from '@repo/ui/blog-page'
import { BlogPost } from '@repo/ui/blog-post'
import { cacheLife, cacheTag } from 'next/cache'
import Link from 'next/link'

async function fetchCachedPosts() {
  'use cache'
  const { data: posts, tags } = await fetchPosts()
  cacheLife('max')
  cacheTag(...tags)
  return posts
}

export default async function Page() {
  const posts = await fetchCachedPosts()
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
