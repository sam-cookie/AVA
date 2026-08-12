import type React from 'react'

/** Props to spread onto any numeric/money input to block non-numeric keystrokes and pastes. */
export function numericInputProps() {
  return {
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.ctrlKey || e.metaKey) return
      if (e.key === '.' && e.currentTarget.value.includes('.')) {
        e.preventDefault()
        return
      }
      const allowed = [
        '0','1','2','3','4','5','6','7','8','9','.',
        'Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown',
        'Tab','Enter','Home','End',
      ]
      if (!allowed.includes(e.key)) e.preventDefault()
    },
    onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData('text')
      if (!/^\d*\.?\d*$/.test(text)) e.preventDefault()
    },
  }
}
