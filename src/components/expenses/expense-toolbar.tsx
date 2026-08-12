'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { ExpenseFilterSheet, FilterButton } from './expense-filter-sheet'
import type { Category, FundWithBalance } from '@/types'

type Props = {
  categories: Category[]
  funds: FundWithBalance[]
}

type ActiveTag = { key: string; label: string }

function useFilterTags(params: URLSearchParams, categories: Category[], funds: FundWithBalance[]): ActiveTag[] {
  const tags: ActiveTag[] = []
  const month = params.get('month')
  const dateFrom = params.get('dateFrom')
  const dateTo = params.get('dateTo')
  const category = params.get('category')
  const fundId = params.get('fundId')

  if (month) {
    const [y, m] = month.split('-').map(Number)
    const label = new Date(y, m - 1, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
    tags.push({ key: 'month', label })
  } else if (dateFrom && dateTo) {
    tags.push({ key: 'date', label: `${dateFrom} → ${dateTo}` })
  }
  if (category) tags.push({ key: 'category', label: category })
  if (fundId) {
    const fund = funds.find((f) => String(f.id) === fundId)
    if (fund) tags.push({ key: 'fundId', label: fund.name })
  }
  return tags
}

export function ExpenseToolbar({ categories, funds }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)
  const [search, setSearch] = useState(params.get('q') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tags = useFilterTags(params, categories, funds)
  const activeFilterCount = tags.length

  // Sync search input when URL changes externally (e.g. back button)
  useEffect(() => {
    setSearch(params.get('q') ?? '')
  }, [params])

  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const p = new URLSearchParams(params.toString())
      if (value.trim()) {
        p.set('q', value.trim())
      } else {
        p.delete('q')
      }
      router.replace(`${pathname}?${p.toString()}`)
    }, 300)
  }

  function removeTag(key: string) {
    const p = new URLSearchParams(params.toString())
    if (key === 'date') {
      p.delete('dateFrom')
      p.delete('dateTo')
    } else {
      p.delete(key)
    }
    router.replace(`${pathname}?${p.toString()}`)
  }

  return (
    <div className="space-y-3">
      {/* Search + filter row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search expenses…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <FilterButton activeCount={activeFilterCount} onClick={() => setFilterOpen(true)} />
      </div>

      {/* Active filter tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag.key}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
            >
              {tag.label}
              <button
                onClick={() => removeTag(tag.key)}
                className="hover:opacity-70 transition-opacity ml-0.5"
                aria-label={`Remove ${tag.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <ExpenseFilterSheet
        categories={categories}
        funds={funds}
        activeCount={activeFilterCount}
        open={filterOpen}
        onOpenChange={setFilterOpen}
      />
    </div>
  )
}
