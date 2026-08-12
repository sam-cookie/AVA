'use client'

import { usePathname } from 'next/navigation'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Key change causes React to remount children, which resets all FadeIn states
  return <div key={pathname}>{children}</div>
}
