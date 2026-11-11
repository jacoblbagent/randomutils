import { useLocation } from 'react-router-dom'
import { TopNav, TopNavHeading, TopNavItem } from '@astryxdesign/core/TopNav'
import { HStack } from '@astryxdesign/core/Stack'
import { Button } from '@astryxdesign/core/Button'
import { Icon } from '@astryxdesign/core/Icon'
import { RouterLink } from '../../lib/RouterLink'
import { SITE } from '../../config/site'
import { IconExternal } from '../../icons/Icons'

const NAV = [
  { label: 'About', path: '/about' },
  { label: 'FAQ', path: '/faq' },
  { label: 'Contact', path: '/contact' },
]

/**
 * Site header. Astryx owns the bar: TopNav carries the product name, the three
 * pages an ad reviewer looks for, and the repository link in the end slot.
 *
 * The pathname comes from the router rather than from a `NavLink`, so the
 * prerendered markup marks the current page on every route instead of only
 * after hydration.
 */
export default function SiteHeader() {
  const { pathname } = useLocation()

  return (
    <TopNav
      label="Site"
      heading={
        <TopNavHeading
          heading={SITE.name}
          headingHref="/"
          logo={<span className="ru-mark" aria-hidden="true" />}
          as={RouterLink}
        />
      }
      startContent={
        <HStack gap={1} vAlign="center">
          {NAV.map((item) => (
            <TopNavItem
              key={item.path}
              label={item.label}
              href={item.path}
              as={RouterLink}
              isSelected={pathname === item.path}
            />
          ))}
        </HStack>
      }
      endContent={
        <Button
          label="Source"
          size="sm"
          variant="ghost"
          icon={<Icon icon={IconExternal} size="sm" />}
          href={SITE.repo}
          target="_blank"
          rel="noreferrer"
        />
      }
    />
  )
}
