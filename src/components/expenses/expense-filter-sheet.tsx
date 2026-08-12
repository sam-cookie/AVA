'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { FormModal } from '@/components/shared/form-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category, FundWithBalance } from '@/types'

type DateMode = 'all' | 'this_month' | 'last_month' | 'custom'

const DATE_OPTIONS: { value: DateMode; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'custom', label: 'Custom range' },
]

function Chip({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'inline-flex items-center px-3 h-8 rounded-full border text-xs font-medium transition-colors',
        selected
          ? 'border-primary bg-accent text-primary'
          : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-muted/30'
      )}
    >
      {label}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2.5">
      {children}
    </p>
  )
}

type Props = {
  categories: Category[]
  funds: FundWithBalance[]
  activeCount: number
  open: boolean
  onOpenChange: (v: boolean) => void
}

function getInitialDateMode(params: URLSearchParams): DateMode {
  const month = params.get('month')
  const dateFrom = params.get('dateFrom')
  if (!month && !dateFrom) return 'all'
  if (dateFrom) return 'custom'
  const now = new Date()
  const thisM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastM = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
  if (month === thisM) return 'this_month'
  if (month === lastM) return 'last_month'
  return 'custom'
}

export function ExpenseFilterSheet({ categories, funds, activeCount, open, onOpenChange }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [dateMode, setDateMode] = useState<DateMode>(() => getInitialDateMode(params))
  const [customFrom, setCustomFrom] = useState(params.get('dateFrom') ?? '')
  const [customTo, setCustomTo] = useState(params.get('dateTo') ?? '')
  const [selectedCategory, setSelectedCategory] = useState(params.get('category') ?? '')
  const [selectedFundId, setSelectedFundId] = useState(params.get('fundId') ?? '')

  function apply() {
    const p = new URLSearchParams()
    const q = params.get('q')
    if (q) p.set('q', q)

    if (dateMode === 'this_month') {
      const now = new Date()
      p.set('month', `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
    } else if (dateMode === 'last_month') {
      const prev = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
      p.set('month', `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`)
    } else if (dateMode === 'custom' && customFrom && customTo) {
      p.set('dateFrom', customFrom)
      p.set('dateTo', customTo)
    }

    if (selectedCategory) p.set('category', selectedCategory)
    if (selectedFundId) p.set('fundId', selectedFundId)

    router.replace(`${pathname}?${p.toString()}`)
    onOpenChange(false)
  }

  function clearAll() {
    setDateMode('all')
    setCustomFrom('')
    setCustomTo('')
    setSelectedCategory('')
    setSelectedFundId('')
    const p = new URLSearchParams()
    const q = params.get('q')
    if (q) p.set('q', q)
    router.replace(`${pathname}?${p.toString()}`)
    onOpenChange(false)
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Filters"
      subtitle={activeCount > 0 ? `${activeCount} filter${activeCount > 1 ? 's' : ''} active` : undefined}
    >
      <div className="px-5 md:px-6 py-5 space-y-6">
        {/* Date range */}
        <div>
          <SectionLabel>Date range</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {DATE_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={dateMode === opt.value}
                onSelect={() => setDateMode(opt.value)}
              />
            ))}
          </div>
          {dateMode === 'custom' && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">From</p>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">To</p>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div>
            <SectionLabel>Category</SectionLabel>
            <div className="flex flex-wrap gap-2">
              <Chip label="All" selected={!selectedCategory} onSelect={() => setSelectedCategory('')} />
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  label={cat.name}
                  selected={selectedCategory === cat.name}
                  onSelect={() => setSelectedCategory(selectedCategory === cat.name ? '' : cat.name)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Account */}
        {funds.length > 0 && (
          <div>
            <SectionLabel>Account</SectionLabel>
            <div className="flex flex-wrap gap-2">
              <Chip label="All" selected={!selectedFundId} onSelect={() => setSelectedFundId('')} />
              {funds.map((f) => (
                <Chip
                  key={f.id}
                  label={f.name}
                  selected={selectedFundId === String(f.id)}
                  onSelect={() => setSelectedFundId(selectedFundId === String(f.id) ? '' : String(f.id))}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-card border-t border-border px-5 md:px-6 py-4 flex gap-3 shrink-0">
        {activeCount > 0 && (
          <Button type="button" variant="outline" className="h-11 px-5" onClick={clearAll}>
            Clear all
          </Button>
        )}
        <Button type="button" className="flex-1 h-11" onClick={apply}>
          Apply filters
        </Button>
      </div>
    </FormModal>
  )
}

export function FilterButton({ activeCount, onClick }: { activeCount: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm font-medium transition-colors shrink-0',
        activeCount > 0
          ? 'border-primary bg-accent text-primary'
          : 'border-border text-foreground hover:bg-muted'
      )}
    >
      <SlidersHorizontal className="h-3.5 w-3.5" />
      Filters
      {activeCount > 0 && (
        <span className="h-4 min-w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center px-1">
          {activeCount}
        </span>
      )}
    </button>
  )
}
