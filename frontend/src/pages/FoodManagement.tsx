import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Apple, Plus, Search, X } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { EmptyState } from '../components/ui/empty-state'
import { Pagination } from '../components/ui/pagination'
import { SkeletonBlock } from '../components/ui/skeleton'
import {
  getFoods,
  createFood,
  updateFood,
  deactivateFood,
  type FoodResponse,
} from '../services/nutrition.service'
import type {
  CreateFoodRequest,
  ServingUnit,
  MacroNutrientsDto,
} from '../types/nutrition.types'
import { getApiErrorMessage } from '../utils/errorHandler'
import toast from '../utils/toast'
import { formatEnum } from '../lib/utils'

const SERVING_UNITS: ServingUnit[] = [
  'GRAM', 'MILLILITER', 'OUNCE', 'CUP', 'SCOOP',
]

type FoodForm = {
  name: string
  brand: string
  servingSize: string
  servingUnit: ServingUnit
  caloriesPerServing: string
  protein: string
  carbs: string
  fats: string
  fiber: string
  sugar: string
  barcode: string
}

const emptyForm: FoodForm = {
  name: '',
  brand: '',
  servingSize: '',
  servingUnit: 'GRAM',
  caloriesPerServing: '',
  protein: '',
  carbs: '',
  fats: '',
  fiber: '',
  sugar: '',
  barcode: '',
}

