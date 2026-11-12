/**
 * UUID generation, the whole of the maths, with no React in it.
 *
 * Kept apart from the page so it can be run straight off disk with
 * `node --experimental-strip-types` to check the shape of what it emits, and the
 * one rule that matters (every bit that is meant to be random comes from
 * `crypto.getRandomValues`) lives in a single place.
 *
 * Two versions ship, the two that cover most uses:
 *
 * - **v4** is 122 random bits and nothing else, so it carries no information
 *   about the machine or the moment it was made. That is the point of it and
 *   the reason it should be the default.
 * - **v7** (RFC 9562) puts a 48-bit millisecond timestamp first, so a database
 *   index stores them roughly in insertion order instead of scattering inserts
 *   across a B-tree. The rest is random. Within one millisecond the counter in
 *   `rand_a` is incremented, so v7s from this page sort in the order they were
 *   generated rather than merely in timestamp order.
 */

/** Formatting choices, all display-only: the 128 bits are the same either way. */
export interface Format {
  /** 8-4-4-4-12 with hyphens. Off gives the bare 32 hex digits. */
  hyphens: boolean
  /** {…} around the whole thing, the form Java and some Windows APIs take. */
  braces: boolean
  /** Upper-case hex. RFC 9562 lower-cases, so this is for the places that don't. */
  uppercase: boolean
}

export const DEFAULT_FORMAT: Format = { hyphens: true, braces: false, uppercase: false }

export type Version = 'v4' | 'v7'

export const VERSIONS: { id: Version; label: string; blurb: string }[] = [
  {
    id: 'v4',
    label: 'Version 4',
    blurb: 'Fully random. Tells nobody when or where it was made.',
  },
  {
    id: 'v7',
    label: 'Version 7',
    blurb: 'Starts with the time, so it sorts by creation date.',
  },
]

/** 16 bytes of cryptographic randomness, the same source TLS keys come from. */
export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

/**
 * A 48-bit millisecond timestamp, big-endian, written into `bytes[0..5]`.
 *
 * Split into two halves because JavaScript bitwise operators are 32-bit: `>>>`
 * on anything above 2^32 silently truncates, and a timestamp that silently loses
 * its high bits is a v7 that sorts wrongly for the next 8,000 years.
 */
function writeTimestamp(bytes: Uint8Array, ms: number): void {
  const high = Math.floor(ms / 0x1_0000_0000) // bits 47..32, fits in 16 bits
  const low = ms % 0x1_0000_0000 // bits 31..0
  bytes[0] = (high >>> 8) & 0xff // bits 47..40
  bytes[1] = high & 0xff // bits 39..32
  bytes[2] = (low >>> 24) & 0xff // bits 31..24
  bytes[3] = (low >>> 16) & 0xff // bits 23..16
  bytes[4] = (low >>> 8) & 0xff // bits 15..8
  bytes[5] = low & 0xff // bits 7..0
}

/** RFC 9562 version and variant nibbles on an already-filled buffer. */
function stampVersionAndVariant(bytes: Uint8Array, version: number): void {
  bytes[6] = (bytes[6] & 0x0f) | (version << 4) // version in the high nibble
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10 in the top two bits
}

/** A version 4 UUID: random version nibble, variant bits, everything else random. */
export function uuidV4(): Uint8Array {
  const bytes = randomBytes(16)
  stampVersionAndVariant(bytes, 4)
  return bytes
}

/*
 * State for the v7 counter. A 12-bit clock sequence in `rand_a` makes a batch
 * of v7s strictly increasing even though several land in the same millisecond,
 * which is exactly what a "generate 25" button produces.
 */
let lastMs = -1
let sequence = 0

/** A version 7 UUID: timestamp, counter, then 62 random bits. */
export function uuidV7(now: number = Date.now()): Uint8Array {
  let ms = now
  if (ms > lastMs) {
    lastMs = ms
    sequence = randomBytes(2)[0] & 0x0f // 0..4095, fresh per millisecond
  } else {
    // Same millisecond, or a clock that went backwards: hold the timestamp and
    // advance the counter instead of emitting two ids in the wrong order.
    ms = lastMs
    sequence += 1
    if (sequence > 0x0fff) {
      ms += 1 // counter exhausted: borrow the next millisecond
      lastMs = ms
      sequence = randomBytes(2)[0] & 0x0f
    }
  }

  const bytes = randomBytes(16)
  writeTimestamp(bytes, ms)
  bytes[6] = 0x70 | ((sequence >>> 8) & 0x0f) // version 7, then the counter's top 4 bits
  bytes[7] = sequence & 0xff // counter's low 8 bits: rand_a complete
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant 10
  return bytes
}

/** Hex, 8-4-4-4-12, then unfolded by the format flags. */
export function formatUuid(bytes: Uint8Array, format: Format = DEFAULT_FORMAT): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  const hyphenated = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  const body = format.hyphens ? hyphenated : hyphenated.replace(/-/g, '')
  const cased = format.uppercase ? body.toUpperCase() : body
  return format.braces ? `{${cased}}` : cased
}

/** One UUID in the requested version and format. */
export function generate(version: Version, format: Format = DEFAULT_FORMAT): string {
  return formatUuid(version === 'v4' ? uuidV4() : uuidV7(), format)
}

/** A batch, each id drawn independently except for the v7 counter that keeps order. */
export function generateMany(
  count: number,
  version: Version,
  format: Format = DEFAULT_FORMAT,
): string[] {
  return Array.from({ length: count }, () => generate(version, format))
}

/** The version nibble of a formatted UUID, for anything that has to check one. */
export function versionOf(uuid: string): number {
  const hex = uuid.replace(/[{}-]/g, '')
  return Number.parseInt(hex.slice(12, 13), 16)
}

/** The timestamp a v7 carries, or null for a version that has none. */
export function timestampOf(uuid: string): Date | null {
  const hex = uuid.replace(/[{}-]/g, '')
  if (Number.parseInt(hex.slice(12, 13), 16) !== 7) return null
  return new Date(Number.parseInt(hex.slice(0, 12), 16))
}
