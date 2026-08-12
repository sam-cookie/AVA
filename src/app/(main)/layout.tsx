import { BottomNav } from '@/components/layout/bottom-nav'
import { Sidebar } from '@/components/layout/sidebar'
import { PageTransition } from '@/components/layout/page-transition'
import { ChatProvider } from '@/components/chat/chat-provider'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="w-full px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
      <BottomNav />
      <ChatProvider />
    </div>
  )
}
