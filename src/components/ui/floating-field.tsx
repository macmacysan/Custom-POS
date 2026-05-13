import * as React from 'react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, parseMoney } from '@/lib/money'
import { DatePicker } from '@/components/ui/date-picker'

type FloatingInputProps = React.ComponentProps<typeof Input> & {
  label: string
  containerClassName?: string
}

export function FloatingInput({ label, className, containerClassName, id, ...props }: FloatingInputProps) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId

  return (
    <div className={cn('grid gap-1', containerClassName)}>
      <label
        htmlFor={inputId}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      <Input id={inputId} className={className} {...props} />
    </div>
  )
}

type FloatingNumberInputProps = React.ComponentProps<typeof Input> & {
  label: string
  containerClassName?: string
}

export function FloatingNumberInput({ label, className, containerClassName, id, value, onChange, onBlur, ...props }: FloatingNumberInputProps) {
  const generatedId = React.useId()
  const inputId = id ?? generatedId

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (onChange && e.target.value !== '') {
      const parsed = parseMoney(e.target.value)
      // Create a synthetic event
      const event = {
        ...e,
        target: { ...e.target, value: formatCurrency(parsed) },
      } as React.ChangeEvent<HTMLInputElement>
      onChange(event)
    }
    if (onBlur) onBlur(e)
  }

  return (
    <div className={cn('grid gap-1', containerClassName)}>
      <label
        htmlFor={inputId}
        className="text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      <Input id={inputId} className={className} value={value} onChange={onChange} onBlur={handleBlur} {...props} />
    </div>
  )
}

type FloatingSelectProps = {
  label: string
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  options: Array<{ label: string; value: string }>
}

export function FloatingSelect({
  label,
  value,
  onValueChange,
  placeholder,
  disabled,
  className,
  triggerClassName,
  options,
}: FloatingSelectProps) {
  return (
    <div className={cn('grid gap-1', className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={cn('w-full', triggerClassName)}>
          <SelectValue placeholder={placeholder ?? `Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

type FloatingDatePickerProps = React.ComponentProps<typeof DatePicker> & {
  label: string
  containerClassName?: string
}

export function FloatingDatePicker({ label, containerClassName, ...props }: FloatingDatePickerProps) {
  return (
    <div className={cn('grid gap-1', containerClassName)}>
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <DatePicker {...props} />
    </div>
  )
}
