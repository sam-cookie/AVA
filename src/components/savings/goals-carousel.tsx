'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GoalCardMini } from './goal-card-mini'
import { cn } from '@/lib/utils'
import type { GoalWithProgress } from '@/types'

const PAGE_SIZE = 3

type Props = {
  goals: GoalWithProgress[]
}

export function GoalsCarousel({ goals }: Props) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(goals.length / PAGE_SIZE)
  const visible = goals.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const hasPrev = page > 0
  const hasNext = page < totalPages - 1

  return (
    <div className="space-y-3">
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((goal) => (
          <GoalCardMini key={goal.id} goal={goal} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-[11px] text-muted-foreground/60 mr-1">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={!hasPrev}
            className={cn(
              'h-7 w-7 flex items-center justify-center rounded-md border border-border/60 transition-colors',
              hasPrev
                ? 'hover:bg-muted text-foreground'
                : 'text-muted-foreground/30 cursor-not-allowed'
            )}
            aria-label="Previous goals"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
            className={cn(
              'h-7 w-7 flex items-center justify-center rounded-md border border-border/60 transition-colors',
              hasNext
                ? 'hover:bg-muted text-foreground'
                : 'text-muted-foreground/30 cursor-not-allowed'
            )}
            aria-label="Next goals"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
