'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Plus, Smartphone, Building2, Leaf, Banknote, CreditCard } from 'lucide-react'
import { formatPHP } from '@/lib/utils/currency'
import type { FundWithBalance } from '@/types'

const CARD_W = 220
const CARD_H = 130
const PEEK = 96 // wide enough to show name + balance in the peeking strip

type Material = { bg: string; Icon: React.ElementType; subtle: string }

function getMaterial(name: string, id: number): Material {
  const n = name.toLowerCase()
  const defaults = [
    '#1c1c2e', '#0d1b2a', '#1a0a2e', '#0a1628', '#1e1a0a',
  ]
  if (n.includes('gcash'))   return { bg: '#003699', Icon: Smartphone, subtle: 'rgba(255,255,255,0.42)' }
  if (n.includes('maya') || n.includes('paymaya')) return { bg: '#004030', Icon: Smartphone, subtle: 'rgba(255,255,255,0.42)' }
  if (n.includes('bpi'))     return { bg: '#620000', Icon: Building2,  subtle: 'rgba(255,255,255,0.42)' }
  if (n.includes('bdo'))     return { bg: '#00103a', Icon: Building2,  subtle: 'rgba(255,255,255,0.42)' }
  if (n.includes('maribank') || n.includes('mari bank')) return { bg: '#003028', Icon: Leaf, subtle: 'rgba(255,255,255,0.42)' }
  if (n.includes('cash') || n.includes('wallet')) return { bg: '#1a1a1a', Icon: Banknote, subtle: 'rgba(255,255,255,0.38)' }
  return { bg: defaults[id % defaults.length], Icon: CreditCard, subtle: 'rgba(255,255,255,0.36)' }
}

function DeckCard({ fund, isActive }: { fund: FundWithBalance; isActive: boolean }) {
  const { bg: autoBg, Icon, subtle } = getMaterial(fund.name, fund.id)
  const bg = fund.color ?? autoBg

  return (
    <div
      style={{
        background: bg,
        borderRadius: 14,
        height: '100%',
        boxSizing: 'border-box',
        boxShadow: isActive
          ? '0 4px 28px rgba(0,0,0,0.30), 0 1px 4px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.07)'
          : '0 2px 12px rgba(0,0,0,0.18)',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: isActive ? 'default' : 'pointer',
      }}
    >
      {/* Subtle gloss */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.06) 0%, transparent 55%)',
      }} />

      {/* Icon — top left, only meaningful when card is fully visible */}
      <div style={{ position: 'absolute', left: 20, top: 20 }}>
        <Icon style={{ width: 14, height: 14, color: subtle }} strokeWidth={1.5} />
      </div>

      {/* Right strip — always visible in peek area: name + balance */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: PEEK,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '18px 20px 18px 0',
      }}>
        <span style={{
          display: 'block', textAlign: 'right',
          fontSize: 9, fontWeight: 700, letterSpacing: '0.15em',
          textTransform: 'uppercase', color: subtle, lineHeight: 1,
        }}>
          {fund.name}
        </span>
        <div style={{ textAlign: 'right' }}>
          <p style={{
            fontSize: 7.5, fontWeight: 600, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: subtle, marginBottom: 4,
          }}>
            Balance
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, lineHeight: 1, color: '#fff' }}>
            {formatPHP(fund.balance)}
          </p>
        </div>
      </div>
    </div>
  )
}

type Props = { funds: FundWithBalance[] }

export function FundCardDeck({ funds }: Props) {
  const [activeId, setActiveId] = useState<number>(funds[0]?.id ?? -1)

  const active = funds.find(f => f.id === activeId) ?? funds[0]
  const ordered = [active, ...funds.filter(f => f.id !== active?.id)].filter(Boolean) as FundWithBalance[]

  const n = ordered.length
  const containerW = CARD_W + n * PEEK

  return (
    <div
      style={{ position: 'relative', height: CARD_H, width: containerW, maxWidth: '100%' }}
      className="select-none"
    >
      {/* Add account — backmost slot */}
      <motion.div
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 0, width: CARD_W, height: CARD_H }}
        animate={{ x: n * PEEK, scale: 1 - n * 0.018, filter: `brightness(${Math.max(0.5, 1 - n * 0.06)})` }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
      >
        <Link
          href="/funds"
          className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add account
        </Link>
      </motion.div>

      {/* Fund cards — rendered back to front */}
      {[...ordered].reverse().map((fund, reverseIdx) => {
        const stackIdx = n - 1 - reverseIdx
        const isActive = stackIdx === 0

        return (
          <motion.div
            key={fund.id}
            style={{
              position: 'absolute', top: 0, left: 0,
              zIndex: n - stackIdx,
              width: CARD_W, height: CARD_H,
            }}
            animate={{
              x: stackIdx * PEEK,
              scale: 1 - stackIdx * 0.016,
              filter: `brightness(${Math.max(0.6, 1 - stackIdx * 0.06)})`,
            }}
            whileHover={!isActive ? { y: -8, transition: { type: 'spring', stiffness: 400, damping: 28 } } : {}}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            onClick={() => { if (!isActive) setActiveId(fund.id) }}
          >
            <DeckCard fund={fund} isActive={isActive} />
          </motion.div>
        )
      })}
    </div>
  )
}
