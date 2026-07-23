import type { IconType } from '../../lib/utils'

type SummaryCardProps = {
  icon?: IconType
  label: string
  value: string | number
}

export const SummaryCard = ({ icon: Icon, label, value }: SummaryCardProps) => (
  <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3">
    {Icon && (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
        <Icon className="h-4 w-4 text-emerald-600" />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  </div>
)
