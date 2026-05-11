import * as React from 'react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
