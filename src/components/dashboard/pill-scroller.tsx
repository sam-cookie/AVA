'use client'

import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Pill } from '@/lib/utils/period'

type Props = {
  pills: Pill[]
  selectedIndex: number
  onChange: (i: number) => void
  onPrev?: () => void
  onNext?: () => void
  disablePrev?: boolean
  disableNext?: boolean
}

export function PillScroller({ pills, selectedIndex, onChange, onPrev, onNext, disablePrev, disableNext }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const active = activeRef.current
    if (!container || !active) return
    const offset = active.offsetLeft - container.offsetWidth / 2 + active.offsetWidth / 2
    container.scrollTo({ left: offset, behavior: 'smooth' })
  }, [selectedIndex])

  const hasArrows = onPrev !== undefined || onNext !== undefined

  return (
    <div className="flex items-center gap-1">
      {hasArrows && (
        <button
          type="button"
          onClick={onPrev}
          disabled={disablePrev}
          aria-label="Previous period"
          className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md border border-border/50 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 hover:border-border disabled:opacity-25 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div ref={containerRef} className="flex-1 flex gap-0.5 min-w-0">
        {pills.map((pill, i) => (
          <button
            key={`${pill.label}-${i}`}
            ref={i === selectedIndex ? activeRef : undefined}
            type="button"
            onClick={() => onChange(i)}
            title={pill.label}
            className={cn(
              'flex-1 min-w-0 h-8 rounded-md text-[8px] font-semibold tracking-normal transition-colors whitespace-nowrap overflow-hidden text-ellipsis px-0.5',
              i === selectedIndex
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground/55 hover:text-foreground hover:bg-muted/40'
            )}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {hasArrows && (
        <button
          type="button"
          onClick={onNext}
          disabled={disableNext}
          aria-label="Next period"
          className="shrink-0 h-8 w-8 flex items-center justify-center rounded-md border border-border/50 text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 hover:border-border disabled:opacity-25 disabled:pointer-events-none transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
