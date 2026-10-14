import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getArchivedItems } from '@/services/archive'
import { ArchiveView } from '@/components/archive/archive-view'

export const dynamic = 'force-dynamic'

export default async function SettingsArchivePage() {
  const items = await getArchivedItems()

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60 hover:text-foreground transition-colors mb-2.5"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Settings
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Archive</h1>
      </div>

      <ArchiveView initialItems={items} />
    </div>
  )
}
