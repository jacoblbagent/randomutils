/**
 * Prerender entry — renders the real app shell for one route to HTML.
 *
 * Loaded by scripts/prerender.mjs through Vite's SSR module runner, so it uses
 * the same components, the same CSS imports and the same TypeScript source as
 * the browser build. A MemoryRouter seeded with the route path stands in for
 * the BrowserRouter; effects never run, and the flag store falls back to the
 * committed defaults, which is exactly what a first-time visitor gets.
 *
 * Deliberately not part of the app build: tsconfig's `include` covers `src`
 * only, so this file is never shipped.
 */
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { AppShell } from '../../src/App'

export function render(pathname: string): string {
  return renderToString(
    <MemoryRouter initialEntries={[pathname]}>
      <AppShell />
    </MemoryRouter>,
  )
}
