type Props = {
  percent: number // 0–100
  className?: string
}

export function GoalProgressBar({ percent, className }: Props) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div className={`h-1.5 rounded-full bg-border overflow-hidden ${className ?? ''}`}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
