'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useCallback, useEffect } from 'react'

export type MutationDetail = {
  type?: 'expense' | 'addition' | 'transfer' | 'fund' | 'savings-goal' | 'savings-contribution' | 'utang' | 'utang-payment' | 'category' | 'source' | string
  id?: number | string
  [key: string]: unknown
}

export const APP_MUTATION_EVENT = 'ava:app-mutation'

/**
 * Dispatches a client-side mutation event to inform all active components
 * that data in the app has changed.
 */
export function emitAppMutation(detail?: MutationDetail) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(APP_MUTATION_EVENT, { detail }))
  }
}

/**
 * Centralized reactive refresh hook:
 * 1. Broadcasts the mutation event to client listeners.
 * 2. Invalidate and re-fetches server components via router.refresh() inside startTransition.
 */
export function useAppRefresh() {
  const router = useRouter()
  const [isRefreshing, startTransition] = useTransition()

  const refresh = useCallback(
    (detail?: MutationDetail) => {
      emitAppMutation(detail)
      startTransition(() => {
        router.refresh()
      })
    },
    [router]
  )

  return { refresh, isRefreshing }
}

/**
 * Hook for client components to subscribe to any data mutation across the app
 * and automatically re-run local state fetches or recalculations.
 */
export function useAppMutationListener(callback: (detail?: MutationDetail) => void) {
  useEffect(() => {
    function handleEvent(e: Event) {
      const customEvent = e as CustomEvent<MutationDetail>
      callback(customEvent.detail)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener(APP_MUTATION_EVENT, handleEvent)
      return () => {
        window.removeEventListener(APP_MUTATION_EVENT, handleEvent)
      }
    }
  }, [callback])
}
