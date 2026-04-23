import { fetchSiblings, fetchPost, fetchStaticParams, tagPrefixes } from '@repo/ui/blog'
import { BlogPost } from '@repo/ui/blog-post'
import { BlogPostPage } from '@repo/ui/blog-post-page'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  return await fetchStaticParams()
}

async function fetchCachedPost(slug: string) {
  const actuallyFetchCachedPost = unstable_cache(
    async (slug: string) => {
      const { data } = await fetchPost(slug)
      return data
    },
    [],
    { tags: [`${tagPrefixes.slug}${slug}`] },
  )
  return actuallyFetchCachedPost(slug)
}

export default async function Page({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params
  const post = await fetchCachedPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <BlogPostPage post={post}>
      <MorePosts slugs={post.siblings} />
    </BlogPostPage>
  )
}

async function fetchCachedSiblings(slugs: string[]) {
  const actuallyFetchCachedSiblings = unstable_cache(
    async (slugs: string[]) => {
      const { data } = await fetchSiblings(slugs)
      return data
    },
    [],
    { tags: slugs.map((slug) => `${tagPrefixes.slug}${slug}`) },
  )
  return actuallyFetchCachedSiblings(slugs)
}

async function MorePosts({ slugs }: { slugs: string[] }) {
  const siblings = await fetchCachedSiblings(slugs)
  return (
    <>
      {siblings.map((sibling) => (
        <Link key={sibling.slug} href={`/blog/${sibling.slug}`}>
          <BlogPost post={sibling} />
        </Link>
      ))}
    </>
  )
}
