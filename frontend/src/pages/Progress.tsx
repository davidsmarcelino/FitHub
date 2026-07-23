import { useCallback, useEffect, useState, type ComponentType, type FormEvent, type SVGProps } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Camera,
  CheckCircle2,
  Edit3,
  Footprints,
  HeartPulse,
  Image,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Weight,
  X,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { EmptyState } from '../components/ui/empty-state'
import { formatDate, type IconType } from '../lib/utils'
import { useMountedRef } from '../utils/useMountedRef'
import {
  type BodyMeasurementResponse,
  type CreateBodyMeasurementRequest,
  type CreateGoalRequest,
  type CreatePersonalRecordRequest,
  type CreateProgressPhotoRequest,
  type GoalResponse,
  type GoalType,
  type MeasurementUnit,
  type MeasurementHistoryResponse,
  type PersonalRecordResponse,
  type RecordType,
  type ProgressPhotoResponse,
  createBodyMeasurement,
  createGoal,
  createPersonalRecord,
  createProgressPhoto,
  getActiveGoals,
  getCompletedGoals,
  getMeasurementHistory,
  getPersonalRecords,
  getProgressPhotos,
  updateGoalProgress,
  completeGoal,
} from '../services/progress.service'
import { getApiErrorMessage } from '../utils/errorHandler'
import { getActiveExercises, type ExerciseResponse } from '../services/workout.service'
import toast from '../utils/toast'

type ProgressTab = 'overview' | 'measurements' | 'goals' | 'records' | 'photos'

const getTabs = (t: (key: string) => string): { key: ProgressTab; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] => [
  { key: 'overview', label: t('tabs.overview'), icon: HeartPulse },
  { key: 'measurements', label: t('tabs.measurements'), icon: Weight },
  { key: 'goals', label: t('tabs.goals'), icon: Target },
  { key: 'records', label: t('tabs.records'), icon: Trophy },
  { key: 'photos', label: t('tabs.photos'), icon: Camera },
]

