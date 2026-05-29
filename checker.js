import process from 'node:process'
import { createInterface } from 'node:readline/promises'

import Redis from 'ioredis'

const host = process.env.VALKEY_HOST ?? '127.0.0.1'
const port = Number(process.env.VALKEY_PORT ?? 6379)

const counters = {
  components: {
    lock: { get: 0, acquired: 0, pending: 0, confirmed: 0 },
    value: { get: 0, set: 0 }
  },
  isr: {
    lock: { get: 0, acquired: 0, pending: 0, confirmed: 0 },
    value: { get: 0, set: 0 }
  }
}

function createValkeyClient () {
  return new Redis({ host, port, lazyConnect: true })
}

function parseKey (key) {
  for (const scope of ['components', 'isr']) {
    for (const type of ['lock', 'value']) {
      const prefix = `${scope}:${type}:`
      if (key.startsWith(prefix)) {
        return { scope, type, key: key.slice(prefix.length) }
      }
    }
  }
}

function printRow (scope, type, values) {
  const set = type === 'value' ? values.set : ''
  const acquired = type === 'lock' ? values.acquired : ''
  const pending = type === 'lock' ? values.pending : ''
  const confirmed = type === 'lock' ? values.confirmed : ''

  console.log(`| ${scope.padEnd(10)} | ${type.padEnd(5)} | ${String(values.get).padStart(5)} | ${String(set).padStart(5)} | ${String(acquired).padStart(8)} | ${String(pending).padStart(7)} | ${String(confirmed).padStart(9)} |`)
}

function printStats () {
  console.log('| scope      | type  |   get |   set | acquired | pending | confirmed |')
  console.log('| ---------- | ----- | ----: | ----: | -------: | ------: | --------: |')

  for (const scope of ['components', 'isr']) {
    for (const type of ['lock', 'value']) {
      const values = counters[scope][type]
      printRow(scope, type, values)
      values.get = 0

      if (type === 'lock') {
        values.acquired = 0
        values.pending = 0
        values.confirmed = 0
      } else {
        values.set = 0
      }
    }
  }
}

async function flushAll () {
  const flusher = createValkeyClient()
  try {
    await flusher.connect()
    await flusher.flushall()
    console.log('FLUSHALL OK')
  } catch (error) {
    console.error(`FLUSHALL failed: ${error.message}`)
  } finally {
    flusher.disconnect()
  }
}

const redis = createValkeyClient()
await redis.connect()

const monitor = await redis.monitor()
monitor.on('monitor', (_time, args) => {
  const command = args[0]?.toLowerCase()
  const key = String(args[1] ?? '')
  const parsed = parseKey(key)

  if (!parsed || !['get', 'set', 'del'].includes(command)) {
    return
  }

  const values = counters[parsed.scope][parsed.type]

  if (command === 'get') {
    values.get++
    return
  }

  if (command === 'set' && parsed.type === 'value') {
    values.set++
    console.log(`${command} ${parsed.scope} ${parsed.type} ${parsed.key}`)
    return
  }

  if (command === 'set' && parsed.type === 'lock') {
    const state = String(args[2] ?? '').toLowerCase()
    if (state in values) {
      values[state]++
    }

    console.log(`${command} ${parsed.scope} ${parsed.type} ${parsed.key} ${args[2]}`)
    return
  }

  console.log(`${command} ${parsed.scope} ${parsed.type} ${parsed.key}`)
})

monitor.on('error', error => {
  console.error(`Monitor connection failed: ${error.message}`)
  process.exitCode = 1
})

const rl = createInterface({ input: process.stdin, output: process.stdout })
console.log(`Monitoring Valkey at ${host}:${port}. Press Enter to print counts. Type f and press Enter to print counts and FLUSHALL.`)

for await (const line of rl) {
  printStats()
  if (line.trim().toLowerCase() === 'f') {
    await flushAll()
  }
}

monitor.disconnect()
redis.disconnect()
