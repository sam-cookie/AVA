import { getArchivedItems } from '@/services/archive'
import { ArchiveView } from '@/components/archive/archive-view'

export const dynamic = 'force-dynamic'

export default async function ArchivePage() {
  const items = await getArchivedItems()

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-2.5">
          Data Management
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Archive</h1>
      </div>

      <ArchiveView initialItems={items} />
    </div>
  )
}
