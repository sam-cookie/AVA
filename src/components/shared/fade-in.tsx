'use client'

import { motion } from 'framer-motion'

type Props = {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function FadeIn({ children, delay = 0, className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut', delay: delay * 0.4 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
