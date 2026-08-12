'use client'

import { useState } from 'react'
import { ChatBubble } from './chat-bubble'
import { ChatPanel } from './chat-panel'
import { useChat } from '@/hooks/use-chat'

export function ChatProvider() {
  const [open, setOpen] = useState(false)
  const { messages, isLoading, sendMessage, clearChat } = useChat()

  return (
    <>
      <ChatBubble open={open} onClick={() => setOpen((v) => !v)} />
      <ChatPanel
        open={open}
        messages={messages}
        isLoading={isLoading}
        onSend={sendMessage}
        onClose={() => setOpen(false)}
        onClear={clearChat}
      />
    </>
  )
}
