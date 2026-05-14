import * as React from 'react'
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

/* -- Tooltip item list -- */
function TooltipItemList({ items }: { items: HoverItem[] }) {
  if (items.length === 0) return <p className="px-2 py-3 text-xs italic opacity-50">No items found</p>
  
  const total = items.reduce((sum, item) => sum + item.amount, 0)
  
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between border-b border-border/50 pb-1.5 px-0.5">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Breakdown</span>
        <span className="text-[9px] font-black px-1.5 rounded bg-primary/10 text-primary uppercase">
          {items.length} {items.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>
      
      <div className="max-h-56 overflow-y-auto pr-1 -mr-1 scrollbar-thin scrollbar-thumb-border">
        <div className="space-y-1">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between gap-4 group/item">
              <span className="text-[11px] font-medium text-foreground/80 group-hover/item:text-foreground transition-colors truncate">
                {item.description}
              </span>
              <span className="font-mono text-[11px] text-right tabular-nums shrink-0 text-foreground/60 group-hover/item:text-foreground transition-colors">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-border/50 flex items-center justify-between px-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Total Amount</span>
        <span className="text-xs font-black tabular-nums text-primary">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

function SidebarTooltip({ children, items, isDark }: { children: React.ReactElement; items: HoverItem[]; isDark?: boolean }) {
  if (!items || items.length === 0) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={12}
        avoidCollisions={true}
        className={cn(
          'z-[9999] w-64 p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-200',
          'bg-popover/95 backdrop-blur-xl rounded-lg border border-border/50 shadow-black/10',
          isDark && 'dark bg-slate-900/95 text-slate-50 border-slate-800 shadow-black/40',
        )}
      >
        <TooltipItemList items={items} />
      </TooltipContent>
    </Tooltip>
  )
}



/* -- Main sidebar -- */
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
          'h-full w-64 shrink-0 flex-col border-r transition-all duration-300',
          'bg-sidebar/70 backdrop-blur-md border-border',
          isDarkSidebar ? 'dark bg-slate-950/90 text-slate-50 border-slate-800' : 'bg-sidebar/50',
          embeddedInSheet ? 'flex min-h-0' : 'hidden lg:flex',
        )}
      >
        {/* Header - Dashboard Title */}
        {!embeddedInSheet && (
          <div className={cn("px-4 py-3 border-b shrink-0", isDarkSidebar && "border-slate-800")}>
            <h2 className="text-sm font-bold tracking-tight uppercase opacity-80">Cashier Summary</h2>
            <p className={cn("text-[10px]", isDarkSidebar ? "text-slate-400" : "text-muted-foreground")}>Daily financial audit</p>
          </div>
        )}

        {/* -- Scrollable body -- */}
        <ScrollArea className="flex-1 min-h-0 px-3 py-4">
          <div className="space-y-6">
            {/* Section 1: Receipts */}
            <div className="space-y-1.5">
              <SectionHeader isDark={isDarkSidebar} color="blue">
                Revenue & Receipts
              </SectionHeader>
              
              <div className="space-y-0.5">
                <ReceiptInput
                  label="Opening Cash"
                  amount={sidebar.openingCash}
                  onAmountChange={(v) => updateSidebarField('openingCash', v)}
                  hideQty
                  isDark={isDarkSidebar}
                />
                
                {/* Column headers */}
                <div className={cn("grid grid-cols-[1fr_40px_88px] gap-1 px-2 pt-2 pb-1 text-[9px] font-bold uppercase tracking-widest", isDarkSidebar ? "text-slate-500" : "text-muted-foreground/50")}>
                  <span>Type</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Amount</span>
                </div>

                <ReceiptInput label="Sales Invoice"     qty={sidebar.salesInvoiceQty}     onQtyChange={(v) => updateSidebarField('salesInvoiceQty', v)}     amount={sidebar.salesInvoice}     onAmountChange={(v) => updateSidebarField('salesInvoice', v)}     isDark={isDarkSidebar} />
                <ReceiptInput label="SI - Trading"      qty={sidebar.siTradingQty}         onQtyChange={(v) => updateSidebarField('siTradingQty', v)}         amount={sidebar.siTrading}        onAmountChange={(v) => updateSidebarField('siTrading', v)}        isDark={isDarkSidebar} />
                <ReceiptInput label="Delivery Receipt"  qty={sidebar.deliveryReceiptQty}   onQtyChange={(v) => updateSidebarField('deliveryReceiptQty', v)}   amount={sidebar.deliveryReceipt} onAmountChange={(v) => updateSidebarField('deliveryReceipt', v)} isDark={isDarkSidebar} />
                <ReceiptInput label="Bobs Pawnshop"     qty={sidebar.bobsPawnshopQty}      onQtyChange={(v) => updateSidebarField('bobsPawnshopQty', v)}      amount={sidebar.bobsPawnshop}    onAmountChange={(v) => updateSidebarField('bobsPawnshop', v)}    isDark={isDarkSidebar} />
              </div>

              <div className="pt-2">
                <TotalRow label="Subtotal Receipts" value={totals.subtotalReceipts} isDark={isDarkSidebar} color="blue" />
              </div>
            </div>

            {/* Section 1.5: Other Collections */}
            <div className="space-y-1.5">
              <SectionHeader isDark={isDarkSidebar} color="indigo">
                Additional Funds
              </SectionHeader>
              
              <div className="space-y-0.5">
                {hasDisplayAmount(totals.otherincome.drawings) && (
                  <StaticRow label="Other Income" value={totals.otherincome.drawings} isDark={isDarkSidebar} />
                )}
                <StaticRow label="Cash Collection" value={totals.cashcollection.purchases} isDark={isDarkSidebar} hoverItems={totals.paymentsList} />
                <InteractiveRow label="Credit / Accounts" value={totals.creditTotals.credit} onClick={() => setDeductionsOpen(true)} isDark={isDarkSidebar} />
              </div>

              <div className="pt-2">
                <TotalRow label="Total Cash Receipts" value={totals.totalPaidCash} isDark={isDarkSidebar} color="indigo" />
              </div>
            </div>

            {/* Section 2: Outflows */}
            <div className="space-y-1.5">
              <SectionHeader isDark={isDarkSidebar} color="amber">
                Cash Outflows
              </SectionHeader>
              
              <div className="space-y-0.5">
                <StaticRow label="Cash Expenses" value={totals.expenseTotals.company} isDark={isDarkSidebar} hoverItems={totals.cashExpensesList} />
                <StaticRow label="Drawings" value={totals.expenseTotals.drawings} isDark={isDarkSidebar} hoverItems={totals.drawingsList} />
                <StaticRow label="Cash Purchases" value={totals.expenseTotals.purchases} isDark={isDarkSidebar} hoverItems={totals.cashPurchasesList} />
                <InteractiveRow label="Monthly Deductions" value={totals.deductionsTotal} onClick={() => setDeductionsOpen(true)} isDark={isDarkSidebar} hoverItems={totals.deductionsList} />
              </div>

              <div className="pt-2">
                <TotalRow label="Total Paid Out" value={totals.totalPaidOut} isDark={isDarkSidebar} color="amber" />
              </div>
            </div>

            {/* Section 3: Remittance Details */}
            <div className="space-y-1.5 pb-4">
              <SectionHeader isDark={isDarkSidebar} color="emerald">
                Payments & Assets
              </SectionHeader>
              
              <div className="space-y-0.5">
                <InteractiveRow label="Cash on Hand" value={totals.cashAmount} onClick={() => setDenomOpen(true)} isDark={isDarkSidebar} hoverItems={totals.cashAmountList} />
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
              </div>

              <div className="pt-2">
                <TotalRow label="Grand Total Payments" value={totals.totalPayments} isDark={isDarkSidebar} color="emerald" />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* -- Footer -- */}
        <div className={cn(
          'shrink-0 border-t bg-sidebar/95 backdrop-blur-md px-3 py-4 space-y-3 z-10 shadow-[0_-8px_20px_rgba(0,0,0,0.04)]',
          isDarkSidebar && 'border-slate-800 bg-slate-900/90',
        )}>
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className={cn("text-[10px] font-semibold uppercase tracking-wider", isDarkSidebar ? "text-slate-400" : "text-muted-foreground")}>Expected Cash</span>
              <span className="text-sm font-bold font-mono tabular-nums">{formatCurrency(totals.expectedCash)}</span>
            </div>
            <MoneyInput label="Cash Remitted" value={sidebar.cashRemitted} onChange={(v) => updateSidebarField('cashRemitted', v)} isDark={isDarkSidebar} />
          </div>

          <div className={cn(
            'rounded-md px-3 py-2 text-center transition-all duration-300 shadow-sm border',
            isDarkSidebar ? 'border-transparent' : 'border',
            totals.cashVariance < 0
              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
              : totals.cashVariance > 0
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
          )}>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-70 mb-0.5">
              {totals.cashVariance === 0 ? 'Cash Audit' : 'Variance Detection'}
            </p>
            <p className="text-sm font-black tabular-nums tracking-tight">
              {totals.cashVariance === 0 ? 'BALANCED' : formatCurrency(totals.cashVariance)}
            </p>
          </div>
        </div>
      </aside>

      {/* -- Modals -- */}
      <Dialog open={deductionsOpen} onOpenChange={setDeductionsOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Monthly Deductions</DialogTitle></DialogHeader>
          <div className="py-2 space-y-1">
            {deductionLabels.map((name) => (
              <MoneyInput key={name} label={name} value={sidebar.deductions[name] || 0} onChange={(v) => updateDeduction(name, v)} isDark={isDarkSidebar} />
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => deductionLabels.forEach((name) => updateDeduction(name, 0))} className="text-xs text-muted-foreground hover:text-destructive">
              Clear All
            </Button>
            <Button size="sm" onClick={() => setDeductionsOpen(false)} className="text-xs">Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={denomOpen} onOpenChange={setDenomOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Cash Denomination</DialogTitle></DialogHeader>
          <div className="py-2 space-y-1">
            {denominationValues.map((denom) => {
              const qty = sidebar.denominationQuantities[String(denom)] || 0
              const rowTotal = qty * denom
              return (
                <div key={denom} className={cn("flex items-center justify-between gap-3 px-2 py-1 transition-colors rounded-md group", isDarkSidebar ? "hover:bg-slate-800" : "hover:bg-muted/30")}>
                  <span className={cn("text-[11px] font-bold w-10", isDarkSidebar ? "text-slate-400" : "text-muted-foreground")}>{denom}</span>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      className={cn("w-full text-xs text-center transition-all border-transparent h-7 focus-visible:ring-0 focus-visible:border-primary/30 tabular-nums", isDarkSidebar ? "bg-slate-800 focus-visible:bg-slate-950" : "bg-muted/50 focus-visible:bg-background")}
                      value={qty || ''}
                      onChange={(e) => updateDenomination(String(denom), parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <span className="font-mono text-xs font-medium text-right w-20 tabular-nums">{formatNumber(rowTotal)}</span>
                </div>
              )
            })}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => denominationValues.forEach((denom) => updateDenomination(String(denom), 0))} className="text-xs text-muted-foreground hover:text-destructive">
              Clear All
            </Button>
            <Button size="sm" onClick={() => setDenomOpen(false)} className="text-xs font-semibold">Update Cash Amount</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

/* -- Helper components -- */

function SectionHeader({ children, isDark, color = 'blue' }: { children: React.ReactNode; isDark?: boolean; color?: 'blue' | 'indigo' | 'amber' | 'emerald' }) {
  const colorMap = {
    blue: 'text-blue-600 dark:text-blue-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    amber: 'text-amber-600 dark:text-amber-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
  }
  return (
    <div className={cn(
      'px-2 text-[10px] font-bold uppercase tracking-[0.15em]',
      colorMap[color],
      isDark && 'opacity-90'
    )}>
      {children}
    </div>
  )
}

function ReceiptInput({ label, qty, onQtyChange, amount, onAmountChange, hideQty, isDark }: {
  label: string; qty?: number; onQtyChange?: (next: number) => void
  amount: number; onAmountChange: (next: number) => void; hideQty?: boolean; isDark?: boolean
}) {
  return (
    <label className={cn("grid grid-cols-[1fr_36px_88px] items-center gap-1.5 px-2 py-0.5 group cursor-text transition-all rounded border-l-2 border-l-transparent hover:border-l-primary/40", isDark ? "hover:bg-slate-800/40" : "hover:bg-muted/30")}>
      <span className={cn('text-[11px] font-medium text-muted-foreground group-focus-within:text-foreground transition-colors truncate', isDark && 'text-slate-400 group-focus-within:text-slate-200')}>
        {label}
      </span>
      <div className="w-full">
        {!hideQty && onQtyChange && (
          <Input
            type="number"
            className={cn('w-full h-5 px-1 bg-muted/40 border-transparent focus-visible:ring-0 focus-visible:border-border/30 focus-visible:bg-background rounded-[3px] text-center text-[10px] font-mono tabular-nums transition-all placeholder:text-muted-foreground/30', isDark && 'text-slate-200 bg-slate-800/60')}
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
          className={cn('w-full h-5 pl-3 pr-1 bg-muted/40 border-transparent focus-visible:ring-0 focus-visible:border-border/30 focus-visible:bg-background rounded-[3px] text-right text-[10px] font-mono tabular-nums transition-all placeholder:text-muted-foreground/30', isDark && 'text-slate-200 bg-slate-800/60')}
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
    <label className={cn("flex items-center justify-between gap-3 px-2 py-1 group cursor-text transition-all rounded border-l-2 border-l-transparent hover:border-l-primary/40", isDark ? "hover:bg-slate-800/40" : "hover:bg-muted/30")}>
      <span className={cn('text-[11px] font-medium text-muted-foreground group-focus-within:text-foreground transition-colors truncate', isDark && 'text-slate-400 group-focus-within:text-slate-200')}>
        {label}
      </span>
      <div className="relative w-[88px] shrink-0">
        <Input
          type="text"
          inputMode="decimal"
          className={cn('w-full h-6 pl-3 pr-1.5 bg-muted/40 border border-transparent focus-visible:ring-0 focus-visible:border-primary/30 focus-visible:bg-background rounded-md text-right text-xs font-mono tabular-nums transition-all', isDark && 'text-slate-200 bg-slate-800/60')}
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
    <div className={cn("flex items-center justify-between w-full px-2 py-1 transition-all rounded group cursor-default border-l-2 border-l-transparent hover:border-l-primary/40", isDark ? "hover:bg-slate-800/40" : "hover:bg-muted/30")}>
      <div className="flex items-center gap-1.5">
        <span className={cn('text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-foreground', isDark && 'text-slate-400 group-hover:text-slate-200')}>{label}</span>
        {hasItems && (
          <span className={cn('text-[9px] font-bold px-1 rounded-full bg-muted/60 text-muted-foreground/70 group-hover:bg-primary/10 group-hover:text-primary transition-colors', isDark && 'bg-slate-800 text-slate-500')}>
            {hoverItems.length}
          </span>
        )}
      </div>
      <span className={cn('text-[11px] tabular-nums font-mono text-muted-foreground/80 pr-0.5 group-hover:text-foreground transition-colors', isDark && 'text-slate-400')}>
        {formatCurrency(value)}
      </span>
    </div>
  )
  if (!hasItems) return row
  return <SidebarTooltip items={hoverItems} isDark={isDark}>{row}</SidebarTooltip>
}

function InteractiveRow({ label, value, onClick, isDark, hoverItems }: { label: string; value: number; onClick: () => void; isDark?: boolean; hoverItems?: HoverItem[] }) {
  const hasItems = hoverItems && hoverItems.length > 0
  const row = (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        'group h-auto min-h-0 w-full items-center justify-between gap-2 rounded px-2 py-1 font-normal transition-all hover:bg-muted/40 hover:text-foreground border-l-2 border-l-transparent hover:border-l-primary/60 shadow-none',
        isDark && 'hover:bg-slate-800/80',
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn('text-[11px] font-medium text-muted-foreground group-hover:text-primary transition-colors', isDark && 'text-slate-400 group-hover:text-slate-200')}>
          {label}
        </span>
        {hasItems && (
          <span className={cn('text-[9px] font-bold px-1 rounded-full bg-muted/60 text-muted-foreground/70 group-hover:bg-primary/20 group-hover:text-primary transition-colors', isDark && 'bg-slate-800 text-slate-500')}>
            {hoverItems.length}
          </span>
        )}
      </div>
      <span className={cn('text-[11px] tabular-nums font-mono font-semibold text-foreground/90 group-hover:text-primary pr-0.5 transition-colors', isDark && 'text-slate-200')}>
        {formatCurrency(value)}
      </span>
    </Button>
  )
  if (!hasItems) return row
  return <SidebarTooltip items={hoverItems}>{row}</SidebarTooltip>
}

function TotalRow({ label, value, isDark, color = 'blue' }: { label: string; value: number; isDark?: boolean; color?: 'blue' | 'indigo' | 'amber' | 'emerald' }) {
  const colorMap = {
    blue: 'bg-blue-500/5 text-blue-700 dark:text-blue-400 dark:bg-blue-500/10',
    indigo: 'bg-indigo-500/5 text-indigo-700 dark:text-indigo-400 dark:bg-indigo-500/10',
    amber: 'bg-amber-500/5 text-amber-700 dark:text-amber-400 dark:bg-amber-500/10',
    emerald: 'bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/10',
  }
  return (
    <div className={cn(
      'flex items-center justify-between px-2.5 py-1.5 rounded-md transition-all',
      colorMap[color],
      isDark && 'border border-white/5'
    )}>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
        {label}
      </span>
      <span className="text-xs font-black tabular-nums font-mono pr-0.5">
        {formatCurrency(value)}
      </span>
    </div>
  )
}