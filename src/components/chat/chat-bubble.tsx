'use client'

import { motion } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'
import { useDraggable } from '@/hooks/use-draggable'

type Props = {
  open: boolean
  onClick: () => void
}

export function ChatBubble({ open, onClick }: Props) {
  const { position, savePosition, mounted } = useDraggable('ava-chat-position', { x: 0, y: 0 })

  if (!mounted) return null

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.05}
      dragConstraints={{
        top: -window.innerHeight + 120,
        left: -window.innerWidth + 70,
        right: 0,
        bottom: 0,
      }}
      onDragEnd={(_, info) => {
        savePosition({ x: position.x + info.offset.x, y: position.y + info.offset.y })
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      style={{ x: position.x, y: position.y }}
      className="fixed bottom-[88px] right-5 md:bottom-6 md:right-6 z-50 touch-none select-none"
    >
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.93 }}
        className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-md flex items-center justify-center transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={open ? 'Close Ava' : 'Open Ava'}
      >
        <motion.div
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.18 }}
        >
          {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </motion.div>
      </motion.button>

      {/* Label */}
      {!open && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-muted-foreground/50 whitespace-nowrap pointer-events-none">
          Ava, CPA
        </div>
      )}
    </motion.div>
  )
}
