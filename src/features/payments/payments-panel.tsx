import * as React from 'react'
import { Pencil, Trash2, Undo2, Redo2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FloatingInput, FloatingSelect, FloatingNumberInput } from '@/components/ui/floating-field'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { usePosStore } from '@/state/pos-store'
import { formatCurrency, parseMoney } from '@/lib/money'
import type { FinanceType, PaymentEntry } from '@/types/pos'

const financeGroups: FinanceType[] = [
  'Nueva',
  'Home Credit',
  'Salmon Credit',
  'Skyro',
]

const paymentTypes = ['Downpayment', 'Payment', 'New Account'] as const
const termFrequencies = ['Daily', 'Weekly', 'Semi', 'Monthly'] as const
const paymentMethods = ['Cash', 'Gcash', 'Check', 'Online Payment'] as const
const monthlyTerms = Array.from({ length: 12 }, (_, i) => String(i + 1))

type Draft = {
  finance: FinanceType
  type: string
  termFrequency: string
  termValue: string
  date: string
  accountName: string
  qty: string
  item: string
  unitPrice: string
  grandTotal: string
  down: string
  balance: string
  cr: string
  lateFee: string
  paymentMethod: string
  notes: string
}

const defaultDraft: Draft = {
  finance: 'Nueva',
  type: '',
  termFrequency: '',
  termValue: '',
  date: '',
  accountName: '',
  qty: '',
  item: '',
  unitPrice: '',
  grandTotal: '',
  down: '',
  balance: '',
  cr: '',
  lateFee: '',
  paymentMethod: '',
  notes: '',
}

