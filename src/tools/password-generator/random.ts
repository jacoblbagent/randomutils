/**
 * Password generation — the whole of the maths, with no React in it.
 *
 * Kept apart from the page so it can be exercised directly (`node
 * --experimental-strip-types src/tools/password-generator/random.ts` prints a
 * distribution check) and so the one rule that matters is in a single place:
 * every draw comes from `crypto.getRandomValues`, and an index is taken by
 * rejection, never by modulo.
 *
 * Why rejection: a 32-bit draw mapped onto a 30-character pool with `%` hands
 * the first two characters in the pool one extra chance in 2^32. Nobody would
 * notice by eye, but a generator that is subtly biased is not a generator you
 * would trust for anything else, and the fix is four lines.
 *
 * Nothing in this module — or in the page that uses it — touches the network.
 */

export const LOWER = 'abcdefghijklmnopqrstuvwxyz'
export const UPPER = LOWER.toUpperCase()
export const DIGITS = '0123456789'

/**
 * Symbols that survive being pasted into the places passwords end up:
 *
 * No quotes (single or double), no backtick, no backslash, no space, no angle
 * brackets and no pipe — those are the characters a signup form strips, a shell
 * eats, or a CSV, JSON or .env file mangles when the value is not quoted. Every
 * character here is safe in all of those.
 */
export const SYMBOLS = '!#$%&*+-=?@^_~.:,;()[]{}'

/**
 * The characters people misread when a password is copied off a screen or a
 * sheet of paper: zero against capital O, lower-case o, and one against capital
 * I and lower-case l.
 */
export const AMBIGUOUS = new Set(['0', 'O', 'o', '1', 'I', 'l'])

export type SetId = 'lower' | 'upper' | 'digits' | 'symbols'

export interface CharSet {
  id: SetId
  label: string
  chars: string
}

export const SETS: CharSet[] = [
  { id: 'lower', label: 'Lower-case letters', chars: LOWER },
  { id: 'upper', label: 'Upper-case letters', chars: UPPER },
  { id: 'digits', label: 'Digits', chars: DIGITS },
  { id: 'symbols', label: 'Symbols', chars: SYMBOLS },
]

export interface Options {
  /** Characters wanted. Raised to the number of selected sets if it is smaller. */
  length: number
  sets: Record<SetId, boolean>
  /** Drop the look-alike characters from every pool. */
  avoidAmbiguous: boolean
}

/** A set's characters, with the look-alikes removed when asked. */
export function charsOf(set: CharSet, avoidAmbiguous: boolean): string {
  if (!avoidAmbiguous) return set.chars
  return [...set.chars].filter((char) => !AMBIGUOUS.has(char)).join('')
}

/**
 * The pools to draw from, in set order — one pool per selected set, each already
 * stripped of whatever is excluded. Empty pools (a set whose characters are all
 * excluded) drop out here rather than producing a pool a draw could never use.
 */
export function poolsFor(options: Options): string[] {
  return SETS.filter((set) => options.sets[set.id])
    .map((set) => charsOf(set, options.avoidAmbiguous))
    .filter((chars) => chars.length > 0)
}

const DRAW_RANGE = 0x1_0000_0000

/**
 * A uniform integer in [0, max). Draws above the largest whole multiple of `max`
 * are thrown away (and redrawn) so the remaining range divides evenly.
 */
export function randomInt(max: number): number {
  if (!Number.isInteger(max) || max < 1) throw new Error(`randomInt needs a positive integer, got ${max}`)
  if (max === 1) return 0
  const limit = Math.floor(DRAW_RANGE / max) * max
  const draw = new Uint32Array(1)
  let value = limit
  while (value >= limit) {
    crypto.getRandomValues(draw)
    value = draw[0]
  }
  return value % max
}

const pick = (chars: string): string => chars[randomInt(chars.length)]

/** Fisher-Yates, with the same unbiased draw for every swap. */
export function shuffle(items: string[]): string[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1)
    const held = items[i]
    items[i] = items[j]
    items[j] = held
  }
  return items
}

/**
 * One password: one character from every selected set, the rest from the
 * combined pool, then shuffled.
 *
 * The head start exists because "include symbols" that returns a password with
 * no symbol in it is the complaint every generator gets. Drawing the guaranteed
 * characters first does bias the output slightly (those characters are certain
 * to appear rather than merely likely); the entropy figure the page shows is the
 * pool-based one, `length × log2(pool)`, which is what a generator of this shape
 * is normally measured by. The shuffle is what stops the guaranteed characters
 * from always sitting at the front.
 */
export function generate(length: number, pools: string[]): string {
  if (pools.length === 0) throw new Error('generate needs at least one pool')
  const total = Math.max(length, pools.length)
  const chars = pools.map((pool) => pick(pool))
  const all = pools.join('')
  while (chars.length < total) chars.push(pick(all))
  return shuffle(chars).join('')
}

/** A batch, each password drawn independently. */
export function generateMany(count: number, length: number, pools: string[]): string[] {
  return Array.from({ length: count }, () => generate(length, pools))
}

/**
 * Shannon entropy of the generator's space, in bits: length × log2(pool size).
 * 20 characters from the full 92-character pool is about 130 bits.
 */
export function entropyBits(poolSize: number, length: number): number {
  if (poolSize < 2 || length < 1) return 0
  return length * Math.log2(poolSize)
}

export interface Strength {
  label: string
  tone: 'bad' | 'mid' | 'good'
}

/**
 * Plain bands, from the usual reading of the figures: below 28 bits an off-the-
 * shelf cracker walks in, 60 is the old NIST-era "should be fine" line, and 80
 * is where even an offline attack on a fast hash stops being worth the power.
 */
export function strengthOf(bits: number): Strength {
  if (bits < 28) return { label: 'Very weak', tone: 'bad' }
  if (bits < 40) return { label: 'Weak', tone: 'bad' }
  if (bits < 60) return { label: 'Fair', tone: 'mid' }
  if (bits < 80) return { label: 'Strong', tone: 'good' }
  if (bits < 100) return { label: 'Very strong', tone: 'good' }
  return { label: 'Excellent', tone: 'good' }
}

/**
 * Guesses per second for the crack-time estimate: 100 billion, roughly a
 * well-funded offline attack against a fast hash (MD5/SHA-1 class, or a GPU rig
 * on a leaked dump). It is a *lower* bound on how long the password lasts —
 * a slow or salted hash, or a rate-limited login, makes the real number larger.
 */
export const GUESSES_PER_SECOND = 1e11

/**
 * log10 of the seconds an offline attack needs, on average (half the space, so
 * `bits - 1`). Returned as a logarithm because a 200-bit password overflows a
 * double long before it stops being a sensible answer.
 */
export function log10CrackSeconds(bits: number): number {
  return (bits - 1) * Math.log10(2) - Math.log10(GUESSES_PER_SECOND)
}
