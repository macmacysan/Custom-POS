import * as React from 'react'
import { Activity, RefreshCcw, CheckCircle2, XCircle, AlertTriangle, Terminal, Search, Info } from 'lucide-react'
import { usePosStore } from '@/state/pos-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    electronAPI: {
      syncToGSheet: (sheetName: string, data: any[]) => Promise<{ success: boolean; data?: any; error?: string }>
    }
  }
}

export function SyncDebugPanel() {
  const { 
    syncLogs, clearSyncLogs, addSyncLog, 
    expenses, income, payments, checks, financing,
    selectedBranch 
  } = usePosStore()
  
  const [isTesting, setIsTesting] = React.useState(false)
  const [selectedLog, setSelectedLog] = React.useState<string | null>(null)
  
  const currentLog = syncLogs.find(l => l.id === selectedLog)
  const isElectron = typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron')
  const hasAPI = typeof window !== 'undefined' && !!window.electronAPI
  
  const testConnection = async () => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      addSyncLog('Debug', 'error', 'Electron API not available in this environment')
      return
    }
    
    setIsTesting(true)
    const trace: { step: string; timestamp: number; data?: any }[] = [{ step: 'Test Initiated', timestamp: Date.now() }]
    addSyncLog('Debug', 'syncing', 'Testing connection with ping...', null, trace)
    
    try {
      trace.push({ step: 'Preparing Payload', timestamp: Date.now(), data: { sheetName: 'PingTest' } })
      
      const result = await window.electronAPI.syncToGSheet('PingTest', [{ test: true, timestamp: new Date().toISOString() }])
      
      trace.push({ step: 'API Response Received', timestamp: Date.now(), data: result })
      
      if (result.success) {
        addSyncLog('Debug', 'success', 'Connection test successful!', result, trace)
      } else {
        addSyncLog('Debug', 'error', `Connection test failed: ${result.error}`, result, trace)
      }
    } catch (err: any) {
      trace.push({ step: 'Critical Failure', timestamp: Date.now(), data: err.message })
      addSyncLog('Debug', 'error', `Critical failure during test: ${err.message}`, null, trace)
    } finally {
      setIsTesting(false)
    }
  }

  const syncAll = async () => {
    if (typeof window === 'undefined' || !window.electronAPI) return
    
    const sheets = [
      { name: 'Expenses', data: expenses },
      { name: 'Income', data: income },
      { name: 'Payments', data: payments },
      { name: 'Checks', data: checks },
      { name: 'Financing', data: financing },
    ]
    
    for (const sheet of sheets) {
      const trace: { step: string; timestamp: number; data?: any }[] = [{ step: 'Manual Sync Start', timestamp: Date.now(), data: { sheet: sheet.name } }]
      addSyncLog(sheet.name, 'syncing', `Starting full manual sync for ${sheet.name}...`, null, trace)
      try {
        trace.push({ step: 'Formatting Payload', timestamp: Date.now(), data: {} })
        const payload = (sheet.data as any[]).map((row, i) => ({
          rowId: i + 1,
          branch: selectedBranch ?? '',
          syncDate: new Date().toISOString().split('T')[0],
          ...row
        }))
        trace.push({ step: 'Payload Ready', timestamp: Date.now(), data: { rowCount: payload.length } })
        
        const result = await window.electronAPI.syncToGSheet(sheet.name, payload)
        trace.push({ step: 'API Response Received', timestamp: Date.now(), data: result })

        if (result.success) {
          addSyncLog(sheet.name, 'success', `Successfully synced ${payload.length} rows`, result, trace)
        } else {
          addSyncLog(sheet.name, 'error', `Failed: ${result.error}`, result, trace)
        }
      } catch (err: any) {
        trace.push({ step: 'Exception', timestamp: Date.now(), data: err.message })
        addSyncLog(sheet.name, 'error', `Exception: ${err.message}`, null, trace)
      }
    }
  }

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_350px] overflow-hidden bg-background">
      <div className="flex flex-col min-h-0 border-r overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b shrink-0 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Sync Diagnostics</h2>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider opacity-60">Google Sheets Connection Status</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearSyncLogs} className="h-8 text-xs">
              Clear Logs
            </Button>
            <Button size="sm" onClick={testConnection} disabled={isTesting} className="h-8 text-xs gap-2">
              {isTesting ? <RefreshCcw className="size-3 animate-spin" /> : <Activity className="size-3" />}
              Test Connection
            </Button>
            <Button variant="default" size="sm" onClick={syncAll} className="h-8 text-xs gap-2 bg-emerald-600 hover:bg-emerald-700">
              <RefreshCcw className="size-3" />
              Sync All Sheets
            </Button>
          </div>
        </header>

        <div className="flex items-center gap-4 px-6 py-2 border-b bg-muted/10">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Env:</span>
            <Badge variant={isElectron ? 'outline' : 'destructive'} className="text-[9px] px-1.5 h-4">
              {isElectron ? 'ELECTRON' : 'WEB BROWSER'}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Bridge:</span>
            <Badge variant={hasAPI ? 'outline' : 'destructive'} className="text-[9px] px-1.5 h-4">
              {hasAPI ? 'CONNECTED' : 'DISCONNECTED'}
            </Badge>
          </div>
        </div>

        <main className="flex-1 min-h-0 p-6 overflow-hidden">
          <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Synchronization Timeline</CardTitle>
                  <CardDescription>Recent API requests and responses</CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-tighter">
                  {syncLogs.length} Events Logged
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 px-0 pb-0">
              <ScrollArea className="h-full pr-4 -mr-4">
                <div className="space-y-2">
                  {syncLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                      <Terminal className="size-10 mb-3" />
                      <p className="text-sm font-medium">No sync events recorded yet.</p>
                      <p className="text-xs">Try performing an action or testing the connection.</p>
                    </div>
                  ) : (
                    syncLogs.map((log) => (
                      <div 
                        key={log.id}
                        onClick={() => setSelectedLog(log.id)}
                        className={cn(
                          "group flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer",
                          selectedLog === log.id 
                            ? "bg-primary/5 border-primary/30 shadow-sm" 
                            : "hover:bg-muted/50 border-transparent"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          log.status === 'success' ? "bg-emerald-500/10" : 
                          log.status === 'syncing' ? "bg-blue-500/10" : 
                          log.status === 'error' ? "bg-red-500/10" : "bg-amber-500/10"
                        )}>
                          {log.status === 'success' ? <CheckCircle2 className="size-4 text-emerald-500" /> : 
                           log.status === 'syncing' ? <RefreshCcw className="size-4 text-blue-500 animate-spin" /> : 
                           log.status === 'error' ? <XCircle className="size-4 text-red-500" /> : <AlertTriangle className="size-4 text-amber-500" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold text-foreground">
                              {log.sheetName}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate font-medium">
                            {log.message}
                          </p>
                        </div>
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Badge variant="secondary" className="text-[9px] h-5">Details</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </main>
      </div>

      <aside className="flex flex-col min-h-0 bg-muted/20 overflow-hidden">
        <header className="px-5 py-4 border-b bg-background/50">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Info className="size-4 text-primary" />
            <span>Event Inspector</span>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-5">
          {currentLog ? (
            <div className="space-y-6">
              <section>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Response Summary</h4>
                <div className="p-4 rounded-2xl bg-background border space-y-3 shadow-sm">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Environment</span>
                    <Badge variant={isElectron ? 'outline' : 'destructive'} className="text-[10px]">
                      {isElectron ? 'ELECTRON' : 'WEB BROWSER'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">API Bridge</span>
                    <Badge variant={hasAPI ? 'outline' : 'destructive'} className="text-[10px]">
                      {hasAPI ? 'CONNECTED' : 'DISCONNECTED'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={currentLog.status === 'success' ? 'default' : 'destructive'} className={cn(
                      "text-[10px] font-bold",
                      currentLog.status === 'success' ? "bg-emerald-500 hover:bg-emerald-600" : ""
                    )}>
                      {currentLog.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Target Sheet</span>
                    <span className="font-semibold">{currentLog.sheetName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-mono">{currentLog.timestamp.toLocaleString()}</span>
                  </div>
                </div>
              </section>

              {currentLog.trace && currentLog.trace.length > 0 && (
                <section>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Execution Trace</h4>
                  <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
                    {currentLog.trace.map((step, idx) => (
                      <div key={idx} className="relative pl-6">
                        <div className="absolute left-0 top-1.5 size-4 rounded-full border bg-background flex items-center justify-center">
                          <div className="size-1.5 rounded-full bg-primary" />
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-[11px] font-bold">{step.step}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">
                            {idx > 0 ? `+${step.timestamp - currentLog.trace![idx-1].timestamp}ms` : 'Start'}
                          </span>
                        </div>
                        {step.data && (
                          <div className="mt-1 p-2 rounded-lg bg-muted/30 border text-[9px] font-mono overflow-x-auto">
                            {typeof step.data === 'string' ? step.data : JSON.stringify(step.data, null, 2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {currentLog.details && (
                <section>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Raw Payload / Response</h4>
                  <div className="rounded-2xl border bg-zinc-950 p-4 shadow-inner">
                    <pre className="text-[10px] font-mono text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(currentLog.details, null, 2)}
                    </pre>
                  </div>
                </section>
              )}
              
              {!currentLog.details && (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-30 italic">
                  <Search className="size-8 mb-2" />
                  <p className="text-xs">No additional metadata for this event.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
              <Activity className="size-12 mb-4 text-muted-foreground" />
              <p className="text-sm font-medium italic">Select an event from the timeline to inspect details.</p>
            </div>
          )}
        </div>
        
        <footer className="p-5 border-t bg-background/50">
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Debug Hints</h4>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground">Ensure your Google Apps Script is deployed as "Web App" with access to "Anyone".</p>
              </div>
              <div className="flex gap-2">
                <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground">Check the sheet names in your spreadsheet: they must exactly match (Expenses, Income, etc.)</p>
              </div>
            </div>
          </div>
        </footer>
      </aside>
    </div>
  )
}
