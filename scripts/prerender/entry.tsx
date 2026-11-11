/**
 * Prerender entry, renders the real app shell for one route to HTML.
 *
 * Loaded by scripts/prerender.mjs through Vite's SSR module runner, so it uses
 * the same components, the same CSS imports and the same TypeScript source as
 * the browser build. A MemoryRouter seeded with the route path stands in for
 * the BrowserRouter; effects never run, and the flag store falls back to the
 * committed defaults, which is exactly what a first-time visitor gets.
 *
 * The Theme and LinkProvider wrappers mirror src/main.tsx: the theme is what
 * paints every Astryx surface, so leaving it out here would ship markup that
 * has no theme scope until the client mounts.
 *
 * Deliberately not part of the app build: tsconfig's `include` covers `src`
 * only, so this file is never shipped.
 */
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { Theme } from '@astryxdesign/core/theme'
import { LinkProvider } from '@astryxdesign/core/Link'
import { themes, defaultThemeSlug } from '../../src/astryx-themes'
import { AppShell } from '../../src/App'
import { RouterLink } from '../../src/lib/RouterLink'

export function render(pathname: string): string {
  return renderToString(
    <Theme theme={themes[defaultThemeSlug]} mode="light">
      <LinkProvider component={RouterLink}>
        <MemoryRouter initialEntries={[pathname]}>
          <AppShell />
        </MemoryRouter>
      </LinkProvider>
    </Theme>,
  )
}
