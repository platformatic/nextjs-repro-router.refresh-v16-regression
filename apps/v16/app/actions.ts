'use server'

import { revalidateTag, updateTag } from 'next/cache'

type RevalidateTagProfile = string | { stale?: number; revalidate?: number; expire?: number }

export async function revalidateTagAction(
  tag: string,
  profile?: RevalidateTagProfile,
): Promise<void> {
  if (profile === undefined) {
    revalidateTag(tag, {})
    return
  }
  revalidateTag(tag, profile)
}

export async function updateTagAction(tag: string): Promise<void> {
  updateTag(tag)
}
