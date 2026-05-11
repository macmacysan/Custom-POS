import { Card, CardContent } from '@/components/ui/card'
import { usePosStore } from '@/state/pos-store'
import { DashboardPanel } from '@/features/dashboard/dashboard-panel'
import { ChecksPanel } from '@/features/checks/checks-panel'
import { ExpensesPanel } from '@/features/expenses/expenses-panel'
import { IncomePanel } from '@/features/income/income-panel'
import { InstallmentPanel } from '@/features/installment/installment-panel'
import { PaymentsPanel } from '@/features/payments/payments-panel'

export function WorkspaceTabs() {
  const { activeTab } = usePosStore()

  if (activeTab === 'dashboard') return <DashboardPanel />
  if (activeTab === 'expenses') return <ExpensesPanel />
  if (activeTab === 'checks') return <ChecksPanel />
  if (activeTab === 'income') return <IncomePanel />
  if (activeTab === 'payments') return <PaymentsPanel />
  if (activeTab === 'installment') return <InstallmentPanel />
  return (
    <Card>
      <CardContent className="py-8 text-center text-sm text-muted-foreground">
        Homecredit / external financing module is staged as the next migration slice.
      </CardContent>
    </Card>
  )
}

