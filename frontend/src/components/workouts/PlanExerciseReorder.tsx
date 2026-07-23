import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { GripVertical, X } from 'lucide-react'
import { Button } from '../ui/button'
import {
  reorderPlanExercises,
} from '../../services/workout.service'
import type {
  WorkoutPlanResponse,
  WorkoutPlanExerciseResponse,
} from '../../types/workout.types'
import { getApiErrorMessage } from '../../utils/errorHandler'
import toast from '../../utils/toast'
import { formatEnum } from '../../lib/utils'

type Props = {
  isOpen: boolean
  onClose: () => void
  plan: WorkoutPlanResponse
  onReordered: () => Promise<void>
}

export const PlanExerciseReorder = ({ isOpen, onClose, plan, onReordered }: Props) => {
  const { t } = useTranslation(['workouts', 'common'])
  const [exercises, setExercises] = useState<WorkoutPlanExerciseResponse[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setExercises([...plan.exercises].sort((a, b) => a.dayNumber - b.dayNumber || a.orderIndex - b.orderIndex))
  }, [isOpen, plan.exercises])

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === idx) return
    setExercises((prev) => {
      const next = [...prev]
      const [moved] = next.splice(draggedIdx, 1)
      next.splice(idx, 0, moved)
      return next
    })
    setDraggedIdx(idx)
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const dayGroups = new Map<number, WorkoutPlanExerciseResponse[]>()
      for (const ex of exercises) {
        const day = ex.dayNumber
        if (!dayGroups.has(day)) dayGroups.set(day, [])
        dayGroups.get(day)!.push(ex)
      }

      for (const [day, dayExercises] of dayGroups) {
        const reordered = dayExercises.map((ex, i) => ({
          planExerciseId: ex.id,
          orderIndex: i,
        }))
        await reorderPlanExercises(plan.id, { day, exercises: reordered })
      }

      toast.success(t('common:messages.updated'))
      await onReordered()
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common:messages.failed')))
    } finally {
      setIsSaving(false)
    }
  }

  const exercisesByDay = exercises.reduce<Record<number, WorkoutPlanExerciseResponse[]>>((acc, ex) => {
    if (!acc[ex.dayNumber]) acc[ex.dayNumber] = []
    acc[ex.dayNumber].push(ex)
    return acc
  }, {})

  const days = Object.keys(exercisesByDay).map(Number).sort((a, b) => a - b)

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
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {t('planCard.reorder')}
                </span>
                <h2 className="mt-1 text-xl font-bold text-foreground">{plan.name}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">{t('planCard.reorderDescription')}</p>

            <div className="mt-4 space-y-4">
              {days.map((day) => (
                <div key={day}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('detail.day')} {day}
                  </p>
                  <div className="space-y-1">
                    {exercisesByDay[day].map((ex) => {
                      const globalIdx = exercises.indexOf(ex)
                      return (
                        <div
                          key={ex.id}
                          draggable
                          onDragStart={() => handleDragStart(globalIdx)}
                          onDragOver={(e) => handleDragOver(e, globalIdx)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition-colors ${
                            draggedIdx === globalIdx ? 'opacity-50' : ''
                          }`}
                        >
                          <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground cursor-grab" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{ex.exercise.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatEnum(ex.exercise.category)} · {formatEnum(ex.exercise.primaryMuscleGroup)}
                              {ex.sets && ` · ${ex.sets}×${ex.reps}`}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">#{ex.orderIndex + 1}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                {t('common:buttons.cancel')}
              </Button>
              <Button onClick={() => void handleSave()} disabled={isSaving} className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:brightness-110">
                {isSaving && (
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                )}
                {t('common:buttons.saveChanges')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
