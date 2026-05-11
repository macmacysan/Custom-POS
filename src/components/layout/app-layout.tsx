
import { TopNav } from '@/components/layout/top-nav'
import { WorkspaceTabs } from '@/components/workspace/workspace-tabs'
import { MasterCalculationsSidebar } from '@/features/sidebar/master-calculations-sidebar'
import { usePosStore } from '@/state/pos-store'

export function AppLayout() {
  const { settings } = usePosStore()

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar on the left from the top */}
      <MasterCalculationsSidebar />
      
      {/* Main area on the right */}
      <div className="flex h-full w-full flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-hidden">
          <WorkspaceTabs />
        </main>
      </div>
    </div>
  )
}

