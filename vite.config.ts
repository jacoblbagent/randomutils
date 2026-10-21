import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * GitHub Pages has no rewrite rules, so a deep-link reload such as
 * /randomutils/ts-to-mp4 would 404. Pages does serve /randomutils/404.html for
 * any unknown path under the project, so emitting a byte-identical copy of
 * index.html as 404.html lets React Router take over from the real URL.
 */
function spaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// GitHub Pages serves the project site from /randomutils/; keep dev at the root.
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/randomutils/' : '/',
  plugins: [react(), spaFallback()],
  server: {
    // Reachable over the tailnet via `tailscale serve` (Host = <node>.ts.net).
    allowedHosts: ['.ts.net', 'localhost', '127.0.0.1'],
  },
  // ffmpeg.wasm spins up its own worker; pre-bundling breaks it.
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
