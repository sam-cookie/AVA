'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Receipt, CreditCard, Settings, BarChart3, PanelLeftClose, PanelLeft, Target, Banknote, LogOut, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutAction } from '@/actions/auth'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: Home, exact: true },
  { href: '/transactions', label: 'Expenses', icon: Receipt },
  { href: '/funds', label: 'Accounts', icon: CreditCard },
  { href: '/savings', label: 'Savings', icon: Target },
  { href: '/utang', label: 'Utang', icon: Banknote },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const STORAGE_KEY = 'ava-sidebar-collapsed'

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === 'true')
    } catch { /* ignore */ }
  }, [])

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem(STORAGE_KEY, String(next)) } catch { /* ignore */ }
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col shrink-0 border-r border-border/60 bg-sidebar h-screen sticky top-0 overflow-hidden transition-[width] duration-200',
        collapsed ? 'w-[58px]' : 'w-52'
      )}
    >
      {/* Brand + toggle */}
      <div className={cn(
        'flex items-center h-14 shrink-0',
        collapsed ? 'justify-center px-2' : 'px-5 gap-3'
      )}>
        {!collapsed && (
          <Link href="/" className="flex-1 min-w-0 select-none">
            <span className="text-[17px] font-bold tracking-tight text-foreground">ava</span>
            <span className="text-[17px] font-bold tracking-tight text-primary">.</span>
          </Link>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0"
        >
          {collapsed
            ? <PanelLeft className="h-[14px] w-[14px]" />
            : <PanelLeftClose className="h-[14px] w-[14px]" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-2.5 space-y-px">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md text-[13px] font-medium transition-colors duration-100',
                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2',
                active
                  ? 'bg-accent text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              <Icon
                className="h-[15px] w-[15px] shrink-0"
                strokeWidth={active ? 2.2 : 1.7}
              />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className={cn(
        'py-4 border-t border-border/40 shrink-0',
        collapsed ? 'flex flex-col items-center gap-3 px-2' : 'px-3.5'
      )}>
        <div className={cn('flex items-center', !collapsed && 'gap-2.5')}>
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-primary">A</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground leading-none">Ava</p>
              <p className="text-[11px] text-muted-foreground/55 mt-0.5">Personal wallet</p>
            </div>
          )}
          {!collapsed && (
            <form action={logoutAction}>
              <button
                type="submit"
                title="Log out"
                className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                <LogOut className="h-[14px] w-[14px]" />
              </button>
            </form>
          )}
        </div>
        {collapsed && (
          <form action={logoutAction}>
            <button
              type="submit"
              title="Log out"
              className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              <LogOut className="h-[14px] w-[14px]" />
            </button>
          </form>
        )}
      </div>
    </aside>
  )
}
