import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  DollarSign,
  Droplets,
  Dumbbell,
  LineChart,
  Target,
  Users2,
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { getMyActiveMembership } from '../services/membership.service'
import { getTodayWaterIntake } from '../services/nutrition.service'
import { getActiveGoals, getLatestBodyMeasurement } from '../services/progress.service'
import { getMyActiveAssignments, getTrainingSessions } from '../services/workout.service'
import { getMyTrainerAnalytics, getDashboardAnalytics } from '../services/dashboard.service'
import { useAuthStore } from '../store/useAuthStore'
import type { MembershipResponse, DailyWaterIntakeResponse, BodyMeasurementResponse, GoalResponse, ClientWorkoutPlanResponse, TrainingSessionResponse, TrainerAnalyticsResponse, DashboardAnalyticsResponse } from '../types'
import { formatDate, clampPercentage, formatCurrency, getAppDateTimeMs, parseAppDate, type IconType } from '../lib/utils'
import toast from '../utils/toast'
import { useMountedRef } from '../utils/useMountedRef'
import { ProgressBar } from '../components/ui/progress-bar'
import { StatusBadge, assignmentStatusColors } from '../components/ui/status-badge'
import { InfoTile } from '../components/ui/info-tile'

type DashboardData = {
  membership: MembershipResponse | null
  water: DailyWaterIntakeResponse | null
  assignments: ClientWorkoutPlanResponse[]
  nextSession: TrainingSessionResponse | null
  goals: GoalResponse[]
  latestMeasurement: BodyMeasurementResponse | null
}

type DashboardErrors = Partial<Record<keyof DashboardData, string>>

const todayIso = () => new Date().toISOString().slice(0, 10)

