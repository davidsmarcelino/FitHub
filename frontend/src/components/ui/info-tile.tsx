import type { IconType } from '../../lib/utils'

type InfoTileProps = {
  icon: IconType
  label: string
  value: string
}

export const InfoTile = ({ icon: Icon, label, value }: InfoTileProps) => (
  <div className="rounded-xl bg-emerald-50/50 px-3 py-3">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="h-4 w-4 text-emerald-500" />
      {label}
    </div>
    <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
  </div>
)
