'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { toast } from 'sonner'
import { Pencil, Trash2, X, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { updateCategoryAction, deleteCategoryAction } from '@/actions/categories'
import { categorySchema, type CategoryFormValues } from '@/lib/validations/category'
import { CategoryIcon } from './category-icon'
import { IconPicker } from './icon-picker'
import type { Category } from '@/types'

type Props = {
  categories: Category[]
}

type EditingState = { id: number; name: string; icon: string } | null

export function ManageCategories({ categories }: Props) {
  const [editing, setEditing] = useState<EditingState>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const form = useForm<CategoryFormValues>({
    resolver: standardSchemaResolver(categorySchema),
    defaultValues: { name: '', icon: 'Tag' },
  })

  function startEdit(cat: Category) {
    setEditing({ id: cat.id, name: cat.name, icon: cat.icon })
    form.setValue('name', cat.name)
    form.setValue('icon', cat.icon)
  }

  function cancelEdit() {
    setEditing(null)
    form.reset()
  }

  async function saveEdit() {
    if (!editing) return
    const valid = await form.trigger()
    if (!valid) return
    const values = form.getValues()
    const result = await updateCategoryAction(editing.id, values)
    if (result.success) {
      toast.success('Category updated')
      setEditing(null)
      form.reset()
    } else {
      toast.error(result.error)
    }
  }

  async function handleDelete() {
    if (confirmId == null) return
    setDeleting(true)
    const result = await deleteCategoryAction(confirmId)
    if (result.success) {
      toast.success('Category deleted')
    } else {
      toast.error(result.error)
    }
    setDeleting(false)
    setConfirmId(null)
  }

  if (categories.length === 0) {
    return <p className="text-sm text-muted-foreground">No categories yet.</p>
  }

  return (
    <>
      <div className="divide-y divide-border/60">
        {categories.map((cat) => {
          const isEditing = editing?.id === cat.id

          return (
            <div key={cat.id} className="py-3">
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    autoFocus
                    placeholder="Category name"
                    className="h-9"
                    {...form.register('name')}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                  <IconPicker value={form.watch('icon')} onChange={(v) => form.setValue('icon', v)} />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-1.5">
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveEdit} className="gap-1.5">
                      <Check className="h-3.5 w-3.5" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <CategoryIcon name={cat.icon} className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-sm font-medium">{cat.name}</span>
                  <button
                    onClick={() => startEdit(cat)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmId(cat.id)}
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
        title="Delete category?"
        description="Existing expenses with this category will keep the category label, but it won't appear in filters."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
