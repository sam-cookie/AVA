'use client'

import Link from 'next/link'
import { formatPHP } from '@/lib/utils/currency'
import type { FundWithBalance } from '@/types'
import { Smartphone, Building2, Leaf, Banknote, CreditCard } from 'lucide-react'

type Material = {
  bg: string
  Icon: React.ElementType
  subtleColor: string
}

function getMaterial(name: string, index: number): Material {
  const n = name.toLowerCase()

  const defaults: Material[] = [
    { bg: '#1c1c2e', Icon: CreditCard, subtleColor: 'rgba(255,255,255,0.36)' },
    { bg: '#0d1b2a', Icon: CreditCard, subtleColor: 'rgba(255,255,255,0.36)' },
    { bg: '#1a0a2e', Icon: CreditCard, subtleColor: 'rgba(255,255,255,0.36)' },
    { bg: '#0a1628', Icon: CreditCard, subtleColor: 'rgba(255,255,255,0.36)' },
    { bg: '#1e1a0a', Icon: CreditCard, subtleColor: 'rgba(255,255,255,0.36)' },
  ]

  if (n.includes('gcash')) return { bg: '#003699', Icon: Smartphone, subtleColor: 'rgba(255,255,255,0.42)' }
  if (n.includes('maya') || n.includes('paymaya')) return { bg: '#004030', Icon: Smartphone, subtleColor: 'rgba(255,255,255,0.42)' }
  if (n.includes('bpi')) return { bg: '#620000', Icon: Building2, subtleColor: 'rgba(255,255,255,0.42)' }
  if (n.includes('bdo')) return { bg: '#00103a', Icon: Building2, subtleColor: 'rgba(255,255,255,0.42)' }
  if (n.includes('maribank') || n.includes('mari bank')) return { bg: '#003028', Icon: Leaf, subtleColor: 'rgba(255,255,255,0.42)' }
  if (n.includes('cash') || n.includes('wallet')) return { bg: '#1a1a1a', Icon: Banknote, subtleColor: 'rgba(255,255,255,0.38)' }

  return defaults[index % defaults.length]
}

type Props = {
  fund: FundWithBalance
  index: number
}

export function FundCardMini({ fund, index }: Props) {
  const { bg: autoBg, Icon, subtleColor } = getMaterial(fund.name, index)
  const bg = fund.color ?? autoBg

  return (
    <Link
      href="/funds"
      className="relative flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] select-none"
      style={{
        background: bg,
        borderRadius: '14px',
        padding: '20px',
        minHeight: '130px',
        boxSizing: 'border-box',
        boxShadow: '0 2px 20px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
        color: '#fff',
        height: '100%',
      }}
    >
      <div className="flex items-center justify-between">
        <Icon className="h-[14px] w-[14px]" style={{ color: subtleColor }} strokeWidth={1.5} />
        <span
          className="text-[9.5px] font-semibold tracking-[0.16em] uppercase"
          style={{ color: subtleColor }}
        >
          {fund.name}
        </span>
      </div>

      <div>
        <p
          className="text-[9px] font-medium tracking-[0.12em] uppercase mb-1.5"
          style={{ color: subtleColor }}
        >
          Balance
        </p>
        <p className="balance-number text-[19px] font-semibold leading-none text-white">
          {formatPHP(fund.balance)}
        </p>
      </div>
    </Link>
  )
}
