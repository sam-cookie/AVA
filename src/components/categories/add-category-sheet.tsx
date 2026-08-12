'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { toast } from 'sonner'
import { FormModal } from '@/components/shared/form-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { categorySchema, type CategoryFormValues } from '@/lib/validations/category'
import { createCategoryAction } from '@/actions/categories'
import { IconPicker } from './icon-picker'
import { Plus } from 'lucide-react'

type Props = {
  onCreated?: (name: string) => void
  triggerVariant?: 'chip' | 'tile'
}

export function AddCategorySheet({ onCreated, triggerVariant = 'chip' }: Props) {
  const [open, setOpen] = useState(false)

  const form = useForm<CategoryFormValues>({
    resolver: standardSchemaResolver(categorySchema),
    defaultValues: { name: '', icon: 'Tag' },
  })

  async function onSubmit(values: CategoryFormValues) {
    const result = await createCategoryAction(values)
    if (result.success) {
      toast.success(`${values.name} added`)
      onCreated?.(values.name)
      form.reset({ name: '', icon: 'Tag' })
      setOpen(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      {triggerVariant === 'tile' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-lg border border-dashed border-border/80 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-accent/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-full"
        >
          <Plus className="h-5 w-5" />
          Add
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-dashed text-xs font-medium shrink-0 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-accent/30 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      )}

      <FormModal
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) form.reset({ name: '', icon: 'Tag' }) }}
        title="Add Category"
        subtitle="Choose a name and icon"
      >
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="px-5 md:px-6 py-5 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                autoFocus
                placeholder="e.g. Food Delivery, Subscriptions"
                className="h-10"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker
                value={form.watch('icon')}
                onChange={(v) => form.setValue('icon', v)}
              />
              {form.formState.errors.icon && (
                <p className="text-xs text-destructive">{form.formState.errors.icon.message}</p>
              )}
            </div>
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 bg-card border-t border-border px-5 md:px-6 py-4 flex gap-3 shrink-0">
            <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-11" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Adding…' : 'Add category'}
            </Button>
          </div>
        </form>
      </FormModal>
    </>
  )
}
