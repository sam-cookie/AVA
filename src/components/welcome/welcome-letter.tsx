'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { LETTER_SECTIONS, TOTAL_SCREENS, SECTION_HEIGHT_VH } from './section-data'
import { LetterSection } from './letter-section'
import { FloatingHearts } from './floating-hearts'

export function WelcomeLetter() {
  const router = useRouter()
  const [activeIdx, setActiveIdx] = useState(0)
  const [typedSections, setTypedSections] = useState<Set<number>>(new Set([0]))
  const [isExiting, setIsExiting] = useState(false)
  const prevIdxRef = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const sectionPx = (SECTION_HEIGHT_VH / 100) * window.innerHeight
      const newIdx = Math.min(
        Math.floor(window.scrollY / sectionPx),
        TOTAL_SCREENS - 1
      )
      if (newIdx === prevIdxRef.current) return

      // Mark any sections we're jumping past as typed
      const skipped = new Set<number>()
      for (let i = prevIdxRef.current; i < newIdx && i < LETTER_SECTIONS.length; i++) {
        skipped.add(i)
      }
      if (skipped.size > 0) {
        setTypedSections(s => new Set([...s, ...skipped]))
      }

      prevIdxRef.current = newIdx
      setActiveIdx(newIdx)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleEnter = useCallback(() => {
    localStorage.setItem('hasSeenWelcomeLetter', 'true')
    setIsExiting(true)
    setTimeout(() => router.push('/login?from=welcome'), 700)
  }, [router])

  const handleSkip = useCallback(() => {
    router.push('/login?from=welcome')
  }, [router])

  const showEnterScreen = activeIdx === TOTAL_SCREENS - 1

  return (
    <>
      <FloatingHearts />

      {/* Dev skip button — remove when going live */}
      <button
        onClick={handleSkip}
        className="fixed top-4 right-4 z-20 text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
      >
        skip →
      </button>

      {/* Exit overlay */}
      <AnimatePresence>
        {isExiting && (
          <motion.div
            className="fixed inset-0 z-50 bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* Progress indicator — dots on the right */}
      <div className="fixed right-5 top-1/2 -translate-y-1/2 z-10 hidden sm:flex flex-col items-center gap-2">
        {LETTER_SECTIONS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-500 ease-out"
            style={{
              width: 3,
              height: i === activeIdx ? 14 : 4,
              backgroundColor:
                i < activeIdx
                  ? 'oklch(0.411 0.177 354 / 0.4)'
                  : i === activeIdx
                  ? 'oklch(0.411 0.177 354)'
                  : 'oklch(0.908 0.004 75)',
            }}
          />
        ))}
      </div>

      {/* Scroll body */}
      <div style={{ height: `${TOTAL_SCREENS * SECTION_HEIGHT_VH + 100}vh` }}>
        <div className="sticky top-0 h-screen flex items-center justify-center px-8">
          <div className="max-w-[520px] w-full">
            <AnimatePresence mode="wait">
              {!showEnterScreen ? (
                <motion.div
                  key={activeIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <LetterSection
                    section={LETTER_SECTIONS[activeIdx]}
                    instant={typedSections.has(activeIdx) && LETTER_SECTIONS[activeIdx].typeSpeed > 0}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="enter"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="space-y-10"
                >
                  <div className="text-[18px] leading-[1.75] text-foreground whitespace-pre-line">
                    {'with all the love in the world,\n\nsam'}
                  </div>
                  <div className="text-primary/30 text-base select-none">♡</div>
                  <button
                    onClick={handleEnter}
                    className="group flex items-center gap-2 text-[13px] text-muted-foreground hover:text-primary transition-colors duration-300 tracking-[0.15em] uppercase mt-2"
                  >
                    <span>enter ava</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Scroll hint — fades out after first scroll */}
          <AnimatePresence>
            {activeIdx === 0 && (
              <motion.p
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[11px] text-muted-foreground/50 tracking-widest uppercase select-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                scroll
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
