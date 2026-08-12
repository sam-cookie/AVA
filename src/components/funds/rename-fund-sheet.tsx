'use client'

import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fundCreateSchema, type FundCreateFormValues } from '@/lib/validations/fund-create'
import { renameFundAction } from '@/actions/funds'
import type { Fund } from '@/types'

type Props = {
  fund: Fund
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RenameFundSheet({ fund, open, onOpenChange }: Props) {
  const form = useForm<FundCreateFormValues>({
    resolver: standardSchemaResolver(fundCreateSchema),
    defaultValues: { name: fund.name },
  })

  async function onSubmit(values: FundCreateFormValues) {
    const result = await renameFundAction(fund.id, values.name)
    if (result.success) {
      toast.success('Account renamed')
      onOpenChange(false)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename account</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="rename-fund">Name</Label>
            <Input
              id="rename-fund"
              autoFocus
              placeholder="e.g. GCash"
              className="h-10"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-10"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-10" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
