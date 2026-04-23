import { fetchPost, fetchSiblings, fetchStaticParams } from '@repo/ui/blog'
import { BlogPost } from '@repo/ui/blog-post'
import { BlogPostPage } from '@repo/ui/blog-post-page'
import { cacheLife, cacheTag } from 'next/cache'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  return await fetchStaticParams()
}

async function fetchCachedPost(slug: string) {
  'use cache'
  cacheLife('max')
  const { data: post, tags } = await fetchPost(slug)
  cacheTag(...tags)
  return post
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

async function MorePosts({ slugs }: { slugs: string[] }) {
  'use cache'
  cacheLife('max')
  const { data: siblings, tags } = await fetchSiblings(slugs)
  cacheTag(...tags)
  console.log('siblings', { siblings, tags })
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
