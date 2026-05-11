import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { usePosStore } from '@/state/pos-store'
import { cn } from '@/lib/utils'

type LineItem = { label: string; value: string; hint?: string }

const sampleTotals: LineItem[] = [
  { label: 'Subtotal', value: '$1,248.00' },
  { label: 'Tax', value: '$99.84', hint: '8%' },
  { label: 'Discounts', value: '-$62.40' },
  { label: 'Tips', value: '$187.20' },
]

export function MasterCalculationsSidebar()
{
  const { settings } = usePosStore()
  const isDarkSidebar = settings.sidebarAlwaysDark
  return (
    <aside className={cn("sticky top-14 flex h-[calc(100svh-3.5rem)] w-[min(100%,20rem)] shrink-0 flex-col border-l bg-sidebar", isDarkSidebar && "dark text-slate-50")}>
        <ScrollArea className="h-full space-y-6 p-4">
        <div className="space-y-4 p-4">
          <Card className={cn("border-sidebar-border bg-sidebar shadow-none", isDarkSidebar && "border-slate-800  text-slate-50")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Master totals</CardTitle>
              <CardDescription className={isDarkSidebar ? "text-slate-400" : ""}>Live rollups for the current session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {sampleTotals.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-2">
                  <span className={cn("text-muted-foreground", isDarkSidebar && "text-slate-400")}>
                    {row.label}
                    {row.hint ? (
                      <span className={cn("ml-1 text-xs text-muted-foreground/80", isDarkSidebar && "text-slate-500")}> ({row.hint})</span>
                    ) : null}
                  </span>
                  <span className={cn("tabular-nums font-medium text-foreground", isDarkSidebar && "text-slate-50")}>{row.value}</span>
                </div>
              ))}
              <Separator className={isDarkSidebar ? "bg-slate-800" : ""} />
              <div className={cn("flex items-baseline justify-between gap-2 text-base font-semibold", isDarkSidebar && "text-slate-50")}>
                <span>Grand total</span>
                <span className="tabular-nums">$1,472.64</span>
              </div>
            </CardContent>
          </Card>
          <Card className={cn("border-sidebar-border bg-sidebar shadow-none", isDarkSidebar && "border-slate-800 text-slate-50")}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Shift</CardTitle>
              <CardDescription className={isDarkSidebar ? "text-slate-400" : ""}>Cash drawer & reconciliation</CardDescription>
            </CardHeader>
            <CardContent className={cn("space-y-2 text-sm text-muted-foreground", isDarkSidebar && "text-slate-400")}>
              <p>Open float, paid in/out, and expected cash can plug in here as you migrate logic.</p>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </aside>
  )
}

