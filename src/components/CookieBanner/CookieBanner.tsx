import { useEffect, useState } from 'react'

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

export default function CookieBanner() {
  const [consent, setConsent] = useState<CookieConsent>(readConsentFromStorage)

  useEffect(() => {
    writeConsentToStorage(consent)
  }, [consent])

  // Hide banner if dismissed or consent given
  if (consent.dismissed || consent.analytics) {
    return null
  }

  return (
    <div
      className="cookie-banner"
      aria-live="polite"
      role="alert"
      style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        background: '#f8f9fa',
        borderTop: '1px solid #dee2e6',
        padding: '12px',
        fontSize: '14px',
        zIndex: '9999'
      }}
    >
      <p
        style={{
          margin: '0',
          paddingRight: '60px'
        }}
      >
        This site is supported by Google AdSense, which may place cookies.
        <a
          href="/privacy"
          style={{
            color: 'inherit',
            textDecoration: 'underline'
          }}
        >
          Learn more
        </a>.
      </p>
      <div
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          gap: '8px'
        }}
      >
        <button
          onClick={() =>
            setConsent(prev => ({ ...prev, analytics: true }))
          }
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          Accept
        </button>
        <button
          onClick={() =>
            setConsent(prev => ({ ...prev, dismissed: true }))
          }
          style={{ padding: '4px 8px', fontSize: '12px' }}
        >
          Reject
        </button>
      </div>
    </div>
  )
}
