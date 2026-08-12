'use client'

import { useEffect, useRef, useState } from 'react'
import {
  motion,
  AnimatePresence,
  useDragControls,
  useMotionValue,
} from 'framer-motion'
import { X, Trash2, GripHorizontal } from 'lucide-react'
import { ChatMessageBubble } from './chat-message'
import { ChatInput } from './chat-input'
import { useResizable } from '@/hooks/use-resizable'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types/chat'

type Props = {
  open: boolean
  messages: ChatMessage[]
  isLoading: boolean
  onSend: (content: string) => void
  onClose: () => void
  onClear: () => void
}

const SUGGESTIONS = [
  "What's my total balance?",
  'How much did I spend this month?',
  'Add ₱200 lunch expense',
]

const PANEL_POS_KEY = 'ava-chat-panel-pos'
const DEFAULT_SIZE = { width: 380, height: 520 }

export function ChatPanel({ open, messages, isLoading, onSend, onClose, onClear }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(true)
  const { size, startResize } = useResizable('ava-chat-size', DEFAULT_SIZE)
  const dragControls = useDragControls()

  // Motion values for drag position — avoids double-offset with React state
  const panelX = useMotionValue(0)
  const panelY = useMotionValue(0)

  // Detect mobile/desktop after hydration
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    setIsMobile(!mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(!e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Restore saved panel position
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PANEL_POS_KEY)
      if (saved) {
        const { x, y } = JSON.parse(saved) as { x: number; y: number }
        if (typeof x === 'number' && typeof y === 'number') {
          panelX.set(x)
          panelY.set(y)
        }
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-scroll to latest message
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  function savePanelPos() {
    try {
      localStorage.setItem(PANEL_POS_KEY, JSON.stringify({ x: panelX.get(), y: panelY.get() }))
    } catch { /* ignore */ }
  }

  // ─── Shared UI ──────────────────────────────────────────────────────────────

  const header = (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0 select-none',
        !isMobile && 'cursor-grab active:cursor-grabbing'
      )}
      onPointerDown={(e) => {
        if (isMobile) return
        if ((e.target as HTMLElement).closest('button')) return
        dragControls.start(e)
      }}
    >
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-[11px] font-bold text-primary">A</span>
        </div>
        <div>
          <p className="text-[13px] font-semibold leading-none">Ava, CPA</p>
          <p className="text-[10px] text-muted-foreground/55 mt-0.5">Your personal finance assistant</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {!isMobile && (
          <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground/20 mr-1 pointer-events-none" />
        )}
        {messages.length > 0 && (
          <button
            onClick={onClear}
            title="Clear chat"
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={onClose}
          title="Close"
          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )

  const body = (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center gap-3 pb-8">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">A</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">Hi, I&apos;m Ava!</p>
            <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed max-w-[200px]">
              Ask me about your finances, or tell me to log an expense.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 w-full max-w-[220px]">
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => onSend(q)}
                className="text-left text-[11px] text-muted-foreground/70 border border-border/50 rounded-lg px-3 py-2 hover:bg-muted/40 hover:text-foreground transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : (
        messages.map((m) => <ChatMessageBubble key={m.id} message={m} />)
      )}
      <div ref={bottomRef} />
    </div>
  )

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile: dim backdrop */}
          {isMobile && (
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
          )}

          {isMobile ? (
            /* ── Mobile: full-screen slide-up ──────────────────────────── */
            <motion.div
              key="mobile-panel"
              className="fixed inset-x-0 top-0 bottom-0 z-50 flex flex-col bg-background border-t border-border/60 shadow-xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            >
              {header}
              {body}
              <ChatInput onSend={onSend} disabled={isLoading} />
            </motion.div>
          ) : (
            /* ── Desktop: draggable + resizable panel ───────────────────── */
            <motion.div
              key="desktop-panel"
              drag
              dragControls={dragControls}
              dragListener={false}
              dragMomentum={false}
              dragElastic={0.03}
              style={{
                x: panelX,
                y: panelY,
                width: size.width,
                height: size.height,
                bottom: 88,
                right: 20,
              }}
              className="fixed z-50 flex flex-col bg-background border border-border/60 shadow-lg rounded-xl overflow-hidden"
              onDragEnd={savePanelPos}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Resize: left edge */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-w-resize z-10 hover:bg-primary/10 transition-colors rounded-l-xl"
                onMouseDown={(e) => { e.stopPropagation(); startResize(e, 'left') }}
              />
              {/* Resize: top edge */}
              <div
                className="absolute left-0 right-0 top-0 h-1.5 cursor-n-resize z-10 hover:bg-primary/10 transition-colors rounded-t-xl"
                onMouseDown={(e) => { e.stopPropagation(); startResize(e, 'top') }}
              />
              {/* Resize: top-left corner */}
              <div
                className="absolute left-0 top-0 w-3 h-3 cursor-nw-resize z-20"
                onMouseDown={(e) => { e.stopPropagation(); startResize(e, 'left top') }}
              />

              {header}
              {body}
              <ChatInput onSend={onSend} disabled={isLoading} />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}
