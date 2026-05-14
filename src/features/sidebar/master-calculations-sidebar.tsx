import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  if (items.length === 0) return <p className="text-xs italic opacity-60">No items</p>
  return (
    <div className="w-full">
      <div className="flex items-center justify-between border-b border-current/20 pb-1 mb-1.5 text-[9px] font-semibold uppercase opacity-60">
        <span>Description</span>
        <span>Amount</span>
      </div>
      <div className="pr-1 space-y-0.5 overflow-y-auto max-h-44">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start justify-between gap-3">
            <span className="text-[11px] truncate">{item.description}</span>
            <span className="font-mono text-[11px] text-right tabular-nums shrink-0 opacity-70">
              {formatCurrency(item.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SidebarTooltip({ children, items }: { children: React.ReactNode; items: HoverItem[] }) {
  if (!items || items.length === 0) return <>{children}</>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-full">{children}</div>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={8}
        avoidCollisions={false}
        className={cn(
          'z-[9999]',
          'bg-popover',
          'text-popover-foreground',
          'border border-border',
          'shadow-md',
          'rounded-sm',
          'p-2.5',
          'max-w-[240px]',
          'inline-block',
        )}
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
    settings,
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
  const isDarkSidebar = settings.sidebarAlwaysDark
  const totals = calculateMasterTotals(sidebar, expenses, checks, income, payments)

  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={100}>
      <aside
        className={cn(
          'h-full w-64 shrink-0 flex-col border-r bg-sidebar', // w-75 → w-64
          embeddedInSheet ? 'flex min-h-0' : 'hidden lg:flex',
          isDarkSidebar && 'dark border-slate-800 text-slate-50',
        )}
      >
        {/* ── Scrollable body ── */}
        <ScrollArea className="flex-1 min-h-0 p-3">
          <div className="space-y-2">

            {/* Section 1: Receipts */}
            <div className="space-y-px">
              <ReceiptInput
                label="Opening Cash"
                amount={sidebar.openingCash}
                onAmountChange={(v) => updateSidebarField('openingCash', v)}
                hideQty
                isDark={isDarkSidebar}
              />
              {/* Column headers */}
              <div className={cn('grid grid-cols-[1fr_52px_88px] gap-1.5 px-2 mt-1.5 mb-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground')}>
                <span className={cn('text-blue-500/80 dark:text-blue-400', isDarkSidebar && 'text-blue-300')}>Type</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Amount</span>
              </div>
              <ReceiptInput label="Sales Invoice"     qty={sidebar.salesInvoiceQty}     onQtyChange={(v) => updateSidebarField('salesInvoiceQty', v)}     amount={sidebar.salesInvoice}     onAmountChange={(v) => updateSidebarField('salesInvoice', v)}     isDark={isDarkSidebar} />
              <ReceiptInput label="SI - Trading"      qty={sidebar.siTradingQty}         onQtyChange={(v) => updateSidebarField('siTradingQty', v)}         amount={sidebar.siTrading}        onAmountChange={(v) => updateSidebarField('siTrading', v)}        isDark={isDarkSidebar} />
              <ReceiptInput label="Delivery Receipt"  qty={sidebar.deliveryReceiptQty}   onQtyChange={(v) => updateSidebarField('deliveryReceiptQty', v)}   amount={sidebar.deliveryReceipt} onAmountChange={(v) => updateSidebarField('deliveryReceipt', v)} isDark={isDarkSidebar} />
              <ReceiptInput label="Bobs Pawnshop"     qty={sidebar.bobsPawnshopQty}      onQtyChange={(v) => updateSidebarField('bobsPawnshopQty', v)}      amount={sidebar.bobsPawnshop}    onAmountChange={(v) => updateSidebarField('bobsPawnshop', v)}    isDark={isDarkSidebar} />
              <div className="pt-1">
                <TotalRow label="Subtotal Receipts" value={totals.subtotalReceipts} highlight isDark={isDarkSidebar} />
              </div>
            </div>

            <Separator className="w-auto mx-1.5 bg-border/60" />

            {/* Section 1.5: Other */}
            <div className="space-y-px">
              {hasDisplayAmount(totals.otherincome.drawings) && (
                <StaticRow label="Other Income" value={totals.otherincome.drawings} isDark={isDarkSidebar} />
              )}
              {hasDisplayAmount(totals.cashcollection.purchases) && (
                <StaticRow label="Cash Collection" value={totals.cashcollection.purchases} isDark={isDarkSidebar} hoverItems={totals.paymentsList} />
              )}
              {hasDisplayAmount(totals.creditTotals.credit) && (
                <InteractiveRow label="Credit" value={totals.creditTotals.credit} onClick={() => setDeductionsOpen(true)} isDark={isDarkSidebar} />
              )}
              <div className="pt-1">
                <TotalRow label="Total Cash Receipts" value={totals.totalPaidCash} highlight isDark={isDarkSidebar} />
              </div>
            </div>

            {/* Section 2: Outflows */}
            <div className="space-y-px">
              {hasDisplayAmount(totals.expenseTotals.company) && (
                <StaticRow label="Cash Expenses" value={totals.expenseTotals.company} isDark={isDarkSidebar} hoverItems={totals.cashExpensesList} />
              )}
              {hasDisplayAmount(totals.expenseTotals.drawings) && (
                <StaticRow label="Drawings" value={totals.expenseTotals.drawings} isDark={isDarkSidebar} hoverItems={totals.drawingsList} />
              )}
              {hasDisplayAmount(totals.expenseTotals.purchases) && (
                <StaticRow label="Cash Purchases" value={totals.expenseTotals.purchases} isDark={isDarkSidebar} hoverItems={totals.cashPurchasesList} />
              )}
              <InteractiveRow label="Deductions" value={totals.deductionsTotal} onClick={() => setDeductionsOpen(true)} isDark={isDarkSidebar} hoverItems={totals.deductionsList} />
              <div className="pt-1">
                <TotalRow label="Total Paid Out" value={totals.totalPaidOut} highlight isDark={isDarkSidebar} />
              </div>
            </div>

            <Separator className={cn('mx-1.5 w-auto bg-border/60', isDarkSidebar)} />

            {/* Section 3: Denominations & Checks */}
            <div className="pb-1 space-y-px">
              <SectionHeader isDark={isDarkSidebar}>Denomination</SectionHeader>
              <InteractiveRow label="Cash Amount" value={totals.cashAmount} onClick={() => setDenomOpen(true)} isDark={isDarkSidebar} hoverItems={totals.cashAmountList} />
              {hasDisplayAmount(totals.checkTotals.check) && (
                <StaticRow label="Bank Check" value={totals.checkTotals.check} isDark={isDarkSidebar} hoverItems={totals.bankCheckList} />
              )}
              {hasDisplayAmount(totals.checkTotals.transfer) && (
                <StaticRow label="Bank Transfer" value={totals.checkTotals.transfer} isDark={isDarkSidebar} hoverItems={totals.bankTransferList} />
              )}
              {hasDisplayAmount(totals.checkTotals.gcash) && (
                <StaticRow label="GCash" value={totals.checkTotals.gcash} isDark={isDarkSidebar} hoverItems={totals.gcashList} />
              )}
              {hasDisplayAmount(totals.checkTotals.ewallet) && (
                <StaticRow label="Other E-Wallet" value={totals.checkTotals.ewallet} isDark={isDarkSidebar} hoverItems={totals.otherEWalletList} />
              )}
              <div className="pt-1">
                <TotalRow label="Total Payments" value={totals.totalPayments} highlight isDark={isDarkSidebar} />
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* ── Footer ── */}
        <div className={cn(
          'shrink-0 border-t bg-sidebar/95 backdrop-blur-sm px-1.5 py-2 space-y-1 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]',
          isDarkSidebar && 'border-slate-800',
        )}>
          <TotalRow label="Expected Cash" value={totals.expectedCash} highlight isDark={isDarkSidebar} />
          <MoneyInput label="Cash Remitted" value={sidebar.cashRemitted} onChange={(v) => updateSidebarField('cashRemitted', v)} isDark={isDarkSidebar} />
          <div className={cn(
            'mt-1 rounded px-2 py-1 text-[11px] font-bold text-center tracking-wide transition-colors',
            totals.cashVariance < 0
              ? 'border border-red-500/30 bg-red-500/10 text-red-500 dark:text-red-400'
              : totals.cashVariance > 0
                ? 'border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          )}>
            {totals.cashVariance === 0 ? 'Balanced' : `Variance: ${formatCurrency(totals.cashVariance)}`}
          </div>
        </div>
      </aside>

      {/* ── Modals ── */}
      <Dialog open={deductionsOpen} onOpenChange={setDeductionsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Monthly Deductions</DialogTitle></DialogHeader>
          <div className="space-y-0.5">
            {deductionLabels.map((name) => (
              <MoneyInput key={name} label={name} value={sidebar.deductions[name] || 0} onChange={(v) => updateDeduction(name, v)} />
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => deductionLabels.forEach((name) => updateDeduction(name, 0))}>Clear All</Button>
            <Button onClick={() => setDeductionsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={denomOpen} onOpenChange={setDenomOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Cash Denomination</DialogTitle></DialogHeader>
          <div className="space-y-0.5">
            {denominationValues.map((denom) => {
              const qty = sidebar.denominationQuantities[String(denom)] || 0
              const rowTotal = qty * denom
              return (
                <div key={denom} className="flex items-center justify-between gap-3 px-1 py-px group">
                  <span className="text-[11px] font-semibold text-muted-foreground w-10">{denom}</span>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      className="w-full text-xs text-center transition-all border-transparent h-7 bg-muted/30 focus-visible:ring-0 focus-visible:border-border focus-visible:bg-muted/50 tabular-nums"
                      value={qty || ''}
                      onChange={(e) => updateDenomination(String(denom), parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <span className="font-mono text-xs text-right w-18 tabular-nums">{formatNumber(rowTotal)}</span>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => denominationValues.forEach((denom) => updateDenomination(String(denom), 0))}>Clear All</Button>
            <Button onClick={() => setDenomOpen(false)}>Update Cash Amount</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

/* ── Helper components ── */

function SectionHeader({ children, isDark }: { children: React.ReactNode; isDark?: boolean }) {
  return (
    <div className={cn('mb-0.5 px-2 text-[9px] font-bold uppercase tracking-wider text-blue-500/80 dark:text-blue-400', isDark && 'text-blue-300')}>
      {children}
    </div>
  )
}

function ReceiptInput({ label, qty, onQtyChange, amount, onAmountChange, hideQty, isDark }: {
  label: string; qty?: number; onQtyChange?: (next: number) => void
  amount: number; onAmountChange: (next: number) => void; hideQty?: boolean; isDark?: boolean
}) {
  return (
    <label className="grid grid-cols-[1fr_36px_88px] items-center gap-1 px-2 py-0 group cursor-text">
      <span className={cn('text-[10px] font-medium text-muted-foreground group-focus-within:text-foreground transition-colors truncate', isDark && '')}>
        {label}
      </span>
      <div className="w-full">
        {!hideQty && onQtyChange && (
          <Input
            type="number"
            className={cn('w-full h-5 px-1 bg-muted/40 border-transparent focus-visible:ring-0 focus-visible:border-border/50 focus-visible:bg-muted/70 rounded-[3px] text-center text-[10px] font-mono tabular-nums transition-all placeholder:text-muted-foreground/30', isDark && 'text-slate-200 placeholder:text-slate-600')}
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
          className={cn('w-full h-5 pl-4 pr-1.5 bg-muted/40 border-transparent focus-visible:ring-0 focus-visible:border-border/50 focus-visible:bg-muted/70 rounded-[3px] text-right text-[10px] font-mono tabular-nums transition-all placeholder:text-muted-foreground/30', isDark && 'text-slate-200 placeholder:text-slate-600')}
          value={amount || ''}
          placeholder="0.00"
          onChange={(e) => onAmountChange(parseMoney(e.target.value))}
        />
      </div>
    </label>
  )
}

function MoneyInput({ label, value, onChange, isDark }: { label: string; value: number; onChange: (next: number) => void; isDark?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-2 px-2 py-0 group cursor-text">
      <span className={cn('text-[10px] font-medium text-muted-foreground group-focus-within:text-foreground transition-colors truncate', isDark && 'text-slate-400 group-focus-within:text-slate-200')}>
        {label}
      </span>
      <div className="relative w-[88px] shrink-0">
        <Input
          type="text"
          inputMode="decimal"
          className={cn('w-full h-5 pl-4 pr-1.5 bg-muted/40 border-transparent focus-visible:ring-0 focus-visible:border-border/50 focus-visible:bg-muted/70 rounded-[3px] text-right text-[10px] font-mono tabular-nums transition-all placeholder:text-muted-foreground/30', isDark && 'text-slate-200 placeholder:text-slate-600')}
          value={value || ''}
          placeholder="0.00"
          onChange={(e) => onChange(parseMoney(e.target.value))}
        />
      </div>
    </label>
  )
}

function StaticRow({ label, value, isDark, hoverItems }: { label: string; value: number; isDark?: boolean; hoverItems?: HoverItem[] }) {
  const hasItems = hoverItems && hoverItems.length > 0
  const row = (
    <div className="flex items-center justify-between w-full px-2 py-px cursor-default">
      <div className="flex items-center gap-1">
        <span className={cn('text-[10px] text-muted-foreground', isDark && 'text-slate-400')}>{label}</span>
        {hasItems && (
          <span className={cn('text-[9px] px-0.5 rounded bg-muted/50 leading-4', isDark && 'bg-slate-800 text-slate-500')}>
            {hoverItems.length}
          </span>
        )}
      </div>
      <span className={cn('text-[11px] tabular-nums font-mono text-muted-foreground pr-0.5', isDark && 'text-slate-400')}>
        {formatCurrency(value)}
      </span>
    </div>
  )
  if (!hasItems) return row
  return <SidebarTooltip items={hoverItems}>{row}</SidebarTooltip>
}

function InteractiveRow({ label, value, onClick, isDark, hoverItems }: { label: string; value: number; onClick: () => void; isDark?: boolean; hoverItems?: HoverItem[] }) {
  const hasItems = hoverItems && hoverItems.length > 0
  const row = (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        'group h-auto min-h-0 w-full items-center justify-between gap-2 rounded px-2 py-px font-normal hover:bg-muted/40',
        isDark && 'hover:bg-slate-800/60',
      )}
    >
      <div className="flex items-center gap-1">
        <span className={cn('text-[10px] text-muted-foreground group-hover:text-foreground transition-colors', isDark && 'text-slate-400 group-hover:text-slate-200')}>
          {label}
        </span>
        {hasItems && (
          <span className={cn('text-[9px] px-0.5 rounded bg-muted/50 leading-4', isDark && 'bg-slate-800 text-slate-500')}>
            {hoverItems.length}
          </span>
        )}
      </div>
      <span className={cn('text-[11px] tabular-nums font-mono font-medium text-foreground pr-0.5', isDark && 'text-slate-200')}>
        {formatCurrency(value)}
      </span>
    </Button>
  )
  if (!hasItems) return row
  return <SidebarTooltip items={hoverItems}>{row}</SidebarTooltip>
}

function TotalRow({ label, value, highlight, isDark }: { label: string; value: number; highlight?: boolean; isDark?: boolean }) {
  return (
    <div className={cn(
      'flex items-center justify-between px-2 py-0.5 rounded-[3px]',
      highlight && 'bg-muted/60',
      isDark && highlight && 'bg-slate-800/80',
    )}>
      <span className={cn(
        'text-[10px]',
        highlight ? 'font-medium text-foreground' : 'text-muted-foreground',
        isDark && (highlight ? 'text-slate-100' : 'text-slate-400'),
      )}>
        {label}
      </span>
      <span className={cn(
        'text-[11px] tabular-nums font-mono pr-0.5',
        highlight ? 'font-bold text-foreground' : 'text-muted-foreground',
        isDark && (highlight ? 'text-slate-100' : 'text-slate-400'),
      )}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}