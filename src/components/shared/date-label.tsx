import { formatDate, formatShortDate } from '@/lib/utils/date'
import { cn } from '@/lib/utils'

type Props = {
  iso: string
  short?: boolean
  className?: string
}

export function DateLabel({ iso, short, className }: Props) {
  return (
    <span className={cn('text-muted-foreground', className)}>
      {short ? formatShortDate(iso) : formatDate(iso)}
    </span>
  )
}
