import { denominationValues } from '@/state/seed'
import type { CheckEntry, ExpenseEntry, IncomeEntry, PaymentEntry, SidebarState } from '@/types/pos'

export function summarizeExpenses(expenses: ExpenseEntry[]) {
  const totals = {
    company: 0,
    purchases: 0,
    drawings: 0,
  }

  expenses.forEach((item) => {
    if (item.type === 'Company Expenses') totals.company += item.amount
    if (item.type === 'Purchases') totals.purchases += item.amount
    if (item.type === 'Drawings') totals.drawings += item.amount
  })

  return { ...totals, grand: totals.company + totals.purchases + totals.drawings }
}

export function summarizeChecks(checks: CheckEntry[]) {
  const totals = { check: 0, transfer: 0, gcash: 0, ewallet: 0 }
  checks.forEach((item) => {
    if (item.type === 'Bank Check') totals.check += item.amount
    if (item.type === 'Bank Transfer') totals.transfer += item.amount
    if (item.type === 'GCash') totals.gcash += item.amount
    if (item.type === 'Other E-Wallet') totals.ewallet += item.amount
  })
  return { ...totals, grand: totals.check + totals.transfer + totals.gcash + totals.ewallet }
}

export function summarizeIncome(income: IncomeEntry[]) {
  const totals = { load: 0, reimbursement: 0, others: 0 }
  income.forEach((item) => {
    if (item.particular === 'Load') totals.load += item.amount
    if (item.particular === 'Cash Reimbursement') totals.reimbursement += item.amount
    if (item.particular === 'Others') totals.others += item.amount
  })
  return { ...totals, grand: totals.load + totals.reimbursement + totals.others }
}

export function calculateDenominationTotal(sidebar: SidebarState) {
  return denominationValues.reduce((sum, denom) => {
    const qty = sidebar.denominationQuantities[String(denom)] ?? 0
    return sum + qty * denom
  }, 0)
}

export function calculateDeductionsTotal(sidebar: SidebarState) {
  return Object.values(sidebar.deductions).reduce((sum, value) => sum + value, 0)
}

export function calculateMasterTotals(sidebar: SidebarState, expenses: ExpenseEntry[], checks: CheckEntry[], income: IncomeEntry[], payments: PaymentEntry[]) {
  const exp = summarizeExpenses(expenses)
  const chk = summarizeChecks(checks)
  const inc = summarizeIncome(income)

  // Calculate Payments totals for Cash Collection
  const paymentsByFinance = {
    nueva: payments.filter(p => p.finance === 'Nueva').reduce((sum, p) => sum + p.grandTotal, 0),
    homeCredit: payments.filter(p => p.finance === 'Home Credit').reduce((sum, p) => sum + p.grandTotal, 0),
    salmonCredit: payments.filter(p => p.finance === 'Salmon Credit').reduce((sum, p) => sum + p.grandTotal, 0),
    skyro: payments.filter(p => p.finance === 'Skyro').reduce((sum, p) => sum + p.grandTotal, 0),
  }
  const paymentsGrandTotal = payments.reduce((sum, p) => sum + p.grandTotal, 0)
  
  const paymentsBreakdownList = [
    { description: 'Nueva', amount: paymentsByFinance.nueva },
    { description: 'Home Credit', amount: paymentsByFinance.homeCredit },
    { description: 'Salmon Credit', amount: paymentsByFinance.salmonCredit },
    { description: 'Skyro', amount: paymentsByFinance.skyro },
  ].filter(item => item.amount > 0)

  const subtotalReceipts = sidebar.salesInvoice + sidebar.siTrading + sidebar.deliveryReceipt + sidebar.bobsPawnshop
  const totalPaidCash = subtotalReceipts + sidebar.collections + sidebar.credits + inc.grand + paymentsGrandTotal
  const totalPaidOut = exp.company + exp.drawings + exp.purchases + calculateDeductionsTotal(sidebar)
  const totalPayments = chk.grand
  const expectedCash = sidebar.openingCash + totalPaidCash - totalPaidOut - totalPayments
  const cashAmount = calculateDenominationTotal(sidebar)
  const cashVariance = cashAmount - totalPaidOut

  // Detailed lists for hover cards
  const cashExpensesList = expenses.filter(e => e.type === 'Company Expenses').map(e => ({ description: e.description || 'Company Expense', amount: e.amount }))
  const drawingsList = expenses.filter(e => e.type === 'Drawings').map(e => ({ description: e.description || 'Drawing', amount: e.amount }))
  const cashPurchasesList = expenses.filter(e => e.type === 'Purchases').map(e => ({ description: e.description || 'Purchase', amount: e.amount }))
  const deductionsList = Object.entries(sidebar.deductions).filter(([, value]) => value > 0).map(([name, value]) => ({ description: name, amount: value }))
  const cashAmountList = denominationValues.map(denom => {
    const qty = sidebar.denominationQuantities[String(denom)] ?? 0
    return { description: `${denom} x ${qty}`, amount: qty * denom }
  }).filter(item => item.amount > 0)
  const bankCheckList = checks.filter(c => c.type === 'Bank Check').map(c => ({ description: c.checkNo || c.bank || 'Bank Check', amount: c.amount }))
  const bankTransferList = checks.filter(c => c.type === 'Bank Transfer').map(c => ({ description: c.bank || c.account || 'Bank Transfer', amount: c.amount }))
  const gcashList = checks.filter(c => c.type === 'GCash').map(c => ({ description: c.account || c.bank || 'GCash', amount: c.amount }))
  const otherEWalletList = checks.filter(c => c.type === 'Other E-Wallet').map(c => ({ description: c.account || c.bank || 'Other E-Wallet', amount: c.amount }))
  const paymentsList = paymentsBreakdownList

  return {
    expenseTotals: exp,
    checkTotals: chk,
    incomeTotals: inc,
    subtotalReceipts,
    totalPaidCash,
    totalPaidOut,
    totalPayments,
    expectedCash,
    cashAmount,
    cashVariance,
    deductionsTotal: calculateDeductionsTotal(sidebar),
    // Legacy properties for backward compatibility
    otherincome: { drawings: inc.grand },
    cashcollection: { purchases: paymentsGrandTotal },
    creditTotals: { credit: 0 },
    // Detailed lists for hover cards
    cashExpensesList,
    drawingsList,
    cashPurchasesList,
    deductionsList,
    cashAmountList,
    bankCheckList,
    bankTransferList,
    gcashList,
    otherEWalletList,
    paymentsList,
  }
}

