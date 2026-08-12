export type ChatRole = 'user' | 'assistant'

export type ToolCallInfo = {
  name: string
  result: string
}

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  toolCalls?: ToolCallInfo[]
  isStreaming?: boolean
  isError?: boolean
}

export type ChatStreamEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_call'; name: string; result: string }
  | { type: 'error'; message: string }
  | { type: 'done'; mutated: boolean }

// What the API route receives and sends to Groq
export type ApiChatMessage = {
  role: ChatRole
  content: string
}
