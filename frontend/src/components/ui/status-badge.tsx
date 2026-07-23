import { formatEnum } from '../../lib/utils'
import { membershipStatusColors } from './status-colors'

// eslint-disable-next-line react-refresh/only-export-components
export { membershipStatusColors, sessionStatusColors, paymentStatusColors, assignmentStatusColors, workoutStatusColors } from './status-colors'

type StatusBadgeProps = {
  status: string
  colors?: Record<string, string>
  label?: string
}

export const StatusBadge = ({ status, colors = membershipStatusColors, label }: StatusBadgeProps) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${colors[status] ?? 'bg-muted text-muted-foreground'}`}>
    {label ?? formatEnum(status)}
  </span>
)
