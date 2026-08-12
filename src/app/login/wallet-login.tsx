'use client'

import { useActionState, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Eye, EyeOff } from 'lucide-react'
import { loginActionAnimated } from '@/actions/auth'

const LABEL_S: React.CSSProperties = {
  display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.2em',
  textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 7, fontFamily: 'inherit',
}
const INPUT_S: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none',
  borderBottom: '1.5px solid rgba(0,0,0,0.13)', padding: '7px 24px 7px 0',
  fontSize: 14.5, fontWeight: 500, color: '#1a1a2e', outline: 'none', fontFamily: 'inherit', display: 'block',
}
const onFocus = (e: React.FocusEvent<HTMLInputElement>) =>
  (e.currentTarget.style.borderBottomColor = '#9b1842')
const onBlur = (e: React.FocusEvent<HTMLInputElement>) =>
  (e.currentTarget.style.borderBottomColor = 'rgba(0,0,0,0.13)')

export function WalletLogin({ onSuccess }: { onSuccess: () => void }) {
  const [fs, fa, pending] = useActionState(loginActionAnimated, null)
  const [fading, setFading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    if (pending || !fs || 'error' in fs) return
    setFading(true)
    onSuccess()
  }, [fs, pending, onSuccess])

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full min-h-[560px] px-10 lg:px-12 py-10"
      animate={fading ? { opacity: 0, y: 6 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div style={{ width: 'min(300px, 100%)' }}>

        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(0,0,0,0.3)', textAlign: 'center', marginBottom: 20 }}>
          Open your wallet
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.022em', color: '#1a1a2e', marginBottom: 24, lineHeight: 1.22, textAlign: 'center' }}>
          Welcome to Ava.
        </h2>

        <form action={fa} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="username" style={LABEL_S}>Username</label>
            <div style={{ position: 'relative' }}>
              <input id="username" name="username" type="text"
                autoComplete="username" autoCapitalize="none" required
                style={INPUT_S} onFocus={onFocus} onBlur={onBlur} />
              <User size={13} strokeWidth={2} style={{ position: 'absolute', right: 0, bottom: 10, color: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <label htmlFor="password" style={LABEL_S}>Password</label>
            <div style={{ position: 'relative' }}>
              <input id="password" name="password" type={showPw ? 'text' : 'password'}
                autoComplete="current-password" required
                style={INPUT_S} onFocus={onFocus} onBlur={onBlur} />
              <button type="button" onClick={() => setShowPw(p => !p)}
                style={{ position: 'absolute', right: 0, bottom: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(0,0,0,0.24)', display: 'flex', alignItems: 'center' }}>
                {showPw ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
              </button>
            </div>
          </div>

          {fs && 'error' in fs && <p style={{ fontSize: 12, color: '#dc2626' }}>{fs.error}</p>}

          <motion.button type="submit" disabled={pending || fading}
            whileHover={!fading ? { scale: 1.012 } : undefined}
            whileTap={!fading ? { scale: 0.977 } : undefined}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            style={{ height: 44, borderRadius: 10, border: 'none', cursor: 'pointer', background: '#9b1842', color: '#fff', fontSize: 13.5, fontWeight: 700, letterSpacing: '0.01em', opacity: pending || fading ? 0.6 : 1, marginTop: 4, fontFamily: 'inherit', width: '100%' }}>
            {pending ? 'Opening…' : 'Login'}
          </motion.button>
        </form>
      </div>
    </motion.div>
  )
}