const Dashboard = () => {
  const { t } = useTranslation(['dashboard', 'common'])
  const user = useAuthStore((state) => state.user)
  const roles = useAuthStore((state) => state.roles)
  const isClient = roles.includes('CLIENT')
  const isTrainer = roles.includes('TRAINER')
  const isAdmin = roles.includes('ADMIN')
  const [data, setData] = useState<DashboardData>({ membership: null, water: null, assignments: [], nextSession: null, goals: [], latestMeasurement: null })
  const [errors, setErrors] = useState<DashboardErrors>({})
  const [isLoading, setIsLoading] = useState(true)
  const [trainerAnalytics, setTrainerAnalytics] = useState<TrainerAnalyticsResponse | null>(null)
  const [adminAnalytics, setAdminAnalytics] = useState<DashboardAnalyticsResponse | null>(null)
  const mounted = useMountedRef()

  useEffect(() => {
    let cancelled = false

    if (!isClient) {
      const loadTrainerAdminData = async () => {
        setIsLoading(true)
        const safetyTimeout = setTimeout(() => { if (mounted.current && !cancelled) setIsLoading(false) }, 10_000)
        try {
          if (isTrainer) { const data = await getMyTrainerAnalytics(); if (mounted.current && !cancelled) setTrainerAnalytics(data) }
          else if (isAdmin) { const data = await getDashboardAnalytics(); if (mounted.current && !cancelled) setAdminAnalytics(data) }
        } catch { if (mounted.current && !cancelled) toast.error(t('errors.loadFailed')) }
        finally { clearTimeout(safetyTimeout); if (mounted.current && !cancelled) setIsLoading(false) }
      }
      void loadTrainerAdminData()
      return () => { cancelled = true }
    }

    const loadDashboard = async () => {
      setIsLoading(true); setErrors({})
      const safetyTimeout = setTimeout(() => { if (mounted.current && !cancelled) setIsLoading(false) }, 10_000)
      try {
        const [membershipResult, waterResult, assignmentsResult, sessionsResult, goalsResult, measurementResult] = await Promise.allSettled([
          getMyActiveMembership(), getTodayWaterIntake(), getMyActiveAssignments(), getTrainingSessions(0, 12), getActiveGoals(0, 3), getLatestBodyMeasurement(),
        ])
        const nextErrors: DashboardErrors = {}
        const membership = unwrapResult(membershipResult, 'membership', nextErrors, null)
        const water = unwrapResult(waterResult, 'water', nextErrors, null)
        const assignments = unwrapResult(assignmentsResult, 'assignments', nextErrors, [])
        const sessionsPage = unwrapResult(sessionsResult, 'nextSession', nextErrors, { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 })
        const goalsPage = unwrapResult(goalsResult, 'goals', nextErrors, { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 })
        const latestMeasurement = unwrapResult(measurementResult, 'latestMeasurement', nextErrors, null)
        if (mounted.current && !cancelled) {
          setData({ membership, water, assignments, nextSession: getNextUpcomingSession(sessionsPage.content), goals: goalsPage.content, latestMeasurement })
          setErrors(nextErrors)
        }
      } catch { if (mounted.current && !cancelled) toast.error(t('errors.loadFailed')) }
      finally { clearTimeout(safetyTimeout); if (mounted.current && !cancelled) setIsLoading(false) }
    }
    void loadDashboard()
    return () => { cancelled = true }
  }, [isClient, isTrainer, isAdmin, mounted, t])

  const greetingName = user?.clientProfile?.firstname ?? user?.clientProfile?.lastname ?? user?.email?.split('@')[0] ?? t('fallbacks.there')
  const activeAssignment = data.assignments[0] ?? null
  const waterProgress = clampPercentage(data.water?.progress ?? 0)
  const membershipDays = data.membership ? getDaysRemaining(data.membership.endDate) : null

  // Trainer/Admin view
  if (!isClient) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
          <h1 className="text-2xl font-bold md:text-3xl">
            {t('trainer.welcome', { name: user?.trainerProfile?.firstname ?? user?.email?.split('@')[0] ?? '', ns: 'dashboard' })}
          </h1>
          <p className="mt-1 text-emerald-100">{t('trainer.overview', { ns: 'dashboard' })}</p>
        </div>

        <div className={`grid gap-4 md:grid-cols-2 ${isTrainer ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
          {isLoading ? Array.from({ length: isTrainer ? 3 : 4 }).map((_, i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-emerald-50" />) : isTrainer ? (
            <>
              <StatCard icon={Users2} title={t('trainer.quickAccess', { ns: 'dashboard' })} value={trainerAnalytics?.totalClients?.toString() ?? '0'} color="blue" />
              <StatCard icon={Dumbbell} title={t('trainer.workouts', { ns: 'dashboard' })} value={trainerAnalytics?.totalSessions?.toString() ?? '0'} color="violet" />
              <StatCard icon={CheckCircle2} title={t('trainer.sessions', { ns: 'dashboard' })} value={trainerAnalytics?.attendanceRate != null ? `${Math.round(trainerAnalytics.attendanceRate)}%` : '0%'} color="emerald" />
            </>
          ) : (
            <>
              <StatCard icon={Users2} title={t('admin.activeClients', { ns: 'dashboard' })} value={adminAnalytics?.activeClients?.toString() ?? '0'} color="blue" />
              <StatCard icon={CreditCard} title={t('admin.activeMemberships', { ns: 'dashboard' })} value={adminAnalytics?.activeMemberships?.toString() ?? '0'} color="violet" />
              <StatCard icon={DollarSign} title={t('admin.revenue', { ns: 'dashboard' })} value={formatCurrency(adminAnalytics?.revenue)} color="emerald" />
              <StatCard icon={Activity} title={t('admin.todayCheckIns', { ns: 'dashboard' })} value={adminAnalytics?.todayCheckIns?.toString() ?? '0'} color="amber" />
            </>
          )}
        </div>

        <Card>
          <CardContent className="flex min-h-48 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
              <Activity className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-900">{t('trainer.title', { ns: 'dashboard' })}</h2>
            <p className="mt-2 max-w-md text-sm text-gray-500">{t('trainer.desc', { ns: 'dashboard' })}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <ActionLink to="/trainer-workouts" label={t('trainer.managePlans', { ns: 'dashboard' })} icon={Dumbbell} />
              <ActionLink to="/trainer-sessions" label={t('trainer.viewSessions', { ns: 'dashboard' })} icon={CalendarDays} />
              <ActionLink to="/analytics" label={t('trainer.analytics', { ns: 'dashboard' })} icon={BarChart3} />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Client view
  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
        <h1 className="text-2xl font-bold md:text-3xl">{t('title', { name: greetingName })}</h1>
        <p className="mt-1 text-emerald-100">{t('subtitle', { date: formatDate(todayIso()) })}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/workouts" className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30">
            <Dumbbell className="h-4 w-4" /> {t('openWorkouts')}
          </Link>
          <Link to="/progress" className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30">
            <LineChart className="h-4 w-4" /> {t('trackProgress')}
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-emerald-50" />) : (
          <>
            <QuickStat icon={CreditCard} label={t('membership.title', { ns: 'dashboard' })} value={membershipDays === null ? '—' : `${membershipDays}`} unit={membershipDays !== null ? t('membership.days', { count: membershipDays, ns: 'dashboard' }) : t('membership.notActive', { ns: 'dashboard' })} color="emerald" />
            <QuickStat icon={Droplets} label={t('water.title', { ns: 'dashboard' })} value={`${Math.round(waterProgress)}%`} unit={`${data.water?.totalMl ?? 0} / ${data.water?.targetMl ?? 0} ml`} color="blue" />
            <QuickStat icon={Dumbbell} label={t('workoutPlan.title', { ns: 'dashboard' })} value={activeAssignment ? `${Math.round(activeAssignment.completionPercentage ?? 0)}%` : '—'} unit={activeAssignment?.workoutPlan.name ?? t('workoutPlan.noActive', { ns: 'dashboard' })} color="violet" />
            <QuickStat icon={Target} label={t('goals.title', { ns: 'dashboard' })} value={data.goals.length.toString()} unit={data.goals[0]?.title ?? t('goals.noGoals', { ns: 'dashboard' })} color="amber" />
          </>
        )}
      </div>

      {/* Main content */}
      <div className="grid gap-6 xl:grid-cols-[1fr,380px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Today's plan */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{t('todayPlan.title')}</h2>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                  <Activity className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              {isLoading ? <div className="mt-4 h-32 animate-pulse rounded-xl bg-emerald-50" /> : (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <WorkoutPlanPanel assignment={activeAssignment} />
                  <NextSessionPanel session={data.nextSession} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goals & Measurements */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">{t('goals.activeGoalsTitle')}</h2>
              {isLoading ? <div className="mt-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-emerald-50" />)}</div> : (
                <div className="mt-4">
                  <ProgressPanel goals={data.goals} latestMeasurement={data.latestMeasurement} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Water intake */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">{t('water.hydrationTitle')}</h2>
              {isLoading ? <div className="mt-4 h-40 animate-pulse rounded-xl bg-emerald-50" /> : (
                <div className="mt-4">
                  <WaterPanel water={data.water} fallbackTarget={user?.clientProfile?.dailyWaterTarget ?? null} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Membership */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900">{t('membership.statusTitle')}</h2>
              {isLoading ? <div className="mt-4 h-32 animate-pulse rounded-xl bg-emerald-50" /> : (
                <div className="mt-4">
                  <MembershipPanel membership={data.membership} daysRemaining={membershipDays} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {Object.keys(errors).length > 0 && !isLoading && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">{t('errors.loadFailed')}</div>
      )}
    </div>
  )
}

// === Sub-components ===

const StatCard = ({ icon: Icon, title, value, color }: { icon: IconType; title: string; value: string; color: string }) => (
  <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-soft transition-shadow hover:shadow-soft-md">
    <div>
      <p className="text-xs font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
    <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${color === 'blue' ? 'from-blue-400 to-blue-500' : color === 'violet' ? 'from-violet-400 to-violet-500' : color === 'emerald' ? 'from-emerald-400 to-emerald-500' : 'from-amber-400 to-amber-500'} text-white`}>
      <Icon className="h-5 w-5" />
    </div>
  </div>
)

