import type { NextConfig } from "next";
import { resolve } from "node:path";

export default {
  cacheComponents: true,
<<<<<<< Updated upstream
  cacheHandlers: {
    default: resolve(import.meta.dirname, "handler.ts"),
  },
||||||| Stash base
=======
  cacheHandler: resolve(import.meta.dirname, "isr-handler.ts"),
  cacheMaxMemorySize: 0,
  cacheHandlers: {
    default: resolve(import.meta.dirname, "components-handler.ts"),
  },
>>>>>>> Stashed changes
  reactCompiler: true,
  experimental: {
    instantNavigationDevToolsToggle: true,
  },
  allowedDevOrigins: ["cantina.perseveranza.net"],
} satisfies NextConfig;
