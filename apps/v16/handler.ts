import { setImmediate } from "node:timers/promises";

interface CacheEntry<T> {
  value: T;
  tags: string[];
  stale: number;
  timestamp: number;
  expire: number;
  revalidate: number;
}

type NextCacheEntry = CacheEntry<ReadableStream<Uint8Array[]>>;
type StoredCacheEntry = CacheEntry<Uint8Array[]>;

const cache: Map<string, StoredCacheEntry> = new Map();
const writesInProgress: Map<string, Promise<StoredCacheEntry | undefined>> = new Map();

// Next first attempts a get. On a miss, it setups the machinery for the computation and invokes set with an unsettled
// promise as soon as the computation starts.
export default {
  async get(
    cacheKey: string,
    _softTags: string[],
  ): Promise<NextCacheEntry | undefined> {
    let entry = cache.get(cacheKey);

    // Nothing in the cache. Before giving up, check if a set is scheduled.
    if(!entry) {
      // When bursts of requests come in for the same uncached key, there is a chance
      // that multiple requests will arrive while Next is still setting up the set part.
      // Wait a tick to let the first request publish its pending write, then check if it matches this key.
      if(!writesInProgress.has(cacheKey)) {
        await setImmediate();        
      }

      // If another request is already writing this key, await its result and reuse it.
      // Timeout/error paths resolve undefined, so this still falls back to a normal miss.
      if(writesInProgress.has(cacheKey)) {
        entry = await writesInProgress.get(cacheKey);
      }

      // No cached entry and no write to join: Next should compute the value normally.
      if(!entry) {
        return undefined;
      }
    }

    // Reconstruct the ReadableStream from the cached chunks.
    const chunks = entry.value;
    const value = new ReadableStream<Uint8Array[]>({
      start(controller) {        
        controller.enqueue(chunks);        
        controller.close();
      },
    });

    return { ...entry, value };
  },

  async set(
    cacheKey: string,
    pendingEntry: Promise<NextCacheEntry>,
  ): Promise<void> {
    // Capture the current writer, if any, before publishing this write as the active
    // one. This lets readers join this write while still preserving write ordering.
    const pendingWrite = writesInProgress.get(cacheKey);

    let resolved = false;
    const { promise, resolve } = Promise.withResolvers<StoredCacheEntry>();

    // Value is undefined if set failed or timed out.
    // In either case, just let readers miss and compute the value normally.
    function cleanup(value: StoredCacheEntry | undefined = undefined) {
      if (resolved) {
        return;
      }

      resolved = true;
      clearTimeout(timeout);
      resolve(value!);

      // Only remove from the map if this is still the active writer.
      if (writesInProgress.get(cacheKey) === promise) {
        writesInProgress.delete(cacheKey);
      }
    }

    // Do not let a slow render block every request in the burst forever. After the
    // timeout, joined readers will miss and proceed through Next's normal path.
    const timeout = setTimeout(cleanup, 5000).unref();
    writesInProgress.set(cacheKey, promise);

    try {
      // Wait for Next to finish
      const {value, ...result} = await pendingEntry;

      // This writer timed out, discard the result
      if (resolved) {
        return;
      }

      // Save the stream in memory as an array of chunks. This allows us to avoid tee.
      const chunks: Uint8Array[] = []
      for await (const chunk of value) {
        chunks.push(...chunk);
      }

      const newResult: StoredCacheEntry = {...result, value: chunks };

      // If there was already a writer, publish this value only after it finishes.
      // That keeps bursts from racing writes and leaves the cache with the freshest value.
      if(pendingWrite) {
        await pendingWrite
      }

      // Update the cache
      cache.set(cacheKey, newResult);
      cleanup(newResult);
    } catch (err) {
      cleanup();
      throw err
    }
  },

  refreshTags(): void {},

  getExpiration(_: string[]): number {
    // Delegates the check to get method, only when appropriate.
    return Number.POSITIVE_INFINITY;
  },
};
