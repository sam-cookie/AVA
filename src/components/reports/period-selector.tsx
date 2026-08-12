'use client'

import { ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Props = {
  value: string // 'YYYY-MM'
}

function buildOptions() {
  const opts: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
    opts.push({ value, label })
  }
  return opts
}

export function PeriodSelector({ value }: Props) {
  const router = useRouter()
  const options = buildOptions()

  return (
    <div className="relative inline-flex items-center shrink-0">
      <select
        value={value}
        onChange={(e) => router.push(`?month=${e.target.value}`)}
        className="appearance-none bg-muted/60 border border-border rounded-xl pl-3.5 pr-8 py-2 text-sm font-medium text-foreground cursor-pointer hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
    </div>
  )
}
