import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Theme } from '@astryxdesign/core/theme'
import { LinkProvider } from '@astryxdesign/core/Link'
import '@astryxdesign/core/reset.css'
import '@astryxdesign/core/astryx.css'
import { themes, defaultThemeSlug } from './astryx-themes'
import './App.css'
import App from './App'
import { RouterLink } from './lib/RouterLink'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme theme={themes[defaultThemeSlug]} mode="system">
      <LinkProvider component={RouterLink}>
        <App />
      </LinkProvider>
    </Theme>
  </StrictMode>,
)
