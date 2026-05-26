import type { NextConfig } from "next";
import { resolve } from "node:path";

export default {
  cacheComponents: true,
  cacheHandlers: {
    default: resolve(import.meta.dirname, "handler.ts"),
  },
  reactCompiler: true,
  experimental: {
    instantNavigationDevToolsToggle: true,
  },
  allowedDevOrigins: ["cantina.perseveranza.net"],
} satisfies NextConfig;
