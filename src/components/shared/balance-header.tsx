import { formatPHP } from '@/lib/utils/currency'

type Props = {
  label: string
  total: number
  received?: number
  spent?: number
  subtext?: string
}

export function BalanceHeader({ label, total, received = 0, spent = 0, subtext }: Props) {
  const hasStats = received > 0 || spent > 0

  return (
    <div>
      {/* Label — narrow screens only; on wide it moves inside the flex column */}
      <p className="xl:hidden text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.14em] mb-2.5">
        {label}
      </p>

      {/* Narrow screens — balance large, stats compact inline below */}
      <div className="xl:hidden">
        <p className="balance-number text-[42px] md:text-[50px] font-semibold leading-none text-foreground">
          {formatPHP(total)}
        </p>
        {hasStats && (
          <div className="flex items-center gap-5 mt-3">
            {received > 0 && (
              <div>
                <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-[0.14em]">
                  Received
                </p>
                <p className="balance-number text-[17px] font-semibold text-emerald-600 mt-0.5 leading-none whitespace-nowrap">
                  +{formatPHP(received)}
                </p>
              </div>
            )}
            {received > 0 && spent > 0 && (
              <div className="w-px h-7 bg-border/40 self-center" />
            )}
            {spent > 0 && (
              <div>
                <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-[0.14em]">
                  Spent
                </p>
                <p className="balance-number text-[17px] font-semibold text-foreground/65 mt-0.5 leading-none whitespace-nowrap">
                  −{formatPHP(spent)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wide screens — all three equal size, one row */}
      <div className="hidden xl:flex items-end gap-8">
        <div>
          <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-[0.14em] mb-2">
            {label}
          </p>
          <p className="balance-number text-[48px] font-semibold leading-none text-foreground">
            {formatPHP(total)}
          </p>
        </div>
        {received > 0 && (
          <>
            <div className="w-px h-10 bg-border/40 mb-1 self-end" />
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-[0.14em] mb-2">
                Received
              </p>
              <p className="balance-number text-[48px] font-semibold leading-none text-emerald-600">
                +{formatPHP(received)}
              </p>
            </div>
          </>
        )}
        {spent > 0 && (
          <>
            <div className="w-px h-10 bg-border/40 mb-1 self-end" />
            <div>
              <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-[0.14em] mb-2">
                Spent
              </p>
              <p className="balance-number text-[48px] font-semibold leading-none text-foreground/70">
                −{formatPHP(spent)}
              </p>
            </div>
          </>
        )}
      </div>

      {subtext && (
        <p className="text-[11px] text-muted-foreground/60 mt-2">{subtext}</p>
      )}
    </div>
  )
}
