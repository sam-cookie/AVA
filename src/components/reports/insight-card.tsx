import { Lightbulb } from 'lucide-react'
import { formatPHP } from '@/lib/utils/currency'

type Props = {
  totalSpent: number
  topCategory: { name: string; total: number; percentage: number } | null
  topFund: { fundName: string; percentage: number } | null
  transactionCount: number
}

function buildInsight(
  totalSpent: number,
  topCategory: Props['topCategory'],
  topFund: Props['topFund'],
  transactionCount: number
): string {
  if (!topCategory) {
    return `You made ${transactionCount} transaction${transactionCount !== 1 ? 's' : ''} totaling ${formatPHP(totalSpent)} this period.`
  }

  if (topCategory.percentage >= 70) {
    return `Almost all of your spending went toward ${topCategory.name} — ${topCategory.percentage}% of your total expenses (${formatPHP(topCategory.total)}).`
  }

  if (topCategory.percentage >= 50 && topFund) {
    return `Most of your spending this period went toward ${topCategory.name}, making up ${topCategory.percentage}% of your total expenses, mainly from ${topFund.fundName}.`
  }

  if (topCategory.percentage >= 50) {
    return `Most of your spending this period went toward ${topCategory.name}, making up ${topCategory.percentage}% of your total expenses (${formatPHP(topCategory.total)}).`
  }

  return `Your top spending category was ${topCategory.name} at ${topCategory.percentage}% (${formatPHP(topCategory.total)}), spread across ${transactionCount} transaction${transactionCount !== 1 ? 's' : ''}.`
}

export function InsightCard({ totalSpent, topCategory, topFund, transactionCount }: Props) {
  if (totalSpent === 0) return null

  const insight = buildInsight(totalSpent, topCategory, topFund, transactionCount)

  return (
    <div className="bg-accent/50 border border-border rounded-xl p-4 flex gap-3">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Lightbulb className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-accent-foreground uppercase tracking-wider mb-1">
          Spending insight
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">{insight}</p>
      </div>
    </div>
  )
}
