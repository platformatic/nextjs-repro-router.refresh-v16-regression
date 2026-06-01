import { deserialize, serialize } from 'node:v8'

import { SharedCache, enabled } from './shared-cache.ts'

type CacheContext = {
  tags?: string[]
}

type StoredIsrEntry = {
  value: string
  lastModified: number
  tags: string[]
}

const cache = new SharedCache('isr', 1000)

function encode(value: unknown) {
  return serialize(value).toString('base64')
}

function decode(value: string) {
  return deserialize(Buffer.from(value, 'base64'))
}

export default class CacheHandler {
  async get(key: string) {
    let entry: string | StoredIsrEntry | undefined = await (enabled
      ? cache.dedupeGet(key)
      : cache.get(key))

    if (!entry) {
      return null
    } else if (typeof entry === 'string') {
      entry = JSON.parse(entry)
    }

    const stored = entry as StoredIsrEntry

    return {
      value: decode(stored.value),
      lastModified: stored.lastModified,
      tags: stored.tags,
    }
  }

  async set(key: string, data: unknown, ctx: CacheContext = {}) {
    // Signal that we're starting the operation
    if (enabled) {
      await cache.confirm(key)
    }

    try {
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
    } finally {
      if (enabled) {
        await cache.release(key)
      }
    }
  }

  async revalidateTag(_tags: string | string[]) {}

  resetRequestCache() {}
}
