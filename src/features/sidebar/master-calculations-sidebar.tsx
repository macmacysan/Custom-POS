import * as React from 'react'
import { Radio } from 'lucide-react'
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

/* ============================================================================
   Rich tooltip content — description + amount table
============================================================================= */
function TooltipItemList({ items }: { items: HoverItem[] }) {
  if (items.length === 0) {
    return <p className="text-xs italic opacity-60">No items</p>
  }
  return (
    <div className="w-full">
      <div className="flex items-center justify-between border-b border-current/20 pb-1.5 mb-2 text-[10px] font-semibold uppercase opacity-60">
        <span>Description</span>
        <span>Amount</span>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start justify-between gap-3">
            <span className="text-xs truncate">{item.description}</span>
            <span className="text-xs font-mono tabular-nums text-right shrink-0 opacity-70">
              {formatCurrency(item.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============================================================================
   Sidebar tooltip wrapper
   ─ Uses your existing tooltip.tsx
   ─ Overrides bg-foreground → bg-popover so it renders white, not black
   ─ z-[9999] beats sidebar stacking contexts that swallow side="right"
   ─ avoidCollisions={false} stops Radix flipping it back to "bottom"
============================================================================= */
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
          // tailwind-merge resolves conflicts: these override tooltip.tsx defaults
          'z-[9999]',           // beats any sidebar stacking context
          'bg-popover',         // overrides bg-foreground (the black)
          'text-popover-foreground', // overrides text-background (the white-on-black)
          'border border-border',
          'shadow-md',
          'rounded-sm',         // softer than rounded-none default
          'p-3',
          'max-w-[260px]',
          'inline-block',       // override inline-flex so content fills width
        )}
      >
        <TooltipItemList items={items} />
      </TooltipContent>
    </Tooltip>
  )
}

