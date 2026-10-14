'use client'

import { useState } from 'react'
import { Archive, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { restoreFundAction } from '@/actions/funds'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useAppRefresh } from '@/lib/state/app-refresh'

export function ArchivedFundBanner({ fundId, fundName }: { fundId: number; fundName: string }) {
  const [restoring, setRestoring] = useState(false)
  const router = useRouter()
  const { refresh } = useAppRefresh()

  async function handleRestore() {
    setRestoring(true)
    const result = await restoreFundAction(fundId)
    if (result.success) {
      toast.success(`${fundName} restored successfully`)
      refresh({ type: 'fund', id: fundId })
      router.refresh()
    } else {
      toast.error(result.error)
    }
    setRestoring(false)
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
          <Archive className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200">
            This account is currently archived
          </p>
          <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-0.5">
            Historical records and running balances are preserved in read-only mode.
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        disabled={restoring}
        className="h-9 px-3 gap-1.5 text-xs font-medium border-amber-500/40 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 self-start sm:self-auto shrink-0"
      >
        <RotateCcw className={`h-3.5 w-3.5 ${restoring ? 'animate-spin' : ''}`} />
        <span>{restoring ? 'Restoring…' : 'Restore Account'}</span>
      </Button>
    </div>
  )
}
