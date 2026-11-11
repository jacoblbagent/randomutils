import { useEffect, useState } from 'react'
import { Card } from '@astryxdesign/core/Card'
import { VStack, HStack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Button } from '@astryxdesign/core/Button'
import { Link } from '@astryxdesign/core/Link'
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
 * column, not a full-width bar, so it never covers the tool a visitor came for.
 * Stays out of the way once answered: either choice is remembered under
 * `randomutils.cookie.consent` and the card is never shown again.
 *
 * The card is an Astryx Card; CookieBanner.css keeps only the fixed position,
 * which is layout the Card has no prop for.
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
    <Card className="ru-cookie" elevation="med" padding={3}>
      <VStack gap={2}>
        <Text as="p" type="label">
          Cookies on RandomUtils
        </Text>
        <Text as="p" type="supporting">
          Ads served by Google AdSense may set cookies to show and measure them. Every tool runs in
          your browser, and your files are never uploaded.{' '}
          <Link href="/privacy">Privacy policy</Link>
        </Text>
        <HStack gap={2} hAlign="end">
          <Button
            label="Reject"
            size="sm"
            onClick={() => setConsent((prev) => ({ ...prev, dismissed: true }))}
          />
          <Button
            label="Accept"
            size="sm"
            variant="primary"
            onClick={() => setConsent((prev) => ({ ...prev, analytics: true }))}
          />
        </HStack>
      </VStack>
    </Card>
  )
}
