import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import {
  addExerciseToPlan,
  getActiveExercises,
  type AddExerciseToPlanRequest,
  type ExerciseResponse,
  type WorkoutPlanResponse,
} from '../../services/workout.service'
import { getApiErrorMessage } from '../../utils/errorHandler'
import toast from '../../utils/toast'

type AddExerciseModalProps = {
  isOpen: boolean
  onClose: () => void
  plan: WorkoutPlanResponse
  onAdded: () => Promise<void>
}

type ExerciseForm = {
  exerciseId: string
  dayNumber: string
  orderIndex: string
  sets: string
  reps: string
  durationSeconds: string
  restSeconds: string
  notes: string
}

export const AddExerciseModal = ({
  isOpen,
  onClose,
  plan,
  onAdded,
}: AddExerciseModalProps) => {
  const { t } = useTranslation(['workouts', 'common'])
  const [exercises, setExercises] = useState<ExerciseResponse[]>([])
  const [isLoadingExercises, setIsLoadingExercises] = useState(false)
  const [form, setForm] = useState<ExerciseForm>({
    exerciseId: '',
    dayNumber: '1',
    orderIndex: '1',
    sets: '',
    reps: '',
    durationSeconds: '',
    restSeconds: '',
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    setIsLoadingExercises(true)
    getActiveExercises(0, 200)
      .then((res) => {
        if (!isMounted) return
        setExercises(res.content)
        setForm((prev) => ({
          ...prev,
          exerciseId: res.content[0]?.id ?? '',
        }))
      })
      .catch((err) => {
        if (!isMounted) return
        toast.error(getApiErrorMessage(err, t('addExercise.loadExercisesFailed')))
      })
      .finally(() => { if (isMounted) setIsLoadingExercises(false) })

    const nextOrder = plan.exercises.length + 1
    setForm((prev) => ({
      ...prev,
      orderIndex: String(nextOrder),
    }))

    return () => { isMounted = false }
  }, [isOpen, plan.exercises.length, t])

  const updateField = (field: keyof ExerciseForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!form.exerciseId) newErrors.exerciseId = t('addExercise.validation.exerciseRequired')

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    setIsSubmitting(true)
    try {
      const payload: AddExerciseToPlanRequest = {
        exerciseId: form.exerciseId,
        dayNumber: Number(form.dayNumber),
        orderIndex: Number(form.orderIndex),
        sets: form.sets.trim() ? Number(form.sets) : undefined,
        reps: form.reps.trim() ? Number(form.reps) : undefined,
        durationSeconds: form.durationSeconds.trim() ? Number(form.durationSeconds) : undefined,
        restSeconds: form.restSeconds.trim() ? Number(form.restSeconds) : undefined,
        notes: form.notes.trim() || undefined,
      }
      await addExerciseToPlan(plan.id, payload)
      toast.success(t('addExercise.toastSuccess'))
      await onAdded()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('addExercise.toastError')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-soft-lg"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('addExercise.badge')}
                </p>
                <h2 className="mt-1 text-xl font-bold text-foreground">{t('addExercise.title')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.name}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-emerald-50 hover:text-emerald-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="space-y-1.5">
                <span className="text-xs text-foreground">{t('addExercise.exercise')} *</span>
                <select
                  value={form.exerciseId}
                  onChange={(e) => updateField('exerciseId', e.target.value)}
                  disabled={isLoadingExercises}
                  className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  {isLoadingExercises ? (
                    <option>{t('common:messages.loading')}</option>
                  ) : exercises.length === 0 ? (
                    <option>{t('addExercise.noExercises')}</option>
                  ) : (
                    exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} — {t('common:enums.exerciseCategory.' + ex.category)}
                      </option>
                    ))
                  )}
                </select>
                {errors.exerciseId && <p className="text-xs text-destructive">{errors.exerciseId}</p>}
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-xs text-foreground">{t('addExercise.dayNumber')} *</span>
                  <Input
                    type="number"
                    min={1}
                    max={7}
                    value={form.dayNumber}
                    onChange={(e) => updateField('dayNumber', e.target.value)}
                    required
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-foreground">{t('addExercise.orderIndex')} *</span>
                  <Input
                    type="number"
                    min={1}
                    value={form.orderIndex}
                    onChange={(e) => updateField('orderIndex', e.target.value)}
                    required
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-xs text-foreground">{t('addExercise.sets')}</span>
                  <Input
                    type="number"
                    min={1}
                    value={form.sets}
                    onChange={(e) => updateField('sets', e.target.value)}
                    placeholder={t('common:labels.optional')}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-foreground">{t('addExercise.reps')}</span>
                  <Input
                    type="number"
                    min={1}
                    value={form.reps}
                    onChange={(e) => updateField('reps', e.target.value)}
                    placeholder={t('common:labels.optional')}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-xs text-foreground">{t('addExercise.duration')}</span>
                  <Input
                    type="number"
                    min={0}
                    value={form.durationSeconds}
                    onChange={(e) => updateField('durationSeconds', e.target.value)}
                    placeholder={t('common:labels.optional')}
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-foreground">{t('addExercise.rest')}</span>
                  <Input
                    type="number"
                    min={0}
                    value={form.restSeconds}
                    onChange={(e) => updateField('restSeconds', e.target.value)}
                    placeholder={t('common:labels.optional')}
                  />
                </label>
              </div>

              <label className="space-y-1.5">
                <span className="text-xs text-foreground">{t('addExercise.notes')}</span>
                <textarea
                  className="min-h-[60px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={t('addExercise.notesPlaceholder')}
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-xl px-4"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  {t('common:buttons.cancel')}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:brightness-110 px-4"
                  disabled={isSubmitting || !form.exerciseId}
                >
                  {isSubmitting && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  )}
                  {isSubmitting ? t('addExercise.adding') : t('addExercise.addButton')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
