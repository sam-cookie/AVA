'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LoginCards } from './login-cards'
import { WalletLogin } from './wallet-login'

const CREAM = '#faf7f3'

export default function LoginPage() {
  const [ready, setReady] = useState(false)
  const [walletPhase, setWalletPhase] = useState<'idle' | 'closing' | 'closed'>('idle')
  const router = useRouter()

  useEffect(() => {
    const fromWelcome = new URLSearchParams(window.location.search).get('from') === 'welcome'
    if (fromWelcome) { setReady(true); return }
    const seen = localStorage.getItem('hasSeenWelcomeLetter')
    if (!seen) router.replace('/welcome')
    else setReady(true)
  }, [router])

  const handleSuccess = useCallback(() => {
    setWalletPhase('closing')
    setTimeout(() => setWalletPhase('closed'), 340)
    setTimeout(() => router.push('/'), 580)
  }, [router])

  if (!ready) return null

  const leafTransition = walletPhase !== 'idle'
    ? { duration: 0.36, ease: [0.55, 0, 0.45, 1] as const }
    : { type: 'spring' as const, stiffness: 90, damping: 18, delay: 0.28 }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>

      {/* Mobile: form only */}
      <div className="lg:hidden w-full" style={{ maxWidth: 400 }}>
        <div style={{ background: CREAM, borderRadius: 24, boxShadow: '0 12px 48px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
          <WalletLogin onSuccess={handleSuccess} />
        </div>
      </div>

      {/* Desktop: bifold wallet */}
      <motion.div
        className="hidden lg:block"
        style={{ maxWidth: 920, width: '100%', position: 'relative', borderRadius: 28, boxShadow: '0 32px 100px rgba(0,0,0,0.20), 0 6px 20px rgba(0,0,0,0.09)' }}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={walletPhase === 'closed' ? { scale: 0.9, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={walletPhase === 'closed' ? { duration: 0.22 } : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Grid — NO overflow:hidden so 3D perspective works; dark bg is the wallet "exterior" */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', minHeight: 580, background: '#1a100c', borderRadius: 28, perspective: 1400 }}>

          {/* Left leaf */}
          <motion.div
            style={{ background: CREAM, padding: '44px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(0,0,0,0.07)', position: 'relative', transformOrigin: 'right center', borderRadius: '28px 0 0 28px', backfaceVisibility: 'hidden' }}
            initial={{ rotateY: 90 }}
            animate={{ rotateY: walletPhase !== 'idle' ? 90 : 0 }}
            transition={leafTransition}
          >
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 22, background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.032))', pointerEvents: 'none' }} />
            <div>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#1a1a2e' }}>ava</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#9b1842' }}>.</span>
            </div>
            <div>
              <h1 style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.18, letterSpacing: '-0.022em', color: '#1a1a2e', marginBottom: 8 }}>
                Your money,<br />all in one place.
              </h1>
              <p style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.42)', marginBottom: 36, lineHeight: 1.55 }}>
                Open your wallet and pick up where you left off.
              </p>
              <LoginCards />
              <p style={{ fontSize: 9.5, color: 'rgba(0,0,0,0.28)', marginTop: 18, letterSpacing: '0.03em', textTransform: 'uppercase' as const }}>
                All your accounts, all in one place.
              </p>
            </div>
            <div />
          </motion.div>

          {/* Right leaf */}
          <motion.div
            style={{ background: CREAM, position: 'relative', transformOrigin: 'left center', borderRadius: '0 28px 28px 0', backfaceVisibility: 'hidden' }}
            initial={{ rotateY: -90 }}
            animate={{ rotateY: walletPhase !== 'idle' ? -90 : 0 }}
            transition={leafTransition}
          >
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 22, background: 'linear-gradient(to left, transparent, rgba(0,0,0,0.028))', pointerEvents: 'none', zIndex: 1 }} />
            <WalletLogin onSuccess={handleSuccess} />
          </motion.div>
        </div>

        {/* Clasp */}
        <div style={{ position: 'absolute', right: -13, top: '50%', transform: 'translateY(-50%)', width: 27, height: 27, borderRadius: '50%', zIndex: 10, background: 'linear-gradient(145deg, #d8cab4 0%, #b5a080 100%)', boxShadow: '0 2px 10px rgba(0,0,0,0.22), inset 0 1px 2px rgba(255,255,255,0.48)' }} />
      </motion.div>
    </div>
  )
}
