'use client'

import { cn } from '@/lib/utils'
import type { Granularity } from '@/lib/utils/period'

const OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

type Props = {
  value: Granularity
  onChange: (g: Granularity) => void
}

export function PeriodToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-2.5 h-7 rounded-md text-[11.5px] font-medium transition-colors',
            value === opt.value
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground/55 hover:text-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
