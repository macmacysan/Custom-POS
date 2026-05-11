import * as React from 'react'
import { Pencil, Trash2, GripVertical, Undo2, Redo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { FloatingInput, FloatingSelect } from '@/components/ui/floating-field'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { usePosStore } from '@/state/pos-store'
import type { IncomeEntry, IncomeType } from '@/types/pos'
import { formatCurrency, parseMoney } from '@/lib/money'
import { summarizeIncome } from '@/features/sidebar/calculations'

const incomeTypes: IncomeType[] = ['Load', 'Cash Reimbursement', 'Others']

type Draft = { particular: IncomeType; remarks: string; receipt: string; date: string; amount: string }
const defaultDraft: Draft = { particular: 'Load', remarks: '', receipt: '', date: '', amount: '' }

export function IncomePanel() {
  const { income, setIncome, pushHistory, undo, redo, canUndo, canRedo } = usePosStore()
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<Draft>(defaultDraft)
  const totals = summarizeIncome(income)

  const reset = () => { setEditingId(null); setDraft(defaultDraft) }

  function onSave() {
    const amount = parseMoney(draft.amount)
    if (amount <= 0) return
    pushHistory('income')
    const entry: IncomeEntry = {
      id: editingId ?? Date.now().toString(),
      particular: draft.particular,
      remarks: draft.remarks || '—',
      receipt: draft.receipt || '—',
      date: draft.date || '—',
      amount,
    }
    setIncome((prev) => editingId ? prev.map((x) => (x.id === editingId ? entry : x)) : [...prev, entry])
    reset()
  }

  function onDelete(id: string) {
    pushHistory('income')
    setIncome((prev) => prev.filter((row) => row.id !== id))
    if (editingId === id) reset()
  }

  function onEdit(item: IncomeEntry) {
    setEditingId(item.id)
    setDraft({ particular: item.particular, remarks: item.remarks, receipt: item.receipt, date: item.date === '—' ? '' : item.date, amount: String(item.amount) })
  }

  function onDrop(particular: IncomeType, id: string) {
    pushHistory('income')
    setIncome((prev) => prev.map((item) => (item.id === id ? { ...item, particular } : item)))
  }

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_320px]">
      <section className="flex min-h-0 flex-col overflow-hidden rounded-none bg-card">
        <div className="flex items-center justify-between border-b p-3">
          <h2 className="text-sm font-semibold">Other Income</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" onClick={() => undo('income')} disabled={!canUndo('income')}><Undo2 className="size-4" /></Button>
            <Button variant="outline" size="icon-sm" onClick={() => redo('income')} disabled={!canRedo('income')}><Redo2 className="size-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => { pushHistory('income'); setIncome([]); reset() }} disabled={income.length === 0}>Clear All</Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Particular</TableHead><TableHead>Remarks</TableHead><TableHead>Receipt</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            {incomeTypes.map((type) => {
              const rows = income.filter((row) => row.particular === type)
              if (!rows.length) return null
              return (
                <TableBody key={type} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData('text/plain'); if (id) onDrop(type, id) }}>
                  <TableRow className="bg-muted/40"><TableCell colSpan={5} className="font-semibold">{type}</TableCell></TableRow>
                  {rows.map((row) => (
                    <TableRow key={row.id} className="group" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', row.id)}>
                      <TableCell className="w-45 max-w-45">
                        <div className="flex items-center">
                          <GripVertical className="mr-2 shrink-0 size-3 text-muted-foreground" />
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate cursor-default block w-full text-left">{row.particular}</span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" align="start" className="max-w-75 whitespace-normal wrap-break-word">
                                {row.particular}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell className="w-45 max-w-45">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate cursor-default block w-full text-left">{row.remarks}</span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="start" className="max-w-75 whitespace-normal wrap-break-word">
                              {row.remarks}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>{row.receipt}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <div className="flex items-center justify-end gap-2">
                          <span>{formatCurrency(row.amount)}</span>
                          <span className="inline-flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button variant="ghost" size="icon-xs" onClick={() => onEdit(row)}><Pencil className="size-3" /></Button>
                            <Button variant="ghost" size="icon-xs" onClick={() => onDelete(row.id)}><Trash2 className="size-3" /></Button>
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )
            })}
          </Table>
        </div>
        <div className="flex flex-wrap gap-4 border-t px-3 py-2 text-xs">
          <span>Load: {formatCurrency(totals.load)}</span>
          <span>Cash Reimb.: {formatCurrency(totals.reimbursement)}</span>
          <span>Others: {formatCurrency(totals.others)}</span>
        </div>
      </section>

      <section className="shrink-0 space-y-3 rounded-none border-l bg-muted/20 p-3">
        <h3 className="text-sm font-semibold">{editingId ? 'Edit Income' : 'Add Income'}</h3>
        <FloatingSelect
          label="Particular"
          value={draft.particular}
          onValueChange={(v) => setDraft((s) => ({ ...s, particular: v as IncomeType }))}
          options={incomeTypes.map((t) => ({ label: t, value: t }))}
        />
        <FloatingInput label="Remarks" value={draft.remarks} onChange={(e) => setDraft((s) => ({ ...s, remarks: e.target.value }))} />
        <div className="grid grid-cols-6 gap-2">
          <FloatingInput 
            label="Receipt/Reference"
            className="col-span-3" 
            value={draft.receipt} 
            onChange={(e) => setDraft((s) => ({ ...s, receipt: e.target.value }))} 
          />
          <div className="col-span-3 w-full">
            <DatePicker 
              value={draft.date} 
              onChange={(date) => setDraft((s) => ({ ...s, date }))} 
              placeholder="yyyy/mm/dd" 
            />
          </div>
        </div>
        <FloatingInput label="Amount" inputMode="decimal" value={draft.amount} onChange={(e) => setDraft((s) => ({ ...s, amount: e.target.value }))} />
        <div className="grid grid-cols-3 gap-2">
          <Button onClick={onSave}>{editingId ? 'Update' : 'Save'}</Button>
          <Button variant="outline" onClick={reset}>Cancel</Button>
          <Button variant="destructive" disabled={!editingId} onClick={() => editingId && onDelete(editingId)}>Delete</Button>
        </div>
      </section>
    </div>
  )
}

