export const membershipStatusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600',
  EXPIRED: 'bg-muted text-muted-foreground',
  FROZEN: 'bg-blue-500/10 text-blue-600',
  CANCELLED: 'bg-red-500/10 text-red-600',
  CREATED: 'bg-amber-500/10 text-amber-600',
}

export const sessionStatusColors: Record<string, string> = {
  SCHEDULED: 'bg-emerald-500/10 text-emerald-600',
  COMPLETED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-red-500/10 text-red-600',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-600',
}

export const paymentStatusColors: Record<string, string> = {
  PAID: 'bg-emerald-500/10 text-emerald-600',
  PENDING: 'bg-amber-500/10 text-amber-600',
  COMPLETED: 'bg-emerald-500/10 text-emerald-600',
  FAILED: 'bg-red-500/10 text-red-600',
}

export const assignmentStatusColors: Record<string, string> = {
  ASSIGNED: 'bg-amber-500/10 text-amber-600',
  NOT_STARTED: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-600',
  COMPLETED: 'bg-emerald-500/10 text-emerald-600',
  CANCELLED: 'bg-red-500/10 text-red-600',
}

export const workoutStatusColors = assignmentStatusColors
