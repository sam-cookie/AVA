// Session tokens using Web Crypto API — works in both Node.js and Edge runtime

export const SESSION_COOKIE = 'ava_session'
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

type SessionPayload = {
  userId: number
  username: string
  exp: number
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET env var is not set')
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function createSessionToken(userId: number, username: string): Promise<string> {
  const payload: SessionPayload = {
    userId,
    username,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  }
  const payloadB64 = btoa(JSON.stringify(payload))
  const key = await getKey()
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
  return `${payloadB64}.${sigB64}`
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const [payloadB64, sigB64] = token.split('.')
    if (!payloadB64 || !sigB64) return null

    const key = await getKey()
    const sigBytes = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payloadB64))
    if (!valid) return null

    const payload: SessionPayload = JSON.parse(atob(payloadB64))
    if (payload.exp < Date.now()) return null

    return payload
  } catch {
    return null
  }
}
