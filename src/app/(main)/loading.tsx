export default function Loading() {
  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-pulse">
      <div className="space-y-2.5">
        <div className="h-2.5 w-16 bg-muted rounded" />
        <div className="h-7 w-44 bg-muted rounded" />
      </div>
      <div className="space-y-3">
        <div className="h-28 bg-muted rounded-xl" />
        <div className="h-20 bg-muted rounded-xl" />
        <div className="h-20 bg-muted rounded-xl" />
        <div className="h-16 bg-muted rounded-xl" />
      </div>
    </div>
  )
}