const QuickStat = ({ icon: Icon, label, value, unit, color }: { icon: IconType; label: string; value: string; unit: string; color: string }) => (
  <div className="rounded-2xl bg-white p-4 shadow-soft transition-shadow hover:shadow-soft-md">
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : color === 'blue' ? 'bg-blue-100 text-blue-600' : color === 'violet' ? 'bg-violet-100 text-violet-600' : 'bg-amber-100 text-amber-600'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
    <p className="mt-2 truncate text-xs text-gray-400">{unit}</p>
  </div>
)

const ActionLink = ({ to, label, icon: Icon }: { to: string; label: string; icon: IconType }) => (
  <Link to={to} className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30">
    <Icon className="h-4 w-4" /> {label} <ArrowRight className="h-3.5 w-3.5" />
  </Link>
)

const WorkoutPlanPanel = ({ assignment }: { assignment: ClientWorkoutPlanResponse | null }) => {
  const { t } = useTranslation(['dashboard', 'common'])
  if (!assignment) return <EmptyPanel icon={Dumbbell} title={t('workoutPlan.noActive', { ns: 'dashboard' })} />
  const progress = clampPercentage(assignment.completionPercentage ?? 0)
  return (
    <div className="rounded-xl bg-emerald-50/50 p-4">
      <StatusBadge status={assignment.status} colors={assignmentStatusColors} label={t(`common:enums.assignmentStatus.${assignment.status}`)} />
      <p className="mt-2 font-semibold text-gray-900">{assignment.workoutPlan.name}</p>
      <p className="mt-1 text-xs text-gray-500">{t('workoutPlan.sessionsPerWeek', { count: assignment.workoutPlan.sessionsPerWeek, ns: 'dashboard' })}</p>
      <ProgressBar value={progress} className="mt-3" />
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>{Math.round(progress)}% {t('common:buttons.save')}</span>
        <span>{assignment.completedWorkouts}/{assignment.totalWorkouts}</span>
      </div>
    </div>
  )
}

