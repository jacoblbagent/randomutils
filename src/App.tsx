import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PageMetaSync from './components/PageMetaSync/PageMetaSync'
import SiteFooter from './components/SiteFooter/SiteFooter'
import SiteHeader from './components/SiteHeader/SiteHeader'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import FlagsPanel from './config/FlagsPanel/FlagsPanel'
import { useFlags } from './config/flags'
import About from './pages/About/About'
import Contact from './pages/Contact/Contact'
import Faq from './pages/Faq/Faq'
import Home from './pages/Home/Home'
import NotFound from './pages/NotFound/NotFound'
import Privacy from './pages/Privacy/Privacy'
import Terms from './pages/Terms/Terms'
import AudioExtract from './tools/audio-extract/AudioExtract'
import MovToMp4 from './tools/mov-to-mp4/MovToMp4'
import TsToMp4 from './tools/ts-to-mp4/TsToMp4'

// Production is served at the apex of randomutils.com; dev runs at the root too.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

/**
 * The site shell: one persistent header and footer around a routed page.
 *
 * Split out of `App` so the prerenderer can render the same shell inside a
 * MemoryRouter and write static HTML for each route (scripts/prerender.mjs) —
 * the page a crawler gets and the page a visitor gets are therefore the same
 * page, not two descriptions of it.
 *
 * Routes for a flagged tool are mounted only while its flag is on, so switching
 * the flag off in the flags panel takes the URL with it — /ts-to-mp4 falls
 * through to NotFound rather than offering a page nobody can reach.
 */
export function AppShell() {
  const flags = useFlags()
  return (
    <>
      <ScrollToTop />
      <PageMetaSync />
      <div className="app">
        <SiteHeader />
        <main className="page">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/contact" element={<Contact />} />
            {flags['ts-to-mp4'] && <Route path="/ts-to-mp4" element={<TsToMp4 />} />}
            {flags['mov-to-mp4'] && <Route path="/mov-to-mp4" element={<MovToMp4 />} />}
            {flags['audio-extract'] && <Route path="/audio-extract" element={<AudioExtract />} />}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <SiteFooter />
      </div>
      <FlagsPanel />
    </>
  )
}

/**
 * Real paths, not hashes — /ts-to-mp4 rather than /#/ts-to-mp4. The site is
 * static (GitHub Pages), so every route a crawler should see is prerendered to
 * its own `dist/<path>/index.html`; the `404.html` copy of index.html that the
 * build emits (see the `spa-fallback` plugin in vite.config.ts) is the backstop
 * for genuinely unknown paths. New tools: add a <Route> here, an entry in
 * src/data/tools.ts, and a page for the registry in src/data/pages.ts.
 */
export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <AppShell />
    </BrowserRouter>
  )
}
