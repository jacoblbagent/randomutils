import type { AnchorHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'

/**
 * The one bridge between Astryx's `href` links and react-router's `to`.
 *
 * Every Astryx link-accepting component (TopNavItem, Button, Link, ...) can
 * take a custom component through `as` or the LinkProvider. They pass `href`,
 * react-router wants `to`, so this maps one to the other once instead of
 * repeating `as={...}` on every link. `to` wins when both are supplied.
 *
 * Lives in its own module so the header, the pages and App can all use it
 * without importing each other in a cycle.
 */
export type RouterLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href?: string
  to?: string
}

export function RouterLink({ href, to, ...rest }: RouterLinkProps) {
  return <Link to={(to ?? href ?? '/') as string} {...rest} />
}
