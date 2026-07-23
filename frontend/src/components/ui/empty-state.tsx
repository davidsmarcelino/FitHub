import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { IconType } from '../../lib/utils'

type EmptyStateProps = {
  icon: IconType
  title: string
  description: string
  actionLabel?: string
  to?: string
  onClick?: () => void
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  to,
  onClick,
}: EmptyStateProps) => (
  <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 p-8 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
      <Icon className="h-6 w-6 text-emerald-500" />
    </div>
    <p className="mt-4 text-sm font-semibold text-foreground">{title}</p>
    <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
    {actionLabel && to && (
      <Link
        to={to}
        className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
      >
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    )}
    {actionLabel && onClick && !to && (
      <button
        type="button"
        onClick={onClick}
        className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
      >
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    )}
  </div>
)
