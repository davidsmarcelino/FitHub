import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { CalendarDays, CheckCircle2, Dumbbell, History, ListChecks, Play, Trophy, User2 } from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { StatusBadge, assignmentStatusColors } from '../components/ui/status-badge'
import { useAuthStore } from '../store/useAuthStore'
import { type ClientWorkoutPlanResponse, type WorkoutLogResponse, type WorkoutPlanExerciseResponse, getMyActiveAssignments, getMyAssignments, getMyWorkoutLogs, getWorkoutPlanById } from '../services/workout.service'
import { LogWorkoutModal } from '../components/workouts/LogWorkoutModal'
import { formatDate, clampPercentage } from '../lib/utils'
import { useMountedRef } from '../utils/useMountedRef'
import { ProgressBar } from '../components/ui/progress-bar'
import { EmptyState } from '../components/ui/empty-state'

type WorkoutsState = {
  activeAssignments: ClientWorkoutPlanResponse[]
  allAssignments: ClientWorkoutPlanResponse[]
  recentLogs: WorkoutLogResponse[]
}

const Workouts = () => {
  const { t } = useTranslation(['workouts', 'common'])
  const user = useAuthStore((state) => state.user)
  const roles = useAuthStore((state) => state.roles)
  const isClient = roles.includes('CLIENT')
  const [state, setState] = useState<WorkoutsState>({ activeAssignments: [], allAssignments: [], recentLogs: [] })
  const [isLoading, setIsLoading] = useState(true)
  const mounted = useMountedRef()
  const [error, setError] = useState<string | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<ClientWorkoutPlanResponse | null>(null)
  const [selectedExercises, setSelectedExercises] = useState<WorkoutPlanExerciseResponse[]>([])
  const [isLogOpen, setIsLogOpen] = useState(false)

  const handleStartWorkout = async (assignment: ClientWorkoutPlanResponse) => {
    setSelectedAssignment(assignment)
    try { const plan = await getWorkoutPlanById(assignment.workoutPlan.id); setSelectedExercises(plan.exercises) } catch { setSelectedExercises([]) }
    setIsLogOpen(true)
  }

  const loadData = useCallback(async () => {
    if (!isClient) { setIsLoading(false); return }
    setIsLoading(true); setError(null)
    try {
      const [activeResult, allResult, logsResult] = await Promise.allSettled([getMyActiveAssignments(), getMyAssignments(), getMyWorkoutLogs(0, 5)])
      if (mounted.current) setState({
        activeAssignments: activeResult.status === 'fulfilled' ? activeResult.value : [],
        allAssignments: allResult.status === 'fulfilled' ? allResult.value : [],
        recentLogs: logsResult.status === 'fulfilled' ? logsResult.value.content : [],
      })
    } catch { if (mounted.current) setError(t('errorLoading')) } finally { if (mounted.current) setIsLoading(false) }
  }, [isClient, mounted, t])

  useEffect(() => { void loadData() }, [loadData])

  const titleName = user?.clientProfile?.firstname || user?.clientProfile?.lastname || t('common:fallbacks.client')
  const totalCompleted = useMemo(() => state.allAssignments.reduce((sum, a) => sum + (a.completedWorkouts ?? 0), 0), [state.allAssignments])
  const averageCompletion = useMemo(() => { if (!state.allAssignments.length) return 0; return Math.round(state.allAssignments.reduce((s, a) => s + (a.completionPercentage ?? 0), 0) / state.allAssignments.length) }, [state.allAssignments])

  const handleLogged = async () => { setIsLogOpen(false); setSelectedAssignment(null); setSelectedExercises([]); await loadData() }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{t('subtitle')}, {titleName}</h1>
            <p className="mt-1 text-emerald-100">{t('headerDesc')}</p>
          </div>
          <Link to="/sessions" className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30">
            <CalendarDays className="h-4 w-4" /> {t('viewSessions')}
          </Link>
        </div>
      </div>

      {error && !isLoading && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-emerald-50" />) : (
          <>
            <QuickStat icon={Dumbbell} label={t('summary.activePlans')} value={state.activeAssignments.length.toString()} color="emerald" />
            <QuickStat icon={ListChecks} label={t('summary.loggedWorkouts')} value={totalCompleted.toString()} color="blue" />
            <QuickStat icon={Trophy} label={t('summary.avgCompletion')} value={`${averageCompletion}%`} color="violet" />
          </>
        )}
      </div>

      {/* Active plans + Recent logs */}
      <div className="grid gap-6 xl:grid-cols-[1fr,380px]">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{t('activePlans.title')}</h2>
              <Link to="/trainers" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">{t('activePlans.exploreTrainers')} →</Link>
            </div>
            {isLoading ? <div className="mt-4 grid gap-4 md:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-xl bg-emerald-50" />)}</div> : state.activeAssignments.length ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {state.activeAssignments.map((a) => <WorkoutCard key={a.id} assignment={a} onStart={() => handleStartWorkout(a)} />)}
              </div>
            ) : <EmptyState icon={Dumbbell} title={t('activePlans.empty')} description={t('activePlans.emptyDesc')} actionLabel={t('activePlans.exploreTrainers')} to="/trainers" />}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900">{t('recentLogs.title')}</h2>
            {isLoading ? <div className="mt-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-emerald-50" />)}</div> : state.recentLogs.length ? (
              <div className="mt-4 space-y-3">
                {state.recentLogs.map((log) => <LogRow key={log.id} log={log} />)}
              </div>
            ) : <EmptyState icon={History} title={t('recentLogs.empty')} description={t('recentLogs.emptyDesc')} />}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">{t('planHistory.title')}</h2>
          {isLoading ? <div className="mt-4 space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-emerald-50" />)}</div> : state.allAssignments.length ? (
            <div className="mt-4 space-y-2">
              {state.allAssignments.map((a) => <HistoryRow key={a.id} assignment={a} />)}
            </div>
          ) : <EmptyState icon={CheckCircle2} title={t('planHistory.empty')} description={t('planHistory.emptyDesc')} />}
        </CardContent>
      </Card>

      {selectedAssignment && <LogWorkoutModal isOpen={isLogOpen} onClose={() => { setIsLogOpen(false); setSelectedAssignment(null); setSelectedExercises([]) }} assignment={selectedAssignment} exercises={selectedExercises} onLogged={handleLogged} />}
    </div>
  )
}

