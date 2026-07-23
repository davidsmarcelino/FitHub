import { clampPercentage } from '../../lib/utils'

type ProgressBarProps = {
  value: number
  className?: string
}

export const ProgressBar = ({ value, className }: ProgressBarProps) => (
  <div
    role="progressbar"
    aria-valuenow={clampPercentage(value)}
    aria-valuemin={0}
    aria-valuemax={100}
    className={`h-2 overflow-hidden rounded-full bg-muted ${className ?? ''}`}
  >
    <div
      className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
      style={{ width: `${clampPercentage(value)}%` }}
    />
  </div>
)
