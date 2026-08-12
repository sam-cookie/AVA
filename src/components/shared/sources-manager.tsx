'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Pencil, Trash2, X, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { updateSourceAction, deleteSourceAction } from '@/actions/sources'
import type { IncomeSource } from '@/types'

type Props = {
  sources: IncomeSource[]
}

export function SourcesManager({ sources }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  function startEdit(src: IncomeSource) {
    setEditingId(src.id)
    setEditingName(src.name)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingName('')
  }

  async function saveEdit() {
    if (editingId == null || !editingName.trim()) return
    setSaving(true)
    const result = await updateSourceAction(editingId, editingName.trim())
    if (result.success) {
      toast.success('Source updated')
      setEditingId(null)
    } else {
      toast.error(result.error)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (confirmId == null) return
    setDeleting(true)
    const result = await deleteSourceAction(confirmId)
    if (result.success) {
      toast.success('Source deleted')
    } else {
      toast.error(result.error)
    }
    setDeleting(false)
    setConfirmId(null)
  }

  if (sources.length === 0) {
    return <p className="text-sm text-muted-foreground">No income sources yet.</p>
  }

  return (
    <>
      <div className="divide-y divide-border/60">
        {sources.map((src) => {
          const isEditing = editingId === src.id
          return (
            <div key={src.id} className="py-3">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); saveEdit() }
                      if (e.key === 'Escape') cancelEdit()
                    }}
                    className="h-9 flex-1"
                  />
                  <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" onClick={saveEdit} disabled={saving}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-sm font-medium">{src.name}</span>
                  <button
                    onClick={() => startEdit(src)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmId(src.id)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={confirmId != null}
        onOpenChange={(open) => { if (!open) setConfirmId(null) }}
        title="Delete source?"
        description="Existing income entries with this source will keep the source label, but it won't appear in suggestions."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
