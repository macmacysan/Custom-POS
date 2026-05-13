export type PosTab = 'dashboard' | 'expenses' | 'checks' | 'income' | 'payments' | 'installment' | 'financing'

export type NavSection = 'inventory' | 'sales' | 'reports'

export type ExpenseType = 'Company Expenses' | 'Purchases' | 'Drawings'
export type VatType = 'Vat' | 'Non-Vat'

export type CheckType = 'Bank Check' | 'Bank Transfer' | 'GCash' | 'Other E-Wallet'
export type IncomeType = 'Load' | 'Cash Reimbursement' | 'Others'

export type ExpenseEntry = {
  id: string
  type: ExpenseType
  description: string
  receipt: string
  category: string
  vat: VatType
  amount: number
}

export type CheckEntry = {
  id: string
  type: CheckType
  bank: string
  account: string
  checkNo: string
  receipt: string
  date: string
  amount: number
}

export type IncomeEntry = {
  id: string
  particular: IncomeType
  remarks: string
  receipt: string
  date: string
  amount: number
}

export type FinanceType = 'Nueva' | 'Home Credit' | 'Salmon Credit' | 'Skyro'

export type PaymentEntry = {
  id: string
  finance: FinanceType
  type: string
  terms: string
  date: string
  accountName: string
  qty: number
  item: string
  unitPrice: number
  grandTotal: number
  down: number
  balance: number
  cr: string
  lateFee: number
  paymentMethod: string
  notes: string
}

export type InstallmentEntry = {
  id: string
  branch: string
  lname: string
  fname: string
  mname: string
  suffix: string
  street: string
  brgy: string
  city: string
  prov: string
  occ: string
  contact: string
  agent: string
  ref: string
  added: string
}

export type AppSettings = {
  compactRows: boolean
  showVatColumn: boolean
  cashierName: string
  dailySalesTarget: number
  highlightVariance: boolean
  autoCalculateTotals: boolean
  sidebarAlwaysDark: boolean
}

export type SidebarState = {
  openingCash: number
  salesInvoiceQty: number
  salesInvoice: number
  siTradingQty: number
  siTrading: number
  deliveryReceiptQty: number
  deliveryReceipt: number
  bobsPawnshopQty: number
  bobsPawnshop: number
  collections: number
  credits: number
  cashRemitted: number
  denominationQuantities: Record<string, number>
  deductions: Record<string, number>
}

