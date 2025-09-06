import * as React from 'react'
import { cn } from '@/lib/utils'

export type ChartConfig = Record<string, { label?: string; color?: string }>

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config?: ChartConfig
}

// Lightweight container to expose CSS variables for series colors.
// Use like: <ChartContainer config={{ total: { color: 'var(--chart-1)' } }}>...
export function ChartContainer({ config, className, style, children, ...props }: ChartContainerProps & { children?: React.ReactNode }) {
  const cssVars = React.useMemo(() => {
    const vars: React.CSSProperties = {}
    if (config) {
      for (const [key, value] of Object.entries(config)) {
        if (value?.color) (vars as any)[`--color-${key}`] = value.color
      }
    }
    return vars
  }, [config])

  return (
    <div
      className={cn('w-full min-h-[220px] text-sm', className)}
      style={{ ...cssVars, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

// Simple tooltip content used by Recharts <Tooltip content={<ChartTooltipContent />} />
export function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="rounded-md border bg-card/95 backdrop-blur px-3 py-2 shadow-sm">
      {label && <div className="mb-1 text-xs text-muted-foreground">{label}</div>}
      <div className="space-y-1">
        {payload.map((item: any) => {
          const name = item.name as string
          const color = item.color || item.stroke || item.fill || item.payload?.fill || `var(--color-${name})`
          return (
            <div key={name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="inline-block size-2 rounded-sm" style={{ backgroundColor: color }} />
                <span className="text-muted-foreground">{name}</span>
              </div>
              <span className="font-medium tabular-nums">{item.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ChartEmptyState({ message = 'No data' }: { message?: string }) {
  return (
    <div className="flex h-[220px] w-full items-center justify-center text-muted-foreground text-sm">
      {message}
    </div>
  )
}

export default {
  ChartContainer,
  ChartTooltipContent,
  ChartEmptyState,
}
