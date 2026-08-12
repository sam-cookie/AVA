'use client'

import { useEffect, useRef, useState } from 'react'

export function useTyping(text: string, speedMs: number, instant: boolean) {
  const [displayed, setDisplayed] = useState(instant || speedMs === 0 ? text : '')
  const [done, setDone] = useState(instant || speedMs === 0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const indexRef = useRef(0)

  useEffect(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }

    if (instant || speedMs === 0) {
      setDisplayed(text)
      setDone(true)
      return
    }

    indexRef.current = 0
    setDisplayed('')
    setDone(false)

    const tick = () => {
      indexRef.current++
      setDisplayed(text.slice(0, indexRef.current))
      if (indexRef.current >= text.length) {
        setDone(true)
        return
      }
      timerRef.current = setTimeout(tick, speedMs)
    }

    timerRef.current = setTimeout(tick, speedMs)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [text, speedMs, instant])

  return { displayed, done }
}
