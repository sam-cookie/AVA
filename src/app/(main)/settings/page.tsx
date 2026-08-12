import { getCategories } from '@/services/categories'
import { getAllSources } from '@/services/sources'
import { ManageCategories } from '@/components/categories/manage-categories'
import { AddCategorySheet } from '@/components/categories/add-category-sheet'
import { SourcesManager } from '@/components/shared/sources-manager'
import { logoutAction } from '@/actions/auth'
import { LogOut } from 'lucide-react'

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

export default async function SettingsPage() {
  const [categories, sources] = await Promise.all([getCategories(), getAllSources()])

  return (
    <div className="space-y-7 pb-24 md:pb-8">
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.14em] mb-2.5">
          Settings
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Preferences</h1>
      </div>

      <div className="space-y-4">
        <Section title="Categories" action={<AddCategorySheet />}>
          <ManageCategories categories={categories} />
        </Section>

        <Section title="Income Sources">
          <SourcesManager sources={sources} />
        </Section>

        <form action={logoutAction} className="md:hidden">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-5 py-4 border border-border rounded-xl bg-card text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-[15px] w-[15px]" />
            Log out
          </button>
        </form>
      </div>
    </div>
  )
}
