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
  // Split on bold, italic, and inline code tokens
  const parts = text.split(/(`[^`]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|_[^_\n]+_)/)
  if (parts.length === 1) return text
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) return <em key={i}>{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-muted/80 rounded px-1 py-px font-mono text-[11.5px]">{part.slice(1, -1)}</code>
    return part
  })
}

function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let listType: 'ul' | 'ol' = 'ul'
  let k = 0

  const flushList = () => {
    if (listItems.length === 0) return
    const Tag = listType
    elements.push(
      <Tag key={k++} className={`${listType === 'ol' ? 'list-decimal' : 'list-disc'} pl-4 space-y-0.5 my-1`}>
        {listItems}
      </Tag>
    )
    listItems = []
  }

  for (const line of lines) {
    const heading = line.match(/^(#{1,3}) (.+)/)
    const bullet = line.match(/^[*-] (.+)/)
    const numbered = line.match(/^\d+\. (.+)/)

    if (heading) {
      flushList()
      const level = heading[1].length
      const cls = level === 1
        ? 'block font-bold text-[14px] mt-2 mb-0.5'
        : level === 2
        ? 'block font-semibold text-[13.5px] mt-2 mb-0.5'
        : 'block font-semibold text-[13px] mt-1.5 mb-0.5 text-foreground/80'
      elements.push(<span key={k++} className={cls}>{renderInline(heading[2])}</span>)
    } else if (bullet) {
      if (listType !== 'ul' && listItems.length > 0) flushList()
      listType = 'ul'
      listItems.push(<li key={k++}>{renderInline(bullet[1])}</li>)
    } else if (numbered) {
      if (listType !== 'ol' && listItems.length > 0) flushList()
      listType = 'ol'
      listItems.push(<li key={k++}>{renderInline(numbered[1])}</li>)
    } else {
      flushList()
      if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={k++} className="border-border/40 my-2" />)
      } else if (line !== '') {
        elements.push(<span key={k++} className="block">{renderInline(line)}</span>)
      } else {
        elements.push(<span key={k++} className="block h-2" />)
      }
    }
  }
  flushList()

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
