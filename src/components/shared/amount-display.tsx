import { formatPHP } from '@/lib/utils/currency'
import { cn } from '@/lib/utils'

type Props = {
  centavos: number
  className?: string
  /** Show + prefix for positive credit amounts */
  signed?: boolean
  /** Apply color based on sign */
  colored?: boolean
}

export function AmountDisplay({ centavos, className, signed, colored }: Props) {
  const formatted = formatPHP(Math.abs(centavos))
  const prefix = signed && centavos > 0 ? '+' : ''

  return (
    <span
      className={cn(
        'tabular-nums',
        colored && centavos >= 0 && 'text-green-600',
        colored && centavos < 0 && 'text-red-500',
        className
      )}
    >
      {prefix}{formatted}
    </span>
  )
}
