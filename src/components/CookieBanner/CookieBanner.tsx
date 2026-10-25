import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './CookieBanner.css'

type CookieConsent = {
  analytics: boolean
  dismissed: boolean
}

const DEFAULT_COOKIE_CONSENT: CookieConsent = {
  analytics: false,
  dismissed: false
}

function readConsentFromStorage(): CookieConsent {
  try {
    if (typeof window === 'undefined') return DEFAULT_COOKIE_CONSENT
    const stored = localStorage.getItem('randomutils.cookie.consent')
    if (!stored) return DEFAULT_COOKIE_CONSENT
    const parsed = JSON.parse(stored)
    if (!parsed || typeof parsed !== 'object') return DEFAULT_COOKIE_CONSENT
    return {
      analytics: 'analytics' in parsed ? !!parsed.analytics : false,
      dismissed: 'dismissed' in parsed ? !!parsed.dismissed : false
    }
  } catch {
    return DEFAULT_COOKIE_CONSENT
  }
}

function writeConsentToStorage(consent: CookieConsent) {
  try {
    localStorage.setItem(
      'randomutils.cookie.consent',
      JSON.stringify(consent)
    )
  } catch {
    // storage full / private mode
  }
}

/**
 * Consent notice for the ads that fund the site. A floating card in the content
 * column, not a full-width bar — it never covers the tool a visitor came for.
 * Stays out of the way once answered: either choice is remembered under
 * `randomutils.cookie.consent` and the card is never shown again.
 */
export default function CookieBanner() {
  const [consent, setConsent] = useState<CookieConsent>(readConsentFromStorage)

  useEffect(() => {
    writeConsentToStorage(consent)
  }, [consent])

  if (consent.dismissed || consent.analytics) {
    return null
  }

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie consent">
      <p className="cookie-banner__title">Cookies on RandomUtils</p>
      <p className="cookie-banner__body">
        Ads served by Google AdSense may set cookies to show and measure them.
        Every tool runs in your browser — your files are never uploaded.{' '}
        <Link className="cookie-banner__policy" to="/privacy">
          Cookie policy
        </Link>
      </p>
      <div className="cookie-banner__actions">
        <button
          type="button"
          className="secondary small"
          onClick={() => setConsent(prev => ({ ...prev, dismissed: true }))}
        >
          Reject
        </button>
        <button
          type="button"
          className="primary small"
          onClick={() => setConsent(prev => ({ ...prev, analytics: true }))}
        >
          Accept
        </button>
      </div>
    </div>
  )
}
