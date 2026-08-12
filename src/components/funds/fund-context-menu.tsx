'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { deleteFundAction } from '@/actions/funds'
import { RenameFundSheet } from './rename-fund-sheet'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import type { Fund } from '@/types'

type Props = {
  fund: Fund
}

export function FundContextMenu({ fund }: Props) {
  const [renameOpen, setRenameOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteFundAction(fund.id)
    if (result.success) {
      toast.success(`${fund.name} deleted`)
    } else {
      toast.error(result.error)
    }
    setDeleting(false)
    setConfirmOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setTimeout(() => setRenameOpen(true), 0)}>
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setTimeout(() => setConfirmOpen(true), 0)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameFundSheet fund={fund} open={renameOpen} onOpenChange={setRenameOpen} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${fund.name}?`}
        description="This cannot be undone. Only accounts with no transactions can be deleted."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
