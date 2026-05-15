
import { X } from 'lucide-react'

import { WorkspaceNavigationSidebar } from '@/components/layout/workspace-navigation-sidebar'
import { WorkspaceTabs } from '@/components/workspace/workspace-tabs'
import { MasterCalculationsSidebar } from '@/features/sidebar/master-calculations-sidebar'
import { usePosStore } from '@/state/pos-store'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent } from '@/components/ui/sheet'

function MobileSidebarSheet() {
  const { mobileSidebarOpen, setMobileSidebarOpen } = usePosStore()

  return (
    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
      <SheetContent className="flex flex-col w-full max-w-sm gap-0 p-0 overflow-hidden" showCloseButton={false}>
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b shrink-0 border-border">
          <div>
            <p className="text-sm font-semibold text-foreground">Menu</p>
            <p className="text-xs text-muted-foreground">Workspace, cashier totals, and date tools.</p>
          </div>
          <SheetClose asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Close menu">
              <X className="size-4" />
            </Button>
          </SheetClose>
        </div>

        <WorkspaceNavigationSidebar
          className="flex-1 min-h-0 border-b border-border"
          onTabSelect={() => setMobileSidebarOpen(false)}
        />

        <div className="min-h-0 flex-[1.2] overflow-hidden border-t border-border">
          <MasterCalculationsSidebar embeddedInSheet />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function AppLayout() {
  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-background">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <WorkspaceNavigationSidebar className="hidden shrink-0 border-r border-sidebar-border lg:flex" />
        <main className="relative flex flex-col flex-1 h-full min-w-0 overflow-hidden bg-background">
          <WorkspaceTabs />
        </main>
        <MasterCalculationsSidebar />
      </div>
      <MobileSidebarSheet />
    </div>
  )
}
