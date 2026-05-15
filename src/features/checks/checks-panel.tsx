import * as React from 'react'
import { Pencil, Trash2, GripVertical, Undo2, Redo2, PlusCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ActionTooltip } from '@/components/ui/action-tooltip'
import { FloatingInput, FloatingSelect, FloatingNumberInput, FloatingDatePicker } from '@/components/ui/floating-field'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useFormShortcuts } from '@/hooks/use-form-shortcuts'
import { usePosStore } from '@/state/pos-store'
import type { CheckEntry, CheckType } from '@/types/pos'
import { formatCurrency, parseMoney } from '@/lib/money'
import { summarizeChecks } from '@/features/sidebar/calculations'
import { kb } from '@/lib/keyboard-hints'
import { cn } from '@/lib/utils'

const checkTypes: CheckType[] = ['Bank Check', 'Bank Transfer', 'GCash', 'Other E-Wallet']

// Per-type accent: left-border color + subtle tints (mirrors ExpensesPanel pattern)
const typeAccent: Record<CheckType, { border: string; badge: string; header: string; dot: string }> = {
  'Bank Check': {
    border: 'border-l-blue-500/60',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    header: 'bg-blue-500/5 text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500/70',
  },
  'Bank Transfer': {
    border: 'border-l-emerald-500/60',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    header: 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500/70',
  },
  GCash: {
    border: 'border-l-indigo-500/60',
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    header: 'bg-indigo-500/5 text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500/70',
  },
  'Other E-Wallet': {
    border: 'border-l-violet-500/60',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    header: 'bg-violet-500/5 text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500/70',
  },
}

type Draft = {
  type: CheckType
  bank: string
  account: string
  checkNo: string
  receipt: string
  date: string
  amount: string
}

const defaultDraft: Draft = {
  type: 'Bank Check',
  bank: '',
  account: '',
  checkNo: '',
  receipt: '',
  date: '',
  amount: '',
}

