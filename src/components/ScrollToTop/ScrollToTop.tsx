import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Each route is a fresh view — land at the top of it, without animation. */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
