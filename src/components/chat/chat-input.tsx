'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { SendHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  onSend: (content: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function onInput() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  return (
    <div className="flex items-end gap-2 p-3 border-t border-border/50 bg-background shrink-0">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onInput={onInput}
        disabled={disabled}
        placeholder="Ask Ava anything…"
        className={cn(
          'flex-1 resize-none bg-muted/50 rounded-lg px-3 py-2.5 text-[13px] leading-relaxed',
          'placeholder:text-muted-foreground/45 outline-none border border-transparent',
          'focus:border-border/70 focus:bg-background transition-colors',
          'min-h-[44px] max-h-[120px] overflow-y-auto',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        className={cn(
          'h-[44px] w-[44px] shrink-0 flex items-center justify-center rounded-lg',
          'bg-primary text-primary-foreground transition-opacity',
          'hover:opacity-90 active:scale-95',
          'disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100'
        )}
      >
        <SendHorizontal className="h-4 w-4" />
      </button>
    </div>
  )
}
