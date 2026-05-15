import * as React from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { deductionLabels, denominationValues } from '@/state/seed'
import { usePosStore } from '@/state/pos-store'
import { formatCurrency, formatNumber, parseMoney } from '@/lib/money'
import { calculateMasterTotals } from '@/features/sidebar/calculations'
import { cn } from '@/lib/utils'

type HoverItem = { description: string; amount: number }

function hasDisplayAmount(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/* ── Tooltip item list ── */
function TooltipItemList({ items }: { items: HoverItem[] }) {
  if (items.length === 0) return (
    <p className="px-2 py-3 text-xs italic text-muted-foreground">No items found</p>
  )

  const total = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="w-full space-y-2 border border-border">
      <div className="flex items-center justify-between pb-1.5 border-b">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Breakdown
        </span>
        <span className="text-[10px] font-medium px-1.5 rounded-md bg-secondary text-secondary-foreground">
          {items.length} {items.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      <div className="pr-1 overflow-y-auto max-h-56">
        <div className="space-y-1">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between gap-4">
              <span className="text-xs truncate text-popover-foreground/80">
                {item.description}
              </span>
              <span className="font-mono text-xs text-right tabular-nums text-popover-foreground/80 shrink-0">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t px-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Total Amount
        </span>
        <span className="text-xs font-bold tabular-nums text-popover-foreground">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  )
}

function SidebarTooltip({ children, items }: { children: React.ReactElement; items: HoverItem[] }) {
  if (!items || items.length === 0) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={12}
        avoidCollisions
        className="z-[9999] w-64 p-3 bg-popover text-popover-foreground border shadow-md rounded-md"
      >
        <TooltipItemList items={items} />
      </TooltipContent>
    </Tooltip>
  )
}

