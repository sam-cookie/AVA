'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Archive,
  RotateCcw,
  Trash2,
  CreditCard,
  Receipt,
  Target,
  Folder,
  Banknote,
  Users,
  Clock,
  ArrowUpRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatPHP } from '@/lib/utils/currency'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useAppRefresh } from '@/lib/state/app-refresh'
import { restoreArchivedItemAction, deleteArchivedItemForeverAction } from '@/actions/archive'
import type { ArchiveItem, ArchiveItemType } from '@/types'
import { cn } from '@/lib/utils'

type FilterTab = 'all' | ArchiveItemType

const TAB_CONFIG: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'account', label: 'Accounts' },
  { id: 'transaction', label: 'Transactions' },
  { id: 'savings_goal', label: 'Savings' },
  { id: 'category', label: 'Categories' },
  { id: 'source', label: 'Sources' },
  { id: 'utang', label: 'Utang' },
]

function getItemIcon(type: ArchiveItemType) {
  switch (type) {
    case 'account':
      return CreditCard
    case 'transaction':
      return Receipt
    case 'savings_goal':
      return Target
    case 'category':
      return Folder
    case 'source':
      return Banknote
    case 'utang':
      return Users
    default:
      return Archive
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function ArchiveView({ initialItems }: { initialItems: ArchiveItem[] }) {
  const { refresh } = useAppRefresh()
  const [items, setItems] = useState<ArchiveItem[]>(initialItems)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  const [confirmItem, setConfirmItem] = useState<ArchiveItem | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const counts: Record<FilterTab, number> = {
    all: items.length,
    account: items.filter((i) => i.type === 'account').length,
    transaction: items.filter((i) => i.type === 'transaction').length,
    savings_goal: items.filter((i) => i.type === 'savings_goal').length,
    category: items.filter((i) => i.type === 'category').length,
    source: items.filter((i) => i.type === 'source').length,
    utang: items.filter((i) => i.type === 'utang').length,
  }

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true
    return item.type === activeTab
  })

  async function handleRestore(item: ArchiveItem) {
    const key = `${item.type}-${item.id}`
    setRestoringId(key)
    try {
      const result = await restoreArchivedItemAction(item.type, item.id)
      if (result.success) {
        toast.success(`Restored "${item.title}"`)
        setItems((prev) => prev.filter((i) => !(i.type === item.type && i.id === item.id)))
        refresh({ type: 'archive' })
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Failed to restore item')
    } finally {
      setRestoringId(null)
    }
  }

  function promptDeleteForever(item: ArchiveItem) {
    setConfirmItem(item)
    setConfirmOpen(true)
  }

  async function handleConfirmDeleteForever() {
    if (!confirmItem) return
    const key = `${confirmItem.type}-${confirmItem.id}`
    setDeletingId(key)
    try {
      const result = await deleteArchivedItemForeverAction(confirmItem.type, confirmItem.id)
      if (result.success) {
        toast.success(`Permanently deleted "${confirmItem.title}"`)
        setItems((prev) => prev.filter((i) => !(i.type === confirmItem.type && i.id === confirmItem.id)))
        refresh({ type: 'archive' })
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Failed to delete item')
    } finally {
      setDeletingId(null)
      setConfirmOpen(false)
      setConfirmItem(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Policy banner */}
      <div className="rounded-xl border border-border/70 bg-muted/30 p-4 sm:p-5 flex items-start gap-3.5">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
          <Clock className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-foreground">
            30-day Automatic Expiration
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Archived items and accounts remain recoverable for 30 days. After 30 days, eligible items are automatically and permanently deleted by the system.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
        {TAB_CONFIG.map((tab) => {
          const count = counts[tab.id]
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0',
                active
                  ? 'bg-foreground text-background'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-semibold',
                  active
                    ? 'bg-background/20 text-background'
                    : 'bg-border/60 text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Item list */}
      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 px-4 text-center">
          <div className="h-11 w-11 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/60 mx-auto mb-3">
            <Archive className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground">Archive is empty</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {activeTab === 'all'
              ? 'No deleted accounts, transactions, or items in the archive.'
              : `No archived ${TAB_CONFIG.find((t) => t.id === activeTab)?.label.toLowerCase()} found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const key = `${item.type}-${item.id}`
            const Icon = getItemIcon(item.type)
            const isRestoring = restoringId === key
            const isDeleting = deletingId === key
            const isExpiringSoon = item.daysRemaining <= 5

            return (
              <div
                key={key}
                className="bg-card border border-border rounded-xl p-4 sm:p-5 transition-shadow hover:shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Info Column */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-muted/70 flex items-center justify-center text-foreground shrink-0 mt-0.5">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {item.title}
                        </p>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border',
                            isExpiringSoon
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              : 'bg-muted/70 text-muted-foreground border-border/80'
                          )}
                        >
                          <Clock className="h-3 w-3" />
                          {item.daysRemaining === 0
                            ? 'Expires today'
                            : item.daysRemaining === 1
                            ? '1 day left'
                            : `${item.daysRemaining} days left`}
                        </span>
                      </div>

                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {item.subtitle}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground/70 mt-1.5">
                        <span>Archived {formatDate(item.archivedAt)}</span>
                        {item.type === 'account' && (
                          <Link
                            href={`/funds/${item.id}`}
                            className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
                          >
                            <span>View history</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t border-border/40 sm:border-0">
                    {item.amount !== null && item.amount !== undefined && (
                      <div className="text-left sm:text-right pr-2">
                        <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground/60">
                          {item.type === 'account' ? 'Balance' : 'Amount'}
                        </p>
                        <p className="text-sm font-bold tabular-nums text-foreground">
                          {formatPHP(item.amount)}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-3 gap-1.5 text-xs font-medium"
                        onClick={() => handleRestore(item)}
                        disabled={isRestoring || isDeleting}
                      >
                        <RotateCcw className={cn('h-3.5 w-3.5', isRestoring && 'animate-spin')} />
                        <span>{isRestoring ? 'Restoring…' : 'Restore'}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3 gap-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => promptDeleteForever(item)}
                        disabled={isRestoring || isDeleting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden xs:inline">Delete forever</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmItem ? `Permanently delete "${confirmItem.title}"?` : 'Delete item forever?'}
        description={
          confirmItem?.type === 'account'
            ? 'This cannot be undone. The account and its associated records will be permanently removed immediately.'
            : 'This cannot be undone. This record will be permanently deleted from the database immediately.'
        }
        confirmLabel="Delete forever"
        onConfirm={handleConfirmDeleteForever}
        loading={Boolean(deletingId)}
      />
    </div>
  )
}