/* ============================================================================
   Main sidebar
============================================================================= */
export function MasterCalculationsSidebar() {
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
    mobileSidebarOpen,
  } = usePosStore()

  const [deductionsOpen, setDeductionsOpen] = React.useState(false)
  const [denomOpen, setDenomOpen] = React.useState(false)
  const isDarkSidebar = settings.sidebarAlwaysDark
  const totals = calculateMasterTotals(sidebar, expenses, checks, income, payments)

  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={100}>
      <aside
        className={cn(
          `h-full w-75 shrink-0 border-r bg-sidebar flex flex-col ${mobileSidebarOpen ? '' : 'max-md:hidden'}`,
          isDarkSidebar && 'dark text-slate-50 border-slate-800',
        )}
      >
        {/* Header */}
        <div className={cn('shrink-0 bg-sidebar p-3', isDarkSidebar && 'border-slate-800')}>
          <div className="flex items-center gap-2">
            <div className={cn('rounded-md bg-primary/15 p-1.5 text-primary', isDarkSidebar && 'bg-blue-500/20 text-blue-400')}>
              <Radio className="size-4" />
            </div>
            <div className="leading-none">
              <p className={cn('text-xs font-bold tracking-wide', isDarkSidebar && 'text-slate-50')}>
                CASHIER REPORT SYSTEM
              </p>
              <p className={cn('text-[10px] text-muted-foreground', isDarkSidebar && 'text-slate-400')}>
                Nueva Camsur Home Furnishing
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <ScrollArea className="flex-1 min-h-0 px-2 py-2">
          <div className="space-y-3">

            {/* Section 1: Receipts */}
            <div className="space-y-0.5">
              <ReceiptInput
                label="Opening Cash"
                amount={sidebar.openingCash}
                onAmountChange={(v) => updateSidebarField('openingCash', v)}
                hideQty
                isDark={isDarkSidebar}
              />

              <div className={cn('grid grid-cols-[1fr_70px_100px] gap-2 px-2 mt-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground', isDarkSidebar)}>
                <span className={cn('text-blue-500/80 dark:text-blue-400', isDarkSidebar && 'text-blue-300')}>RECEIPT TYPE</span>
                <span className="text-center">QTY</span>
                <span className="text-right">AMOUNT</span>
              </div>

              <ReceiptInput label="Sales Invoice"    qty={sidebar.salesInvoiceQty}   onQtyChange={(v) => updateSidebarField('salesInvoiceQty', v)}   amount={sidebar.salesInvoice}    onAmountChange={(v) => updateSidebarField('salesInvoice', v)}    isDark={isDarkSidebar} />
              <ReceiptInput label="SI - Trading"     qty={sidebar.siTradingQty}       onQtyChange={(v) => updateSidebarField('siTradingQty', v)}       amount={sidebar.siTrading}        onAmountChange={(v) => updateSidebarField('siTrading', v)}        isDark={isDarkSidebar} />
              <ReceiptInput label="Delivery Receipt" qty={sidebar.deliveryReceiptQty} onQtyChange={(v) => updateSidebarField('deliveryReceiptQty', v)} amount={sidebar.deliveryReceipt}  onAmountChange={(v) => updateSidebarField('deliveryReceipt', v)}  isDark={isDarkSidebar} />
              <ReceiptInput label="Bobs Pawnshop"    qty={sidebar.bobsPawnshopQty}    onQtyChange={(v) => updateSidebarField('bobsPawnshopQty', v)}    amount={sidebar.bobsPawnshop}     onAmountChange={(v) => updateSidebarField('bobsPawnshop', v)}     isDark={isDarkSidebar} />

              <div className="pt-1.5">
                <TotalRow label="Subtotal Receipts" value={totals.subtotalReceipts} highlight isDark={isDarkSidebar} />
              </div>
            </div>

            <Separator className="mx-2 w-auto bg-border/60" />

            {/* Section 1.5: Other */}
            <div className="space-y-0.5">
              <StaticRow label="Other Income"    value={totals.otherincome.drawings}     isDark={isDarkSidebar} />
              <StaticRow label="Cash Collection" value={totals.cashcollection.purchases} isDark={isDarkSidebar} hoverItems={totals.paymentsList} />
              <InteractiveRow label="Credit"     value={totals.creditTotals.credit}      onClick={() => setDeductionsOpen(true)} isDark={isDarkSidebar} />
              <div className="pt-1.5">
                <TotalRow label="Total Cash Receipts" value={totals.totalPaidCash} highlight isDark={isDarkSidebar} />
              </div>
            </div>

            {/* Section 2: Outflows */}
            <div className="space-y-0.5">
              <StaticRow label="Cash Expenses"  value={totals.expenseTotals.company}   isDark={isDarkSidebar} hoverItems={totals.cashExpensesList} />
              <StaticRow label="Drawings"        value={totals.expenseTotals.drawings}  isDark={isDarkSidebar} hoverItems={totals.drawingsList} />
              <StaticRow label="Cash Purchases"  value={totals.expenseTotals.purchases} isDark={isDarkSidebar} hoverItems={totals.cashPurchasesList} />
              <InteractiveRow label="Deductions" value={totals.deductionsTotal}         onClick={() => setDeductionsOpen(true)} isDark={isDarkSidebar} hoverItems={totals.deductionsList} />
              <div className="pt-1.5">
                <TotalRow label="Total Paid Out" value={totals.totalPaidOut} highlight isDark={isDarkSidebar} />
              </div>
            </div>

            <Separator className={cn('mx-2 w-auto bg-border/60', isDarkSidebar)} />

            {/* Section 3: Denominations & Checks */}
            <div className="space-y-0.5 pb-2">
              <SectionHeader isDark={isDarkSidebar}>Denomination</SectionHeader>
              <InteractiveRow label="Cash Amount"  value={totals.cashAmount}           onClick={() => setDenomOpen(true)} isDark={isDarkSidebar} hoverItems={totals.cashAmountList} />
              <StaticRow label="Bank Check"         value={totals.checkTotals.check}    isDark={isDarkSidebar} hoverItems={totals.bankCheckList} />
              <StaticRow label="Bank Transfer"      value={totals.checkTotals.transfer} isDark={isDarkSidebar} hoverItems={totals.bankTransferList} />
              <StaticRow label="GCash"              value={totals.checkTotals.gcash}    isDark={isDarkSidebar} hoverItems={totals.gcashList} />
              <StaticRow label="Other E-Wallet"     value={totals.checkTotals.ewallet}  isDark={isDarkSidebar} hoverItems={totals.otherEWalletList} />
              <div className="pt-1.5">
                <TotalRow label="Total Payments" value={totals.totalPayments} highlight isDark={isDarkSidebar} />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className={cn('shrink-0 border-t bg-sidebar/95 backdrop-blur-sm p-2.5 space-y-1.5 z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]', isDarkSidebar && 'border-slate-800')}>
          <TotalRow label="Expected Cash" value={totals.expectedCash} highlight isDark={isDarkSidebar} />
          <MoneyInput label="Cash Remitted" value={sidebar.cashRemitted} onChange={(v) => updateSidebarField('cashRemitted', v)} isDark={isDarkSidebar} />

          <div className={`mt-1.5 rounded-md border px-2 py-1.5 text-[12px] font-bold text-center tracking-wide transition-colors ${
            totals.cashVariance < 0
              ? 'border-red-500/30 bg-red-500/10 text-red-500 dark:text-red-400'
              : totals.cashVariance > 0
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            Cash Variance: {totals.cashVariance === 0 ? 'Balanced' : formatCurrency(totals.cashVariance)}
          </div>
        </div>
      </aside>

      {/* Modals */}
      <Dialog open={deductionsOpen} onOpenChange={setDeductionsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Monthly Deductions</DialogTitle></DialogHeader>
          <div className="space-y-1">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Cash Denomination</DialogTitle></DialogHeader>
          <div className="space-y-1">
            {denominationValues.map((denom) => {
              const qty = sidebar.denominationQuantities[String(denom)] || 0
              const rowTotal = qty * denom
              return (
                <div key={denom} className="flex items-center justify-between gap-4 px-1 py-0.5 group">
                  <span className="text-[12px] font-semibold text-muted-foreground w-12">{denom}</span>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      className="w-full h-8 bg-muted/30 border-transparent focus-visible:ring-0 focus-visible:border-border focus-visible:bg-muted/50 text-center text-xs tabular-nums transition-all"
                      value={qty || ''}
                      onChange={(e) => updateDenomination(String(denom), parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <span className="text-right text-xs tabular-nums font-mono w-20">{formatNumber(rowTotal)}</span>
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

/* ============================================================================
   Helper UI Components
============================================================================= */
function SectionHeader({ children, isDark }: { children: React.ReactNode; isDark?: boolean }) {
  return (
    <div className={cn('mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-blue-500/80 dark:text-blue-400', isDark && 'text-blue-300')}>
      {children}
    </div>
  )
}

function ReceiptInput({ label, qty, onQtyChange, amount, onAmountChange, hideQty, isDark }: {
  label: string; qty?: number; onQtyChange?: (next: number) => void
  amount: number; onAmountChange: (next: number) => void; hideQty?: boolean; isDark?: boolean
}) {
  return (
    <label className={cn('grid grid-cols-[1fr_40px_100px] items-center gap-2 px-2 py-0 group cursor-text', isDark && '')}>
      <span className={cn('text-[11px] font-medium text-muted-foreground group-focus-within:text-foreground transition-colors truncate', isDark)}>
        {label}
      </span>
      <div className="w-full">
        {!hideQty && onQtyChange && (
          <Input
            type="number"
            className={cn('w-full h-6 px-1 bg-muted/40 border-transparent focus-visible:ring-0 focus-visible:border-border/50 focus-visible:bg-muted/70 rounded-[4px] text-center text-xs font-mono tabular-nums transition-all placeholder:text-muted-foreground/30', isDark && 'text-slate-200 placeholder:text-slate-600')}
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
          className={cn('w-full h-6 pl-5 pr-2 bg-muted/40 border-transparent focus-visible:ring-0 focus-visible:border-border/50 focus-visible:bg-muted/70 rounded-[4px] text-right text-xs font-mono tabular-nums transition-all placeholder:text-muted-foreground/30', isDark && 'text-slate-200 placeholder:text-slate-600')}
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
    <label className={cn('flex items-center justify-between gap-2 px-2 py-0 group cursor-text', isDark && '')}>
      <span className={cn('text-[11px] font-medium text-muted-foreground group-focus-within:text-foreground transition-colors truncate', isDark && 'text-slate-400 group-focus-within:text-slate-200')}>
        {label}
      </span>
      <div className="relative w-[100px] shrink-0">
        <Input
          type="text"
          inputMode="decimal"
          className={cn('w-full h-6 pl-5 pr-2 bg-muted/40 border-transparent focus-visible:ring-0 focus-visible:border-border/50 focus-visible:bg-muted/70 rounded-[4px] text-right text-xs font-mono tabular-nums transition-all placeholder:text-muted-foreground/30', isDark && 'text-slate-200 placeholder:text-slate-600')}
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
    <div className={cn('flex items-center justify-between px-2 py-0.5 cursor-default w-full', isDark && '')}>
      <div className="flex items-center gap-1">
        <span className={cn('text-[11px] text-muted-foreground', isDark && 'text-slate-400')}>{label}</span>
        {hasItems && (
          <span className={cn('text-[10px] px-1 rounded bg-muted/50', isDark && 'bg-slate-800 text-slate-500')}>
            {hoverItems.length}
          </span>
        )}
      </div>
      <span className={cn('text-[12px] tabular-nums font-mono text-muted-foreground pr-1', isDark && 'text-slate-400')}>
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
    <button
      onClick={onClick}
      className={cn('flex w-full items-center justify-between px-2 py-0.5 hover:bg-muted/40 rounded-[4px] transition-colors cursor-pointer group', isDark)}
    >
      <div className="flex items-center gap-1">
        <span className={cn('text-[11px] text-muted-foreground group-hover:text-foreground transition-colors', isDark && 'text-slate-400 group-hover:text-slate-200')}>
          {label}
        </span>
        {hasItems && (
          <span className={cn('text-[10px] px-1 rounded bg-muted/50', isDark && 'bg-slate-800 text-slate-500')}>
            {hoverItems.length}
          </span>
        )}
      </div>
      <span className={cn('text-[12px] tabular-nums font-mono font-medium text-foreground pr-1', isDark && 'text-slate-200')}>
        {formatCurrency(value)}
      </span>
    </button>
  )

  if (!hasItems) return row
  return <SidebarTooltip items={hoverItems}>{row}</SidebarTooltip>
}

function TotalRow({ label, value, highlight, isDark }: { label: string; value: number; highlight?: boolean; isDark?: boolean }) {
  return (
    <div className={cn(`flex items-center justify-between px-2 py-1 rounded-[4px] ${highlight ? 'bg-muted/60' : ''}`, isDark && `${highlight ? 'bg-slate-800/80' : ''}`)}>
      <span className={cn(`text-[11px] ${highlight ? 'font-medium text-foreground' : 'text-muted-foreground'}`, isDark && `${highlight ? 'text-slate-100' : 'text-slate-400'}`)}>
        {label}
      </span>
      <span className={cn(`text-[12px] tabular-nums font-mono pr-1 ${highlight ? 'font-bold text-foreground' : 'text-muted-foreground'}`, isDark && `${highlight ? 'text-slate-100' : 'text-slate-400'}`)}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}