const QuickStat = ({ icon: Icon, label, value, color }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; label: string; value: string; color: string }) => (
  <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-soft transition-shadow hover:shadow-soft-md">
    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-violet-100 text-violet-600'}`}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
)

const WorkoutCard = ({ assignment, onStart }: { assignment: ClientWorkoutPlanResponse; onStart: () => void }) => {
  const { t } = useTranslation(['workouts', 'common'])
  const plan = assignment.workoutPlan
  const progress = clampPercentage(assignment.completionPercentage ?? 0)
  const trainerName = [plan.trainer.firstname, plan.trainer.lastname].filter(Boolean).join(' ') || t('detail.trainer')

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-gray-50 p-4 transition-shadow hover:shadow-soft-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <StatusBadge status={assignment.status} colors={assignmentStatusColors} label={t(`common:enums.assignmentStatus.${assignment.status}`)} />
          <h3 className="mt-2 font-semibold text-gray-900">{plan.name}</h3>
          <p className="mt-1 text-xs text-gray-500">{t(`common:enums.difficultyLevel.${plan.difficultyLevel}`)} · {t('planCard.sessionsPerWeek', { count: plan.sessionsPerWeek })}</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">{t('planCard.weeks', { count: plan.durationWeeks })}</span>
      </div>
      <ProgressBar value={progress} className="mt-4" />
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>{Math.round(progress)}%</span>
        <span>{assignment.completedWorkouts}/{assignment.totalWorkouts}</span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-500"><User2 className="h-3.5 w-3.5" /> <span className="truncate">{trainerName}</span></div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onStart} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700">
            <Play className="h-3.5 w-3.5" /> {t('planCard.start')}
          </button>
          <Link to={`/workouts/${assignment.id}`} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">{t('planCard.details')} →</Link>
        </div>
      </div>
    </motion.div>
  )
}

const LogRow = ({ log }: { log: WorkoutLogResponse }) => {
  const { t } = useTranslation(['workouts', 'common'])
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{log.exercise.name}</p>
        <p className="text-xs text-gray-500">{formatDate(log.workoutDate)} · {t(`common:enums.exerciseCategory.${log.exercise.category}`)}</p>
      </div>
      <div className="text-right">
        {log.difficultyRating && <span className="text-xs text-gray-400">RPE {log.difficultyRating}/5</span>}
        <p className="text-xs text-gray-500">{[log.setsCompleted ? `${log.setsCompleted}×${log.repsCompleted}` : null, log.weightUsed ? `${log.weightUsed}kg` : null].filter(Boolean).join(' · ')}</p>
      </div>
    </div>
  )
}

const HistoryRow = ({ assignment }: { assignment: ClientWorkoutPlanResponse }) => {
  const { t } = useTranslation(['workouts', 'common'])
  return (
    <Link to={`/workouts/${assignment.id}`} className="flex items-center justify-between rounded-xl bg-gray-50 p-4 transition hover:bg-emerald-50">
      <div>
        <p className="font-semibold text-gray-900">{assignment.workoutPlan.name}</p>
        <p className="mt-0.5 text-xs text-gray-500">{t('planCard.assignedDate', { date: formatDate(assignment.assignedDate) })}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{t(`common:enums.assignmentStatus.${assignment.status}`)}</span>
        <span className="text-sm font-bold text-emerald-600">{Math.round(assignment.completionPercentage ?? 0)}%</span>
      </div>
    </Link>
  )
}

export default Workouts
