'use client'

import { ICON_OPTIONS, CategoryIcon } from './category-icon'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (name: string) => void
}

export function IconPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {ICON_OPTIONS.map((opt) => (
        <button
          key={opt.name}
          type="button"
          onClick={() => onChange(opt.name)}
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-md border text-[10px] transition-colors min-h-[56px]',
            value === opt.name
              ? 'border-primary bg-accent text-primary'
              : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-muted/30'
          )}
        >
          <CategoryIcon name={opt.name} className="h-5 w-5" />
          <span className="leading-tight text-center">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
