'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Receipt, CreditCard, Target, Settings, Banknote } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/transactions', label: 'Expenses', icon: Receipt },
  { href: '/funds', label: 'Wallet', icon: CreditCard },
  { href: '/savings', label: 'Savings', icon: Target },
  { href: '/utang', label: 'Utang', icon: Banknote },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-4 left-3 right-3 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/50 shadow-lg shadow-black/10 ring-1 ring-black/[0.06]">
        <div className="grid grid-cols-6 h-[58px]">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-[3px] transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground/55'
                )}
              >
                <Icon
                  className="h-[19px] w-[19px]"
                  strokeWidth={active ? 2.2 : 1.65}
                />
                <span className={cn(
                  'text-[8.5px] font-medium leading-none',
                  active ? 'text-primary' : 'text-muted-foreground/45'
                )}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
