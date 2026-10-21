import { BrowserRouter, Route, Routes } from 'react-router-dom'
import SiteFooter from './components/SiteFooter/SiteFooter'
import SiteHeader from './components/SiteHeader/SiteHeader'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import Home from './pages/Home/Home'
import NotFound from './pages/NotFound/NotFound'
import TsToMp4 from './tools/ts-to-mp4/TsToMp4'

// Production is served at the apex of randomutils.com; dev runs at the root too.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

/**
 * RandomUtils shell: one persistent header and footer around a routed page.
 *
 * Real paths, not hashes — /ts-to-mp4 rather than /#/ts-to-mp4. The site is
 * static (GitHub Pages), so deep-link reloads are handled by the 404.html copy
 * of index.html that the build emits (see the `spa-fallback` plugin in
 * vite.config.ts, which GitHub Pages serves for unknown paths). New tools: add
 * a <Route> here and an entry in src/data/tools.ts.
 */
export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <ScrollToTop />
      <div className="app">
        <SiteHeader />
        <main className="page">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ts-to-mp4" element={<TsToMp4 />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <SiteFooter />
      </div>
    </BrowserRouter>
  )
}
