'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { loginSchema } from '@/lib/validations/auth'
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'
import { findUserByUsername, validatePassword } from '@/services/auth'

type LoginResult = { error: string }

export async function loginAction(_prev: LoginResult | null, formData: FormData): Promise<LoginResult | null> {
  const raw = {
    username: formData.get('username'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: 'Username and password are required' }
  }

  const { username, password } = parsed.data

  const user = await findUserByUsername(username)
  if (!user) return { error: 'Invalid credentials' }

  const ok = await validatePassword(password, user.passwordHash)
  if (!ok) return { error: 'Invalid credentials' }

  const token = await createSessionToken(user.id, user.username)
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })

  redirect('/')
}

export async function logoutAction() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  redirect('/login')
}

type AnimatedLoginResult = { error: string } | { success: true }

// Same as loginAction but returns { success: true } instead of redirecting,
// so the client can play the wallet-closing animation before navigating.
export async function loginActionAnimated(
  _prev: AnimatedLoginResult | null,
  formData: FormData
): Promise<AnimatedLoginResult | null> {
  const raw = { username: formData.get('username'), password: formData.get('password') }
  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) return { error: 'Username and password are required' }

  const { username, password } = parsed.data
  const user = await findUserByUsername(username)
  if (!user) return { error: 'Invalid credentials' }

  const ok = await validatePassword(password, user.passwordHash)
  if (!ok) return { error: 'Invalid credentials' }

  const token = await createSessionToken(user.id, user.username)
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })

  return { success: true }
}
