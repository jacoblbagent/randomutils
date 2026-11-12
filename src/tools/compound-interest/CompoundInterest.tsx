import { useState } from 'react'
import RelatedTools from '../../components/RelatedTools/RelatedTools'
import ToolGuide from '../../components/ToolGuide/ToolGuide'
import { IconArrowLeft } from '../../icons/Icons'
import { VStack, HStack, StackItem } from '@astryxdesign/core/Stack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Button } from '@astryxdesign/core/Button'
import { Badge } from '@astryxdesign/core/Badge'
import { Card } from '@astryxdesign/core/Card'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { Grid } from '@astryxdesign/core/Grid'
import { Icon } from '@astryxdesign/core/Icon'
import { List, ListItem } from '@astryxdesign/core/List'
import { NumberInput } from '@astryxdesign/core/NumberInput'
import { Table, type TableColumn } from '@astryxdesign/core/Table'
import { Link } from '@astryxdesign/core/Link'
import { Code } from '@astryxdesign/core/Code'
import { Divider } from '@astryxdesign/core/Divider'
import Page from '../../components/Page/Page'
import CompoundChart from './CompoundChart'
import { project, type YearRow } from './compound'

/**
 * Compound interest calculator: what a starting balance plus monthly
 * contributions grows to at a fixed annual rate.
 *
 * Every value on screen is derived from the four inputs on each render; the
 * arithmetic lives in `compound.ts`. The page makes no request.
 */

/** Whole dollars by default; the checkbox only adds or drops the symbol. */
function money(value: number, currency: boolean): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: currency ? 'currency' : 'decimal',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
  return formatter.format(value)
}

interface Row extends Record<string, unknown> {
  year: string
  balance: string
  contributed: string
  interest: string
}

