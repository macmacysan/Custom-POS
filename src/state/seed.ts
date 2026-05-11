import type {
  AppSettings,
  CheckEntry,
  ExpenseEntry,
  IncomeEntry,
  InstallmentEntry,
  PosTab,
  SidebarState,
} from '@/types/pos'

export const expenseCategories = [
  'Advertising',
  'Bank Fees',
  'Business Meals',
  'Charitable Contributions',
  'Credit and Collection Fees',
  'Dues and Subscriptions',
  'Education and training expenses for employees',
  'Employee Benefit Programs',
  'Food Allowance',
  'Freight, Postage and Shipping',
  'Insurance',
  'Legal and professional expenses',
  'Licenses and Permits',
  'Office Expenses and Supplies',
  'Others',
  'Printing',
  'Rent',
  'Salaries and Compensation',
  'Telephone/Communication Expense',
  'Transportation Allowance',
  'Utilities',
  'Vehicle Maintenance and Repairs',
]

export const deductionLabels = [
  'SSS ER (Employer)',
  'SSS EC (Employee)',
  'SSS Loan',
  'Pag-IBIG ER',
  'Pag-IBIG EC',
  'Pag-IBIG Loan',
  'PhilHealth ER',
  'PhilHealth EC',
] as const

export const denominationValues = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25] as const

const today = new Date().toISOString().slice(0, 10)

export const initialSettings: AppSettings = {
  compactRows: true,
  showVatColumn: true,
  cashierName: '',
  dailySalesTarget: 50000,
  highlightVariance: true,
  autoCalculateTotals: true,
  sidebarAlwaysDark: true,
}

export const initialSidebar: SidebarState = {
  openingCash: 0,
  salesInvoiceQty: 0,
  salesInvoice: 0,
  siTradingQty: 0,
  siTrading: 0,
  deliveryReceiptQty: 0,
  deliveryReceipt: 0,
  bobsPawnshopQty: 0,
  bobsPawnshop: 0,
  collections: 0,
  credits: 0,
  cashRemitted: 0,
  denominationQuantities: Object.fromEntries(denominationValues.map((v) => [String(v), 0])),
  deductions: Object.fromEntries(deductionLabels.map((k) => [k, 0])),
}

export const initialExpenses: ExpenseEntry[] = [
  { id: '1', type: 'Purchases', description: 'Sample Purchase – Laptop', receipt: 'PO-1001', category: 'Office Expenses and Supplies', vat: 'Vat', amount: 1250 },
  { id: '2', type: 'Company Expenses', description: 'Office Supplies (Printer)', receipt: 'REC-202', category: 'Office Expenses and Supplies', vat: 'Vat', amount: 89.5 },
  { id: '3', type: 'Drawings', description: 'Personal Withdrawal', receipt: 'DW-09', category: 'Others', vat: 'Non-Vat', amount: 300 },
]

export const initialChecks: CheckEntry[] = [
  { id: 'c1', type: 'Bank Check', bank: 'BDO – Goa', account: 'Juan Dela Cruz', checkNo: '100234', receipt: 'REC-01', date: today, amount: 5000 },
]

export const initialIncome: IncomeEntry[] = [
  { id: 'i1', particular: 'Load', remarks: 'Globe GCash Cash In', receipt: 'REF-099', date: today, amount: 3000 },
]

export const initialInstallments: InstallmentEntry[] = [
  { id: 'inst1', branch: 'GOA', lname: 'Dela Cruz', fname: 'Juan', mname: 'P', suffix: 'NONE', street: 'Zone 1', brgy: 'San Jose', city: 'GOA', prov: 'CAMARINES SUR', occ: 'Teacher', contact: '09123456789', agent: 'Mike R.', ref: 'Sarah T.', added: '2026-04-23' },
]

export const initialTab: PosTab = 'expenses'

