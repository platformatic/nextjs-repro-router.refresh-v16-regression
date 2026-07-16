import { SharedCache } from './shared-cache.ts'

interface CacheEntry<T> {
  value: T
  tags: string[]
  stale: number
  timestamp: number
  expire: number
  revalidate: number
}

type NextCacheEntry = CacheEntry<ReadableStream<Uint8Array>>
type StoredCacheEntry = CacheEntry<string>

const cache = new SharedCache('components')

// Next first attempts a get. On a miss, it setups the machinery for the computation and invokes set with an unsettled
// promise as soon as the computation starts.
export default {
  async get(key: string, _softTags: string[]): Promise<NextCacheEntry | undefined> {
    let entry = await cache.get(key)

    if (!entry) {
      return undefined
    }

    const stored = JSON.parse(entry) as StoredCacheEntry

    // Reconstruct the ReadableStream from the cached chunks.
    const bytes = Buffer.from(stored.value, 'base64')
    const value = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes)
        controller.close()
      },
    })

    return { ...stored, value }
  },

  async set(key: string, pendingEntry: Promise<NextCacheEntry>): Promise<void> {
    // Wait for Next to finish.
    const { value, ...result } = await pendingEntry

    // Save the stream in memory as an array of chunks to be able to serialize it.
    const chunks: Uint8Array[] = []
    for await (const chunk of value) {
      chunks.push(chunk)
    }

    const nextValue = Buffer.concat(chunks).toString('base64')

    // Update the cache.
    await cache.set(key, JSON.stringify({ ...result, value: nextValue }))
  },

  refreshTags(): void {},

  getExpiration(_: string[]): number {
    // Delegates the check to get method, only when appropriate.
    return Number.POSITIVE_INFINITY
  },
}
