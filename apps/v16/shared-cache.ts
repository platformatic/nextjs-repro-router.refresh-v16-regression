import EventEmitter from 'node:events'

import Redis from 'ioredis'

export class SharedCache extends EventEmitter {
  #prefix: string
  #primary: Redis

  constructor(prefix: string) {
    super()
    this.setMaxListeners(0)
    this.#prefix = prefix
    this.#primary = new Redis({ enableAutoPipelining: true })
  }

  async get(key: string): Promise<string | undefined> {
    const value = await this.#primary.get(this.#valueKey(key))
    return value ?? undefined
  }

  async set(key: string, value: string) {
    return this.#primary.set(this.#valueKey(key), value)
  }

  async delete(key: string) {
    return this.#primary.del(this.#valueKey(key))
  }

  #valueKey(key: string) {
    return `${this.#prefix}:value:${key}`
  }
}
