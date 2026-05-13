
import { X } from 'lucide-react'

import { TopNav } from '@/components/layout/top-nav'
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
      <SheetContent className="flex w-full max-w-sm flex-col gap-0 overflow-hidden p-0" showCloseButton={false}>
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
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
          className="min-h-0 flex-1 border-b border-border"
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
    <div className="flex h-screen w-full overflow-hidden bg-background bg-gradient-to-br from-background via-background to-muted/30">
      <WorkspaceNavigationSidebar className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl lg:flex" />
      <MasterCalculationsSidebar />
      <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-background/50 backdrop-blur-sm">
        <TopNav />
        <main className="flex-1 overflow-hidden p-2">
          <div className="h-full rounded-xl border border-border/50 bg-card/50 backdrop-blur-md shadow-sm overflow-hidden flex flex-col">
            <WorkspaceTabs />
          </div>
        </main>
      </div>
      <MobileSidebarSheet />
    </div>
  )
}
