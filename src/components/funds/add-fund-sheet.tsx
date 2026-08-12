'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { FormModal } from '@/components/shared/form-modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fundCreateSchema, type FundCreateFormValues } from '@/lib/validations/fund-create'
import { createFundAction } from '@/actions/funds'
import { numericInputProps } from '@/lib/utils/input'
import { Plus, Pipette } from 'lucide-react'

const PRESETS = [
  '#003699',
  '#620000',
  '#001f5c',
  '#003028',
  '#005c42',
  '#1c1c2e',
  '#0d1b2a',
  '#1a0a2e',
  '#201a08',
  '#1a1a1a',
  '#002030',
  '#2d1000',
]

type Props = {
  open?: boolean
  onOpenChange?: (v: boolean) => void
  trigger?: React.ReactNode
}

export function AddFundSheet({ open: controlledOpen, onOpenChange, trigger }: Props = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const open = controlledOpen ?? internalOpen
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v)
    else setInternalOpen(v)
  }

  const form = useForm<FundCreateFormValues>({
    resolver: standardSchemaResolver(fundCreateSchema),
    defaultValues: { name: '', initialBalance: '' },
  })

  const watchedName = form.watch('name')
  const isCustomColor = selectedColor !== null && !PRESETS.includes(selectedColor)

  function handleClose() {
    setOpen(false)
    setSelectedColor(null)
    form.reset()
  }

  async function onSubmit(values: FundCreateFormValues) {
    const result = await createFundAction({ ...values, color: selectedColor })
    if (result.success) {
      toast.success(`${values.name} account added`)
      handleClose()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</span>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add account
        </button>
      )}

      <FormModal
        open={open}
        onOpenChange={(v) => { if (!v) handleClose(); else setOpen(v) }}
        title="Add Account"
        subtitle="Add a wallet or bank account — e.g. GCash, BPI, Cash"
      >
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="px-5 md:px-6 py-5 space-y-5">

            {/* Account name */}
            <div className="space-y-1.5">
              <Label htmlFor="new-fund-name">Account name</Label>
              <Input
                id="new-fund-name"
                autoFocus
                placeholder="e.g. GCash, BPI, BDO, Cash"
                className="h-10"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Card color */}
            <div className="space-y-2">
              <Label>Card color <span className="text-muted-foreground font-normal">(optional)</span></Label>

              <div className="flex flex-wrap gap-2 items-center">
                {PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'w-7 h-7 rounded-md transition-all shrink-0',
                      selectedColor === color
                        ? 'ring-2 ring-offset-2 ring-primary scale-110'
                        : 'hover:scale-105 hover:ring-1 hover:ring-border'
                    )}
                    style={{ background: color }}
                    aria-label={`Color ${color}`}
                  />
                ))}

                {/* Custom color picker */}
                <label
                  className={cn(
                    'w-7 h-7 rounded-md border-2 border-dashed border-border/60 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-all shrink-0 overflow-hidden relative',
                    isCustomColor ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                  )}
                  style={isCustomColor ? { background: selectedColor! } : undefined}
                  title="Custom color"
                >
                  <input
                    type="color"
                    className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
                    value={selectedColor ?? '#1c1c2e'}
                    onChange={(e) => setSelectedColor(e.target.value)}
                  />
                  {!isCustomColor && (
                    <Pipette className="h-3 w-3 text-muted-foreground/60 pointer-events-none" />
                  )}
                </label>
              </div>

              {/* Mini card preview */}
              {selectedColor && (
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-md"
                  style={{
                    background: selectedColor,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
                  }}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
                    Preview
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
                    {watchedName || 'Account'}
                  </span>
                </div>
              )}
            </div>

            {/* Starting balance — optional */}
            <div className="space-y-1.5">
              <Label htmlFor="new-fund-balance">
                Starting balance{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground pointer-events-none select-none">
                  ₱
                </span>
                <Input
                  id="new-fund-balance"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="pl-10 h-14 text-3xl font-bold border-border focus-visible:ring-primary/30"
                  {...numericInputProps()}
                  {...form.register('initialBalance')}
                />
              </div>
              {form.formState.errors.initialBalance && (
                <p className="text-xs text-destructive">{form.formState.errors.initialBalance.message}</p>
              )}
              <p className="text-[11px] text-muted-foreground/60">
                Leave empty to start with ₱0 — you can add money later.
              </p>
            </div>
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 bg-card border-t border-border px-5 md:px-6 py-4 flex gap-3 shrink-0">
            <Button type="button" variant="outline" className="flex-1 h-11" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-11" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Adding…' : 'Add account'}
            </Button>
          </div>
        </form>
      </FormModal>
    </>
  )
}
