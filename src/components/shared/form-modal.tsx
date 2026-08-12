'use client'

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { DialogPortal, DialogOverlay } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function FormModal({ open, onOpenChange, title, subtitle, children }: Props) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup
          className={cn(
            'fixed z-50 bg-card flex flex-col outline-none overflow-hidden',
            // Mobile: full-width bottom sheet
            'inset-x-0 bottom-0 rounded-t-2xl max-h-[90dvh]',
            // Desktop: centered modal, overrides mobile positioning
            'md:inset-auto md:top-1/2 md:left-1/2',
            'md:-translate-x-1/2 md:-translate-y-1/2',
            'md:w-full md:max-w-[520px] md:rounded-2xl md:max-h-[85vh]',
            'md:shadow-xl md:ring-1 md:ring-foreground/10',
            // Animations
            'data-open:animate-in data-open:fade-in-0 data-open:duration-150',
            'data-closed:animate-out data-closed:fade-out-0 data-closed:duration-100',
            'md:data-open:zoom-in-95 md:data-closed:zoom-out-95',
          )}
        >
          {/* Mobile drag handle */}
          <div className="flex justify-center pt-3 pb-1 md:hidden shrink-0">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-3 pb-4 md:px-6 md:pt-6 shrink-0 border-b border-border">
            <div>
              <DialogPrimitive.Title className="text-base font-semibold md:text-lg leading-tight">
                {title}
              </DialogPrimitive.Title>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <DialogPrimitive.Close
              render={
                <button
                  aria-label="Close"
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors ml-3 mt-0.5 shrink-0"
                />
              }
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </DialogPrimitive.Close>
          </div>

          {/* Scrollable body — forms render their content + sticky footer here */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </DialogPrimitive.Root>
  )
}