const Progress = () => {
  const { t } = useTranslation(['progress', 'common'])
  const [activeTab, setActiveTab] = useState<ProgressTab>('overview')
  const [history, setHistory] = useState<MeasurementHistoryResponse | null>(null)
  const [activeGoals, setActiveGoals] = useState<GoalResponse[]>([])
  const [completedGoals, setCompletedGoals] = useState<GoalResponse[]>([])
  const [records, setRecords] = useState<PersonalRecordResponse[]>([])
  const [photos, setPhotos] = useState<ProgressPhotoResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const mounted = useMountedRef()

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [historyData, activeGoalsData, completedGoalsData, recordsData, photosData] =
        await Promise.allSettled([
          getMeasurementHistory(),
          getActiveGoals(0, 10),
          getCompletedGoals(0, 5),
          getPersonalRecords(0, 10),
          getProgressPhotos(0, 10),
        ])

      if (mounted.current) {
        if (historyData.status === 'fulfilled') setHistory(historyData.value)
        if (activeGoalsData.status === 'fulfilled') setActiveGoals(activeGoalsData.value.content)
        if (completedGoalsData.status === 'fulfilled') setCompletedGoals(completedGoalsData.value.content)
        if (recordsData.status === 'fulfilled') setRecords(recordsData.value.content)
        if (photosData.status === 'fulfilled') setPhotos(photosData.value.content)
      }
    } catch {
      toast.error(t('common:toast.progressLoadFailed'))
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [mounted, t])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  return (
    <div className="space-y-6">
      {/* Gradient header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
        <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-emerald-100">{t('subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1" role="tablist">
        {getTabs(t).map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <OverviewTab history={history} goals={activeGoals} records={records} />
          )}
          {activeTab === 'measurements' && (
            <MeasurementsTab history={history} onRefresh={loadAll} />
          )}
          {activeTab === 'goals' && (
            <GoalsTab
              activeGoals={activeGoals}
              completedGoals={completedGoals}
              onRefresh={loadAll}
            />
          )}
          {activeTab === 'records' && (
            <RecordsTab records={records} onRefresh={loadAll} />
          )}
          {activeTab === 'photos' && (
            <PhotosTab photos={photos} onRefresh={loadAll} />
          )}
        </>
      )}
    </div>
  )
}

const OverviewTab = ({
  history,
  goals,
  records,
}: {
  history: MeasurementHistoryResponse | null
  goals: GoalResponse[]
  records: PersonalRecordResponse[]
}) => {
  const { t } = useTranslation(['progress', 'common'])
  const latest = history?.measurements[0] ?? null
  const trends = history?.trends ?? null

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Weight}
          label={t('overview.currentWeight')}
          value={latest?.weight != null ? `${latest.weight} kg` : '—'}
          change={trends?.totalWeightChange}
          unit="kg"
        />
        <MetricCard
          icon={HeartPulse}
          label={t('overview.bodyFat')}
          value={latest?.bodyFatPercentage != null ? `${latest.bodyFatPercentage}%` : '—'}
          change={trends?.totalBodyFatChange}
          unit="%"
        />
        <MetricCard
          icon={Target}
          label={t('overview.activeGoals')}
          value={goals.length.toString()}
          detail={t('overview.completed', { count: goals.filter((g) => g.progressPercentage >= 100).length })}
        />
        <MetricCard
          icon={Trophy}
          label={t('overview.personalRecords')}
          value={records.length.toString()}
          detail={t('overview.totalRecords')}
        />
      </section>

      {trends && trends.measurementCount > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('overview.trends')}</CardTitle>
            <CardDescription>
              {t('overview.trendDays', { count: trends.measurementCount, days: trends.daysSinceFirst })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <TrendTile
                label={t('trend.weight')}
                change={trends.totalWeightChange}
                unit="kg"
              />
              <TrendTile
                label={t('trend.bodyFat')}
                change={trends.totalBodyFatChange}
                unit="%"
              />
              <TrendTile
                label={t('trend.muscleMass')}
                change={trends.totalMuscleMassChange}
                unit="kg"
                inverted
              />
            </div>
          </CardContent>
        </Card>
      )}

      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('overview.activeGoalsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goals.slice(0, 3).map((goal) => (
                <GoalRow key={goal.id} goal={goal} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('overview.recentRecords')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {records.slice(0, 3).map((record) => (
                <RecordRow key={record.id} record={record} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!latest && goals.length === 0 && records.length === 0 && (
        <EmptyState
          icon={Footprints}
          title={t('overview.noData')}
          description={t('overview.noDataDesc')}
        />
      )}
    </div>
  )
}

const MeasurementsTab = ({
  history,
  onRefresh,
}: {
  history: MeasurementHistoryResponse | null
  onRefresh: () => Promise<void>
}) => {
  const { t } = useTranslation(['progress', 'common'])
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleCreated = async () => {
    setIsCreateOpen(false)
    toast.success(t('common:toast.measurementSaved'))
    await onRefresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          {t('measurements.addButton')}
        </button>
      </div>

      {history && history.measurements.length > 0 ? (
        <div className="space-y-4">
          {history.measurements.map((m) => (
            <MeasurementCard key={m.id} measurement={m} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Weight}
          title={t('measurements.noData')}
          description={t('measurements.noDataDesc')}
        />
      )}

      {isCreateOpen && (
        <CreateMeasurementModal onClose={() => setIsCreateOpen(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}

const GoalsTab = ({
  activeGoals,
  completedGoals,
  onRefresh,
}: {
  activeGoals: GoalResponse[]
  completedGoals: GoalResponse[]
  onRefresh: () => Promise<void>
}) => {
  const { t } = useTranslation(['progress', 'common'])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null)

  const handleCreated = async () => {
    setIsCreateOpen(false)
    toast.success(t('common:toast.goalCreated'))
    await onRefresh()
  }

  const handleUpdateProgress = async (goalId: string, currentValue: number) => {
    setUpdatingGoalId(goalId)
    try {
      await updateGoalProgress(goalId, { currentValue })
      toast.success(t('common:toast.progressUpdated'))
      await onRefresh()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common:messages.failed')))
    } finally {
      setUpdatingGoalId(null)
    }
  }

  const handleComplete = async (goalId: string) => {
    try {
      await completeGoal(goalId)
      toast.success(t('common:toast.goalCompleted'))
      await onRefresh()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common:messages.failed')))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          {t('goals.newButton')}
        </button>
      </div>

      {activeGoals.length > 0 && (
        <div className="space-y-4">
          {activeGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              isUpdating={updatingGoalId === goal.id}
              onUpdateProgress={handleUpdateProgress}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}

      {completedGoals.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            {t('goals.completedSection')}
          </h3>
          <div className="space-y-3">
            {completedGoals.map((goal) => (
              <GoalRow key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {activeGoals.length === 0 && completedGoals.length === 0 && (
        <EmptyState
          icon={Target}
          title={t('goals.noData')}
          description={t('goals.noDataDesc')}
        />
      )}

      {isCreateOpen && (
        <CreateGoalModal onClose={() => setIsCreateOpen(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}

const RecordsTab = ({
  records,
  onRefresh,
}: {
  records: PersonalRecordResponse[]
  onRefresh: () => Promise<void>
}) => {
  const { t } = useTranslation(['progress', 'common'])
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleCreated = async () => {
    setIsCreateOpen(false)
    toast.success(t('common:toast.recordSaved'))
    await onRefresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          {t('records.addButton')}
        </button>
      </div>

      {records.length > 0 ? (
        <div className="space-y-3">
          {records.map((record) => (
            <RecordCard key={record.id} record={record} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title={t('records.noData')}
          description={t('records.noDataDesc')}
        />
      )}

      {isCreateOpen && (
        <CreateRecordModal onClose={() => setIsCreateOpen(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}

const PhotosTab = ({
  photos,
  onRefresh,
}: {
  photos: ProgressPhotoResponse[]
  onRefresh: () => Promise<void>
}) => {
  const { t } = useTranslation('progress')
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:brightness-110"
        >
          <Camera className="h-4 w-4" />
          {t('photos.addButton')}
        </button>
      </div>

      {photos.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Image}
          title={t('photos.noData')}
          description={t('photos.noDataDesc')}
        />
      )}

      {isUploadOpen && (
        <CreatePhotoModal
          onClose={() => setIsUploadOpen(false)}
          onCreated={async () => {
            setIsUploadOpen(false)
            await onRefresh()
          }}
        />
      )}
    </div>
  )
}

const TrendTile = ({
  label,
  change,
  unit,
  inverted = false,
}: {
  label: string
  change: number | null
  unit: string
  inverted?: boolean
}) => {
  const isPositive = change != null && (inverted ? change >= 0 : change <= 0)
  return (
    <div className="rounded-xl bg-muted px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-foreground'}`}>
        {change != null ? `${change > 0 ? '+' : ''}${change.toFixed(1)} ${unit}` : '—'}
      </p>
    </div>
  )
}

const MetricCard = ({
  icon: Icon,
  label,
  value,
  change,
  unit,
  detail,
}: {
  icon: IconType
  label: string
  value: string
  change?: number | null
  unit?: string
  detail?: string
}) => (
  <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
        {change != null && unit && (
          <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${change <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {change <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {change > 0 ? '+' : ''}{change.toFixed(1)} {unit}
          </p>
        )}
        {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </CardContent>
  </Card>
)

const MeasurementCard = ({ measurement }: { measurement: BodyMeasurementResponse }) => {
  const { t } = useTranslation(['progress', 'common'])
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {formatDate(measurement.measurementDate)}
          </p>
          {measurement.notes && (
            <p className="mt-1 text-xs text-muted-foreground">{measurement.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {measurement.weightChange != null && (
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${measurement.weightChange <= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
              {measurement.weightChange > 0 ? '+' : ''}{measurement.weightChange.toFixed(1)} kg
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MeasurementTile label={t('measurement.weight')} value={measurement.weight} unit="kg" />
        <MeasurementTile label={t('measurement.bodyFat')} value={measurement.bodyFatPercentage} unit="%" />
        <MeasurementTile label={t('measurement.muscle')} value={measurement.muscleMass} unit="kg" />
        <MeasurementTile label={t('measurement.bmi')} value={measurement.bmi} unit="" />
      </div>
    </motion.div>
  )
}

const PhotoCard = ({ photo }: { photo: ProgressPhotoResponse }) => {
  const [imgError, setImgError] = useState(false)
  const { t } = useTranslation(['progress', 'common'])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {photo.photoUrl && !imgError ? (
          <img
            src={photo.photoUrl}
            alt={`Progress photo ${formatDate(photo.photoDate)}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <Image className="h-12 w-12 text-muted-foreground/40" />
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{formatDate(photo.photoDate)}</p>
          <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
            {t(`photos.modal.angles.${({ FRONT: 'front', BACK: 'back', SIDE_LEFT: 'sideLeft', SIDE_RIGHT: 'sideRight' } as const)[photo.angle]}`)}
          </span>
        </div>
        {photo.notes && (
          <p className="mt-2 text-xs text-muted-foreground">{photo.notes}</p>
        )}
      </div>
    </motion.div>
  )
}

const MeasurementTile = ({
  label,
  value,
  unit,
}: {
  label: string
  value: number | null
  unit: string
}) => (
  <div className="rounded-xl bg-muted px-3 py-2">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-sm font-semibold text-foreground">
      {value === null ? '—' : `${value}${unit ? ` ${unit}` : ''}`}
    </p>
  </div>
)

const GoalRow = ({ goal }: { goal: GoalResponse }) => {
  const { t } = useTranslation(['progress', 'common'])
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{goal.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t(`goals.modal.types.${goal.goalType.toLowerCase()}`)} · {goal.currentValue}/{goal.targetValue} {goal.unit.toLowerCase()}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {Math.round(goal.progressPercentage)}%
        </span>
      </div>
    </div>
  )
}

const GoalCard = ({
  goal,
  isUpdating,
  onUpdateProgress,
  onComplete,
}: {
  goal: GoalResponse
  isUpdating: boolean
  onUpdateProgress: (goalId: string, currentValue: number) => Promise<void>
  onComplete: (goalId: string) => Promise<void>
}) => {
  const [newValues, setNewValues] = useState(goal.currentValue.toString())
  const { t } = useTranslation(['progress', 'common'])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-foreground">{goal.title}</p>
          {goal.description && (
            <p className="mt-1 text-sm text-muted-foreground">{goal.description}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {t(`goals.modal.types.${goal.goalType.toLowerCase()}`)} · {goal.unit.toLowerCase()}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {Math.round(goal.progressPercentage)}%
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">
          {goal.currentValue} / {goal.targetValue} {goal.unit.toLowerCase()}
        </span>
        {goal.daysRemaining != null && (
          <span className="text-muted-foreground">· {goal.daysRemaining} {t('goals.daysLeft')}</span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Input
          type="number"
          value={newValues}
          onChange={(e) => setNewValues(e.target.value)}
          className="h-9 w-28 text-sm"
          placeholder={t('goals.update')}
        />
        <button
          type="button"
          disabled={isUpdating}
          onClick={() => void onUpdateProgress(goal.id, Number(newValues))}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          <Edit3 className="h-3 w-3" />
          {t('goals.update')}
        </button>
        {goal.progressPercentage >= 100 && (
          <button
            type="button"
            onClick={() => void onComplete(goal.id)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition hover:bg-accent"
          >
            <CheckCircle2 className="h-3 w-3" />
            {t('goals.complete')}
          </button>
        )}
      </div>
    </motion.div>
  )
}

const RecordRow = ({ record }: { record: PersonalRecordResponse }) => {
  const { t } = useTranslation(['progress', 'common'])
  return (
    <div className="rounded-2xl border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{record.exercise.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t(`records.modal.types.${record.recordType.toLowerCase()}`)} · {record.value} {record.unit.toLowerCase()}
          </p>
        </div>
        {record.improvement != null && record.improvement > 0 && (
          <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600">
            +{record.improvement}
          </span>
        )}
      </div>
    </div>
  )
}

const RecordCard = ({ record }: { record: PersonalRecordResponse }) => {
  const { t } = useTranslation(['progress', 'common'])
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{record.exercise.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t(`common:enums.exerciseCategory.${record.exercise.category}`)} · {formatDate(record.recordDate)}
          </p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
          <Trophy className="h-4 w-4 text-amber-600" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-muted px-3 py-2">
          <p className="text-xs text-muted-foreground">{t(`records.modal.types.${record.recordType.toLowerCase()}`)}</p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {record.value} {record.unit.toLowerCase()}
          </p>
        </div>
        {record.previousRecord != null && (
          <div className="rounded-xl bg-muted px-3 py-2">
            <p className="text-xs text-muted-foreground">{t('records.previous')}</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              {record.previousRecord} {record.unit.toLowerCase()}
            </p>
          </div>
        )}
      </div>
      {record.improvement != null && record.improvement > 0 && (
        <p className="mt-3 text-xs font-medium text-emerald-600">
          {t('records.improvedBy', { value: record.improvement, unit: record.unit.toLowerCase() })}
        </p>
      )}
    </motion.div>
  )
}

const CreateMeasurementModal = ({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => Promise<void>
}) => {
  const { t } = useTranslation(['progress', 'common'])
  const [form, setForm] = useState<CreateBodyMeasurementRequest>({
    weight: undefined,
    bodyFatPercentage: undefined,
    muscleMass: undefined,
    bmi: undefined,
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createBodyMeasurement(form)
      await onCreated()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common:messages.failed')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm" onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-soft-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('measurements.modal.title')}
            </p>
            <h2 className="mt-1 text-xl font-bold text-foreground">{t('measurements.modal.title')}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <ModalInput label={t('measurements.modal.weight')} type="number" step="0.1" value={form.weight?.toString() ?? ''} onChange={(v) => setForm((p) => ({ ...p, weight: v ? Number(v) : undefined }))} />
            <ModalInput label={t('measurements.modal.bodyFat')} type="number" step="0.1" value={form.bodyFatPercentage?.toString() ?? ''} onChange={(v) => setForm((p) => ({ ...p, bodyFatPercentage: v ? Number(v) : undefined }))} />
            <ModalInput label={t('measurements.modal.muscleMass')} type="number" step="0.1" value={form.muscleMass?.toString() ?? ''} onChange={(v) => setForm((p) => ({ ...p, muscleMass: v ? Number(v) : undefined }))} />
            <ModalInput label={t('measurements.modal.bmi')} type="number" step="0.1" value={form.bmi?.toString() ?? ''} onChange={(v) => setForm((p) => ({ ...p, bmi: v ? Number(v) : undefined }))} />
          </div>
          <label className="space-y-1.5">
            <span className="text-xs text-foreground">{t('measurements.modal.notes')}</span>
            <textarea
              className="min-h-[72px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t('measurements.modal.notesPlaceholder')}
              value={form.notes ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value || undefined }))}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-60">
              {t('common:buttons.cancel')}
            </button>
            <button type="submit" disabled={isSubmitting} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">
              {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />}
              {t('common:buttons.save')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

const CreateGoalModal = ({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => Promise<void>
}) => {
  const { t } = useTranslation(['progress', 'common'])
  const [form, setForm] = useState<{
    title: string
    goalType: GoalType
    targetValue: string
    unit: MeasurementUnit
    description: string
  }>({
    title: '',
    goalType: 'WEIGHT_LOSS',
    targetValue: '',
    unit: 'KG',
    description: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.targetValue) return
    setIsSubmitting(true)
    try {
      const payload: CreateGoalRequest = {
        title: form.title.trim(),
        goalType: form.goalType,
        targetValue: Number(form.targetValue),
        unit: form.unit,
        description: form.description.trim() || undefined,
      }
      await createGoal(payload)
      await onCreated()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common:messages.failed')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm" onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-soft-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('goals.modal.title')}</p>
            <h2 className="mt-1 text-xl font-bold text-foreground">{t('goals.modal.title')}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ModalInput label={t('goals.modal.goalTitle')} value={form.title} onChange={(v) => setForm((p) => ({ ...p, title: v }))} placeholder={t('goals.modal.goalTitlePlaceholder')} />
          <label className="space-y-1.5">
            <span className="text-xs text-foreground">{t('goals.modal.goalType')}</span>
            <select
              value={form.goalType}
              onChange={(e) => setForm((p) => ({ ...p, goalType: e.target.value as GoalType }))}
              className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="WEIGHT_LOSS">{t('goals.modal.types.weightLoss')}</option>
              <option value="MUSCLE_GAIN">{t('goals.modal.types.muscleGain')}</option>
              <option value="ENDURANCE">{t('goals.modal.types.endurance')}</option>
              <option value="STRENGTH">{t('goals.modal.types.strength')}</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <ModalInput label={t('goals.modal.targetValue')} type="number" value={form.targetValue} onChange={(v) => setForm((p) => ({ ...p, targetValue: v }))} />
            <label className="space-y-1.5">
              <span className="text-xs text-foreground">{t('goals.modal.unit')}</span>
              <select
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value as MeasurementUnit }))}
                className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="KG">{t('goals.modal.units.kg')}</option>
                <option value="CM">{t('goals.modal.units.cm')}</option>
                <option value="MINUTES">{t('goals.modal.units.minutes')}</option>
                <option value="REPS">{t('goals.modal.units.reps')}</option>
              </select>
            </label>
          </div>
          <ModalInput label={t('goals.modal.description')} value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} placeholder={t('goals.modal.descriptionPlaceholder')} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-60">
              {t('common:buttons.cancel')}
            </button>
            <button type="submit" disabled={isSubmitting || !form.title.trim() || !form.targetValue} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">
              {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />}
              {t('goals.modal.createButton')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

const CreateRecordModal = ({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => Promise<void>
}) => {
  const { t } = useTranslation(['progress', 'common'])
  const [form, setForm] = useState<{
    exerciseId: string
    recordType: RecordType
    value: string
    unit: string
    notes: string
  }>({
    exerciseId: '',
    recordType: 'MAX_WEIGHT',
    value: '',
    unit: 'KG',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [exercises, setExercises] = useState<ExerciseResponse[]>([])
  const [exerciseSearch, setExerciseSearch] = useState('')

  useEffect(() => {
    void getActiveExercises(0, 100).then((res) => setExercises(res.content)).catch(() => {})
  }, [])

  const filteredExercises = exerciseSearch
    ? exercises.filter((e) => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
    : exercises

  const selectedExercise = exercises.find((e) => e.id === form.exerciseId)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.exerciseId.trim() || !form.value) return
    setIsSubmitting(true)
    try {
      const payload: CreatePersonalRecordRequest = {
        exerciseId: form.exerciseId.trim(),
        recordType: form.recordType,
        value: Number(form.value),
        unit: form.unit as CreatePersonalRecordRequest['unit'],
        notes: form.notes.trim() || undefined,
      }
      await createPersonalRecord(payload)
      await onCreated()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common:messages.failed')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm" onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-soft-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('records.modal.title')}</p>
            <h2 className="mt-1 text-xl font-bold text-foreground">{t('records.modal.title')}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="space-y-1.5">
            <span className="text-xs text-foreground">{t('records.modal.exerciseId')}</span>
            <div className="relative">
              <Input
                value={selectedExercise ? selectedExercise.name : exerciseSearch}
                onChange={(e) => { setExerciseSearch(e.target.value); setForm((p) => ({ ...p, exerciseId: '' })) }}
                placeholder={t('records.modal.exerciseIdPlaceholder')}
              />
              {exerciseSearch && !form.exerciseId && filteredExercises.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-card shadow-soft-lg">
                  {filteredExercises.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => { setForm((p) => ({ ...p, exerciseId: ex.id })); setExerciseSearch('') }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-accent"
                    >
                      <span className="font-medium text-foreground">{ex.name}</span>
                      <span className="text-xs text-muted-foreground">{ex.primaryMuscleGroup}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-foreground">{t('records.modal.recordType')}</span>
            <select
              value={form.recordType}
              onChange={(e) => setForm((p) => ({ ...p, recordType: e.target.value as RecordType }))}
              className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="MAX_WEIGHT">{t('records.modal.types.maxWeight')}</option>
              <option value="MAX_REPS">{t('records.modal.types.maxReps')}</option>
              <option value="MAX_DISTANCE">{t('records.modal.types.maxDistance')}</option>
              <option value="BEST_TIME">{t('records.modal.types.bestTime')}</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <ModalInput label={t('records.modal.value')} type="number" value={form.value} onChange={(v) => setForm((p) => ({ ...p, value: v }))} />
            <label className="space-y-1.5">
              <span className="text-xs text-foreground">{t('records.modal.unit')}</span>
              <select
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="KG">{t('records.modal.units.kg')}</option>
                <option value="REPS">{t('records.modal.units.reps')}</option>
                <option value="SECONDS">{t('records.modal.units.seconds')}</option>
                <option value="METERS">{t('records.modal.units.meters')}</option>
              </select>
            </label>
          </div>
          <ModalInput label={t('records.modal.notes')} value={form.notes} onChange={(v) => setForm((p) => ({ ...p, notes: v }))} placeholder={t('records.modal.notesPlaceholder')} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-60">
              {t('common:buttons.cancel')}
            </button>
            <button type="submit" disabled={isSubmitting || !form.exerciseId.trim() || !form.value} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">
              {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />}
              {t('records.modal.saveButton')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

const ModalInput = ({
  label,
  value,
  onChange,
  type = 'text',
  step,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  step?: string
  placeholder?: string
}) => (
  <label className="space-y-1.5">
    <span className="text-xs text-foreground">{label}</span>
    <input
      type={type}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
    />
  </label>
)

const CreatePhotoModal = ({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => Promise<void>
}) => {
  const { t } = useTranslation(['progress', 'common'])
  const [form, setForm] = useState<{
    photoUrl: string
    angle: CreateProgressPhotoRequest['angle']
    notes: string
  }>({
    photoUrl: '',
    angle: 'FRONT',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.photoUrl.trim()) return
    setIsSubmitting(true)
    try {
      await createProgressPhoto({
        photoUrl: form.photoUrl.trim(),
        angle: form.angle,
        notes: form.notes.trim() || undefined,
      })
      await onCreated()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common:messages.failed')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm" onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-soft-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('photos.modal.title')}</p>
            <h2 className="mt-1 text-xl font-bold text-foreground">{t('photos.modal.title')}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ModalInput label={t('photos.modal.photoUrl')} value={form.photoUrl} onChange={(v) => setForm((p) => ({ ...p, photoUrl: v }))} placeholder={t('photos.modal.photoUrlPlaceholder')} />
          <label className="space-y-1.5">
            <span className="text-xs text-foreground">{t('photos.modal.angle')}</span>
            <select
              value={form.angle}
              onChange={(e) => setForm((p) => ({ ...p, angle: e.target.value as CreateProgressPhotoRequest['angle'] }))}
              className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="FRONT">{t('photos.modal.angles.front')}</option>
              <option value="BACK">{t('photos.modal.angles.back')}</option>
              <option value="SIDE_LEFT">{t('photos.modal.angles.sideLeft')}</option>
              <option value="SIDE_RIGHT">{t('photos.modal.angles.sideRight')}</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-foreground">{t('photos.modal.notes')}</span>
            <textarea
              className="min-h-[72px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t('photos.modal.notesPlaceholder')}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-60">
              {t('common:buttons.cancel')}
            </button>
            <button type="submit" disabled={isSubmitting || !form.photoUrl.trim()} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">
              {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />}
              {t('photos.modal.uploadButton')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default Progress
