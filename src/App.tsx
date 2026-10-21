import { HashRouter, Route, Routes } from 'react-router-dom'
import SiteFooter from './components/SiteFooter/SiteFooter'
import SiteHeader from './components/SiteHeader/SiteHeader'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import Home from './pages/Home/Home'
import NotFound from './pages/NotFound/NotFound'
import TsToMp4 from './tools/ts-to-mp4/TsToMp4'

/**
 * RandomUtils shell: one persistent header and footer around a routed page.
 *
 * Routing is a hash router on purpose — the site is static (GitHub Pages, a
 * plain file server) and a deep link must survive a reload without any
 * server-side rewrite rule. New tools: add a <Route> here and an entry in
 * src/data/tools.ts.
 */
export default function App() {
  return (
    <HashRouter>
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
    </HashRouter>
  )
}