export function PaymentsPanel() {
  const {
    payments = [],
    setPayments,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePosStore()

  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<Draft>(defaultDraft)

  const isPaymentType = draft.type === 'Payment'
  const isMonthlyTerm = draft.termFrequency === 'Monthly'

  function reset() {
    setEditingId(null)
    setDraft(defaultDraft)
  }

  function onEdit(item: PaymentEntry & { termFrequency?: string; termValue?: string }) {
    setEditingId(item.id)
    setDraft({
      finance: item.finance,
      type: item.type,
      termFrequency: item.termFrequency || '',
      termValue: item.termValue || '',
      date: item.date,
      accountName: item.accountName,
      qty: String(item.qty),
      item: item.item,
      unitPrice: String(item.unitPrice),
      grandTotal: String(item.grandTotal),
      down: String(item.down),
      balance: String(item.balance),
      cr: item.cr,
      lateFee: String(item.lateFee),
      paymentMethod: item.paymentMethod,
      notes: item.notes,
    })
  }

  function onSave() {
    if (!draft.accountName.trim()) return

    pushHistory('payments')

    const next: PaymentEntry & { termFrequency?: string; termValue?: string } = {
      id: editingId ?? Date.now().toString(),
      finance: draft.finance,
      type: draft.type,
      termFrequency: draft.termFrequency,
      termValue: draft.termValue,
      terms: isMonthlyTerm ? `${draft.termFrequency} ${draft.termValue}` : `${draft.termFrequency} ${draft.termValue}`,
      date: draft.date,
      accountName: draft.accountName,
      qty: Number(draft.qty) || 0,
      item: draft.item,
      unitPrice: parseMoney(draft.unitPrice),
      grandTotal: parseMoney(draft.grandTotal),
      down: parseMoney(draft.down),
      balance: parseMoney(draft.balance),
      cr: draft.cr,
      lateFee: parseMoney(draft.lateFee),
      paymentMethod: draft.paymentMethod,
      notes: draft.notes,
    }

    setPayments((prev: PaymentEntry[]) =>
      editingId
        ? prev.map((p) => (p.id === editingId ? next : p))
        : [...prev, next],
    )

    reset()
  }

  function onDelete(id: string) {
    pushHistory('payments')
    setPayments((prev: PaymentEntry[]) =>
      prev.filter((p) => p.id !== id),
    )
    if (editingId === id) reset()
  }

  function clearAll() {
    if (payments.length === 0) return
    pushHistory('payments')
    setPayments([])
    reset()
  }

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_340px]">
      {/* TABLE */}
      <section className="flex flex-col overflow-hidden bg-card">
        <div className="flex items-center justify-between border-b p-3">
          <h2 className="text-sm font-semibold">Payments Panel</h2>
          <div className="flex gap-2">
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => undo('payments')}
              disabled={!canUndo('payments')}
            >
              <Undo2 className="size-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => redo('payments')}
              disabled={!canRedo('payments')}
            >
              <Redo2 className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
            >
              Clear All
            </Button>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>FINANCE</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>TERMS</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>ACCOUNT</TableHead>
                  <TableHead>QTY</TableHead>
                  <TableHead>ITEM</TableHead>
                  <TableHead>UNIT</TableHead>
                  <TableHead>TOTAL</TableHead>
                  <TableHead>DOWN</TableHead>
                  <TableHead>BALANCE</TableHead>
                  <TableHead>CR#</TableHead>
                  <TableHead>LATE</TableHead>
                  <TableHead>METHOD</TableHead>
                  <TableHead>NOTES</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {payments.map((row: PaymentEntry) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.finance || '-'}</TableCell>
                    <TableCell>{row.type || '-'}</TableCell>
                    <TableCell>{row.terms || '-'}</TableCell>
                    <TableCell>{row.date || '-'}</TableCell>
                    <TableCell>{row.accountName || '-'}</TableCell>
                    <TableCell>{row.qty}</TableCell>
                    <TableCell>{row.item || '-'}</TableCell>
                    <TableCell>{formatCurrency(row.unitPrice)}</TableCell>
                    <TableCell>{formatCurrency(row.grandTotal)}</TableCell>
                    <TableCell>{formatCurrency(row.down)}</TableCell>
                    <TableCell>{formatCurrency(row.balance)}</TableCell>
                    <TableCell>{row.cr || '-'}</TableCell>
                    <TableCell>{formatCurrency(row.lateFee)}</TableCell>
                    <TableCell>{row.paymentMethod || '-'}</TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {row.notes}
                    </TableCell>

                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => onEdit(row)}
                        >
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => onDelete(row.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* FOOTER TOTALS */}
          <div className="border-t bg-muted/30 p-3">
            <div className="grid grid-cols-5 gap-4 text-sm">
              {financeGroups.map(finance => {
                const total = payments
                  .filter(p => p.finance === finance)
                  .reduce((sum, p) => sum + p.grandTotal, 0)
                return (
                  <div key={finance} className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{finance}</span>
                    <span className="font-semibold">{formatCurrency(total)}</span>
                  </div>
                )
              })}
              <div className="flex flex-col font-bold">
                <span className="text-xs text-muted-foreground">GRAND TOTAL</span>
                <span className="text-lg">
                  {formatCurrency(payments.reduce((sum, p) => sum + p.grandTotal, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="border-l bg-muted/20 p-3">
        <h3 className="mb-3 text-sm font-semibold">
          {editingId ? 'Edit Payment' : 'Add Payment'}
        </h3>

        <div className="space-y-2">
          {/* Row 1: Finance, Type */}
          <div className="grid grid-cols-2 gap-2">
            <FloatingSelect
              label="Finance"
              value={draft.finance}
              onValueChange={(v) =>
                setDraft((p) => ({ ...p, finance: v as FinanceType }))
              }
              options={financeGroups.map((g) => ({ label: g, value: g }))}
            />
            <FloatingSelect
              label="Type"
              value={draft.type}
              onValueChange={(v) => setDraft((p) => ({ ...p, type: v }))}
              options={paymentTypes.map((t) => ({ label: t, value: t }))}
            />
          </div>

          {/* Row 2: Terms Frequency, Terms Value, Date */}
          <div className="grid grid-cols-4 gap-2">
            <FloatingSelect
              label="Terms"
              value={draft.termFrequency}
              onValueChange={(v) =>
                setDraft((p) => ({ ...p, termFrequency: v, termValue: '' }))
              }
              disabled={isPaymentType}
              options={termFrequencies.map((t) => ({ label: t, value: t }))}
            />

            {isMonthlyTerm ? (
              <FloatingSelect
                label="Months"
                value={draft.termValue}
                onValueChange={(v) => setDraft((p) => ({ ...p, termValue: v }))}
                disabled={isPaymentType}
                options={monthlyTerms.map((t) => ({ label: t, value: t }))}
              />
            ) : (
              <FloatingInput
                label="Value"
                className="w-full"
                value={draft.termValue}
                onChange={(e) => setDraft(p => ({ ...p, termValue: e.target.value }))}
                disabled={isPaymentType || !draft.termFrequency}
              />
            )}

            <FloatingInput 
              label="Date"
              containerClassName="w-full  col-span-2"
              type="date" 
              value={draft.date}
              onChange={(e) => setDraft(p => ({ ...p, date: e.target.value }))} 
            />
          </div>

          {/* Row 3: Account Name */}
          <FloatingInput label="Account Name" value={draft.accountName}
            onChange={(e) => setDraft(p => ({ ...p, accountName: e.target.value }))} />

          {/* Row 4: Qty, Item */}
          <div className="grid grid-cols-4 gap-2">
            <FloatingInput label="Qty" containerClassName="col-span-1" value={draft.qty}
              onChange={(e) => setDraft(p => ({ ...p, qty: e.target.value }))}
              disabled={isPaymentType} />

            <FloatingInput label="Item" containerClassName="col-span-3" value={draft.item}
              onChange={(e) => setDraft(p => ({ ...p, item: e.target.value }))}
              disabled={isPaymentType} />
          </div>

          {/* Row 5: Unit Price, Grand Total */}
          <div className="grid grid-cols-2 gap-2">
            <FloatingNumberInput label="Unit Price" value={draft.unitPrice}
              onChange={(e) => setDraft(p => ({ ...p, unitPrice: e.target.value }))}
              disabled={isPaymentType} />

            <FloatingNumberInput label="Grand Total" value={draft.grandTotal}
              onChange={(e) => setDraft(p => ({ ...p, grandTotal: e.target.value }))}
              disabled={isPaymentType} />
          </div>

          {/* Row 6: Down Payment, Balance */}
          <div className="grid grid-cols-2 gap-2">
            <FloatingNumberInput label="Down Payment" value={draft.down}
              onChange={(e) => setDraft(p => ({ ...p, down: e.target.value }))} />

            <FloatingNumberInput label="Balance" value={draft.balance}
              onChange={(e) => setDraft(p => ({ ...p, balance: e.target.value }))} />
          </div>

          {/* Row 7: CR#, Late Fee, Payment Method */}
          <div className="grid grid-cols-3 gap-2">
            <FloatingInput label="CR#" value={draft.cr}
              onChange={(e) => setDraft(p => ({ ...p, cr: e.target.value }))} />

            <FloatingNumberInput label="Late Fee" value={draft.lateFee}
              onChange={(e) => setDraft(p => ({ ...p, lateFee: e.target.value }))}
              disabled={!isPaymentType} />

            <FloatingSelect
              label="Method"
              value={draft.paymentMethod}
              onValueChange={(v) =>
                setDraft((p) => ({ ...p, paymentMethod: v }))
              }
              options={paymentMethods.map((m) => ({ label: m, value: m }))}
            />
          </div>

          {/* Row 8: Notes */}
          <FloatingInput label="Notes" value={draft.notes}
            onChange={(e) => setDraft(p => ({ ...p, notes: e.target.value }))} />

          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button onClick={onSave}>
              {editingId ? 'Update' : 'Save'}
            </Button>
            <Button variant="outline" onClick={reset}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!editingId}
              onClick={() => editingId && onDelete(editingId)}
            >
              Delete
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}