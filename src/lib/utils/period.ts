export type Granularity = 'day' | 'week' | 'month'

export function shiftDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}

export type Pill = {
  label: string
  dateRange: [string, string]
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getMonday(d: Date): Date {
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff)
}

const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * 7 pills for Mon–Sun of the week containing refDate.
 * Each pill's dateRange spans exactly one day.
 */
export function getDayPills(refDate: Date): Pill[] {
  const monday = getMonday(refDate)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    const iso = toISO(d)
    return { label: `${DAY_ABBR[d.getDay()]} ${d.getDate()}`, dateRange: [iso, iso] as [string, string] }
  })
}

function formatWeekLabel(from: Date, to: Date): string {
  if (from.getTime() === to.getTime()) return `${from.getDate()}`
  return `${from.getDate()}–${to.getDate()}`
}

/**
 * One pill per calendar week (Mon–Sun) that overlaps with refDate's month.
 * dateRanges are clipped to the month boundaries. Labels show the date range.
 */
export function getWeekPills(refDate: Date): Pill[] {
  const year = refDate.getFullYear()
  const month = refDate.getMonth()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)

  let weekStart = getMonday(monthStart)
  const pills: Pill[] = []

  while (weekStart <= monthEnd) {
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)
    pills.push({ label: formatWeekLabel(weekStart, weekEnd), dateRange: [toISO(weekStart), toISO(weekEnd)] })
    weekStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7)
  }

  return pills
}

/**
 * 12 pills, one per month in refDate's year.
 */
export function getMonthPills(refDate: Date): Pill[] {
  const year = refDate.getFullYear()
  return MONTH_ABBR.map((label, i) => {
    const lastDay = new Date(year, i + 1, 0).getDate()
    return {
      label,
      dateRange: [
        `${year}-${String(i + 1).padStart(2, '0')}-01`,
        `${year}-${String(i + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      ] as [string, string],
    }
  })
}

export function getPills(granularity: Granularity, refDate: Date): Pill[] {
  if (granularity === 'day') return getDayPills(refDate)
  if (granularity === 'week') return getWeekPills(refDate)
  return getMonthPills(refDate)
}

/**
 * Index of the pill whose dateRange contains today, or 0 if none match.
 */
export function getDefaultIndex(pills: Pill[], today: Date): number {
  const iso = toISO(today)
  const i = pills.findIndex(p => p.dateRange[0] <= iso && iso <= p.dateRange[1])
  return i === -1 ? 0 : i
}
