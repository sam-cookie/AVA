'use client'

import { useRef, useCallback } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { CreditCard, Smartphone, Banknote } from 'lucide-react'

const CARD_H = 196
const PEEK = 24

type CardData = {
  bg: string
  label: string
  accountType: string
  balance?: string
  Icon: React.ElementType
  subtle: string
}

const CARDS: CardData[] = [
  {
    bg: '#1e1e2e',
    label: 'ava.',
    accountType: 'PERSONAL WALLET',
    balance: '₱1,000,000.00',
    Icon: CreditCard,
    subtle: 'rgba(255,255,255,0.38)',
  },
  {
    bg: '#1c2d3a',
    label: 'GCash',
    accountType: 'E-WALLET',
    balance: '₱4,000.00',
    Icon: Smartphone,
    subtle: 'rgba(255,255,255,0.36)',
  },
  {
    bg: '#1a1a1a',
    label: 'Cash',
    accountType: 'CASH',
    balance: '₱1,560.00',
    Icon: Banknote,
    subtle: 'rgba(255,255,255,0.30)',
  },
]

function Card({ data, index, total }: { data: CardData; index: number; total: number }) {
  const isMain = index === 0
  const rotX = useMotionValue(0)
  const rotY = useMotionValue(0)
  const ref = useRef<HTMLDivElement>(null)

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMain || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    rotX.set((0.5 - (e.clientY - rect.top) / rect.height) * 7)
    rotY.set(((e.clientX - rect.left) / rect.width - 0.5) * 7)
  }, [isMain, rotX, rotY])

  const onMouseLeave = useCallback(() => { rotX.set(0); rotY.set(0) }, [rotX, rotY])

  const translateY = index * PEEK
  const scale = 1 - index * 0.04
  const brightness = 1 - index * 0.1

  return (
    <motion.div
      ref={ref}
      style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: total - index,
        rotateX: isMain ? rotX : 0,
        rotateY: isMain ? rotY : 0,
        transformStyle: 'preserve-3d',
      }}
      initial={{ y: translateY + 36, opacity: 0, scale }}
      animate={{ y: translateY, opacity: 1, scale, filter: `brightness(${brightness})` }}
      transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.2 + index * 0.07 }}
      whileHover={isMain ? { y: translateY - 7, scale: scale * 1.013 } : undefined}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div
        style={{
          background: data.bg,
          borderRadius: '18px',
          height: CARD_H,
          boxShadow: isMain
            ? '0 8px 36px rgba(0,0,0,0.40), 0 2px 8px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.10)'
            : '0 2px 12px rgba(0,0,0,0.22)',
          position: 'relative', overflow: 'hidden',
          padding: '22px 24px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          color: '#fff',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit',
          background: 'radial-gradient(ellipse at 28% 22%, rgba(255,255,255,0.08) 0%, transparent 58%)',
        }} />

        <div className="flex items-center justify-between">
          <data.Icon style={{ color: data.subtle }} className="h-[15px] w-[15px]" strokeWidth={1.5} />
          <span style={{ color: data.subtle }} className="text-[9px] font-bold tracking-[0.22em] uppercase">
            {data.accountType}
          </span>
        </div>

        <div className="flex items-end justify-between">
          {data.balance ? (
            <div>
              <p style={{ color: data.subtle }} className="text-[8.5px] font-semibold tracking-[0.18em] uppercase mb-1.5">
                Balance
              </p>
              <p className="balance-number text-[22px] font-bold leading-none text-white">
                {data.balance}
              </p>
            </div>
          ) : <div />}
          <span style={{ color: data.subtle }} className="text-[10px] font-semibold tracking-[0.14em]">
            {data.label}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export function LoginCards() {
  const total = CARDS.length
  const containerH = CARD_H + (total - 1) * PEEK + 8

  return (
    <div style={{ position: 'relative', height: containerH }} className="w-full max-w-[340px]">
      {[...CARDS].reverse().map((card, ri) => {
        const idx = total - 1 - ri
        return <Card key={card.label} data={card} index={idx} total={total} />
      })}
    </div>
  )
}
