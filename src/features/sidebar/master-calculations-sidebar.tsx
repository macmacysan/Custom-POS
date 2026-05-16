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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Settings2 } from 'lucide-react'
import { deductionLabels, denominationValues } from '@/state/seed'
import { usePosStore } from '@/state/pos-store'
import { formatCurrency, formatNumber, parseMoney } from '@/lib/money'
import { calculateMasterTotals } from '@/features/sidebar/calculations'
import { cn } from '@/lib/utils'

type HoverItem = { description: string; amount: number }

type ReceiptField = 'salesInvoice' | 'siTrading' | 'deliveryReceipt' | 'bobsPawnshop'

function hasDisplayAmount(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/* ── Tooltip item list ── */
function TooltipItemList({ items }: { items: HoverItem[] }) {
  if (items.length === 0) return (
    <p className="px-2 py-1.5 text-[10px] italic text-muted-foreground">No items found</p>
  )

  const total = items.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between pb-1 border-b">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Breakdown
        </span>
        <span className="text-[9px] font-medium px-1 rounded bg-secondary text-secondary-foreground">
          {items.length} {items.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      <div className="pr-0.5 overflow-y-auto max-h-48">
        <div className="space-y-0.5">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between gap-3">
              <span className="text-[11px] truncate text-popover-foreground/80">
                {item.description}
              </span>
              <span className="font-mono text-[11px] text-right tabular-nums text-popover-foreground/80 shrink-0">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t px-0.5">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Total Amount
        </span>
        <span className="text-[11px] font-bold tabular-nums text-popover-foreground">
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
        sideOffset={8}
        avoidCollisions
        className="z-[9999] w-60 p-2 bg-popover text-popover-foreground border shadow-md rounded-md"
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

  const [visibleReceipts, setVisibleReceipts] = React.useState<Record<ReceiptField, boolean>>({
    salesInvoice: false,
    siTrading: false,
    deliveryReceipt: false,
    bobsPawnshop: false,
  })

  const totals = calculateMasterTotals(sidebar, expenses, checks, income, payments)

  const toggleReceiptVisibility = (field: ReceiptField) => {
    setVisibleReceipts(prev => ({ ...prev, [field]: !prev[field] }))
  };

  const hasVisibleFields = Object.values(visibleReceipts).some(Boolean)

  const receiptConfig = [
    { id: 'salesInvoice' as ReceiptField, label: 'Sales Invoice', qtyKey: 'salesInvoiceQty' as const, amtKey: 'salesInvoice' as const },
    { id: 'siTrading' as ReceiptField, label: 'SI - Trading', qtyKey: 'siTradingQty' as const, amtKey: 'siTrading' as const },
    { id: 'deliveryReceipt' as ReceiptField, label: 'Delivery Receipt', qtyKey: 'deliveryReceiptQty' as const, amtKey: 'deliveryReceipt' as const },
    { id: 'bobsPawnshop' as ReceiptField, label: 'Bobs Pawnshop', qtyKey: 'bobsPawnshopQty' as const, amtKey: 'bobsPawnshop' as const },
  ]

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
          <div className="px-3 py-2 border-b shrink-0 bg-muted/30">
            <h2 className="text-xs font-semibold tracking-tight">Cashier Summary</h2>
            <p className="text-[10px] text-muted-foreground">Daily financial audit</p>
          </div>
        )}

        {/* Scrollable body */}
        <ScrollArea className="flex-1 min-h-0 px-1.5 py-2">
          <div className="space-y-3.5">

            {/* Section 1: Revenue & Receipts */}
            <div className="space-y-0.5">
              <div className="flex items-center justify-between pr-1">
                <SectionHeader>Revenue & Receipts</SectionHeader>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground hover:text-foreground">
                      <Settings2 className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="text-xs w-44">
                    {receiptConfig.map(item => (
                      <DropdownMenuCheckboxItem
                        key={item.id}
                        checked={visibleReceipts[item.id]}
                        onCheckedChange={() => toggleReceiptVisibility(item.id)}
                      >
                        {item.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-0.5">
                <ReceiptInput
                  label="Opening Cash"
                  amount={sidebar.openingCash}
                  onAmountChange={(v) => updateSidebarField('openingCash', v)}
                  hideQty
                />

                {hasVisibleFields && (
                  <div className="grid grid-cols-[1fr_28px_76px] gap-1 px-1.5 pt-1 pb-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    <span>Type</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Amount</span>
                  </div>
                )}

                {receiptConfig.map(item => visibleReceipts[item.id] && (
                  <ReceiptInput
                    key={item.id}
                    label={item.label}
                    qty={sidebar[item.qtyKey]}
                    onQtyChange={(v) => updateSidebarField(item.qtyKey, v)}
                    amount={sidebar[item.amtKey]}
                    onAmountChange={(v) => updateSidebarField(item.amtKey, v)}
                  />
                ))}

                {!hasVisibleFields && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-full mt-1 flex items-center justify-center gap-1 py-1.5 border border-dashed rounded text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
                        <Plus className="h-2.5 w-2.5" /> Add optional receipt fields
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="text-xs w-44">
                      {receiptConfig.map(item => (
                        <DropdownMenuCheckboxItem
                          key={item.id}
                          checked={visibleReceipts[item.id]}
                          onCheckedChange={() => toggleReceiptVisibility(item.id)}
                        >
                          {item.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {hasDisplayAmount(totals.subtotalReceipts) && (
                <div className="pt-1">
                  <TotalRow label="Subtotal Receipts" value={totals.subtotalReceipts} variant="subtle" />
                </div>
              )}
            </div>

            {/* Section 2: Additional Funds */}
            {(hasDisplayAmount(totals.otherincome.drawings) || hasDisplayAmount(totals.cashcollection.purchases) || hasDisplayAmount(totals.creditTotals.credit)) && (
              <div className="space-y-0.5">
                <SectionHeader>Additional Funds</SectionHeader>

                <div className="space-y-0.5">
                  {hasDisplayAmount(totals.otherincome.drawings) && (
                    <StaticRow label="Other Income" value={totals.otherincome.drawings} />
                  )}
                  {hasDisplayAmount(totals.cashcollection.purchases) && (
                    <StaticRow label="Cash Collection" value={totals.cashcollection.purchases} hoverItems={totals.paymentsList} />
                  )}
                  {hasDisplayAmount(totals.creditTotals.credit) && (
                    <InteractiveRow label="Credit / Accounts" value={totals.creditTotals.credit} onClick={() => setDeductionsOpen(true)} />
                  )}
                </div>

                <div className="pt-1">
                  <TotalRow label="Total Cash Receipts" value={totals.totalPaidCash} variant="primary" />
                </div>
              </div>
            )}

            {/* Section 3: Cash Outflows */}
            <div className="space-y-0.5">
              <SectionHeader>Cash Outflows</SectionHeader>

              <div className="space-y-0.5">
                {hasDisplayAmount(totals.expenseTotals.company) && (
                  <StaticRow label="Cash Expenses" value={totals.expenseTotals.company} hoverItems={totals.cashExpensesList} />
                )}
                {hasDisplayAmount(totals.expenseTotals.drawings) && (
                  <StaticRow label="Drawings" value={totals.expenseTotals.drawings} hoverItems={totals.drawingsList} />
                )}
                {hasDisplayAmount(totals.expenseTotals.purchases) && (
                  <StaticRow label="Cash Purchases" value={totals.expenseTotals.purchases} hoverItems={totals.cashPurchasesList} />
                )}
                <InteractiveRow label="Monthly Deductions" value={totals.deductionsTotal} onClick={() => setDeductionsOpen(true)} hoverItems={totals.deductionsList} />
              </div>

              <div className="pt-1">
                <TotalRow label="Total Paid Out" value={totals.totalPaidOut} variant="subtle" />
              </div>
            </div>

            {/* Section 4: Payments & Assets */}
            <div className="pb-2 space-y-0.5">
              <SectionHeader>Payments & Assets</SectionHeader>

              <div className="space-y-0.5">
                <InteractiveRow label="Cash on Hand" value={totals.cashAmount} onClick={() => setDenomOpen(true)} hoverItems={totals.cashAmountList} />
                {hasDisplayAmount(totals.checkTotals.check) && <StaticRow label="Bank Check" value={totals.checkTotals.check} hoverItems={totals.bankCheckList} />}
                {hasDisplayAmount(totals.checkTotals.transfer) && <StaticRow label="Bank Transfer" value={totals.checkTotals.transfer} hoverItems={totals.bankTransferList} />}
                {hasDisplayAmount(totals.checkTotals.gcash) && <StaticRow label="GCash" value={totals.checkTotals.gcash} hoverItems={totals.gcashList} />}
                {hasDisplayAmount(totals.checkTotals.ewallet) && <StaticRow label="Other E-Wallet" value={totals.checkTotals.ewallet} hoverItems={totals.otherEWalletList} />}
              </div>

              <div className="pt-1">
                <TotalRow label="Total Payments" value={totals.totalPayments} variant="subtle" />
              </div>
            </div>

          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 space-y-2 border-t shrink-0 bg-muted/10">
          <div className="space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-medium text-muted-foreground">Expected Cash</span>
              <span className="font-mono text-xs font-semibold tabular-nums">{formatCurrency(totals.expectedCash)}</span>
            </div>
            <MoneyInput
              label="Cash Remitted"
              value={sidebar.cashRemitted}
              onChange={(v) => updateSidebarField('cashRemitted', v)}
            />
          </div>

          <div className={cn(
            'rounded-md px-2 py-1.5 text-center transition-colors border',
            totals.cashVariance < 0
              ? 'bg-destructive/10 text-destructive border-destructive/20'
              : totals.cashVariance > 0
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                : 'bg-primary/10 text-primary border-primary/20',
          )}>
            <p className="text-[9px] font-semibold uppercase tracking-widest opacity-80 mb-0.5">
              {totals.cashVariance === 0 ? 'Cash Audit' : 'Variance Detection'}
            </p>
            <p className="text-xs font-bold tracking-tight tabular-nums">
              {totals.cashVariance === 0 ? 'BALANCED' : formatCurrency(totals.cashVariance)}
            </p>
          </div>
        </div>
      </aside>

      {/* ── Deductions modal ── */}
      <Dialog open={deductionsOpen} onOpenChange={setDeductionsOpen}>
        <DialogContent className="sm:max-w-[320px] p-4 gap-3">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Monthly Deductions</DialogTitle>
          </DialogHeader>
          <div className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-0.5">
            {deductionLabels.map((name) => (
              <MoneyInput
                key={name}
                label={name}
                value={sidebar.deductions[name] || 0}
                onChange={(v) => updateDeduction(name, v)}
              />
            ))}
          </div>
          <DialogFooter className="gap-1.5 sm:gap-0 pt-1 border-t flex-row justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deductionLabels.forEach((name) => updateDeduction(name, 0))}
              className="text-[11px] h-7 px-2.5"
            >
              Clear All
            </Button>
            <Button size="sm" onClick={() => setDeductionsOpen(false)} className="text-[11px] h-7 px-2.5">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Denomination modal ── */}
      <Dialog open={denomOpen} onOpenChange={setDenomOpen}>
        <DialogContent className="sm:max-w-[320px] p-4 gap-3">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Cash Denomination</DialogTitle>
          </DialogHeader>
          <div className="space-y-0.5 max-h-[60vh] overflow-y-auto pr-0.5">
            {denominationValues.map((denom) => {
              const qty = sidebar.denominationQuantities[String(denom)] || 0
              const rowTotal = qty * denom
              return (
                <div
                  key={denom}
                  className="flex items-center justify-between gap-2 px-1.5 py-0.5 transition-colors rounded hover:bg-muted/50"
                >
                  <span className="w-8 text-[11px] font-medium text-muted-foreground">{denom}</span>
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      className="w-full h-6 text-[11px] text-center tabular-nums bg-background px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={qty || ''}
                      onChange={(e) => updateDenomination(String(denom), parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <span className="w-16 font-mono text-[11px] font-medium text-right tabular-nums">
                    {formatNumber(rowTotal)}
                  </span>
                </div>
              )
            })}
          </div>
          <DialogFooter className="gap-1.5 sm:gap-0 pt-1 border-t flex-row justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => denominationValues.forEach((denom) => updateDenomination(String(denom), 0))}
              className="text-[11px] h-7 px-2.5"
            >
              Clear All
            </Button>
            <Button size="sm" onClick={() => setDenomOpen(false)} className="text-[11px] h-7 px-2.5">
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
    <div className="px-1.5 py-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
      {children}
    </div>
  )
}

function ReceiptInput({
  label, qty, onQtyChange, amount, onAmountChange, hideQty,
}: {
  label: string
  qty?: number
  onQtyChange?: (next: number) => void
  amount: number
  onAmountChange: (next: number) => void
  hideQty?: boolean
}) {
  // Opening Cash is essential, always display it even if 0.
  if (amount === 0 && label !== "Opening Cash") return null;

  return (
    <label className="grid grid-cols-[1fr_28px_76px] items-center gap-1 px-1.5 py-0.5 rounded transition-colors hover:bg-muted/40 cursor-text focus-within:bg-muted/50">
      <span className="text-[11px] font-medium text-foreground/80 truncate">
        {label}
      </span>
      <div className="w-full">
        {!hideQty && onQtyChange && (
          <Input
            type="number"
            className="w-full h-5 px-0.5 text-center text-[11px] font-mono tabular-nums bg-transparent border-transparent hover:border-input focus-visible:bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
          className="w-full h-5 px-1 text-right text-[11px] font-mono tabular-nums bg-transparent border-transparent hover:border-input focus-visible:bg-background"
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
    <label className="flex items-center justify-between gap-2 px-1.5 py-0.5 rounded transition-colors hover:bg-muted/40 cursor-text focus-within:bg-muted/50">
      <span className="text-[11px] font-medium truncate text-foreground/80">
        {label}
      </span>
      <div className="relative w-20 shrink-0">
        <Input
          type="text"
          inputMode="decimal"
          className="w-full px-1 font-mono text-[11px] text-right bg-transparent h-5.5 tabular-nums border-input focus-visible:bg-background"
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
  if (value === 0) return null;

  const hasItems = hoverItems && hoverItems.length > 0
  const row = (
    <div className="flex items-center justify-between w-full px-1.5 py-0.5 transition-colors rounded cursor-default hover:bg-muted/30">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium text-foreground/80">
          {label}
        </span>
        {hasItems && (
          <span className="text-[8px] font-semibold px-1 rounded bg-secondary text-secondary-foreground">
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
  // Exemption: Always mount Monthly Deductions and Cash on Hand regardless of value
  if (value === 0 && label !== "Monthly Deductions" && label !== "Cash on Hand") return null;

  const hasItems = hoverItems && hoverItems.length > 0
  const row = (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="flex items-center justify-between w-full h-auto min-h-0 px-1.5 py-0.5 font-normal rounded hover:bg-accent hover:text-accent-foreground"
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium">
          {label}
        </span>
        {hasItems && (
          <span className="text-[8px] font-semibold px-1 rounded bg-primary/10 text-primary">
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
  label, value, variant = 'subtle'
}: {
  label: string
  value: number
  variant?: 'subtle' | 'primary' | 'accent'
}) {
  return (
    <div className={cn(
      "flex items-center justify-between px-1.5 py-1 rounded transition-colors",
      variant === 'subtle' && "bg-muted/40 text-muted-foreground",
      variant === 'primary' && "bg-primary/10 text-primary border border-primary/10",
      variant === 'accent' && "bg-foreground text-background font-semibold shadow-sm"
    )}>
      <span className="text-[11px] font-semibold tracking-tight">{label}</span>
      <span className="text-[11px] font-bold font-mono tabular-nums">{formatCurrency(value)}</span>
    </div>
  )
}