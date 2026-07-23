type SkeletonCardProps = {
  className?: string
}

export const SkeletonCard = ({ className = '' }: SkeletonCardProps) => (
  <div className={`animate-pulse rounded-2xl bg-white shadow-soft ${className}`}>
    <div className="h-full rounded-2xl bg-emerald-50" />
  </div>
)

export const SkeletonBlock = ({ className = '' }: SkeletonCardProps) => (
  <div className={`h-44 animate-pulse rounded-2xl bg-emerald-50 ${className}`} />
)

export const SkeletonLine = () => (
  <div className="h-14 animate-pulse rounded-xl bg-emerald-50" />
)
