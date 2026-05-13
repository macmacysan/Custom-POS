import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { kb } from '@/lib/keyboard-hints'
import { WORKSPACE_TAB_HOTKEYS, tabLabel } from '@/lib/nav-sections'

const rows: [string, string][] = [
  [kb.shortcuts(), 'Open this shortcut guide'],
  [kb.newField(), 'Focus the main field on the current tab'],
  [kb.save(), 'Save the side form (when applicable)'],
  [kb.saveAlso(), 'Save the side form (from any field)'],
  [kb.cancel(), 'Reset / cancel the side form'],
  [kb.deleteRow(), 'Delete the row being edited (when editing)'],
  [kb.undo(), 'Undo last change on this tab’s list'],
  [kb.redo(), 'Redo on this tab’s list'],
  ...WORKSPACE_TAB_HOTKEYS.map((tab, i) => [kb.workspaceTab(i + 1), `Open ${tabLabel(tab)}`] as [string, string]),
  [kb.sidebar(), 'Toggle mobile workspace menu'],
  [kb.prevDay(), 'Previous report date'],
  [kb.nextDay(), 'Next report date'],
  [kb.today(), 'Jump report date to today'],
  [kb.theme(), 'Toggle light / dark theme'],
  [kb.settings(), 'Open settings'],
]

export function ShortcutGuideDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto pr-1">
          {rows.map(([keys, desc]) => (
            <div key={`${keys}-${desc}`} className="flex items-center justify-between gap-3 rounded-md border p-2">
              <span className="text-xs text-muted-foreground">{desc}</span>
              <code className="shrink-0 rounded bg-muted px-2 py-1 text-xs">{keys}</code>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
