'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { Smartphone, Building2, Leaf, Banknote, CreditCard, Plus } from 'lucide-react'
import { formatPHP } from '@/lib/utils/currency'
import { AddFundSheet } from './add-fund-sheet'
import type { FundWithBalance } from '@/types'

const CARD_H = 196
const PEEK = 26

type Material = {
  bg: string
  Icon: React.ElementType
  label: string
  subtle: string
}

function getMaterial(name: string, index: number): Material {
  const n = name.toLowerCase()
  const defaults = [
    { bg: '#1c1c2e' }, { bg: '#0f1f3d' }, { bg: '#1e0a2e' },
    { bg: '#0a1e28' }, { bg: '#201a08' },
  ]
  if (n.includes('gcash'))
    return { bg: '#003699', Icon: Smartphone, label: 'E-Wallet', subtle: 'rgba(255,255,255,0.38)' }
  if (n.includes('maya') || n.includes('paymaya'))
    return { bg: '#005c42', Icon: Smartphone, label: 'E-Wallet', subtle: 'rgba(255,255,255,0.35)' }
  if (n.includes('bpi'))
    return { bg: '#6b0000', Icon: Building2, label: 'Bank', subtle: 'rgba(255,255,255,0.35)' }
  if (n.includes('bdo'))
    return { bg: '#001f5c', Icon: Building2, label: 'Bank', subtle: 'rgba(255,255,255,0.35)' }
  if (n.includes('maribank') || n.includes('mari'))
    return { bg: '#003828', Icon: Leaf, label: 'Bank', subtle: 'rgba(255,255,255,0.35)' }
  if (n.includes('cash') || n.includes('wallet'))
    return { bg: '#1a1a1a', Icon: Banknote, label: 'Cash', subtle: 'rgba(255,255,255,0.30)' }
  const d = defaults[index % defaults.length]
  return { bg: d.bg, Icon: CreditCard, label: 'Account', subtle: 'rgba(255,255,255,0.30)' }
}

type CardProps = {
  fund: FundWithBalance
  index: number // position in the ordered array; 0 = active/front
  total: number
  onClick: () => void
  onSwipe?: (deltaX: number) => void
}

function WalletCard({ fund, index, total, onClick, onSwipe }: CardProps) {
  const { bg: autoBg, Icon, label, subtle } = getMaterial(fund.name, index)
  const bg = fund.color ?? autoBg
  const isActive = index === 0

  const rotX = useMotionValue(0)
  const rotY = useMotionValue(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const swipeStartX = useRef<number | null>(null)

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isActive || !cardRef.current) return
      const rect = cardRef.current.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      rotX.set((0.5 - py) * 8)
      rotY.set((px - 0.5) * 8)
    },
    [isActive, rotX, rotY]
  )

  const onMouseLeave = useCallback(() => {
    rotX.set(0)
    rotY.set(0)
  }, [rotX, rotY])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isActive) return
    swipeStartX.current = e.clientX
  }, [isActive])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isActive || swipeStartX.current === null) return
    const delta = e.clientX - swipeStartX.current
    swipeStartX.current = null
    if (Math.abs(delta) > 50) onSwipe?.(delta)
  }, [isActive, onSwipe])

  const translateY = index * PEEK
  const scale = 1 - index * 0.04
  const brightness = 1 - index * 0.1

  return (
    <motion.div
      key={fund.id}
      ref={cardRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: total - index,
        rotateX: isActive ? rotX : 0,
        rotateY: isActive ? rotY : 0,
        transformStyle: 'preserve-3d',
      }}
      animate={{ y: translateY, scale, filter: `brightness(${brightness})` }}
      whileHover={
        isActive
          ? { y: translateY - 6, scale: scale * 1.015 }
          : { y: translateY - 10, scale }
      }
      transition={{ type: 'spring', stiffness: 340, damping: 32 }}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { swipeStartX.current = null }}
      className={isActive ? 'cursor-default' : 'cursor-pointer'}
    >
      {/* Card surface */}
      <div
        style={{
          background: bg,
          borderRadius: '18px',
          height: CARD_H,
          boxShadow: isActive
            ? '0 8px 32px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.10)'
            : '0 2px 12px rgba(0,0,0,0.20)',
          position: 'relative',
          overflow: 'hidden',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#fff',
          userSelect: 'none',
        }}
      >
        {/* Subtle gloss overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.07) 0%, transparent 60%)',
            borderRadius: 'inherit',
            pointerEvents: 'none',
          }}
        />

        {/* Top row */}
        <div className="flex items-center justify-between">
          <Icon style={{ color: subtle }} className="h-[15px] w-[15px]" strokeWidth={1.5} />
          <span
            style={{ color: subtle }}
            className="text-[9px] font-bold tracking-[0.22em] uppercase"
          >
            {label}
          </span>
        </div>

        {/* Bottom row */}
        <div className="flex items-end justify-between">
          <div>
            <p style={{ color: subtle }} className="text-[8.5px] font-semibold tracking-[0.18em] uppercase mb-1.5">
              Balance
            </p>
            <p className="balance-number text-[22px] font-bold leading-none text-white">
              {formatPHP(fund.balance)}
            </p>
          </div>
          <span
            style={{ color: subtle }}
            className="text-[10px] font-semibold tracking-[0.14em] uppercase"
          >
            {fund.name}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

type Props = {
  funds: FundWithBalance[]
  activeId: number | null
  onSelect: (id: number) => void
}

export function WalletStack({ funds, activeId, onSelect }: Props) {
  const [addOpen, setAddOpen] = useState(false)
  const ordered = [
    funds.find((f) => f.id === activeId),
    ...funds.filter((f) => f.id !== activeId),
  ].filter(Boolean) as FundWithBalance[]

  const peekSlots = ordered.length // add-card slot
  const containerH = CARD_H + peekSlots * PEEK

  function handleSwipe(deltaX: number) {
    const currentIdx = ordered.findIndex((f) => f.id === activeId)
    if (deltaX < 0) {
      const next = ordered[currentIdx + 1] ?? ordered[0]
      onSelect(next.id)
    } else {
      const prev = ordered[currentIdx - 1] ?? ordered[ordered.length - 1]
      onSelect(prev.id)
    }
  }

  return (
    <div style={{ position: 'relative', height: containerH }} className="select-none">
      {/* Fund cards — render back to front */}
      {[...ordered].reverse().map((fund, reverseIdx) => {
        const stackIdx = ordered.length - 1 - reverseIdx
        return (
          <WalletCard
            key={fund.id}
            fund={fund}
            index={stackIdx}
            total={ordered.length}
            onClick={() => { if (stackIdx > 0) onSelect(fund.id) }}
            onSwipe={handleSwipe}
          />
        )
      })}

      {/* Add card slot */}
      <motion.button
        type="button"
        onClick={() => setAddOpen(true)}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 0, height: CARD_H }}
        animate={{ y: peekSlots * PEEK, scale: 1 - peekSlots * 0.04 }}
        whileHover={{ y: peekSlots * PEEK - 8 }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        className="w-full rounded-[18px] border-2 border-dashed border-border/50 flex items-center justify-center gap-2 text-muted-foreground/50 hover:text-muted-foreground hover:border-border transition-colors"
        aria-label="Add account"
      >
        <Plus className="h-4 w-4" />
        <span className="text-[12px] font-medium tracking-wide">Add account</span>
      </motion.button>

      {/* Modal owned here so the card slot can open it without lifting state */}
      <AddFundSheet open={addOpen} onOpenChange={setAddOpen} trigger={<></>} />
    </div>
  )
}
