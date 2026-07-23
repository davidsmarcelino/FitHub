import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Dumbbell,
  ListPlus,
  Play,
  Plus,
  ArrowUpDown,
  StopCircle,
  UserPlus,
  Users2,
  XCircle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useAuthStore } from '../store/useAuthStore'
import {
  getMyPlans,
  getAssignedPlans,
  startAssignment,
  completeAssignment,
  cancelAssignment,
  type ClientWorkoutPlanResponse,
  type WorkoutPlanResponse,
} from '../services/workout.service'
import { formatDate, type IconType } from '../lib/utils'
import { EmptyState } from '../components/ui/empty-state'
import { StatusBadge } from '../components/ui/status-badge'
import { CreatePlanModal } from '../components/workouts/CreatePlanModal'
import { AddExerciseModal } from '../components/workouts/AddExerciseModal'
import { AssignPlanModal } from '../components/workouts/AssignPlanModal'
import { PlanExerciseReorder } from '../components/workouts/PlanExerciseReorder'
import { getApiErrorMessage } from '../utils/errorHandler'
import { useMountedRef } from '../utils/useMountedRef'
import toast from '../utils/toast'

const workoutStatusColors: Record<string, string> = {
  ASSIGNED: 'bg-amber-500/10 text-amber-600',
  NOT_STARTED: 'bg-amber-500/10 text-amber-600',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-600',
  COMPLETED: 'bg-emerald-500/10 text-emerald-600',
  CANCELLED: 'bg-red-500/10 text-red-600',
}

