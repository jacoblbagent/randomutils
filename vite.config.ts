import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * GitHub Pages has no rewrite rules, so a deep-link reload of a path with no
 * prerendered page — /ts-to-mp4/anything, say — would 404. Pages serves
 * 404.html for any unknown path on the site, so emitting a byte-identical copy
 * of index.html as 404.html lets React Router take over from the real URL.
 * (The prerenderer then rewrites that copy to carry noindex and no ad code.)
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

// Production is served at the apex of randomutils.com, so assets sit at the root.
export default defineConfig({
  base: '/',
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
