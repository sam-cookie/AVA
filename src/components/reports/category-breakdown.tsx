import { Tag } from 'lucide-react'
import { formatPHP } from '@/lib/utils/currency'
import { CategoryIcon } from '@/components/categories/category-icon'

export type CategoryRow = {
  category: string
  icon: string | null
  total: number
  percentage: number
}

type Props = {
  data: CategoryRow[]
}

export function CategoryBreakdown({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        No spending this period.
      </p>
    )
  }

  const displayed = data.slice(0, 5)
  const hasMore = data.length > 5

  return (
    <div className="space-y-4">
      {displayed.map((row) => (
        <div key={row.category} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            {row.icon ? (
              <CategoryIcon name={row.icon} className="h-4 w-4 text-accent-foreground" />
            ) : (
              <Tag className="h-4 w-4 text-accent-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-sm font-medium truncate">{row.category}</span>
              <span className="text-sm tabular-nums text-muted-foreground shrink-0">
                {formatPHP(row.total)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full transition-all duration-500"
                  style={{ width: `${row.percentage}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground w-7 text-right shrink-0">
                {row.percentage}%
              </span>
            </div>
          </div>
        </div>
      ))}

      {hasMore && (
        <p className="text-xs text-muted-foreground text-center pt-1">
          +{data.length - 5} more categories
        </p>
      )}
    </div>
  )
}
