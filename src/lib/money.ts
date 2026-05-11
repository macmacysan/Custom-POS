export function formatCurrency(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatNumber(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function parseMoney(value: string | number | null | undefined) {
  if (value == null) return 0
  if (typeof value === 'number') return value
  const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

export function valueOrDash(value: number) {
  return value === 0 ? '-' : formatNumber(value)
}

