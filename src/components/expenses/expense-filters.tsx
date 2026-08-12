'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import type { Category, FundWithBalance } from '@/types'

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
  funds: FundWithBalance[]
}

export function ExpenseFilters({ categories, funds }: Props) {
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

  function setMonth(value: string) {
    const p = new URLSearchParams(params.toString())
    if (p.get('month') === value) {
      p.delete('month')
    } else {
      p.set('month', value)
    }
    router.replace(`${pathname}?${p.toString()}`)
  }

  const activeCategory = params.get('category')
  const activeFundId = params.get('fundId')
  const activeMonth = params.get('month')
  const hasFilters = activeCategory || activeFundId || activeMonth

  function clearAll() {
    router.replace(pathname)
  }

  // Last 6 months for the month picker
  const months: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-PH', { month: 'short', year: '2-digit' })
    months.push({ value, label })
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

      {/* Month filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {months.map((m) => (
          <FilterChip
            key={m.value}
            label={m.label}
            active={activeMonth === m.value}
            onToggle={() => setMonth(m.value)}
          />
        ))}
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
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

      {/* Account filter */}
      {funds.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {funds.map((f) => (
            <FilterChip
              key={f.id}
              label={f.name}
              active={activeFundId === String(f.id)}
              onToggle={() => toggle('fundId', String(f.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
