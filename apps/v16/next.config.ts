import type { NextConfig } from 'next'

export default {
  cacheComponents: true,
  reactCompiler: true,
  experimental: {
    instantNavigationDevToolsToggle: true,
  },
} satisfies NextConfig
