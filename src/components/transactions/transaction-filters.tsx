'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { TRANSACTION_TYPES, type Category, type IncomeSource, type TransactionType } from '@/types'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

const TYPE_LABELS: Record<TransactionType, string> = {
  addition: 'Added',
  expense: 'Expense',
  transfer_in: 'Transfer in',
  transfer_out: 'Transfer out',
}

type ChipProps = {
  label: string
  active: boolean
  onToggle: () => void
}

function FilterChip({ label, active, onToggle }: ChipProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'inline-flex items-center gap-1 px-3 h-8 rounded-full text-xs font-medium border transition-colors shrink-0',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
      )}
    >
      {label}
      {active && <X className="h-3 w-3 -mr-0.5" />}
    </button>
  )
}

type Props = {
  categories: Category[]
  sources: IncomeSource[]
}

export function TransactionFilters({ categories, sources }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function toggle(key: string, value: string) {
    const p = new URLSearchParams(params.toString())
    if (p.get(key) === value) {
      p.delete(key)
    } else {
      p.set(key, value)
    }
    router.replace(`${pathname}?${p.toString()}`)
  }

  const activeType = params.get('type') as TransactionType | null
  const activeCategory = params.get('category')
  const activeSource = params.get('source')

  const hasFilters = activeType || activeCategory || activeSource

  function clearAll() {
    router.replace(pathname)
  }

  return (
    <div className="space-y-2">
      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear filters
        </button>
      )}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TRANSACTION_TYPES.map((type) => (
          <FilterChip
            key={type}
            label={TYPE_LABELS[type]}
            active={activeType === type}
            onToggle={() => toggle('type', type)}
          />
        ))}
      </div>
      {activeType === 'expense' && categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <FilterChip
              key={cat.id}
              label={cat.name}
              active={activeCategory === cat.name}
              onToggle={() => toggle('category', cat.name)}
            />
          ))}
        </div>
      )}
      {activeType === 'addition' && sources.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {sources.map((s) => (
            <FilterChip
              key={s.id}
              label={s.name}
              active={activeSource === s.name}
              onToggle={() => toggle('source', s.name)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
