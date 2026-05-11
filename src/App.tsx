import * as React from 'react'
import { useTheme } from 'next-themes'

import { AppLayout } from '@/components/layout/app-layout'
import { PosStoreProvider, usePosStore } from '@/state/pos-store'

function KeyboardShortcuts() {
  const { setTheme, resolvedTheme } = useTheme()
  const { setActiveTab, changeDate, goToToday, setMobileSidebarOpen } = usePosStore()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === '?' && !event.metaKey && !event.ctrlKey) return
      if (!event.altKey) return

      const key = event.key.toLowerCase()
      if (key >= '1' && key <= '5') {
        event.preventDefault()
        const map = ['expenses', 'checks', 'income', 'installment', 'financing'] as const
        setActiveTab(map[Number(key) - 1])
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
      if (key === 't') {
        event.preventDefault()
        goToToday()
        return
      }
      if (key === 'd') {
        event.preventDefault()
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
        return
      }
      if (key === 'b') {
        event.preventDefault()
        setMobileSidebarOpen((v) => !v)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [changeDate, goToToday, resolvedTheme, setActiveTab, setMobileSidebarOpen, setTheme])

  return null
}

function AppContent() {
  return (
    <>
      <KeyboardShortcuts />
      <AppLayout />
    </>
  )
}

function App() {
  return (
    <PosStoreProvider>
      <div className="h-screen w-full overflow-hidden">
        <AppContent />
      </div>
    </PosStoreProvider>
  )
}

export default App