const TrainerWorkouts = () => {
  const { t } = useTranslation(['workouts', 'common'])
  const user = useAuthStore((state) => state.user)
  const [plans, setPlans] = useState<WorkoutPlanResponse[]>([])
  const [assignments, setAssignments] = useState<ClientWorkoutPlanResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlanResponse | null>(null)
  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [isReorderOpen, setIsReorderOpen] = useState(false)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const mounted = useMountedRef()

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [plansResult, assignmentsResult] = await Promise.allSettled([
        getMyPlans(0, 20),
        getAssignedPlans(0, 20),
      ])
      if (mounted.current) {
        if (plansResult.status === 'fulfilled') setPlans(plansResult.value.content)
        if (assignmentsResult.status === 'fulfilled') setAssignments(assignmentsResult.value.content)
      }
    } catch {
      // Promise.allSettled handles individual failures
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [mounted])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleOpenAddExercise = (plan: WorkoutPlanResponse) => {
    setSelectedPlan(plan)
    setIsAddExerciseOpen(true)
  }

  const handleOpenAssign = (plan: WorkoutPlanResponse) => {
    setSelectedPlan(plan)
    setIsAssignOpen(true)
  }

  const handleAssignmentAction = async (
    assignmentId: string,
    action: 'start' | 'complete' | 'cancel',
  ) => {
    setActioningId(assignmentId)
    try {
      if (action === 'start') {
        await startAssignment(assignmentId)
        toast.success(t('common:toast.assignmentStarted'))
      } else if (action === 'complete') {
        await completeAssignment(assignmentId)
        toast.success(t('common:toast.assignmentCompleted'))
      } else {
        await cancelAssignment(assignmentId)
        toast.success(t('common:toast.assignmentCancelled'))
      }
      await loadData()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setActioningId(null)
    }
  }

  const trainerName = user?.trainerProfile
    ? `${user.trainerProfile.firstname} ${user.trainerProfile.lastname}`
    : t('detail.trainer')

  const activeAssignments = assignments.filter(
    (a) => a.status === 'IN_PROGRESS' || a.status === 'ASSIGNED',
  )
  const completedAssignments = assignments.filter((a) => a.status === 'COMPLETED')

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              {t('detail.workspaceTitle', { name: trainerName })}
            </h1>
            <p className="mt-1 text-emerald-100">
              {t('detail.workspaceDesc')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/20 px-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30"
          >
            <Plus className="h-4 w-4" />
            {t('createPlan.createButton')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              icon={Dumbbell}
              label={t('detail.myPlans')}
              value={plans.length.toString()}
              detail={t('detail.plansCreated')}
              tone="bg-violet-500"
            />
            <SummaryCard
              icon={Users2}
              label={t('detail.activeAssignments')}
              value={activeAssignments.length.toString()}
              detail={t('detail.plansAssigned')}
              tone="bg-emerald-500"
            />
            <SummaryCard
              icon={CheckCircle2}
              label={t('detail.completedLabel')}
              value={completedAssignments.length.toString()}
              detail={t('detail.completedDetail')}
              tone="bg-blue-500"
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr),minmax(360px,0.8fr)]">
            <Card>
              <CardHeader>
                <CardTitle>{t('activePlans.title')}</CardTitle>
                <CardDescription>{t('detail.plansForClients')}</CardDescription>
              </CardHeader>
              <CardContent>
                {plans.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {plans.slice(0, 6).map((plan) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-border bg-background p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t(`difficulty.${plan.difficultyLevel}`)} · {t('planCard.weeks', { count: plan.durationWeeks })}
                            </p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${plan.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                            {plan.active ? t('detail.active') : t('detail.inactive')}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{plan.description}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{t('detail.exerciseCount', { count: plan.exercises.length })}</span>
                          <span>{t('planCard.sessionsPerWeek', { count: plan.sessionsPerWeek })}</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 rounded-xl text-xs"
                            onClick={() => handleOpenAddExercise(plan)}
                          >
                            <ListPlus className="h-3.5 w-3.5" />
                            {t('planCard.addExercise')}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 rounded-xl text-xs"
                            onClick={() => handleOpenAssign(plan)}
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            {t('planCard.assign')}
                          </Button>
                          {plan.exercises.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl text-xs"
                              onClick={() => {
                                setSelectedPlan(plan)
                                setIsReorderOpen(true)
                              }}
                            >
                              <ArrowUpDown className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Dumbbell}
                    title={t('activePlans.empty')}
                    description={t('detail.createFirst')}
                  />
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('planHistory.title')}</CardTitle>
                  <CardDescription>{t('detail.latestAssignments')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {assignments.length ? (
                    <div className="space-y-3">
                      {assignments.slice(0, 5).map((assignment) => (
                        <div key={assignment.id} className="rounded-xl bg-muted px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {assignment.workoutPlan.name}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {t('planCard.assignedDate', { date: formatDate(assignment.assignedDate) })}
                              </p>
                            </div>
                            <StatusBadge
                              status={assignment.status}
                              colors={workoutStatusColors}
                              label={t(`status.${assignment.status}`)}
                            />
                          </div>
                          {assignment.completionPercentage != null && (
                            <div className="mt-2">
                              <div className="h-1.5 overflow-hidden rounded-full bg-background">
                                <div
                                  className="h-full rounded-full bg-primary transition-all"
                                  style={{ width: `${assignment.completionPercentage}%` }}
                                />
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t('detail.completePercent', { count: Math.round(assignment.completionPercentage) })}
                              </p>
                            </div>
                          )}
                          {assignment.status === 'ASSIGNED' && (
                            <div className="mt-2 flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-xs"
                                disabled={actioningId === assignment.id}
                                onClick={() => handleAssignmentAction(assignment.id, 'start')}
                              >
                                <Play className="h-3 w-3" />
                                {t('assignmentActions.start')}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl text-xs text-destructive hover:text-destructive"
                                disabled={actioningId === assignment.id}
                                onClick={() => handleAssignmentAction(assignment.id, 'cancel')}
                              >
                                <XCircle className="h-3 w-3" />
                                {t('assignmentActions.cancel')}
                              </Button>
                            </div>
                          )}
                          {assignment.status === 'IN_PROGRESS' && (
                            <div className="mt-2 flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl text-xs"
                                disabled={actioningId === assignment.id}
                                onClick={() => handleAssignmentAction(assignment.id, 'complete')}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                {t('assignmentActions.complete')}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl text-xs text-destructive hover:text-destructive"
                                disabled={actioningId === assignment.id}
                                onClick={() => handleAssignmentAction(assignment.id, 'cancel')}
                              >
                                <StopCircle className="h-3 w-3" />
                                {t('assignmentActions.cancel')}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Users2}
                      title={t('planHistory.empty')}
                      description={t('detail.assignToGetStarted')}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      )}

      <CreatePlanModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={async () => {
          setIsCreateOpen(false)
          await loadData()
        }}
      />

      {selectedPlan && (
        <>
          <AddExerciseModal
            isOpen={isAddExerciseOpen}
            onClose={() => {
              setIsAddExerciseOpen(false)
              setSelectedPlan(null)
            }}
            plan={selectedPlan}
            onAdded={async () => {
              setIsAddExerciseOpen(false)
              setSelectedPlan(null)
              await loadData()
            }}
          />
          <AssignPlanModal
            isOpen={isAssignOpen}
            onClose={() => {
              setIsAssignOpen(false)
              setSelectedPlan(null)
            }}
            plan={selectedPlan}
            onAssigned={async () => {
              setIsAssignOpen(false)
              setSelectedPlan(null)
              await loadData()
            }}
          />
          <PlanExerciseReorder
            isOpen={isReorderOpen}
            onClose={() => {
              setIsReorderOpen(false)
              setSelectedPlan(null)
            }}
            plan={selectedPlan}
            onReordered={async () => {
              setIsReorderOpen(false)
              setSelectedPlan(null)
              await loadData()
            }}
          />
        </>
      )}
    </div>
  )
}

const SummaryCard = ({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: IconType
  label: string
  value: string
  detail: string
  tone: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
  >
    <Card className="h-full">
      <CardContent className="flex h-full flex-col justify-between p-5">
          <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

export default TrainerWorkouts