/* ── Main sidebar ── */
export function MasterCalculationsSidebar({ embeddedInSheet = false }: { embeddedInSheet?: boolean }) {
  const {
    sidebar,
    updateSidebarField,
    updateDeduction,
    updateDenomination,
    expenses,
    checks,
    income,
    payments,
  } = usePosStore()

  const [deductionsOpen, setDeductionsOpen] = React.useState(false)
  const [denomOpen, setDenomOpen] = React.useState(false)
  const totals = calculateMasterTotals(sidebar, expenses, checks, income, payments)

  // Optional receipt rows — auto-show if they already have data
  const [showSiTrading, setShowSiTrading] = React.useState(
    () => (sidebar.siTradingQty ?? 0) > 0 || (sidebar.siTrading ?? 0) > 0
  )
  const [showDeliveryReceipt, setShowDeliveryReceipt] = React.useState(
    () => (sidebar.deliveryReceiptQty ?? 0) > 0 || (sidebar.deliveryReceipt ?? 0) > 0
  )
  const [showBobsPawnshop, setShowBobsPawnshop] = React.useState(
    () => (sidebar.bobsPawnshopQty ?? 0) > 0 || (sidebar.bobsPawnshop ?? 0) > 0
  )

  function toggleRow(
    show: boolean,
    setter: (v: boolean) => void,
    qtyField: Parameters<typeof updateSidebarField>[0] | null,
    amtField: Parameters<typeof updateSidebarField>[0],
  ) {
    if (!show) {
      // clearing values when hiding
      if (qtyField) updateSidebarField(qtyField, 0)
      updateSidebarField(amtField, 0)
    }
    setter(!show)
  }

  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={100}>
      <aside
        className={cn(
          'flex-col w-64 h-full shrink-0 border-r bg-background transition-all duration-300',
          embeddedInSheet ? 'flex min-h-0' : 'hidden lg:flex',
        )}
      >
        {/* Header */}
        {!embeddedInSheet && (
          <div className="px-4 py-3 border-b shrink-0 bg-muted/30">
            <h2 className="text-sm font-semibold tracking-tight">Cashier Summary</h2>
            <p className="text-[11px] text-muted-foreground">Daily financial audit</p>
          </div>
        )}

        {/* Scrollable body */}
        <ScrollArea className="flex-1 min-h-0 px-2 py-3">
          <div className="space-y-6">

            {/* Section 1: Revenue & Receipts */}
            <div className="space-y-1">
              <SectionHeader>Revenue & Receipts</SectionHeader>

              <div className="space-y-0.5">
                <ReceiptInput
                  label="Opening Cash"
                  amount={sidebar.openingCash}
                  onAmountChange={(v) => updateSidebarField('openingCash', v)}
                  hideQty
                />

                <div className="grid grid-cols-[1fr_32px_80px] gap-1 px-2 pt-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span>Type</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Amount</span>
                </div>

                <ReceiptInput label="Sales Invoice" qty={sidebar.salesInvoiceQty} onQtyChange={(v) => updateSidebarField('salesInvoiceQty', v)} amount={sidebar.salesInvoice} onAmountChange={(v) => updateSidebarField('salesInvoice', v)} />

                {/* Optional row toggle buttons */}
                {(!showSiTrading || !showDeliveryReceipt || !showBobsPawnshop) && (
                  <div className="flex flex-wrap gap-1 px-2 pt-1.5">
                    {!showSiTrading && (
                      <button
                        type="button"
                        onClick={() => toggleRow(showSiTrading, setShowSiTrading, 'siTradingQty', 'siTrading')}
                        className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        <Plus className="size-2.5" />SI - Trading
                      </button>
                    )}
                    {!showDeliveryReceipt && (
                      <button
                        type="button"
                        onClick={() => toggleRow(showDeliveryReceipt, setShowDeliveryReceipt, 'deliveryReceiptQty', 'deliveryReceipt')}
                        className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        <Plus className="size-2.5" />Delivery Receipt
                      </button>
                    )}
                    {!showBobsPawnshop && (
                      <button
                        type="button"
                        onClick={() => toggleRow(showBobsPawnshop, setShowBobsPawnshop, 'bobsPawnshopQty', 'bobsPawnshop')}
                        className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                      >
                        <Plus className="size-2.5" />Bobs Pawnshop
                      </button>
                    )}
                  </div>
                )}

                {showSiTrading && (
                  <ReceiptInput
                    label="SI - Trading"
                    qty={sidebar.siTradingQty}
                    onQtyChange={(v) => updateSidebarField('siTradingQty', v)}
                    amount={sidebar.siTrading}
                    onAmountChange={(v) => updateSidebarField('siTrading', v)}
                    onRemove={() => toggleRow(showSiTrading, setShowSiTrading, 'siTradingQty', 'siTrading')}
                  />
                )}
                {showDeliveryReceipt && (
                  <ReceiptInput
                    label="Delivery Receipt"
                    qty={sidebar.deliveryReceiptQty}
                    onQtyChange={(v) => updateSidebarField('deliveryReceiptQty', v)}
                    amount={sidebar.deliveryReceipt}
                    onAmountChange={(v) => updateSidebarField('deliveryReceipt', v)}
                    onRemove={() => toggleRow(showDeliveryReceipt, setShowDeliveryReceipt, 'deliveryReceiptQty', 'deliveryReceipt')}
                  />
                )}
                {showBobsPawnshop && (
                  <ReceiptInput
                    label="Bobs Pawnshop"
                    qty={sidebar.bobsPawnshopQty}
                    onQtyChange={(v) => updateSidebarField('bobsPawnshopQty', v)}
                    amount={sidebar.bobsPawnshop}
                    onAmountChange={(v) => updateSidebarField('bobsPawnshop', v)}
                    onRemove={() => toggleRow(showBobsPawnshop, setShowBobsPawnshop, 'bobsPawnshopQty', 'bobsPawnshop')}
                  />
                )}
              </div>

              <div className="pt-1.5">
                <TotalRow label="Subtotal Receipts" value={totals.subtotalReceipts} />
              </div>
            </div>

            {/* Section 2: Additional Funds */}
            <div className="space-y-1">
              <SectionHeader>Additional Funds</SectionHeader>

              <div className="space-y-0.5">
                {hasDisplayAmount(totals.otherincome.drawings) && (
                  <StaticRow label="Other Income" value={totals.otherincome.drawings} />
                )}
                <StaticRow label="Cash Collection" value={totals.cashcollection.purchases} hoverItems={totals.paymentsList} />
                <InteractiveRow label="Credit / Accounts" value={totals.creditTotals.credit} onClick={() => setDeductionsOpen(true)} />
              </div>

              <div className="pt-1.5">
                <TotalRow label="Total Cash Receipts" value={totals.totalPaidCash} />
              </div>
            </div>

            {/* Section 3: Cash Outflows */}
            <div className="space-y-1">
              <SectionHeader>Cash Outflows</SectionHeader>

              <div className="space-y-0.5">
                {hasDisplayAmount(totals.expenseTotals.company)   && <StaticRow label="Cash Expenses"  value={totals.expenseTotals.company}   hoverItems={totals.cashExpensesList} />}
                {hasDisplayAmount(totals.expenseTotals.drawings)  && <StaticRow label="Drawings"        value={totals.expenseTotals.drawings}  hoverItems={totals.drawingsList} />}
                {hasDisplayAmount(totals.expenseTotals.purchases) && <StaticRow label="Cash Purchases"  value={totals.expenseTotals.purchases} hoverItems={totals.cashPurchasesList} />}
                <InteractiveRow label="Monthly Deductions" value={totals.deductionsTotal} onClick={() => setDeductionsOpen(true)} hoverItems={totals.deductionsList} />
              </div>

              <div className="pt-1.5">
                <TotalRow label="Total Paid Out" value={totals.totalPaidOut} />
              </div>
            </div>

            {/* Section 4: Payments & Assets */}
            <div className="pb-4 space-y-1">
              <SectionHeader>Payments & Assets</SectionHeader>

              <div className="space-y-0.5">
                <InteractiveRow label="Cash on Hand" value={totals.cashAmount} onClick={() => setDenomOpen(true)} hoverItems={totals.cashAmountList} />
                {hasDisplayAmount(totals.checkTotals.check) && <StaticRow label="Bank Check" value={totals.checkTotals.check} hoverItems={totals.bankCheckList} />}
                {hasDisplayAmount(totals.checkTotals.transfer) && <StaticRow label="Bank Transfer" value={totals.checkTotals.transfer} hoverItems={totals.bankTransferList} />}
                {hasDisplayAmount(totals.checkTotals.gcash) && <StaticRow label="GCash" value={totals.checkTotals.gcash} hoverItems={totals.gcashList} />}
                {hasDisplayAmount(totals.checkTotals.ewallet) && <StaticRow label="Other E-Wallet" value={totals.checkTotals.ewallet} hoverItems={totals.otherEWalletList} />}
              </div>

              <div className="pt-1.5">
                <TotalRow label="Grand Total Payments" value={totals.totalPayments} />
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 space-y-3 border-t shrink-0 bg-muted/10">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium text-muted-foreground">Expected Cash</span>
              <span className="font-mono text-sm font-semibold tabular-nums">{formatCurrency(totals.expectedCash)}</span>
            </div>
            <MoneyInput
              label="Cash Remitted"
              value={sidebar.cashRemitted}
              onChange={(v) => updateSidebarField('cashRemitted', v)}
            />
          </div>

          <div className={cn(
            'rounded-lg px-3 py-2.5 text-center transition-colors border',
            totals.cashVariance < 0
              ? 'bg-destructive/10 text-destructive border-destructive/20'
              : totals.cashVariance > 0
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-primary/10 text-primary border-primary/20',
          )}>
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80 mb-0.5">
              {totals.cashVariance === 0 ? 'Cash Audit' : 'Variance Detection'}
            </p>
            <p className="text-sm font-bold tracking-tight tabular-nums">
              {totals.cashVariance === 0 ? 'BALANCED' : formatCurrency(totals.cashVariance)}
            </p>
          </div>
        </div>
      </aside>

      {/* ── Deductions modal ── */}
      <Dialog open={deductionsOpen} onOpenChange={setDeductionsOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="text-base">Monthly Deductions</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-1.5">
            {deductionLabels.map((name) => (
              <MoneyInput
                key={name}
                label={name}
                value={sidebar.deductions[name] || 0}
                onChange={(v) => updateDeduction(name, v)}
              />
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deductionLabels.forEach((name) => updateDeduction(name, 0))}
              className="text-xs"
            >
              Clear All
            </Button>
            <Button size="sm" onClick={() => setDeductionsOpen(false)} className="text-xs">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Denomination modal ── */}
      <Dialog open={denomOpen} onOpenChange={setDenomOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="text-base">Cash Denomination</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-1">
            {denominationValues.map((denom) => {
              const qty = sidebar.denominationQuantities[String(denom)] || 0
              const rowTotal = qty * denom
              return (
                <div
                  key={denom}
                  className="flex items-center justify-between gap-3 px-2 py-1.5 transition-colors rounded-md hover:bg-muted/50"
                >
                  <span className="w-10 text-xs font-medium text-muted-foreground">{denom}</span>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      className="w-full h-8 text-xs text-center tabular-nums bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={qty || ''}
                      onChange={(e) => updateDenomination(String(denom), parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <span className="w-20 font-mono text-xs font-medium text-right tabular-nums">
                    {formatNumber(rowTotal)}
                  </span>
                </div>
              )
            })}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => denominationValues.forEach((denom) => updateDenomination(String(denom), 0))}
              className="text-xs"
            >
              Clear All
            </Button>
            <Button size="sm" onClick={() => setDenomOpen(false)} className="text-xs">
              Confirm Cash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

/* ── Helper components ── */

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 pb-1 text-[11px] font-semibold text-muted-foreground tracking-tight">
      {children}
    </div>
  )
}

function ReceiptInput({
  label, qty, onQtyChange, amount, onAmountChange, hideQty, onRemove,
}: {
  label: string
  qty?: number
  onQtyChange?: (next: number) => void
  amount: number
  onAmountChange: (next: number) => void
  hideQty?: boolean
  onRemove?: () => void
}) {
  return (
    <label className="grid grid-cols-[1fr_32px_80px] items-center gap-1.5 px-2 py-1 rounded-md transition-colors hover:bg-muted/50 cursor-text focus-within:bg-muted/50">
      <span className="flex items-center gap-1 min-w-0">
        <span className="text-[11px] font-medium text-foreground/80 truncate">{label}</span>
        {onRemove && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onRemove() }}
            className="shrink-0 rounded-full p-0.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label={`Remove ${label}`}
          >
            <X className="size-2.5" />
          </button>
        )}
      </span>
      <div className="w-full">
        {!hideQty && onQtyChange && (
          <Input
            type="number"
            className="w-full h-6 px-1 text-center text-[11px] font-mono tabular-nums bg-transparent border-transparent hover:border-input focus-visible:bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            value={qty || ''}
            placeholder="-"
            onChange={(e) => onQtyChange(parseInt(e.target.value) || 0)}
          />
        )}
      </div>
      <div className="relative w-full">
        <Input
          type="text"
          inputMode="decimal"
          className="w-full h-6 px-2 text-right text-[11px] font-mono tabular-nums bg-transparent border-transparent hover:border-input focus-visible:bg-background"
          value={amount || ''}
          placeholder="0.00"
          onChange={(e) => onAmountChange(parseMoney(e.target.value))}
        />
      </div>
    </label>
  )
}

