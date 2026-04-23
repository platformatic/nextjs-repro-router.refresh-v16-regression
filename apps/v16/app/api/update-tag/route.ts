import { updateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const tag = request.nextUrl.searchParams.get('tag')
  if (!tag) {
    return NextResponse.json({ error: 'Missing `tag` query param' }, { status: 400 })
  }

  try {
    updateTag(tag)
  } catch (error) {
    return NextResponse.json(
      {
        updated: false,
        tag,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ updated: true, tag, now: Date.now() })
}
