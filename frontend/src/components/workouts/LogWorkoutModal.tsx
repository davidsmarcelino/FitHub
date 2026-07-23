import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import type {
  ClientWorkoutPlanResponse,
  LogWorkoutRequest,
  WorkoutPlanExerciseResponse,
} from '../../services/workout.service'
import { logWorkout } from '../../services/workout.service'
import { getApiErrorMessage } from '../../utils/errorHandler'
import toast from '../../utils/toast'


type LogWorkoutModalProps = {
  isOpen: boolean
  onClose: () => void
  assignment: ClientWorkoutPlanResponse
  exercises: WorkoutPlanExerciseResponse[]
  onLogged?: () => void | Promise<void>
}

type LogForm = {
  exerciseId: string
  setsCompleted: string
  repsCompleted: string
  weightUsed: string
  durationSeconds: string
  difficulty: string
  notes: string
}

type LogFormErrors = Partial<Record<keyof LogForm, string>>

export const LogWorkoutModal = ({
  isOpen,
  onClose,
  assignment,
  exercises,
  onLogged,
}: LogWorkoutModalProps) => {
  const { t } = useTranslation(['workouts', 'common'])
  const [form, setForm] = useState<LogForm>(() => createInitialForm(exercises))
  const [errors, setErrors] = useState<LogFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const prevIsOpen = useRef(isOpen)

  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setForm(createInitialForm(exercises))
      setErrors({})
    }
    prevIsOpen.current = isOpen
  }, [isOpen, exercises])

  const selectedExercise = useMemo(
    () =>
      exercises.find((exercise) => exercise.exercise.exerciseId === form.exerciseId) ??
      exercises[0],
    [exercises, form.exerciseId],
  )

  const updateField = (field: keyof LogForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateLogForm(form, t)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      toast.error(t('logWorkout.validationError'))
      return
    }

    const payload: LogWorkoutRequest = {
      exerciseId: form.exerciseId,
      clientWorkoutPlanId: assignment.id,
      setsCompleted: toOptionalNumber(form.setsCompleted),
      repsCompleted: toOptionalNumber(form.repsCompleted),
      weightUsed: toOptionalNumber(form.weightUsed),
      durationSeconds: toOptionalNumber(form.durationSeconds),
      difficultRating: toOptionalNumber(form.difficulty),
      notes: form.notes.trim() || undefined,
    }

    setIsSubmitting(true)

    try {
      await logWorkout(payload)
      await onLogged?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('logWorkout.logError')))
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
            className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-soft-lg"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('logWorkout.badge')}
                </p>
                <h2 className="mt-1 text-xl font-bold text-foreground">
                  {assignment.workoutPlan.name}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('logWorkout.title')}
                </p>
              </div>
              <button
                type="button"
                aria-label={t('common:buttons.close')}
                onClick={onClose}
                disabled={isSubmitting}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {exercises.length ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="exerciseId" className="text-xs text-foreground">
                    {t('logWorkout.exercise')}
                  </label>
                  <select
                    id="exerciseId"
                    value={form.exerciseId}
                    onChange={(event) => updateField('exerciseId', event.target.value)}
                    className={`flex h-10 w-full rounded-xl border bg-background px-3 text-sm text-foreground shadow-soft transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring ${
                      errors.exerciseId ? 'border-destructive' : 'border-border'
                    }`}
                  >
                    {exercises.map((exercise) => (
                      <option
                        key={exercise.id}
                        value={exercise.exercise.exerciseId}
                      >
                        {exercise.exercise.name} {t('logWorkout.dayLabel', { n: exercise.dayNumber })}
                      </option>
                    ))}
                  </select>
                  {errors.exerciseId && (
                    <p className="text-xs text-destructive">{errors.exerciseId}</p>
                  )}
                </div>

                {selectedExercise && (
                  <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                    {t('logWorkout.target')}{' '}
                    <span className="font-semibold text-foreground">
                      {[
                        selectedExercise.sets && selectedExercise.reps
                          ? t('detail.setsReps', { sets: selectedExercise.sets, reps: selectedExercise.reps })
                          : null,
                        selectedExercise.durationSeconds
                          ? `${selectedExercise.durationSeconds}s`
                          : null,
                        selectedExercise.restSeconds
                          ? t('detail.restTime', { n: selectedExercise.restSeconds })
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || t('logWorkout.completeAsPrescribed')}
                    </span>
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  <LogInput
                    label={t('logWorkout.sets')}
                    value={form.setsCompleted}
                    error={errors.setsCompleted}
                    onChange={(value) => updateField('setsCompleted', value)}
                    placeholder={t('logWorkout.setsPlaceholder')}
                  />
                  <LogInput
                    label={t('logWorkout.reps')}
                    value={form.repsCompleted}
                    error={errors.repsCompleted}
                    onChange={(value) => updateField('repsCompleted', value)}
                    placeholder={t('logWorkout.repsPlaceholder')}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <LogInput
                    label={t('logWorkout.weight')}
                    value={form.weightUsed}
                    error={errors.weightUsed}
                    onChange={(value) => updateField('weightUsed', value)}
                    placeholder={t('common:labels.optional')}
                    step="0.5"
                    min="0"
                  />
                  <LogInput
                    label={t('logWorkout.duration')}
                    value={form.durationSeconds}
                    error={errors.durationSeconds}
                    onChange={(value) => updateField('durationSeconds', value)}
                    placeholder={t('common:labels.optional')}
                    min="0"
                  />
                  <LogInput
                    label={t('logWorkout.difficulty')}
                    value={form.difficulty}
                    error={errors.difficulty}
                    onChange={(value) => updateField('difficulty', value)}
                    placeholder="3"
                    min="1"
                    max="5"
                  />
                </div>

                <label className="space-y-1.5">
                  <span className="text-xs text-foreground">{t('logWorkout.notes')}</span>
                  <textarea
                    className="min-h-[88px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-soft placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder={t('logWorkout.notesPlaceholder')}
                    value={form.notes}
                    onChange={(event) => updateField('notes', event.target.value)}
                  />
                </label>

                <div className="flex items-center justify-end gap-2">
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
                    disabled={isSubmitting}
                  >
                    {isSubmitting && (
                      <span className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    )}
                    {isSubmitting ? t('logWorkout.logging') : t('logWorkout.logButton')}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                {t('logWorkout.noExercises')}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

const createInitialForm = (exercises: WorkoutPlanExerciseResponse[]): LogForm => ({
  exerciseId: exercises[0]?.exercise.exerciseId ?? '',
  setsCompleted: '',
  repsCompleted: '',
  weightUsed: '',
  durationSeconds: '',
  difficulty: '3',
  notes: '',
})

const toOptionalNumber = (value: string) =>
  value.trim() === '' ? undefined : Number(value)

const validateLogForm = (form: LogForm, t: (key: string) => string): LogFormErrors => {
  const errors: LogFormErrors = {}

  if (!form.exerciseId) errors.exerciseId = t('workouts:logWorkout.validateExercise')
  if (form.setsCompleted && !isIntegerAtLeast(form.setsCompleted, 1)) {
    errors.setsCompleted = t('workouts:logWorkout.validateSets')
  }
  if (form.repsCompleted && !isIntegerAtLeast(form.repsCompleted, 1)) {
    errors.repsCompleted = t('workouts:logWorkout.validateReps')
  }
  if (form.weightUsed && !isNumberAtLeast(form.weightUsed, 0)) {
    errors.weightUsed = t('workouts:logWorkout.validateWeight')
  }
  if (form.durationSeconds && !isIntegerAtLeast(form.durationSeconds, 0)) {
    errors.durationSeconds = t('workouts:logWorkout.validateDuration')
  }
  if (form.difficulty && !isIntegerBetween(form.difficulty, 1, 5)) {
    errors.difficulty = t('workouts:logWorkout.validateDifficulty')
  }

  return errors
}

const isNumberAtLeast = (value: string, min: number) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= min
}

const isIntegerAtLeast = (value: string, min: number) => {
  const numeric = Number(value)
  return Number.isInteger(numeric) && numeric >= min
}

const isIntegerBetween = (value: string, min: number, max: number) => {
  const numeric = Number(value)
  return Number.isInteger(numeric) && numeric >= min && numeric <= max
}

type LogInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  step?: string
  min?: string
  max?: string
}

const LogInput = ({
  label,
  value,
  onChange,
  error,
  placeholder,
  step,
  min = '1',
  max,
}: LogInputProps) => (
  <label className="space-y-1.5">
    <span className="text-xs text-foreground">{label}</span>
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={error ? 'border-destructive' : undefined}
    />
    {error && <span className="text-xs text-destructive">{error}</span>}
  </label>
)
