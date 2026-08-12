'use client'

import { useState, useEffect } from 'react'

type Position = { x: number; y: number }

export function useDraggable(storageKey: string, defaultPos: Position) {
  const [position, setPosition] = useState<Position>(defaultPos)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as Position
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition(parsed)
        }
      }
    } catch { /* ignore */ }
    setMounted(true)
  }, [storageKey])

  function savePosition(pos: Position) {
    setPosition(pos)
    try {
      localStorage.setItem(storageKey, JSON.stringify(pos))
    } catch { /* ignore */ }
  }

  return { position, savePosition, mounted }
}
