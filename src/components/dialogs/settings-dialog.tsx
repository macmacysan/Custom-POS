import { ArrowUpDown } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { FloatingInput } from '@/components/ui/floating-field'
import { Button } from '@/components/ui/button'
import { usePosStore } from '@/state/pos-store'

type SettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuickTheme: (theme: 'light' | 'dark' | 'system') => void
  currentTheme: string
}

export function SettingsDialog({ open, onOpenChange, onQuickTheme, currentTheme }: SettingsDialogProps) {
  const { settings, setSettings } = usePosStore()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowUpDown className="size-4" /> System Settings</DialogTitle>
          <DialogDescription>Display and business preferences for the POS dashboard.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2 p-3 border rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Global dark mode</p>
              <Switch checked={currentTheme === 'dark'} onCheckedChange={(v) => onQuickTheme(v ? 'dark' : 'light')} />
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Compact rows</p>
              <Switch checked={settings.compactRows} onCheckedChange={(v) => setSettings((s) => ({ ...s, compactRows: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Show VAT column</p>
              <Switch checked={settings.showVatColumn} onCheckedChange={(v) => setSettings((s) => ({ ...s, showVatColumn: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Always dark sidebar</p>
              <Switch checked={settings.sidebarAlwaysDark} onCheckedChange={(v) => setSettings((s) => ({ ...s, sidebarAlwaysDark: v }))} />
            </div>
          </div>

          <div className="grid gap-3 p-3 border rounded-md sm:grid-cols-2">
            <label className="grid gap-1 text-xs text-muted-foreground">
              Cashier name
              <FloatingInput label="Cashier name" value={settings.cashierName} onChange={(e) => setSettings((s) => ({ ...s, cashierName: e.target.value }))} />
            </label>
          
            <label className="grid gap-1 text-xs text-muted-foreground sm:col-span-2">
              Daily sales target
              <FloatingInput
                label="Daily sales target"
                inputMode="decimal"
                value={settings.dailySalesTarget}
                onChange={(e) => setSettings((s) => ({ ...s, dailySalesTarget: Number(e.target.value || 0) }))}
              />
            </label>
          </div>

          <div className="grid gap-2 p-3 border rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Highlight variance</p>
              <Switch checked={settings.highlightVariance} onCheckedChange={(v) => setSettings((s) => ({ ...s, highlightVariance: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Auto-calculate totals</p>
              <Switch checked={settings.autoCalculateTotals} onCheckedChange={(v) => setSettings((s) => ({ ...s, autoCalculateTotals: v }))} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}