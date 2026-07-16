import { resolve } from 'node:path'

import type { NextConfig } from 'next'

export default {
  cacheComponents: true,
  cacheHandler: resolve(import.meta.dirname, 'isr-handler.ts'),
  cacheMaxMemorySize: 0,
  cacheHandlers: {
    default: resolve(import.meta.dirname, 'components-handler.ts'),
  },
  reactCompiler: true,
  experimental: {
    instantNavigationDevToolsToggle: true,
  },
} satisfies NextConfig
