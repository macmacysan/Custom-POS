import * as React from 'react'

interface UseFormShortcutsProps {
  onSave: () => void
  onReset: () => void
  onDelete?: () => void
  hasEditingId: boolean
}

function isInShortcutSuppressedRegion(): boolean {
  const el = document.activeElement
  if (!el || !(el instanceof HTMLElement)) return false
  return Boolean(
    el.closest('[role="dialog"]') ||
      el.closest('[role="alertdialog"]') ||
      el.closest('[role="listbox"]') ||
      el.closest('[data-radix-select-content]') ||
      el.closest('[data-radix-popover-content]') ||
      el.closest('[data-radix-dropdown-menu-content]'),
  )
}

export function useFormShortcuts({ onSave, onReset, onDelete, hasEditingId }: UseFormShortcutsProps) {
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isInShortcutSuppressedRegion()) return

      // Ignore if user is typing in a textarea unless they press Ctrl+S / Ctrl+Enter
      if (
        document.activeElement?.tagName === 'TEXTAREA' &&
        !(e.key.toLowerCase() === 's' && (e.metaKey || e.ctrlKey)) &&
        !((e.key === 'Enter' || e.key === 'NumpadEnter') && (e.metaKey || e.ctrlKey)) &&
        e.key !== 'Escape'
      ) {
        return
      }

      // Save (Ctrl+S or Cmd+S)
      if (e.key.toLowerCase() === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onSave()
        return
      }

      // Save (Ctrl+Enter / Cmd+Enter) — handy from notes / long fields
      if ((e.key === 'Enter' || e.key === 'NumpadEnter') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onSave()
        return
      }

      // Cancel/Reset (Escape)
      if (e.key === 'Escape') {
        e.preventDefault()
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }
        onReset()
        return
      }

      // Delete (Ctrl+Backspace or Ctrl+Delete)
      if ((e.key === 'Backspace' || e.key === 'Delete') && (e.metaKey || e.ctrlKey)) {
        if (hasEditingId && onDelete) {
          e.preventDefault()
          onDelete()
          return
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onSave, onReset, onDelete, hasEditingId])
}
