import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Input } from '../ui/input'
import { createWorkoutPlan, type CreateWorkoutPlanRequest } from '../../services/workout.service'
import { getApiErrorMessage } from '../../utils/errorHandler'
import toast from '../../utils/toast'

type CreatePlanModalProps = {
  isOpen: boolean
  onClose: () => void
  onCreated: () => Promise<void>
}

const difficultyOptions = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

export const CreatePlanModal = ({ isOpen, onClose, onCreated }: CreatePlanModalProps) => {
  const { t } = useTranslation(['workouts', 'common'])
  const [form, setForm] = useState({
    name: '',
    description: '',
    difficultyLevel: 'INTERMEDIATE',
    durationWeeks: '4',
    sessionsPerWeek: '3',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) newErrors.name = t('createPlan.validation.nameRequired')

    const weeks = Number(form.durationWeeks)
    if (!Number.isFinite(weeks) || weeks < 1) newErrors.durationWeeks = t('createPlan.validation.weeksInvalid')

    const sessions = Number(form.sessionsPerWeek)
    if (!Number.isFinite(sessions) || sessions < 1 || sessions > 7) newErrors.sessionsPerWeek = t('createPlan.validation.sessionsInvalid')

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    setIsSubmitting(true)
    try {
      const payload: CreateWorkoutPlanRequest = {
        name: form.name.trim(),
        description: form.description.trim(),
        difficultyLevel: form.difficultyLevel as CreateWorkoutPlanRequest['difficultyLevel'],
        durationWeeks: Number(form.durationWeeks),
        sessionsPerWeek: Number(form.sessionsPerWeek),
      }
      await createWorkoutPlan(payload)
      toast.success(t('workouts:createPlan.toastSuccess'))
      await onCreated()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('workouts:createPlan.toastError')))
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
                  {t('createPlan.badge')}
                </p>
                <h2 className="mt-1 text-xl font-bold text-foreground">{t('createPlan.title')}</h2>
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
                <span className="text-xs text-foreground">{t('createPlan.name')}</span>
                <Input
                  value={form.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder={t('createPlan.namePlaceholder')}
                  required
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </label>

              <label className="space-y-1.5">
                <span className="text-xs text-foreground">{t('createPlan.description')}</span>
                <textarea
                  className="min-h-[80px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={t('createPlan.descriptionPlaceholder')}
                  value={form.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs text-foreground">{t('createPlan.difficulty')}</span>
                <select
                  value={form.difficultyLevel}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((p) => ({ ...p, difficultyLevel: e.target.value }))}
                  className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {difficultyOptions.map((opt) => (
                    <option key={opt} value={opt}>{t('common:enums.difficultyLevel.' + opt)}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-xs text-foreground">{t('createPlan.duration')}</span>
                  <Input
                    type="number"
                    min={1}
                    max={52}
                    value={form.durationWeeks}
                    onChange={(e) => setForm((p) => ({ ...p, durationWeeks: e.target.value }))}
                  />
                  {errors.durationWeeks && <p className="text-xs text-destructive">{errors.durationWeeks}</p>}
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs text-foreground">{t('createPlan.sessionsPerWeek')}</span>
                  <Input
                    type="number"
                    min={1}
                    max={7}
                    value={form.sessionsPerWeek}
                    onChange={(e) => setForm((p) => ({ ...p, sessionsPerWeek: e.target.value }))}
                  />
                  {errors.sessionsPerWeek && <p className="text-xs text-destructive">{errors.sessionsPerWeek}</p>}
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-60"
                >
                  {t('common:buttons.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !form.name.trim()}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-60"
                >
                  {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />}
                  {isSubmitting ? t('createPlan.creating') : t('createPlan.createButton')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
