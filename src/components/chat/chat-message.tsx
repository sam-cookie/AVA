import React from 'react'
import { cn } from '@/lib/utils'
import { Wrench, AlertCircle } from 'lucide-react'
import type { ChatMessage } from '@/types/chat'

function toolLabel(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  )
}

function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let bulletItems: React.ReactNode[] = []
  let k = 0

  const flushBullets = () => {
    if (bulletItems.length > 0) {
      elements.push(
        <ul key={k++} className="list-disc pl-4 space-y-0.5 my-1">
          {bulletItems}
        </ul>
      )
      bulletItems = []
    }
  }

  for (const line of lines) {
    const bullet = line.match(/^[*-] (.+)/)
    if (bullet) {
      bulletItems.push(<li key={k++}>{renderInline(bullet[1])}</li>)
    } else {
      flushBullets()
      if (line !== '') {
        elements.push(<span key={k++} className="block">{renderInline(line)}</span>)
      } else {
        elements.push(<span key={k++} className="block h-2" />)
      }
    }
  }
  flushBullets()

  return <>{elements}</>
}

type Props = { message: ChatMessage }

export function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[85%] space-y-1.5', isUser ? 'items-end' : 'items-start')}>
        {/* Bubble */}
        <div
          className={cn(
            'rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed break-words',
            isUser
              ? 'bg-primary/10 text-foreground rounded-tr-sm'
              : message.isError
              ? 'bg-destructive/8 text-destructive/90 rounded-tl-sm border border-destructive/15'
              : 'bg-muted text-foreground rounded-tl-sm'
          )}
        >
          {message.isError && (
            <AlertCircle className="inline h-3.5 w-3.5 mr-1.5 mb-0.5 shrink-0" />
          )}
          {message.isError ? message.content : <MarkdownText content={message.content} />}
          {message.isStreaming && message.content.length === 0 && (
            <span className="inline-flex gap-1 items-center h-4">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" />
            </span>
          )}
          {message.isStreaming && message.content.length > 0 && (
            <span className="inline-block w-0.5 h-3.5 bg-foreground/60 ml-0.5 animate-pulse align-text-bottom" />
          )}
        </div>

        {/* Tool call badges */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {message.toolCalls.map((tc, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground/60 bg-muted/50 rounded-md px-2 py-0.5"
              >
                <Wrench className="h-2.5 w-2.5" />
                {toolLabel(tc.name)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
