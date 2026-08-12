'use client'

const HEARTS = [
  { left: '7%',  top: '18%', size: 16, opacity: 0.08, delay: 0,  duration: 28 },
  { left: '87%', top: '14%', size: 12, opacity: 0.07, delay: 5,  duration: 33 },
  { left: '10%', top: '68%', size: 20, opacity: 0.09, delay: 9,  duration: 26 },
  { left: '80%', top: '62%', size: 14, opacity: 0.07, delay: 2,  duration: 36 },
  { left: '48%', top: '7%',  size: 11, opacity: 0.06, delay: 7,  duration: 31 },
  { left: '91%', top: '44%', size: 18, opacity: 0.08, delay: 12, duration: 29 },
  { left: '4%',  top: '42%', size: 13, opacity: 0.07, delay: 16, duration: 34 },
  { left: '60%', top: '88%', size: 10, opacity: 0.06, delay: 3,  duration: 30 },
]

export function FloatingHearts() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
      {HEARTS.map((h, i) => (
        <span
          key={i}
          className="absolute select-none text-primary"
          style={{
            left: h.left,
            top: h.top,
            fontSize: h.size,
            opacity: h.opacity,
            animation: `float-heart ${h.duration}s ease-in-out ${h.delay}s infinite`,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  )
}