const FoodFormModal = ({
  isOpen,
  onClose,
  food,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  food?: FoodResponse
  onSuccess: () => Promise<void>
}) => {
  const { t } = useTranslation(['nutrition', 'common'])
  const [form, setForm] = useState<FoodForm>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    if (food) {
      setForm({
        name: food.name,
        brand: food.brand ?? '',
        servingSize: String(food.servingSize),
        servingUnit: food.servingUnit,
        caloriesPerServing: String(food.caloriesPerServing),
        protein: String(food.macrosPerServing.protein ?? ''),
        carbs: String(food.macrosPerServing.carbs ?? ''),
        fats: String(food.macrosPerServing.fats ?? ''),
        fiber: String(food.macrosPerServing.fiber ?? ''),
        sugar: String(food.macrosPerServing.sugar ?? ''),
        barcode: food.barcode ?? '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [isOpen, food])

  const updateField = (field: keyof FoodForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.servingSize || !form.caloriesPerServing) return

    const macros: MacroNutrientsDto = {
      protein: form.protein ? Number(form.protein) : null,
      carbs: form.carbs ? Number(form.carbs) : null,
      fats: form.fats ? Number(form.fats) : null,
      fiber: form.fiber ? Number(form.fiber) : null,
      sugar: form.sugar ? Number(form.sugar) : null,
    }

    const payload: CreateFoodRequest = {
      name: form.name.trim(),
      brand: form.brand.trim() || undefined,
      servingSize: Number(form.servingSize),
      servingUnit: form.servingUnit,
      caloriesPerServing: Number(form.caloriesPerServing),
      macrosPerServing: macros,
      barcode: form.barcode.trim() || undefined,
    }

    setIsSubmitting(true)
    try {
      if (food) {
        await updateFood(food.id, payload)
        toast.success(t('food.updated'))
      } else {
        await createFood(payload)
        toast.success(t('food.created'))
      }
      await onSuccess()
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common:messages.failed')))
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
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {food ? t('food.edit') : t('food.add')}
                </span>
                <h2 className="mt-1 text-xl font-bold text-foreground">
                  {food ? t('food.editTitle') : t('food.addTitle')}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-foreground">{t('food.name')} *</span>
                <Input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-medium text-foreground">{t('food.brand')}</span>
                <Input
                  value={form.brand}
                  onChange={(e) => updateField('brand', e.target.value)}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">{t('food.servingSize')} *</span>
                  <Input
                    type="number"
                    value={form.servingSize}
                    onChange={(e) => updateField('servingSize', e.target.value)}
                    required
                    min="0"
                    step="any"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">{t('food.servingUnit')} *</span>
                  <select
                    value={form.servingUnit}
                    onChange={(e) => updateField('servingUnit', e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    {SERVING_UNITS.map((u) => (
                      <option key={u} value={u}>{formatEnum(u)}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-1.5">
                <span className="text-xs font-medium text-foreground">{t('food.calories')} *</span>
                <Input
                  type="number"
                  value={form.caloriesPerServing}
                  onChange={(e) => updateField('caloriesPerServing', e.target.value)}
                  required
                  min="0"
                />
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">{t('food.protein')}</span>
                  <Input type="number" value={form.protein} onChange={(e) => updateField('protein', e.target.value)} min="0" step="any" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">{t('food.carbs')}</span>
                  <Input type="number" value={form.carbs} onChange={(e) => updateField('carbs', e.target.value)} min="0" step="any" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">{t('food.fats')}</span>
                  <Input type="number" value={form.fats} onChange={(e) => updateField('fats', e.target.value)} min="0" step="any" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">{t('food.fiber')}</span>
                  <Input type="number" value={form.fiber} onChange={(e) => updateField('fiber', e.target.value)} min="0" step="any" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">{t('food.sugar')}</span>
                  <Input type="number" value={form.sugar} onChange={(e) => updateField('sugar', e.target.value)} min="0" step="any" />
                </label>
              </div>

              <label className="space-y-1.5">
                <span className="text-xs font-medium text-foreground">{t('food.barcode')}</span>
                <Input value={form.barcode} onChange={(e) => updateField('barcode', e.target.value)} />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  {t('common:buttons.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  )}
                  {food ? t('common:buttons.saveChanges') : t('common:buttons.create')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

const FoodManagement = () => {
  const { t } = useTranslation(['nutrition', 'common'])
  const [foods, setFoods] = useState<FoodResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingFood, setEditingFood] = useState<FoodResponse | null>(null)

  const loadFoods = useCallback(async (page = 0) => {
    setIsLoading(true)
    try {
      const result = await getFoods(page, 12)
      setFoods(result.content)
      setTotalPages(result.totalPages)
      setCurrentPage(page)
    } catch {
      toast.error(t('common:errors.loadFailed'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadFoods()
  }, [loadFoods])

  const handleToggleActive = async (food: FoodResponse) => {
    try {
      if (food.active) {
        await deactivateFood(food.id)
        toast.success(t('food.deactivated'))
      }
      void loadFoods(currentPage)
    } catch {
      toast.error(t('common:messages.failed'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{t('food.management')}</h1>
            <p className="mt-1 text-emerald-100">{t('food.managementDescription')}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/20 px-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30"
          >
            <Plus className="h-4 w-4" />
            {t('food.add')}
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('common:buttons.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-16" />
              ))}
            </div>
          ) : foods.length === 0 ? (
            <EmptyState
              icon={Apple}
              title={t('food.noFoods')}
              description={t('food.noFoodsDescription')}
            />
          ) : (
            <div className="space-y-2">
              {foods
                .filter((f) =>
                  !search || f.name.toLowerCase().includes(search.toLowerCase()) ||
                  (f.brand?.toLowerCase().includes(search.toLowerCase()))
                )
                .map((food) => (
                  <div
                    key={food.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-background p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{food.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {food.brand && `${food.brand} · `}
                        {food.caloriesPerServing} {t('food.caloriesPerServing')} · {food.servingSize} {formatEnum(food.servingUnit)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          food.active
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {food.active ? t('common:status.active') : t('common:status.inactive')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingFood(food)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {t('common:buttons.edit')}
                      </button>
                      {food.active && (
                        <button
                          type="button"
                          onClick={() => void handleToggleActive(food)}
                          className="text-xs text-destructive hover:text-destructive/80"
                        >
                          {t('common:buttons.delete')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => void loadFoods(p)}
            />
          )}
        </CardContent>
      </Card>

      <FoodFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadFoods(currentPage)}
      />
      <FoodFormModal
        isOpen={editingFood !== null}
        onClose={() => setEditingFood(null)}
        food={editingFood ?? undefined}
        onSuccess={() => loadFoods(currentPage)}
      />
    </div>
  )
}

export default FoodManagement
