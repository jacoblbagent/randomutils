/**
 * The arithmetic behind the compound interest calculator, kept out of the
 * component so it can be exercised on its own.
 *
 * Model: interest compounds monthly at `annualRatePct / 12`, and each monthly
 * contribution is added at the end of its month, so the last contribution in a
 * year earns nothing yet in that year. That is the conservative convention,
 * and it means the loop result can be checked against the closed form
 * `P(1+i)^n + C((1+i)^n - 1) / i` exactly.
 */

export interface Inputs {
  /** Starting balance. */
  principal: number
  /** Added at the end of every month. */
  monthlyContribution: number
  /** Nominal annual rate, in percent (8 means 8%). */
  annualRatePct: number
  /** Whole years to project. */
  years: number
}

export interface YearRow {
  year: number
  balance: number
  /** Principal plus every contribution made up to the end of this year. */
  contributed: number
  /** Balance minus contributed: the growth so far. */
  interest: number
}

export interface Projection {
  rows: YearRow[]
  finalBalance: number
  totalContributed: number
  totalInterest: number
}

const MAX_YEARS = 80

/** Monthly rate from a nominal annual percentage. */
export function monthlyRate(annualRatePct: number): number {
  return annualRatePct / 100 / 12
}

/**
 * Month-by-month projection, rolled up into one row per year.
 *
 * Inputs are clamped rather than rejected: an empty field reads as 0, a
 * negative principal counts as 0 and years is capped so the table stays finite.
 */
export function project(inputs: Inputs): Projection {
  const principal = Number.isFinite(inputs.principal) ? Math.max(0, inputs.principal) : 0
  const contribution = Number.isFinite(inputs.monthlyContribution) ? inputs.monthlyContribution : 0
  const annualRatePct = Number.isFinite(inputs.annualRatePct) ? inputs.annualRatePct : 0
  const years = Number.isFinite(inputs.years) ? Math.min(MAX_YEARS, Math.max(0, Math.floor(inputs.years))) : 0

  const i = monthlyRate(annualRatePct)
  let balance = principal
  let contributed = principal
  const rows: YearRow[] = []

  for (let year = 1; year <= years; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      balance *= 1 + i
      balance += contribution
      contributed += contribution
    }
    rows.push({ year, balance, contributed, interest: balance - contributed })
  }

  return {
    rows,
    finalBalance: balance,
    totalContributed: contributed,
    totalInterest: balance - contributed,
  }
}