function MoneyInput({
  label, value, onChange,
}: {
  label: string
  value: number
  onChange: (next: number) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-muted/50 cursor-text focus-within:bg-muted/50">
      <span className="text-xs font-medium truncate text-foreground/80">
        {label}
      </span>
      <div className="relative w-24 shrink-0">
        <Input
          type="text"
          inputMode="decimal"
          className="w-full px-2 font-mono text-xs text-right bg-transparent h-7 tabular-nums border-input focus-visible:bg-background"
          value={value || ''}
          placeholder="0.00"
          onChange={(e) => onChange(parseMoney(e.target.value))}
        />
      </div>
    </label>
  )
}

function StaticRow({
  label, value, hoverItems,
}: {
  label: string
  value: number
  hoverItems?: HoverItem[]
}) {
  const hasItems = hoverItems && hoverItems.length > 0
  const row = (
    <div className="flex items-center justify-between w-full px-2 py-1 transition-colors rounded-md cursor-default hover:bg-muted/40">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-foreground/80">
          {label}
        </span>
        {hasItems && (
          <span className="text-[9px] font-medium px-1.5 rounded-full bg-secondary text-secondary-foreground">
            {hoverItems.length}
          </span>
        )}
      </div>
      <span className="text-[11px] font-mono tabular-nums text-foreground/90">
        {formatCurrency(value)}
      </span>
    </div>
  )
  if (!hasItems) return row
  return <SidebarTooltip items={hoverItems}>{row}</SidebarTooltip>
}

function InteractiveRow({
  label, value, onClick, hoverItems,
}: {
  label: string
  value: number
  onClick: () => void
  hoverItems?: HoverItem[]
}) {
  const hasItems = hoverItems && hoverItems.length > 0
  const row = (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="flex items-center justify-between w-full h-auto min-h-0 px-2 py-1 font-normal rounded-md hover:bg-accent hover:text-accent-foreground"
    >
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium">
          {label}
        </span>
        {hasItems && (
          <span className="text-[9px] font-medium px-1.5 rounded-full bg-primary/10 text-primary">
            {hoverItems.length}
          </span>
        )}
      </div>
      <span className="text-[11px] font-mono font-medium tabular-nums">
        {formatCurrency(value)}
      </span>
    </Button>
  )
  if (!hasItems) return row
  return <SidebarTooltip items={hoverItems}>{row}</SidebarTooltip>
}

function TotalRow({
  label, value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-secondary/50 text-secondary-foreground">
      <span className="text-[11px] font-semibold">{label}</span>
      <span className="text-[11px] font-bold font-mono tabular-nums">{formatCurrency(value)}</span>
    </div>
  )
}