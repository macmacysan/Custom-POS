import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const shortcuts = [
  ['?', 'Open shortcut guide'],
  ['Alt+1..5', 'Switch tabs'],
  ['Alt+N', 'Focus active tab form'],
  ['Alt+B', 'Toggle sidebar on mobile'],
  ['Alt+? / Alt+?', 'Change report date'],
  ['Alt+T', 'Jump to today'],
  ['Alt+D', 'Toggle dark mode'],
  ['Alt+S', 'Open settings'],
  ['Esc', 'Close open dialog'],
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
        <div className="space-y-2">
          {shortcuts.map(([keys, desc]) => (
            <div key={keys} className="flex items-center justify-between rounded-md border p-2">
              <span className="text-xs text-muted-foreground">{desc}</span>
              <code className="rounded bg-muted px-2 py-1 text-xs">{keys}</code>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

