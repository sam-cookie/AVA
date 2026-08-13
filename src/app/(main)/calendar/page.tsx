
import { getDailyExpensesForMonth } from '@/services/transactions'
import { getUtangDeadlinesForMonth } from '@/services/utang'
import { CalendarView } from '@/components/calendar/calendar-view'

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function CalendarPage({ searchParams }: Props) {
  const params = await searchParams
  const now = new Date()
  const year = Number(params.year) || now.getFullYear()
  const month = Number(params.month) || (now.getMonth() + 1)

  const [dailyExpenses, utangDues] = await Promise.all([
    getDailyExpensesForMonth(year, month),
    getUtangDeadlinesForMonth(year, month),
  ])

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <p className="text-[10px] font-medium text-muted-foreground/65 uppercase tracking-[0.14em] mb-2.5">
          Calendar
        </p>
        <p className="text-[22px] font-semibold leading-none text-foreground">
          Spending Overview
        </p>
      </div>
      <CalendarView
        year={year}
        month={month}
        dailyExpenses={dailyExpenses}
        utangDues={utangDues}
      />
    </div>
  )
}
