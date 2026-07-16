import { deserialize, serialize } from 'node:v8'

import { SharedCache } from './shared-cache.ts'

type CacheContext = {
  tags?: string[]
}

type StoredIsrEntry = {
  value: string
  lastModified: number
  tags: string[]
}

const cache = new SharedCache('isr')

function encode(value: unknown) {
  return serialize(value).toString('base64')
}

function decode(value: string) {
  return deserialize(Buffer.from(value, 'base64'))
}

export default class CacheHandler {
  async get(key: string) {
    let entry = await cache.get(key)

    if (!entry) {
      return null
    }

    const stored = JSON.parse(entry) as StoredIsrEntry

    return {
      value: decode(stored.value),
      lastModified: stored.lastModified,
      tags: stored.tags,
    }
  }

  async set(key: string, data: unknown, ctx: CacheContext = {}) {
    if (data === null) {
      await cache.delete(key)
      return
    }

    const value = encode(data)

    await cache.set(
      key,
      JSON.stringify({
        value,
        lastModified: Date.now(),
        tags: ctx.tags ?? [],
      }),
    )
  }

  async revalidateTag(_tags: string | string[]) {}

  resetRequestCache() {}
}
