import * as React from 'react'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type ActionTooltipProps = {
  label: string
  shortcut?: string
  side?: React.ComponentProps<typeof TooltipContent>['side']
  children: React.ReactElement
}

export function ActionTooltip({ label, shortcut, side = 'bottom', children }: ActionTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="flex max-w-xs flex-wrap items-center gap-2">
        <span>{label}</span>
        {shortcut ? (
          <kbd
            data-slot="kbd"
            className={cn(
              'pointer-events-none inline-flex h-5 min-w-[1.25rem] select-none items-center justify-center gap-1',
              'rounded-none border border-background/30 bg-background/15 px-1 font-mono text-[10px] font-medium text-background',
            )}
          >
            {shortcut}
          </kbd>
        ) : null}
      </TooltipContent>
    </Tooltip>
  )
}
