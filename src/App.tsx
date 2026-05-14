import * as React from 'react'
import { useTheme } from 'next-themes'

import { AppLayout } from '@/components/layout/app-layout'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PosStoreProvider, usePosStore } from '@/state/pos-store'
import { AuthScreen } from '@/features/auth/auth-screen'
import { WORKSPACE_TAB_HOTKEYS, TAB_UNDO_DATASET } from '@/lib/nav-sections'
import { dispatchOpenShortcutGuide, dispatchOpenSettings } from '@/lib/app-hotkeys'
import { isTextEntryElement } from '@/lib/keyboard-hints'

function KeyboardShortcuts() {
  const { setTheme, resolvedTheme } = useTheme()
  const {
    activeTab,
    undo,
    redo,
    setActiveTab,
    changeDate,
    goToToday,
    setMobileSidebarOpen,
  } = usePosStore()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const keyLower = event.key.length === 1 ? event.key.toLowerCase() : event.key
      const inTextField = isTextEntryElement(document.activeElement)

      // Shortcut guide: ? or Shift+/
      if (
        (event.key === '?' || (event.shiftKey && event.key === '/')) &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (inTextField) return
        event.preventDefault()
        dispatchOpenShortcutGuide()
        return
      }

      // Alt+S: Settings (avoid while typing)
      if (event.altKey && keyLower === 's' && !event.ctrlKey && !event.metaKey) {
        if (inTextField) return
        event.preventDefault()
        dispatchOpenSettings()
        return
      }

      // Alt+N / Ctrl+N / Cmd+N — focus primary field on active tab
      if (keyLower === 'n' && (event.altKey || event.ctrlKey || event.metaKey)) {
        if (event.repeat) return
        event.preventDefault()
        document.getElementById('primary-input')?.focus()
        return
      }

      // Undo / Redo for list data (do not override text undo inside inputs)
      if (!inTextField) {
        const ds = TAB_UNDO_DATASET[activeTab]
        if (ds) {
          if (keyLower === 'z' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            if (event.shiftKey) redo(ds)
            else undo(ds)
            return
          }
          if (keyLower === 'y' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            redo(ds)
            return
          }
        }
      }

      if (!event.altKey) return

      const digit = event.key.length === 1 ? Number.parseInt(event.key, 10) : NaN
      if (!Number.isNaN(digit) && digit >= 1 && digit <= WORKSPACE_TAB_HOTKEYS.length) {
        event.preventDefault()
        setActiveTab(WORKSPACE_TAB_HOTKEYS[digit - 1])
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        changeDate(-1)
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        changeDate(1)
        return
      }
      if (keyLower === 't') {
        event.preventDefault()
        goToToday()
        return
      }
      if (keyLower === 'd') {
        event.preventDefault()
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
        return
      }
      if (keyLower === 'b') {
        event.preventDefault()
        setMobileSidebarOpen((v) => !v)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    activeTab,
    changeDate,
    goToToday,
    redo,
    resolvedTheme,
    setActiveTab,
    setMobileSidebarOpen,
    setTheme,
    undo,
  ])

  return null
}

function AppContent() {
  const { currentUser } = usePosStore()

  if (!currentUser) {
    return <AuthScreen />
  }

  return (
    <TooltipProvider delayDuration={350}>
      <KeyboardShortcuts />
      <AppLayout />
    </TooltipProvider>
  )
}

function App() {
  return (
    <PosStoreProvider>
      <div className="w-full h-screen overflow-hidden">
        <AppContent />
      </div>
    </PosStoreProvider>
  )
}

export default App
