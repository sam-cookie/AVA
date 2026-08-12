'use client'

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { DialogPortal, DialogOverlay } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  loading,
}: Props) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          className={[
            'fixed z-50 bg-card outline-none',
            'inset-x-4 bottom-4 rounded-2xl p-6',
            'md:inset-auto md:top-1/2 md:left-1/2',
            'md:-translate-x-1/2 md:-translate-y-1/2',
            'md:w-full md:max-w-[380px] md:rounded-2xl',
            'md:shadow-xl md:ring-1 md:ring-foreground/10',
            'data-open:animate-in data-open:fade-in-0 data-open:duration-150',
            'data-closed:animate-out data-closed:fade-out-0 data-closed:duration-100',
          ].join(' ')}
        >
          <DialogPrimitive.Title className="text-base font-semibold">
            {title}
          </DialogPrimitive.Title>
          {description && (
            <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
          )}
          <div className="flex gap-3 mt-5">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-11"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Deleting…' : confirmLabel}
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </DialogPrimitive.Root>
  )
}
