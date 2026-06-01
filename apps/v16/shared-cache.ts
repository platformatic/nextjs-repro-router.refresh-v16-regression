import EventEmitter, { once } from 'node:events'
import { setInterval as every } from 'node:timers/promises'

import Redis from 'ioredis'

export const enabled = true

export interface CancellablePromise<T> {
  promise: Promise<T>
  cancel(): void
}

export class SharedCache extends EventEmitter {
  #prefix: string
  #lockTimeout: number
  #primary: Redis
  #secondary: Redis

  constructor(prefix: string, lockTimeout: number) {
    super()
    this.setMaxListeners(0)
    this.#prefix = prefix
    this.#lockTimeout = lockTimeout
    this.#primary = new Redis({ enableAutoPipelining: true })
    this.#secondary = new Redis({ enableAutoPipelining: true })
    this.#secondary.on('message', this.#onPublish.bind(this))
  }

  async get(key: string) {
    const value = await this.#primary.get(this.#valueKey(key))
    return value ?? undefined
  }

  async set(key: string, value: string) {
    // Use Promise.all so it happens on a single request thanks to autopipelining.
    await Promise.all([
      this.#primary.set(this.#valueKey(key), value),
      this.#primary.publish(this.#channelKey(key), 'OK'),
    ])
  }

  async delete(key: string) {
    // Use Promise.all so it happens on a single request thanks to autopipelining.
    await Promise.all([
      this.#primary.del(this.#valueKey(key)),
      this.#primary.publish(this.#channelKey(key), 'OK'),
    ])
  }

  async wait(key: string): Promise<CancellablePromise<string | undefined>> {
    await this.#secondary.subscribe(this.#channelKey(key))

    const { promise, resolve } = Promise.withResolvers<void>()
    const timeout = setTimeout(() => {
      clearTimeout(timeout)
      resolve()
    }, 5000)

    const waiter = once(this, key)

    return {
      promise: Promise.race([waiter, promise])
        .then((value) => {
          clearTimeout(timeout)
          return Array.isArray(value) ? (value[0] as string) : undefined
        })
        .finally(() => this.#secondary.unsubscribe(this.#channelKey(key))),
      cancel() {
        clearTimeout(timeout)
        resolve()
      },
    }
  }

  async lock(key: string): Promise<'ok' | 'locked' | 'retry'> {
    // The PX implicitly handles set timeouts or crashes, no need to manage manually.
    const result = await this.#primary.set(this.#lockKey(key), 'ACQUIRED', 'PX', '5000', 'NX')

    if (result !== 'OK') {
      // Check every 10 ms the lock status
      for await (const _ of every(10)) {
        const current = await this.#primary.get(this.#lockKey(key))

        if (current === 'PENDING' || current === 'ACQUIRED') {
          continue
        }

        // The lock is either confirmed or released, we can retry to acquire it
        return current ? 'locked' : 'retry'
      }
    }

    // We hold the lock, install the confirmation machinery
    await this.#primary.set(this.#lockKey(key), 'PENDING', 'KEEPTTL', 'XX')
    await this.#waitConfirmation(key)

    return 'ok'
  }

  async #waitConfirmation(key: string) {
    let start = Date.now()

    for await (const _ of every(10)) {
      if (Date.now() - start > this.#lockTimeout) {
        // Forcefully release the lock - Other processes will retry
        await this.#primary.del(this.#lockKey(key))
        break
      }

      const current = await this.#primary.get(this.#lockKey(key))

      if (current === 'CONFIRMED') {
        break
      }
    }
  }

  async release(key: string) {
    return this.#primary.del(this.#lockKey(key))
  }

  async confirm(key: string) {
    return this.#primary.set(this.#lockKey(key), 'CONFIRMED', 'KEEPTTL', 'XX')
  }

  async dedupeGet(key: string): Promise<string | undefined> {
    const updatedPromise = await this.wait(key)
    let entry = await this.get(key)

    // Nothing in the cache. Before giving up, check if a set is scheduled.
    if (!entry) {
      // Install the waiter for the published value before acquiring the lock, so we don't miss any publishing

      // Try to acquire the lock. If it succeeds, it means there is no pending set and we're responsible for it.
      const locked = await this.lock(key)

      if (locked === 'ok') {
        updatedPromise.cancel() // Cancel the waiter, we're responsible for setting the value
        return undefined
      } else if (locked === 'retry') {
        return this.dedupeGet(key) // Retry to acquire the lock
      }

      // Wait for a value to be marked as ready
      await updatedPromise.promise

      // Read the cache again to get the published value
      entry = await this.get(key)
    } else {
      updatedPromise.cancel() // Cancel the waiter, there is already a value in cache
    }

    return entry ?? undefined
  }

  #valueKey(key: string) {
    return `${this.#prefix}:value:${key}`
  }

  #lockKey(key: string) {
    return `${this.#prefix}:lock:${key}`
  }

  #channelKey(key: string) {
    return `${this.#prefix}:result:${key}`
  }

  #onPublish(channel: string, message: string) {
    const resultPrefix = `${this.#prefix}:result:`
    if (channel.startsWith(resultPrefix)) {
      this.emit(channel.slice(resultPrefix.length), message)
      return
    }
  }
}