export default function CompoundInterest() {
  const [principal, setPrincipal] = useState(10000)
  const [monthly, setMonthly] = useState(200)
  const [rate, setRate] = useState(8)
  const [years, setYears] = useState(10)
  const [currency, setCurrency] = useState(true)

  const { rows, finalBalance, totalContributed, totalInterest } = project({
    principal,
    monthlyContribution: monthly,
    annualRatePct: rate,
    years,
  })

  const data: Row[] = rows.map((row: YearRow) => ({
    year: `Year ${row.year}`,
    balance: money(row.balance, currency),
    contributed: money(row.contributed, currency),
    interest: money(row.interest, currency),
  }))

  const columns: TableColumn<Row>[] = [
    { key: 'year', header: 'Year' },
    { key: 'balance', header: 'Balance', align: 'end' },
    { key: 'contributed', header: 'Paid in', align: 'end' },
    { key: 'interest', header: 'Interest', align: 'end' },
  ]

  return (
    <Page>
      <VStack gap={2}>
        <Button
          label="All tools"
          variant="ghost"
          size="sm"
          icon={<Icon icon={IconArrowLeft} size="sm" />}
          href="/"
        />
        <Heading level={1}>Compound interest calculator</Heading>
        <Text type="large" color="secondary">
          What a starting balance plus monthly contributions grows to at a fixed annual rate,
          compounded monthly. Change any field and the figures follow.
        </Text>
      </VStack>

      <Card padding={4}>
        <VStack gap={3}>
          <VStack gap={1}>
            <Text type="label">Future value after {years === 1 ? '1 year' : `${years} years`}</Text>
            <Heading level={2}>{money(finalBalance, currency)}</Heading>
            <Text type="supporting">
              Rounded to the nearest whole number. Interest is added monthly at{' '}
              {(rate / 12).toLocaleString(undefined, { maximumFractionDigits: 4 })}% a month.
            </Text>
          </VStack>

          <HStack gap={4} wrap="wrap">
            <VStack gap={0}>
              <Text type="supporting">Total contributed</Text>
              <Text>{money(totalContributed, currency)}</Text>
            </VStack>
            <StackItem size="fill">
              <VStack gap={0}>
                <Text type="supporting">Interest earned</Text>
                <Text>{money(totalInterest, currency)}</Text>
              </VStack>
            </StackItem>
            <VStack gap={0}>
              <Text type="supporting">Growth on contributions</Text>
              <Text>
                {totalContributed > 0
                  ? `${((totalInterest / totalContributed) * 100).toFixed(0)}%`
                  : '0%'}
              </Text>
            </VStack>
          </HStack>

          <HStack gap={1} wrap="wrap">
            <Badge label={`${money(principal, currency)} to start`} />
            <Badge label={`${money(monthly, currency)} a month`} />
            <Badge label={`${rate}% a year`} />
          </HStack>

          <CheckboxInput
            label="Currency symbol"
            description={currency ? 'Values show a $ before the number.' : 'Plain numbers, no symbol.'}
            value={currency}
            onChange={setCurrency}
          />
        </VStack>
      </Card>

      <Card padding={4}>
        <VStack gap={3}>
          <Heading level={2}>Inputs</Heading>
          <Grid columns={{ minWidth: 200, max: 2 }} gap={3}>
            <NumberInput
              label="Starting amount"
              value={principal}
              onChange={setPrincipal}
              min={0}
              step={500}
              hasNumberSteppers
              isWheelEnabled={false}
              formatValue={(value) => money(value, false)}
            />
            <NumberInput
              label="Monthly contribution"
              value={monthly}
              onChange={setMonthly}
              min={0}
              step={50}
              hasNumberSteppers
              isWheelEnabled={false}
              formatValue={(value) => money(value, false)}
            />
            <NumberInput
              label="Annual interest rate"
              value={rate}
              onChange={setRate}
              min={0}
              max={30}
              step={0.25}
              units="%"
              hasNumberSteppers
              isWheelEnabled={false}
            />
            <NumberInput
              label="Years"
              value={years}
              onChange={setYears}
              min={0}
              max={80}
              step={1}
              isIntegerOnly
              hasNumberSteppers
              isWheelEnabled={false}
            />
          </Grid>
          <Text type="supporting">
            Contributions go in at the end of each month, so the last one in a year has not earned
            interest yet. The rate is nominal and fixed: no fees, no tax, no inflation.
          </Text>
        </VStack>
      </Card>

      <Card padding={4}>
        <VStack gap={3}>
          <Heading level={2}>Year by year</Heading>
          {data.length > 0 ? (
            <VStack gap={3}>
              <CompoundChart rows={rows} principal={principal} currency={currency} />
              <Divider />
              <Table data={data} columns={columns} idKey="year" density="compact" />
            </VStack>
          ) : (
            <Text color="secondary">Set a number of years above 0 to see the chart and table.</Text>
          )}
        </VStack>
      </Card>

      <ToolGuide heading="About this tool">
        <VStack gap={2}>
          <Heading level={2}>How the figure is worked out</Heading>
          <Text as="p" color="secondary">
            The balance is stepped forward one month at a time: it grows by one twelfth of the annual
            rate, then the monthly contribution is added. Compounding monthly rather than yearly
            makes a small difference at the same nominal rate, because interest starts earning
            interest sooner.
          </Text>
          <Text as="p" color="secondary">
            The closed form for the same model is <Code>P(1+i)^n + C((1+i)^n − 1) / i</Code>, with{' '}
            <Code>i</Code> the monthly rate, <Code>n</Code> the number of months and <Code>C</Code>{' '}
            the monthly contribution. The table is the same loop, kept in{' '}
            <Code>src/tools/compound-interest/compound.ts</Code>.
          </Text>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>What it leaves out</Heading>
          <List listStyle="disc">
            <ListItem label={<Text color="secondary">Tax on interest, account fees and fund expense ratios. Each of those lowers the real result.</Text>} />
            <ListItem label={<Text color="secondary">Inflation. The figure is in today’s dollars only if you subtract inflation from the rate first.</Text>} />
            <ListItem label={<Text color="secondary">Variable returns. A fixed 8% is a planning assumption, not a forecast for any particular investment.</Text>} />
            <ListItem label={<Text color="secondary">Deposits that change over time. For a rising contribution, add it as a second run.</Text>} />
          </List>
        </VStack>

        <VStack gap={2}>
          <Heading level={2}>Privacy</Heading>
          <Text as="p" color="secondary">
            The numbers stay in this tab. There is no request, no saved history and no cookie; the{' '}
            <Link href="/privacy">privacy page</Link> covers the rest.
          </Text>
        </VStack>
      </ToolGuide>

      <RelatedTools currentId="compound-interest" />
    </Page>
  )
}
