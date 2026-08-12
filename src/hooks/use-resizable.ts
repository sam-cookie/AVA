'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Size = { width: number; height: number }

const MIN_W = 320
const MIN_H = 400
const MAX_W = 660
const MAX_H = 720

export function useResizable(storageKey: string, defaultSize: Size) {
  const [size, setSize] = useState<Size>(defaultSize)
  const isResizing = useRef(false)
  const startData = useRef({ x: 0, y: 0, w: 0, h: 0, edge: '' })

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as Size
        if (typeof parsed.width === 'number' && typeof parsed.height === 'number') {
          setSize({
            width: Math.min(MAX_W, Math.max(MIN_W, parsed.width)),
            height: Math.min(MAX_H, Math.max(MIN_H, parsed.height)),
          })
        }
      }
    } catch { /* ignore */ }
  }, [storageKey])

  function saveSize(s: Size) {
    setSize(s)
    try { localStorage.setItem(storageKey, JSON.stringify(s)) } catch { /* ignore */ }
  }

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return
    const { x, y, w, h, edge } = startData.current
    let newW = w
    let newH = h

    if (edge.includes('left')) newW = Math.min(MAX_W, Math.max(MIN_W, w - (e.clientX - x)))
    if (edge.includes('top')) newH = Math.min(MAX_H, Math.max(MIN_H, h - (e.clientY - y)))

    setSize({ width: newW, height: newH })
  }, [])

  const onMouseUp = useCallback(() => {
    if (!isResizing.current) return
    isResizing.current = false
    setSize((s) => {
      saveSize(s)
      return s
    })
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMouseMove])

  function startResize(e: React.MouseEvent, edge: string) {
    e.preventDefault()
    isResizing.current = true
    startData.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height, edge }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return { size, startResize }
}