export function ChecksPanel() {
  const {
    checks, setChecks, pushHistory,
    undo, redo, canUndo, canRedo,
    currentDate,
    setSyncStatus, setSyncError, setLastSyncTime,
    addSyncLog,
  } = usePosStore()

  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<Draft>(defaultDraft)
  const totals = summarizeChecks(checks)

  // -- Sync logic --
  type CheckSheetRow = {
    rowId: number
    syncDate: string
    type: string
    bank: string
    account: string
    checkNo: string
    receipt: string
    recordDate: string
    amount: number
  }

  const formatForSheet = React.useCallback((): CheckSheetRow[] => {
    const dateStr = currentDate.toISOString().split('T')[0]
    return checks.map((item, index) => ({
      rowId: index + 1,
      syncDate: dateStr,
      type: item.type,
      bank: item.bank,
      account: item.account,
      checkNo: item.checkNo,
      receipt: item.receipt,
      recordDate: item.date,
      amount: item.amount,
    }))
  }, [checks, currentDate])

  const syncToSheet = React.useCallback(async (overridePayload?: CheckSheetRow[]) => {
    const payload = overridePayload || formatForSheet()

    if (typeof window === 'undefined' || !window.electronAPI) {
      setSyncStatus('offline')
      setSyncError('Sync API unavailable')
      addSyncLog('Checks', 'offline', 'Electron sync API unavailable')
      return
    }

    setSyncStatus('syncing'); setSyncError(null)
    try {
      addSyncLog('Checks', 'syncing', `Starting sync for ${payload.length} rows`)
      const result = await window.electronAPI.syncToGSheet('Checks', payload)

      if (result.success) {
        setSyncStatus('success'); setLastSyncTime(new Date())
        addSyncLog('Checks', 'success', `Synced ${payload.length} rows successfully`, result)
      } else {
        const message = result.error || 'Sync failed'
        const status = /offline|network|enotfound|econnrefused|not connected/i.test(message) ? 'offline' : 'error'
        setSyncStatus(status)
        setSyncError(message)
        addSyncLog('Checks', status, message, result)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err ?? 'Unknown error during sync')
      const status = /offline|network|enotfound|econnrefused|not connected/i.test(message) ? 'offline' : 'error'
      setSyncStatus(status)
      setSyncError(message)
      addSyncLog('Checks', status, message)
    }
  }, [formatForSheet, setSyncStatus, setSyncError, setLastSyncTime, addSyncLog])

  React.useEffect(() => {
    const timer = setInterval(() => syncToSheet(), 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [syncToSheet])

  function reset() {
    setEditingId(null)
    setDraft(defaultDraft)
  }

  function onSave() {
    const amount = parseMoney(draft.amount)
    if (!draft.bank.trim() || amount <= 0) return
    pushHistory('checks')
    const entry: CheckEntry = {
      id: editingId ?? Date.now().toString(),
      type: draft.type,
      bank: draft.bank,
      account: draft.account || '',
      checkNo: draft.checkNo || '',
      receipt: draft.receipt || '',
      date: draft.date || '',
      amount,
    }
    setChecks((prev) => {
      const updated = editingId ? prev.map((x) => (x.id === editingId ? entry : x)) : [...prev, entry]
      const payload = updated.map((item, i) => ({
        rowId: i + 1,
        syncDate: currentDate.toISOString().split('T')[0],
        type: item.type,
        bank: item.bank,
        account: item.account,
        checkNo: item.checkNo,
        receipt: item.receipt,
        recordDate: item.date,
        amount: item.amount,
      }))
      setTimeout(() => syncToSheet(payload), 0)
      return updated
    })
    reset()
  }

  function onDelete(id: string) {
    pushHistory('checks')
    setChecks((prev) => {
      const updated = prev.filter((row) => row.id !== id)
      const payload = updated.map((item, i) => ({
        rowId: i + 1,
        syncDate: currentDate.toISOString().split('T')[0],
        type: item.type,
        bank: item.bank,
        account: item.account,
        checkNo: item.checkNo,
        receipt: item.receipt,
        recordDate: item.date,
        amount: item.amount,
      }))
      setTimeout(() => syncToSheet(payload), 0)
      return updated
    })
    if (editingId === id) reset()
  }

  function onEdit(item: CheckEntry) {
    setEditingId(item.id)
    setDraft({
      type: item.type,
      bank: item.bank,
      account: item.account,
      checkNo: item.checkNo,
      receipt: item.receipt,
      date: item.date,
      amount: String(item.amount),
    })
  }

  function onDrop(type: CheckType, id: string) {
    pushHistory('checks')
    setChecks((prev) => prev.map((item) => (item.id === id ? { ...item, type } : item)))
  }

  useFormShortcuts({
    onSave,
    onReset: reset,
    onDelete: editingId ? () => onDelete(editingId) : undefined,
    hasEditingId: Boolean(editingId),
  })

  const isDirty = draft.bank.trim().length > 0 || draft.amount.trim().length > 0
  const canSave = draft.bank.trim().length > 0 && parseMoney(draft.amount) > 0

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_235px]">

      {/* ── Table section ── */}
      <section className="flex flex-col min-h-0 overflow-hidden bg-card">

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Check Payments</h2>
          </div>
          <div className="flex items-center gap-0.5">
            {canUndo('checks') && (
              <ActionTooltip label="Undo" shortcut={kb.undo()}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Undo"
                  onClick={() => undo('checks')}
                  className="w-6 h-6 text-muted-foreground hover:text-foreground"
                >
                  <Undo2 className="size-3" />
                </Button>
              </ActionTooltip>
            )}
            {canRedo('checks') && (
              <ActionTooltip label="Redo" shortcut={kb.redo()}>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Redo"
                  onClick={() => redo('checks')}
                  className="w-6 h-6 text-muted-foreground hover:text-foreground"
                >
                  <Redo2 className="size-3" />
                </Button>
              </ActionTooltip>
            )}
            {checks.length > 0 && (
              <ActionTooltip label="Clear all rows from this tab">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    pushHistory('checks')
                    setChecks([])
                    setTimeout(() => syncToSheet([]), 0)
                    reset()
                  }}
                  className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive hover:bg-destructive/8"
                >
                  Clear All
                </Button>
              </ActionTooltip>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:hsl(var(--border))_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border/60">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 hover:bg-transparent border-border/60">
                <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pl-8">Bank / Branch</TableHead>
                <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Account</TableHead>
                <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Ref No.</TableHead>
                <TableHead className="h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Date</TableHead>
                <TableHead className="text-right h-7 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 pr-0">Amount</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>

            {checkTypes.map((type) => {
              const rows = checks.filter((row) => row.type === type)
              if (!rows.length) return null
              const accent = typeAccent[type]
              const groupTotal = rows.reduce((sum, r) => sum + r.amount, 0)

              return (
                <TableBody
                  key={type}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData('text/plain')
                    if (id) onDrop(type, id)
                  }}
                >
                  {/* Group header row */}
                  <TableRow className={cn('hover:bg-transparent border-none', accent.header)}>

                    {/* 1. Left Side (Spans Bank, Account, Ref No., Date) */}
                    <TableCell colSpan={4} className="py-1 pl-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[9px] font-bold uppercase tracking-widest px-1.5 py-px rounded-sm', accent.badge)}>
                          {type}
                        </span>
                        <span className="text-[9px] text-muted-foreground/50 tabular-nums">
                          {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                    </TableCell>

                    {/* 2. Subtotal Column (Locks strictly to the Amount column) */}
                    <TableCell className="py-1 pr-0 text-right">
                      <span className="text-[10px] font-semibold font-mono tabular-nums opacity-60">
                        {formatCurrency(groupTotal)}
                      </span>
                    </TableCell>

                    {/* 3. Action Spacer (Accounts for the hidden edit/delete column) */}
                    <TableCell className="w-10 py-1"></TableCell>

                  </TableRow>

                  {/* Data rows */}
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', row.id)}
                      className={cn(
                        'group h-7 border-l-2 transition-colors',
                        accent.border,
                        editingId === row.id
                          ? 'bg-muted/50 border-l-primary'
                          : 'border-l-transparent hover:border-l-current',
                      )}
                    >
                      {/* Bank / Branch */}
                      <TableCell className="py-0 pl-3 text-xs w-52 max-w-52">
                        <div className="flex items-center gap-1.5">
                          <GripVertical className="shrink-0 size-3 text-muted-foreground/25 cursor-grab active:cursor-grabbing" />
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block w-full text-left truncate cursor-default">{row.bank}</span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" align="start" className="whitespace-normal max-w-75 wrap-break-word">
                                {row.bank}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>

                      {/* Account */}
                      <TableCell className="py-0 text-[11px] text-muted-foreground truncate max-w-37.5">
                        {row.account
                          ? <span>{row.account}</span>
                          : <span className="select-none text-muted-foreground/35">—</span>
                        }
                      </TableCell>

                      {/* Ref No. */}
                      <TableCell className="py-0 text-[11px] text-muted-foreground font-mono">
                        {row.checkNo
                          ? <span className="bg-muted/50 rounded px-1 py-px text-[10px]">{row.checkNo}</span>
                          : <span className="select-none text-muted-foreground/35">—</span>
                        }
                      </TableCell>

                      {/* Date */}
                      <TableCell className="py-0 text-[11px] text-muted-foreground font-mono">
                        {row.date || <span className="select-none text-muted-foreground/35">—</span>}
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="py-0 pr-0 text-right tabular-nums">
                        <span className="font-mono text-xs font-medium">
                          {formatCurrency(row.amount)}
                        </span>
                      </TableCell>

                      {/* Dedicated Actions Column (Only visible on hover) */}
                      <TableCell className="w-12 px-0 py-0">
                        <div className="flex items-center justify-end gap-px transition-opacity opacity-0 group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onEdit(row)}
                            className="w-5 h-5 text-muted-foreground/50 hover:text-foreground"
                          >
                            <Pencil className="size-2.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => onDelete(row.id)}
                            className="w-5 h-5 text-muted-foreground/50 hover:text-destructive"
                          >
                            <Trash2 className="size-2.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )
            })}

            {checks.length === 0 && (
              <TableBody>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-10 text-xs text-center text-muted-foreground/55">
                    No check entries yet. Add your first payment on the right panel.
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        </div>

        {/* Footer — ledger summary bar */}
        <div className="shrink-0 border-t bg-muted/20 px-3 py-1.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
            {(
              [
                { label: 'Bank Check', val: totals.check, type: 'Bank Check' as CheckType },
                { label: 'Transfer', val: totals.transfer, type: 'Bank Transfer' as CheckType },
                { label: 'GCash', val: totals.gcash, type: 'GCash' as CheckType },
                { label: 'E-Wallet', val: totals.ewallet, type: 'Other E-Wallet' as CheckType },
              ] as const
            ).map((item) => (
              <span key={item.label} className="flex items-center gap-1.5 text-[10px]">
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', typeAccent[item.type].dot)} />
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-light tabular-nums">{formatCurrency(item.val)}</span>
              </span>
            ))}
            <span className="ml-auto flex items-center gap-1.5 text-[10px]">
              <span className="text-muted-foreground">Grand Total</span>
              <span className="font-light tabular-nums">
                {formatCurrency(checks.reduce((sum, c) => sum + c.amount, 0))}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* ── Form panel ── */}
      <section
        className={cn(
          'flex flex-col border-l shrink-0 transition-colors duration-150',
          editingId ? 'bg-muted/20' : 'bg-muted/10',
        )}
      >
        {/* Panel header — signals mode */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2.5 transition-colors',
            editingId ? 'bg-primary/5' : 'bg-transparent',
          )}
        >
          {editingId
            ? <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            : <PlusCircle className="size-3 text-muted-foreground/50 shrink-0" />
          }
          <h3 className={cn('text-sm font-semibold', editingId ? 'text-primary' : 'text-muted-foreground')}>
            {editingId ? 'Editing Payment' : 'New Payment'}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-2 [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:hsl(var(--border))_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border/60">
          <FloatingSelect
            label="Type"
            value={draft.type}
            onValueChange={(v) => setDraft((s) => ({ ...s, type: v as CheckType }))}
            options={checkTypes.map((t) => ({ label: t, value: t }))}
            triggerClassName="w-full text-left"
          />
          <FloatingInput
            id="primary-input"
            label="Bank name - branch"
            value={draft.bank}
            onChange={(e) => setDraft((s) => ({ ...s, bank: e.target.value }))}
          />
          <FloatingInput
            label="Account name"
            value={draft.account}
            onChange={(e) => setDraft((s) => ({ ...s, account: e.target.value }))}
          />
          <FloatingInput
            label="Check / Reference no."
            value={draft.checkNo}
            onChange={(e) => setDraft((s) => ({ ...s, checkNo: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <FloatingInput
              label="Receipt no."
              value={draft.receipt}
              onChange={(e) => setDraft((s) => ({ ...s, receipt: e.target.value }))}
            />
            <FloatingDatePicker
              label="Date"
              containerClassName="w-full"
              value={draft.date}
              onChange={(date) => setDraft((s) => ({ ...s, date }))}
              placeholder="yyyy/mm/dd"
            />
          </div>
          <FloatingNumberInput
            label="Amount"
            inputMode="decimal"
            value={draft.amount}
            onChange={(e) => setDraft((s) => ({ ...s, amount: e.target.value }))}
          />

          {/* Action buttons — conditional visibility */}
          {(isDirty || editingId) && (
            <div className="pt-0.5 space-y-1.5">
              <div className="flex gap-1.5">
                {!editingId && canSave && (
                  <ActionTooltip label="Save payment" shortcut={`${kb.save()} · ${kb.saveAlso()}`}>
                    <Button type="button" onClick={onSave} className="flex-1 text-xs h-7">
                      Save Payment
                    </Button>
                  </ActionTooltip>
                )}
                {editingId && (
                  <ActionTooltip label="Update payment" shortcut={`${kb.save()} · ${kb.saveAlso()}`}>
                    <Button type="button" onClick={onSave} className="flex-1 text-xs h-7">
                      Update
                    </Button>
                  </ActionTooltip>
                )}
                {(editingId || isDirty) && (
                  <ActionTooltip label="Cancel" shortcut={kb.cancel()}>
                    <Button type="button" variant="outline" onClick={reset} className="px-3 text-xs h-7">
                      Cancel
                    </Button>
                  </ActionTooltip>
                )}
              </div>

              {/* Delete — separated, full width */}
              {editingId && (
                <ActionTooltip label="Delete current row" shortcut={kb.deleteRow()}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onDelete(editingId)}
                    className="w-full text-xs transition-colors h-7 border-destructive/30 text-destructive/80 hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="size-3 mr-1.5" />
                    Delete Payment
                  </Button>
                </ActionTooltip>
              )}
            </div>
          )}
        </div>
      </section>

    </div>
  )
}