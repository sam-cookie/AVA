'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useTyping } from './use-typing'
import type { Section } from './section-data'

interface Props {
  section: Section
  instant: boolean
}

const sizeClasses: Record<Section['size'], string> = {
  sm: 'text-[14px] text-muted-foreground leading-relaxed',
  md: 'text-[18px] leading-[1.75] text-foreground',
  xl: 'text-[2.25rem] leading-tight font-medium tracking-tight',
}

export function LetterSection({ section, instant }: Props) {
  const { displayed, done } = useTyping(section.text, section.typeSpeed, instant)

  const classes = [
    sizeClasses[section.size],
    section.special ? 'text-primary' : '',
    section.italic ? 'italic' : '',
  ].join(' ')

  const lines = displayed.split('\n')

  return (
    <div className={classes}>
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}

      {!done && (
        <span
          className="inline-block w-[2px] bg-current ml-[2px] align-middle opacity-70"
          style={{ height: '1.1em', animation: 'cursor-blink 0.9s step-end infinite' }}
        />
      )}

      {/* Heart flourish on "i love you baby" after typing completes */}
      <AnimatePresence>
        {section.id === 'love' && done && (
          <motion.span
            initial={{ opacity: 0, scale: 0.4, y: 4 }}
            animate={{ opacity: 0.55, scale: 1, y: 0 }}
            transition={{ delay: 0.25, type: 'spring', stiffness: 180, damping: 12 }}
            className="ml-3 text-primary inline-block align-middle"
            style={{ fontSize: '1.4rem' }}
          >
            ♡
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
