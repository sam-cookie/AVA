import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { chatRequestSchema } from '@/lib/validations/chat'
import { streamChat } from '@/services/ai/chat'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth'
import type { ChatStreamEvent } from '@/types/chat'

function friendlyError(e: unknown): string {
  if (!(e instanceof Error)) return "Ava is unavailable right now. Please ask Sam for help!"

  const msg = e.message.toLowerCase()
  const status = (e as Error & { status?: number }).status

  if (status === 401 || msg.includes('api key') || msg.includes('authentication')) {
    return "Ava isn't available right now. Please ask Sam to check her setup!"
  }
  if (status === 429) {
    if (msg.includes('quota') || msg.includes('billing') || msg.includes('resource')) {
      return "Ava has been working a little too hard today and hit her limit. She'll be back soon — or ask Sam for help if this keeps happening!"
    }
    return "Ava is getting a lot of messages right now. Give her a moment and try again!"
  }
  if (status === 500 || status === 503) {
    return "Ava ran into an unexpected issue on her end. Try again in a moment — or ask Sam for help if it keeps happening!"
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('econnrefused')) {
    return "Ava can't connect right now. Check your internet and try again — or ask Sam for help!"
  }

  return "Ava is unavailable right now. Please ask Sam for help!"
}

export async function POST(req: NextRequest) {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  const session = token ? await verifySessionToken(token) : null
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  if (!process.env.GEMINI_API_KEY) {
    const event: ChatStreamEvent = {
      type: 'error',
      message: "Ava isn't available right now. Please ask Sam for help!",
    }
    return new Response(`data: ${JSON.stringify(event)}\n\n`, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const parsed = chatRequestSchema.safeParse(body)
  if (!parsed.success) {
    const event: ChatStreamEvent = { type: 'error', message: 'That message is too long — try keeping it shorter.' }
    return new Response(`data: ${JSON.stringify(event)}\n\n`, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    })
  }

  const { messages, pathname } = parsed.data

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      function send(event: ChatStreamEvent) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        await streamChat(messages, pathname, send)
      } catch (e) {
        console.error('[Ava API error]', e)
        send({ type: 'error', message: friendlyError(e) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