const NextSessionPanel = ({ session }: { session: TrainingSessionResponse | null }) => {
  const { t } = useTranslation(['dashboard'])
  if (!session) return <EmptyPanel icon={CalendarDays} title={t('nextSession.noUpcoming', { ns: 'dashboard' })} />
  return (
    <div className="rounded-xl bg-blue-50/50 p-4">
      <p className="text-xs font-medium text-blue-600">{t('nextSession.title', { ns: 'dashboard' })}</p>
      <p className="mt-2 font-semibold text-gray-900">{t(`common:enums.trainingType.${session.type}`)}</p>
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-500"><Clock3 className="h-3.5 w-3.5" /> {formatDate(session.startTime)}</div>
        <div className="flex items-center gap-2 text-xs text-gray-500"><Users2 className="h-3.5 w-3.5" /> {session.currentParticipants}/{session.maxParticipants}</div>
      </div>
    </div>
  )
}

const WaterPanel = ({ water, fallbackTarget }: { water: DailyWaterIntakeResponse | null; fallbackTarget: number | null }) => {
  const { t } = useTranslation(['dashboard'])
  const target = water?.targetMl ?? fallbackTarget ?? 0
  const total = water?.totalMl ?? 0
  const progress = clampPercentage(water?.progress ?? 0)
  return (
    <div className="text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
        <Droplets className="h-8 w-8 text-blue-500" />
      </div>
      <p className="mt-3 text-3xl font-bold text-gray-900">{total} <span className="text-base font-normal text-gray-400">ml</span></p>
      <p className="mt-1 text-xs text-gray-500">{t('water.ofTarget', { target, ns: 'dashboard' })}</p>
      <ProgressBar value={progress} className="mt-3" />
    </div>
  )
}

const MembershipPanel = ({ membership, daysRemaining }: { membership: MembershipResponse | null; daysRemaining: number | null }) => {
  const { t } = useTranslation(['dashboard'])
  if (!membership) return <EmptyPanel icon={CreditCard} title={t('membership.notActive', { ns: 'dashboard' })} />
  return (
    <div className="rounded-xl bg-emerald-50/50 p-4">
      <StatusBadge status={membership.status} />
      <p className="mt-2 font-semibold text-gray-900">{membership.type}</p>
      <div className="mt-3 space-y-1">
        <InfoTile icon={CalendarDays} label={t('membership.validUntil', { ns: 'dashboard' })} value={formatDate(membership.endDate)} />
        {daysRemaining !== null && <p className="text-center text-sm font-semibold text-emerald-600">{t('membership.days', { count: daysRemaining, ns: 'dashboard' })}</p>}
      </div>
    </div>
  )
}

const ProgressPanel = ({ goals, latestMeasurement }: { goals: GoalResponse[]; latestMeasurement: BodyMeasurementResponse | null }) => {
  const { t } = useTranslation(['dashboard'])
  return (
    <div className="space-y-3">
      {goals.map((goal) => (
        <div key={goal.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
          <div>
            <p className="text-sm font-medium text-gray-900">{goal.title}</p>
            <p className="text-xs text-gray-500">{t(`common:enums.goalType.${goal.goalType}`)}</p>
          </div>
          <ProgressBar value={goal.progressPercentage ?? 0} className="w-20" />
        </div>
      ))}
      {latestMeasurement && (
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-500">{t('goals.latestMeasurement', { ns: 'dashboard' })}</p>
          <div className="mt-2 flex gap-4 text-sm">
            {latestMeasurement.weight && <span className="font-semibold text-gray-900">{latestMeasurement.weight} kg</span>}
            {latestMeasurement.bodyFatPercentage && <span className="text-gray-500">{latestMeasurement.bodyFatPercentage}% BF</span>}
          </div>
        </div>
      )}
      {goals.length === 0 && !latestMeasurement && <EmptyPanel icon={Target} title={t('goals.noGoals', { ns: 'dashboard' })} />}
    </div>
  )
}

const EmptyPanel = ({ icon: Icon, title }: { icon: IconType; title: string }) => (
  <div className="flex flex-col items-center rounded-xl bg-gray-50 p-6 text-center">
    <Icon className="h-8 w-8 text-gray-300" />
    <p className="mt-2 text-sm text-gray-500">{title}</p>
  </div>
)

const unwrapResult = <T,>(result: PromiseSettledResult<T>, key: keyof DashboardData, errors: DashboardErrors, fallback: T): T => {
  if (result.status === 'fulfilled') return result.value
  errors[key] = 'loadFailed'
  return fallback
}

const getNextUpcomingSession = (sessions: TrainingSessionResponse[]) => {
  const now = Date.now()
  return sessions.find((s) => getAppDateTimeMs(s.startTime) >= now && s.status === 'SCHEDULED') ?? null
}

const getDaysRemaining = (endDate: string) => {
  const date = parseAppDate(endDate)
  if (!date) return 0
  const diff = date.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default Dashboard
