import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Dumbbell, Plus, Search, X } from 'lucide-react'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { EmptyState } from '../components/ui/empty-state'
import { Pagination } from '../components/ui/pagination'
import {
  getExercises,
  getExercisesByCategory,
  getExercisesByMuscleGroup,
  createExercise,
  updateExercise,
  activateExercise,
  deactivateExercise,
  type ExerciseResponse,
  type CreateExerciseRequest,
  type ExerciseCategory,
  type MuscleGroup,
} from '../services/workout.service'
import { getApiErrorMessage } from '../utils/errorHandler'
import toast from '../utils/toast'

const exerciseCategories: ExerciseCategory[] = [
  'STRENGTH', 'CARDIO', 'FLEXIBILITY', 'BALANCE', 'PLYOMETRIC',
  'OLYMPIC_LIFTING', 'POWERLIFTING', 'CALISTHENICS', 'STRETCHING', 'YOGA', 'PILATES',
]

const muscleGroups: MuscleGroup[] = [
  'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS', 'CORE', 'ABS',
  'OBLIQUES', 'LOWER_BACK', 'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'FULL_BODY',
]

const ExerciseManagement = () => {
  const { t } = useTranslation(['admin', 'common'])
  const [exercises, setExercises] = useState<ExerciseResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<ExerciseCategory | ''>('')
  const [filterMuscleGroup, setFilterMuscleGroup] = useState<MuscleGroup | ''>('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<ExerciseResponse | null>(null)

  const loadExercises = useCallback(async (page = 0, searchQuery?: string, category?: ExerciseCategory, muscleGroup?: MuscleGroup) => {
    setIsLoading(true)
    try {
      let result
      if (category) {
        result = await getExercisesByCategory(category, 0, 100)
      } else if (muscleGroup) {
        result = await getExercisesByMuscleGroup(muscleGroup, 0, 100)
      } else {
        result = await getExercises(searchQuery ? 0 : page, searchQuery ? 100 : 12)
      }
      let filtered = result.content
      if (searchQuery) {
        filtered = filtered.filter(
          (e) =>
            e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.category.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      }
      setExercises(filtered)
      setTotalPages(searchQuery || category || muscleGroup ? 1 : result.totalPages)
      setCurrentPage(page)
    } catch {
      toast.error(t('common:errors.loadFailed'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadExercises()
  }, [loadExercises])

  const handleSearch = () => {
    void loadExercises(0, search.trim() || undefined, filterCategory || undefined, filterMuscleGroup || undefined)
  }

  const handleFilterChange = (category: ExerciseCategory | '', muscleGroup: MuscleGroup | '') => {
    setFilterCategory(category)
    setFilterMuscleGroup(muscleGroup)
    void loadExercises(0, search.trim() || undefined, category || undefined, muscleGroup || undefined)
  }

  const handleToggleActive = async (exercise: ExerciseResponse) => {
    try {
      if (exercise.active) {
        await deactivateExercise(exercise.id)
        toast.success(t('common:messages.updated'))
      } else {
        await activateExercise(exercise.id)
        toast.success(t('common:messages.updated'))
      }
      await loadExercises(currentPage, search.trim() || undefined, filterCategory || undefined, filterMuscleGroup || undefined)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{t('exercises.title')}</h1>
            <p className="mt-1 text-emerald-100">{t('exercises.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/20 px-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30"
          >
            <Plus className="h-4 w-4" />
            {t('exercises.create')}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder={t('common:labels.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <select
          value={filterCategory}
          onChange={(e) => handleFilterChange(e.target.value as ExerciseCategory | '', filterMuscleGroup)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="">{t('exercises.allCategories')}</option>
          {exerciseCategories.map((c) => (
            <option key={c} value={c}>{t(`common:enums.exerciseCategory.${c}`)}</option>
          ))}
        </select>
        <select
          value={filterMuscleGroup}
          onChange={(e) => handleFilterChange(filterCategory, e.target.value as MuscleGroup | '')}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="">{t('exercises.allMuscleGroups')}</option>
          {muscleGroups.map((m) => (
            <option key={m} value={m}>{t(`common:enums.muscleGroup.${m}`)}</option>
          ))}
        </select>
        <Button variant="outline" onClick={handleSearch}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : exercises.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exercises.map((exercise) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{exercise.name}</h3>
                      <p className="text-xs text-muted-foreground">{t(`common:enums.exerciseCategory.${exercise.category}`)}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      exercise.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {exercise.active ? t('common:status.active') : t('common:status.inactive')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t(`common:enums.muscleGroup.${exercise.primaryMuscleGroup}`)}</p>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingExercise(exercise)}
                  >
                    {t('common:buttons.edit')}
                  </Button>
                  <Button
                    variant={exercise.active ? 'outline' : 'default'}
                    size="sm"
                    className={exercise.active ? 'text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30' : ''}
                    onClick={() => void handleToggleActive(exercise)}
                  >
                    {exercise.active ? t('exercises.deactivate') : t('exercises.activate')}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => void loadExercises(page, search.trim() || undefined)}
            />
          </div>
        </>
      ) : (
        <EmptyState
          icon={Dumbbell}
          title={t('common:messages.noData')}
          description={t('exercises.subtitle')}
        />
      )}

      {isCreateModalOpen && (
        <ExerciseFormModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            void loadExercises(currentPage, search.trim() || undefined)
          }}
        />
      )}

      {editingExercise && (
        <ExerciseFormModal
          exercise={editingExercise}
          onClose={() => setEditingExercise(null)}
          onSuccess={() => {
            setEditingExercise(null)
            void loadExercises(currentPage, search.trim() || undefined)
          }}
        />
      )}
    </div>
  )
}

const ExerciseFormModal = ({
  exercise,
  onClose,
  onSuccess,
}: {
  exercise?: ExerciseResponse
  onClose: () => void
  onSuccess: () => void
}) => {
  const { t } = useTranslation(['admin', 'common'])
  const [form, setForm] = useState<CreateExerciseRequest>({
    name: exercise?.name ?? '',
    description: exercise?.description ?? '',
    category: exercise?.category ?? 'STRENGTH',
    primaryMuscleGroup: exercise?.primaryMuscleGroup ?? 'CHEST',
    secondaryMuscleGroups: exercise?.secondaryMuscleGroups ?? [],
    instructions: exercise?.instructions ?? '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (exercise) {
        await updateExercise(exercise.id, form)
      } else {
        await createExercise(form)
      }
      toast.success(t('common:messages.saved'))
      onSuccess()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-soft-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {exercise ? t('exercises.edit') : t('exercises.create')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:bg-accent"
            aria-label={t('common:buttons.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('exercises.name')}</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t('exercises.description')}</Label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={3}
              className="flex w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-soft focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('exercises.category')}</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as ExerciseCategory })}
                className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground shadow-soft focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {exerciseCategories.map((cat) => (
                  <option key={cat} value={cat}>{t(`common:enums.exerciseCategory.${cat}`)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>{t('exercises.muscleGroup')}</Label>
              <select
                value={form.primaryMuscleGroup}
                onChange={(e) => setForm({ ...form, primaryMuscleGroup: e.target.value as MuscleGroup })}
                className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground shadow-soft focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {muscleGroups.map((mg) => (
                  <option key={mg} value={mg}>{t(`common:enums.muscleGroup.${mg}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common:buttons.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common:buttons.loading') : t('common:buttons.save')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default ExerciseManagement
