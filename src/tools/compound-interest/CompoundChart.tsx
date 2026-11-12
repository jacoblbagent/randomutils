import { useEffect, useRef, useState } from 'react'
import { Text } from '@astryxdesign/core/Text'
import { HStack } from '@astryxdesign/core/Stack'
import type { YearRow } from './compound'
import './CompoundChart.css'

/**
 * Stacked area chart of the projection: contributions in blue at the bottom,
 * interest on top, so the widening green band is the compounding.
 *
 * Hand-drawn SVG rather than a chart library: the data is one series per year
 * and the only dependency-light way to keep the Astryx tokens is to read them
 * through `var(--color-data-…)`. The table underneath carries the exact
 * figures, so this needs no axes hover.
 */

interface Props {
  rows: YearRow[]
  /** Starting balance, the year-0 point. */
  principal: number
  currency: boolean
}

/** Axis labels only: 1.2M reads better than 1,200,000 at 11px. */
function compact(value: number, currency: boolean): string {
  const symbol = currency ? '$' : ''
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${symbol}${Number((value / 1e9).toFixed(1))}B`
  if (abs >= 1e6) return `${symbol}${Number((value / 1e6).toFixed(1))}M`
  if (abs >= 1e4) return `${symbol}${Number((value / 1e3).toFixed(0))}k`
  return `${symbol}${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)}`
}

/** Round step to 1/2/2.5/5 × 10^n so the gridlines land on readable numbers. */
function niceTicks(max: number, count: number): number[] {
  if (!(max > 0)) return [0, 1]
  const raw = max / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const normalised = raw / magnitude
  const step =
    (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 2.5 ? 2.5 : normalised <= 5 ? 5 : 10) *
    magnitude
  const ticks: number[] = []
  for (let value = 0; value <= max + step / 2; value += step) ticks.push(value)
  return ticks
}

/** Year labels on a 1/2/5/10/20/25/50 step, so the last label never crowds the one before it. */
function yearTicks(lastYear: number, count: number): number[] {
  if (lastYear <= 0) return [0]
  const steps = [1, 2, 5, 10, 20, 25, 50]
  const step = steps.find((candidate) => lastYear / candidate <= count) ?? Math.ceil(lastYear / count)
  const ticks: number[] = []
  for (let year = 0; year <= lastYear; year += step) ticks.push(year)
  if (ticks[ticks.length - 1] !== lastYear) ticks.push(lastYear)
  return ticks
}

export default function CompoundChart({ rows, principal, currency }: Props) {
  const holder = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(720)

  useEffect(() => {
    const element = holder.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0].contentRect.width)
      if (next > 0) setWidth(next)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Year 0 is the starting balance: contributions equal the principal, interest nil.
  const points = [
    { year: 0, balance: principal, contributed: principal },
    ...rows.map((row) => ({ year: row.year, balance: row.balance, contributed: row.contributed })),
  ]
  const lastYear = points[points.length - 1].year
  const peak = Math.max(...points.map((point) => point.balance))
  const ticks = niceTicks(peak, width < 420 ? 3 : 4)
  const top = ticks[ticks.length - 1] || 1

  const height = width < 480 ? 220 : 280
  const pad = { left: width < 420 ? 44 : 56, right: 12, top: 12, bottom: 26 }
  const innerWidth = Math.max(1, width - pad.left - pad.right)
  const innerHeight = Math.max(1, height - pad.top - pad.bottom)

  const x = (year: number) => pad.left + (lastYear === 0 ? innerWidth : (year / lastYear) * innerWidth)
  const y = (value: number) => pad.top + innerHeight - (value / top) * innerHeight

  const path = (series: { year: number; value: number }[]) =>
    series.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(point.year).toFixed(1)},${y(point.value).toFixed(1)}`).join(' ')

  const contributedLine = path(points.map((point) => ({ year: point.year, value: point.contributed })))
  const balanceLine = path(points.map((point) => ({ year: point.year, value: point.balance })))

  const baseline = y(0).toFixed(1)
  const firstX = x(points[0].year).toFixed(1)
  const lastX = x(lastYear).toFixed(1)

  const contributedArea = `${contributedLine} L${lastX},${baseline} L${firstX},${baseline} Z`
  const interestArea = `${balanceLine} L${lastX},${y(points[points.length - 1].contributed).toFixed(1)} ${points
    .slice()
    .reverse()
    .map((point) => `L${x(point.year).toFixed(1)},${y(point.contributed).toFixed(1)}`)
    .join(' ')} Z`

  const summary = `Balance grows from ${compact(principal, currency)} to ${compact(peak, currency)} over ${lastYear} ${
    lastYear === 1 ? 'year' : 'years'
  }`

  return (
    <div ref={holder}>
      <svg
        className="ci-chart"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={summary}
      >
        <title>{summary}</title>

        {ticks.map((tick) => (
          <g key={`tick-${tick}`}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(tick)}
              y2={y(tick)}
              style={{ stroke: 'var(--color-border)' }}
              strokeWidth={1}
            />
            <text
              x={pad.left - 8}
              y={y(tick) + 4}
              textAnchor="end"
              style={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
            >
              {compact(tick, currency)}
            </text>
          </g>
        ))}

        <path d={contributedArea} style={{ fill: 'var(--color-data-blue-2)' }} />
        <path d={interestArea} style={{ fill: 'var(--color-data-shamrock-2)' }} />
        <path d={contributedLine} style={{ stroke: 'var(--color-data-blue-4)' }} strokeWidth={2} fill="none" />
        <path d={balanceLine} style={{ stroke: 'var(--color-data-shamrock-4)' }} strokeWidth={2} fill="none" />
        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={y(0)}
          y2={y(0)}
          style={{ stroke: 'var(--color-border-emphasized)' }}
          strokeWidth={1}
        />

        {yearTicks(lastYear, width < 480 ? 3 : 6).map((year) => (
          <text
            key={`year-${year}`}
            x={x(year)}
            y={height - 8}
            textAnchor={year === 0 ? 'start' : year === lastYear ? 'end' : 'middle'}
            style={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
          >
            {year === 0 ? 'Start' : year}
          </text>
        ))}
      </svg>

      <HStack gap={4} wrap="wrap">
        <HStack gap={2} vAlign="center">
          <span className="ci-chart__swatch ci-chart__swatch--contributed" />
          <Text type="supporting">Paid in {compact(points[points.length - 1].contributed, currency)}</Text>
        </HStack>
        <HStack gap={2} vAlign="center">
          <span className="ci-chart__swatch ci-chart__swatch--interest" />
          <Text type="supporting">
            Interest {compact(peak - points[points.length - 1].contributed, currency)}
          </Text>
        </HStack>
      </HStack>
    </div>
  )
}
