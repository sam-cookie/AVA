import { genai, GEMINI_MODEL } from './client'
import { GEMINI_TOOLS } from './tools'
import { buildSystemPrompt } from './system-prompt'
import { executeTool } from './tool-executor'
import type { ChatStreamEvent, ApiChatMessage } from '@/types/chat'
import type { Content, Part } from '@google/genai'

const MAX_TOOL_ROUNDS = 5

export async function streamChat(
  messages: ApiChatMessage[],
  pathname: string,
  onEvent: (event: ChatStreamEvent) => void
): Promise<void> {
  const systemPrompt = await buildSystemPrompt(pathname)

  const history: Content[] = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  let anyMutated = false

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const stream = await genai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: history,
      config: {
        systemInstruction: systemPrompt,
        tools: GEMINI_TOOLS,
      },
    })

    let assistantText = ''
    const functionCalls: Array<{ name: string; args: Record<string, unknown> }> = []
    const rawFunctionCallParts: Part[] = []

    for await (const chunk of stream) {
      for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
        if (part.text) {
          assistantText += part.text
          onEvent({ type: 'text', content: part.text })
        }
        if (part.functionCall) {
          functionCalls.push({
            name: part.functionCall.name ?? '',
            args: (part.functionCall.args as Record<string, unknown>) ?? {},
          })
          // Preserve raw part so thought_signature is kept intact in history
          rawFunctionCallParts.push(part)
        }
      }
    }

    if (functionCalls.length === 0) break

    // Build model turn: consolidated text + raw function call parts (with thought_signature)
    const modelParts: Part[] = []
    if (assistantText) modelParts.push({ text: assistantText })
    modelParts.push(...rawFunctionCallParts)
    history.push({ role: 'model', parts: modelParts })

    // Execute tools and add results as a user turn
    const responseParts: Part[] = []
    for (const fc of functionCalls) {
      const { result, mutated } = await executeTool(fc.name, fc.args)
      if (mutated) anyMutated = true
      onEvent({ type: 'tool_call', name: fc.name, result })
      responseParts.push({
        functionResponse: {
          name: fc.name,
          response: { output: result },
        },
      })
    }
    history.push({ role: 'user', parts: responseParts })
  }

  onEvent({ type: 'done', mutated: anyMutated })
}
