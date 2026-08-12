'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { UtangCard } from './utang-card'
import type { UtangWithProgress, FundWithBalance } from '@/types'

const PAGE_SIZE = 3

type Props = {
  title: string
  items: UtangWithProgress[]
  funds: FundWithBalance[]
}

export function UtangSection({ title, items, funds }: Props) {
  const [page, setPage] = useState(0)

  const totalPages = Math.ceil(items.length / PAGE_SIZE)
  const start = page * PAGE_SIZE
  const visible = items.slice(start, start + PAGE_SIZE)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">
          {title}
          {items.length > PAGE_SIZE && (
            <span className="ml-2 text-muted-foreground/50 normal-case tracking-normal font-normal">
              ({items.length})
            </span>
          )}
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-6 w-6 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] text-muted-foreground tabular-nums w-12 text-center">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="h-6 w-6 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
        {visible.map((u) => (
          <UtangCard key={u.id} utang={u} funds={funds} />
        ))}
      </div>
    </section>
  )
}
