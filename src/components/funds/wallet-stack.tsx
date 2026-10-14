'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { Smartphone, Building2, Leaf, Banknote, CreditCard, Plus } from 'lucide-react'
import { formatPHP } from '@/lib/utils/currency'
import { AddFundSheet } from './add-fund-sheet'
import type { FundWithBalance } from '@/types'

const HERO_H = 184
const LAYER_H = 68
const TUCK = 14

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
  index: number // 0 = active/front
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

  const y = isActive ? 0 : HERO_H - TUCK + (index - 1) * LAYER_H
  const cardHeight = isActive ? HERO_H : LAYER_H + TUCK
  const zIndex = total + 10 - index
  const brightness = Math.max(0.72, 1 - index * 0.05)

  return (
    <motion.div
      key={fund.id}
      ref={cardRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex,
        rotateX: isActive ? rotX : 0,
        rotateY: isActive ? rotY : 0,
        transformStyle: 'preserve-3d',
      }}
      animate={{ y, height: cardHeight, filter: `brightness(${brightness})` }}
      whileHover={
        isActive
          ? { y: y - 4 }
          : { y: y - 5, filter: 'brightness(0.97)' }
      }
      transition={{ type: 'spring', stiffness: 350, damping: 32 }}
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
          borderRadius: isActive ? '18px' : '16px',
          height: '100%',
          boxShadow: isActive
            ? '0 12px 36px -6px rgba(0,0,0,0.40), 0 4px 12px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.15)'
            : '0 6px 20px -3px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.18)',
          position: 'relative',
          overflow: 'hidden',
          color: '#fff',
          userSelect: 'none',
        }}
        className="border border-white/16 flex flex-col justify-end"
      >
        {/* Subtle gloss overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.08) 0%, transparent 65%)',
            borderRadius: 'inherit',
            pointerEvents: 'none',
          }}
        />

        {isActive ? (
          /* ── Full Active Hero Card Layout ── */
          <div className="h-full flex flex-col justify-between p-5">
            {/* Top row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-white/14 flex items-center justify-center shrink-0">
                  <Icon style={{ color: subtle }} className="h-3.5 w-3.5" strokeWidth={1.75} />
                </div>
                <span
                  style={{ color: subtle }}
                  className="text-[9.5px] font-bold tracking-[0.2em] uppercase"
                >
                  {label}
                </span>
              </div>
            </div>

            {/* Middle: Account Name */}
            <div className="my-auto py-1">
              <p
                title={fund.name}
                className="text-[20px] sm:text-[22px] font-bold text-white tracking-tight truncate leading-tight"
              >
                {fund.name}
              </p>
              <p style={{ color: subtle }} className="text-[9.5px] font-medium tracking-widest uppercase mt-0.5">
                Personal Account
              </p>
            </div>

            {/* Bottom row: Balance */}
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p style={{ color: subtle }} className="text-[8.5px] font-semibold tracking-[0.18em] uppercase mb-1">
                  Available Balance
                </p>
                <p className="balance-number text-[24px] sm:text-[26px] font-bold leading-none text-white tabular-nums truncate">
                  {formatPHP(fund.balance)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                {(fund.totalSpent > 0 || fund.totalAdded > 0) && (
                  <p
                    style={{ color: subtle }}
                    className="text-[9.5px] font-medium tracking-wide tabular-nums"
                  >
                    {fund.totalSpent > 0
                      ? `−${formatPHP(fund.totalSpent)}`
                      : `+${formatPHP(fund.totalAdded)}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── Inactive Stacked Card Layer (Guaranteed 68px visible, never overlapped) ── */
          <div className="h-[68px] mt-auto flex items-center justify-between px-4 sm:px-5 gap-3 w-full">
            {/* Left: Brand Icon + Account Name + Type Badge */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-9 w-9 rounded-xl bg-white/16 border border-white/25 flex items-center justify-center shrink-0 shadow-xs">
                <Icon className="h-4 w-4 text-white" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  title={fund.name}
                  className="text-[13.5px] font-bold text-white tracking-wide truncate leading-tight"
                >
                  {fund.name}
                </p>
                <span className="inline-block text-[9.5px] font-semibold text-white/70 uppercase tracking-wider mt-0.5 leading-tight">
                  {label}
                </span>
              </div>
            </div>

            {/* Right: Balance */}
            <div className="shrink-0 text-right pl-2">
              <p className="text-[9px] font-semibold text-white/50 uppercase tracking-wider mb-0.5">
                Balance
              </p>
              <p className="balance-number text-[15px] sm:text-[16px] font-bold text-white tabular-nums tracking-tight leading-none">
                {formatPHP(fund.balance)}
              </p>
            </div>
          </div>
        )}
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

  const stackHeight = ordered.length <= 1 ? HERO_H : HERO_H + (ordered.length - 1) * LAYER_H

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
    <div className="w-full select-none">
      {/* Cards stack container with exact calculated height — zero overflow */}
      <div style={{ position: 'relative', height: stackHeight }} className="w-full">
        {ordered.map((fund, index) => (
          <WalletCard
            key={fund.id}
            fund={fund}
            index={index}
            total={ordered.length}
            onClick={() => { if (index > 0) onSelect(fund.id) }}
            onSwipe={handleSwipe}
          />
        ))}
      </div>

      {/* Add account button — cleanly below the entire stack without overlap */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="w-full mt-3.5 h-12 rounded-2xl border-2 border-dashed border-border/70 hover:border-primary/60 text-muted-foreground/65 hover:text-primary transition-all duration-200 bg-card/40 hover:bg-card/70 flex items-center justify-center gap-2.5 cursor-pointer shadow-2xs select-none"
        aria-label="Add account"
      >
        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
          <Plus className="h-3.5 w-3.5" />
        </div>
        <span className="text-[12px] font-semibold tracking-wide">Add account</span>
      </button>

      {/* Modal owned here so the button can open it */}
      <AddFundSheet open={addOpen} onOpenChange={setAddOpen} trigger={<></>} />
    </div>
  )
}
