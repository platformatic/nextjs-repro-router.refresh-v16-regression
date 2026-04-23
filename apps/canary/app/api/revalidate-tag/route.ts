import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get('tag')
  if (!tag) {
    return NextResponse.json({ error: 'Missing `tag` query param' }, { status: 400 })
  }

  const expireParam = request.nextUrl.searchParams.get('expire')
  const profile: string | { expire?: number } =
    expireParam === null
      ? {}
      : Number.isFinite(Number(expireParam))
        ? { expire: Number(expireParam) }
        : expireParam

  revalidateTag(tag, profile)

  return NextResponse.json({ revalidated: true, tag, profile, now: Date.now() })
}
