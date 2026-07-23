import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  CalendarDays,
  Check,
  Droplets,
  Flame,
  Leaf,
  Plus,
  Search,
  Target,
  Utensils,
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
import {
  addMealToPlan,
  completeMeal,
  createMealPlan,
  getMyMealPlans,
  getTodayMealPlan,
  getTodayWaterIntake,
  getWeeklyWaterIntake,
  logWaterIntake,
  searchFoods,
  type DailyWaterIntakeResponse,
  type FoodResponse,
  type MealPlanResponse,
  type MealResponse,
} from '../services/nutrition.service'
import { useAuthStore } from '../store/useAuthStore'
import { clampPercentage, formatDateShort, type IconType } from '../lib/utils'
import { useMountedRef } from '../utils/useMountedRef'
import { ProgressBar } from '../components/ui/progress-bar'
import { EmptyState } from '../components/ui/empty-state'
import { SkeletonCard, SkeletonBlock, SkeletonLine } from '../components/ui/skeleton'
import { getApiErrorMessage } from '../utils/errorHandler'
import toast from '../utils/toast'
import type { MealType } from '../types/nutrition.types'

const MEAL_TYPES: MealType[] = [
  'BREAKFAST',
  'MORNING_SNACK',
  'LUNCH',
  'AFTERNOON_SNACK',
  'DINNER',
  'EVENING_SNACK',
  'PRE_WORKOUT',
  'POST_WORKOUT',
]

type NutritionState = {
  todayWater: DailyWaterIntakeResponse | null
  weeklyWater: DailyWaterIntakeResponse[]
  todayMealPlan: MealPlanResponse | null
  mealPlans: MealPlanResponse[]
}

type NutritionErrors = Partial<Record<keyof NutritionState, string>>

const todayIso = () => new Date().toISOString().slice(0, 10)

const quickWaterAmounts = [250, 400, 500, 750]

type PendingFood = { food: FoodResponse; servings: number }

const Nutrition = () => {
  const { t } = useTranslation(['nutrition', 'common'])
  const profile = useAuthStore((state) => state.user?.clientProfile)
  const [state, setState] = useState<NutritionState>({
    todayWater: null,
    weeklyWater: [],
    todayMealPlan: null,
    mealPlans: [],
  })
  const [errors, setErrors] = useState<NutritionErrors>({})
  const [isLoading, setIsLoading] = useState(true)
  const mounted = useMountedRef()
  const [isLoggingWater, setIsLoggingWater] = useState(false)
  const [customWaterAmount, setCustomWaterAmount] = useState('')
  const [targetCalories, setTargetCalories] = useState('')
  const [isCreatingMealPlan, setIsCreatingMealPlan] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<MealType>('BREAKFAST')
  const [isAddingMeal, setIsAddingMeal] = useState(false)
  const [completingMealId, setCompletingMealId] = useState<string | null>(null)
  const [foodSearchQuery, setFoodSearchQuery] = useState('')
  const [foodSearchResults, setFoodSearchResults] = useState<FoodResponse[]>([])
  const [isSearchingFoods, setIsSearchingFoods] = useState(false)
  const [pendingFoods, setPendingFoods] = useState<Record<MealType, PendingFood[]>>({
    BREAKFAST: [],
    MORNING_SNACK: [],
    LUNCH: [],
    AFTERNOON_SNACK: [],
    DINNER: [],
    EVENING_SNACK: [],
    PRE_WORKOUT: [],
    POST_WORKOUT: [],
  })

  const loadNutrition = useCallback(async () => {
    setIsLoading(true)
    setErrors({})

    try {
      const [waterResult, weeklyWaterResult, todayPlanResult, plansResult] =
        await Promise.allSettled([
          getTodayWaterIntake(),
          getWeeklyWaterIntake(),
          getTodayMealPlan(todayIso()),
          getMyMealPlans(0, 5),
        ])

      const nextErrors: NutritionErrors = {}
      const todayWater = unwrapResult(waterResult, 'todayWater', nextErrors, null)
      const weeklyWater = unwrapResult(
        weeklyWaterResult,
        'weeklyWater',
        nextErrors,
        [],
      )
      const todayMealPlan = unwrapResult(
        todayPlanResult,
        'todayMealPlan',
        nextErrors,
        null,
      )
      const mealPlansPage = unwrapResult(plansResult, 'mealPlans', nextErrors, {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 0,
      })

      if (mounted.current) {
        setState({
          todayWater,
          weeklyWater,
          todayMealPlan,
          mealPlans: mealPlansPage.content,
        })
        setErrors(nextErrors)
      }
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [mounted])

  useEffect(() => {
    void loadNutrition()
  }, [loadNutrition])

  const waterTarget = state.todayWater?.targetMl ?? profile?.dailyWaterTarget ?? 0
  const waterTotal = state.todayWater?.totalMl ?? 0
  const waterProgress = waterTarget > 0 ? clampPercentage((waterTotal / waterTarget) * 100) : 0
  const mealCompletion = state.todayMealPlan
    ? getMealCompletion(state.todayMealPlan)
    : 0

  const weeklyAverage = useMemo(() => {
    if (!state.weeklyWater.length) return 0
    const total = state.weeklyWater.reduce((sum, day) => sum + day.progress, 0)
    return Math.round(total / state.weeklyWater.length)
  }, [state.weeklyWater])

  const handleLogWater = async (amountMl: number) => {
    if (!Number.isFinite(amountMl) || amountMl <= 0) {
      toast.error(t('common:toast.waterAmountError'))
      return
    }

    setIsLoggingWater(true)

    try {
      await logWaterIntake({ amountMl })
      toast.success(t('water.loggedAmount', { amount: amountMl }))
      setCustomWaterAmount('')
      await loadNutrition()
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common:toast.waterAmountError')))
    } finally {
      setIsLoggingWater(false)
    }
  }

  const handleCustomWaterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleLogWater(Number(customWaterAmount))
  }

  const handleCreateMealPlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const calories = targetCalories.trim() ? Number(targetCalories) : undefined

    if (calories !== undefined && (!Number.isFinite(calories) || calories <= 0)) {
      toast.error(t('common:toast.caloriesError'))
      return
    }

    setIsCreatingMealPlan(true)

    try {
      await createMealPlan({
        planDate: todayIso(),
        targetCalories: calories,
        targetMacros: {
          protein: null,
          carbs: null,
          fats: null,
          fiber: null,
          sugar: null,
        },
      })
      toast.success(t('common:toast.mealPlanCreated'))
      setTargetCalories('')
      await loadNutrition()
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('mealPlan.createFailed')))
    } finally {
      setIsCreatingMealPlan(false)
    }
  }

  const handleAddFoodToMeal = (mealType: MealType, food: FoodResponse) => {
    setPendingFoods(prev => ({
      ...prev,
      [mealType]: [...prev[mealType], { food, servings: 1 }],
    }))
    setFoodSearchQuery('')
    setFoodSearchResults([])
  }

  const handleRemoveFoodFromMeal = (mealType: MealType, foodId: string) => {
    setPendingFoods(prev => ({
      ...prev,
      [mealType]: prev[mealType].filter(f => f.food.id !== foodId),
    }))
  }

  const handleAddMeal = async () => {
    const planId = state.todayMealPlan?.id
    if (!planId) return

    setIsAddingMeal(true)

    try {
      const foods = pendingFoods[selectedMealType].map(f => ({
        foodId: f.food.id,
        servings: f.servings,
      }))
      await addMealToPlan(planId, {
        mealType: selectedMealType,
        name: t('common:enums.mealType.' + selectedMealType),
        description: t('meal.description', { type: t('common:enums.mealType.' + selectedMealType) }),
        foods,
      })
      toast.success(t('meal.added'))
      setPendingFoods(prev => ({ ...prev, [selectedMealType]: [] }))
      setFoodSearchQuery('')
      setFoodSearchResults([])
      await loadNutrition()
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('meal.addFailed')))
    } finally {
      setIsAddingMeal(false)
    }
  }

  const handleCompleteMeal = async (mealId: string) => {
    setCompletingMealId(mealId)

    try {
      await completeMeal(mealId)
      toast.success(t('meal.completed'))
      await loadNutrition()
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('meal.completeFailed')))
    } finally {
      setCompletingMealId(null)
    }
  }

  const handleFoodSearch = async (query: string) => {
    setFoodSearchQuery(query)

    if (query.trim().length < 2) {
      setFoodSearchResults([])
      return
    }

    setIsSearchingFoods(true)

    try {
      const result = await searchFoods(query, 0, 10)
      setFoodSearchResults(result.content)
    } catch {
      setFoodSearchResults([])
      toast.error(t('common:errors.loadFailed'))
    } finally {
      setIsSearchingFoods(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Gradient header */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
            <p className="mt-1 text-emerald-100">{t('subtitle')}</p>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
          >
            <Target className="h-4 w-4" />
            {t('editTargets')}
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} className="h-32" />
          ))
        ) : (
          <>
            <MetricCardNutrition
              icon={Droplets}
              label={t('water.today')}
              value={`${Math.round(waterProgress)}%`}
              detail={`${waterTotal} / ${waterTarget} ml`}
            />
            <MetricCardNutrition
              icon={Flame}
              label={t('calories.today')}
              value={`${state.todayMealPlan?.totalCalories ?? 0}`}
              detail={
                state.todayMealPlan?.targetCalories
                  ? t('calories.ofTarget', { target: state.todayMealPlan.targetCalories })
                  : t('calories.noTarget')
              }
            />
            <MetricCardNutrition
              icon={Leaf}
              label={t('weeklyHydration.title')}
              value={`${weeklyAverage}%`}
              detail={t('weeklyHydration.avg')}
            />
          </>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr),minmax(360px,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t('water.today')}</CardTitle>
            <CardDescription>
              {t('water.quickAdd')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonBlock />
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-3xl font-bold text-foreground">
                        {t('water.mlLogged', { total: waterTotal, target: waterTarget || '—' })}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('water.ofTarget', { target: waterTarget || '—' })}
                      </p>
                    </div>
                    <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sm font-semibold text-sky-600">
                      {Math.round(waterProgress)}%
                    </span>
                  </div>
                  <ProgressBar value={waterProgress} className="mt-5" />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {quickWaterAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      disabled={isLoggingWater}
                      onClick={() => void handleLogWater(amount)}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t('water.quickAddAmount', { amount })}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={handleCustomWaterSubmit}
                  className="grid gap-2 sm:grid-cols-[minmax(0,1fr),auto]"
                >
                  <Input
                    type="number"
                    min={1}
                    placeholder={t('water.customAmount')}
                    value={customWaterAmount}
                    onChange={(event) => setCustomWaterAmount(event.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isLoggingWater}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-xl hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoggingWater && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    {t('water.logWater')}
                  </button>
                </form>

                {!state.todayWater?.intakes.length && (
                  <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                    {t('water.noIntakes')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('water.weekly')}</CardTitle>
            <CardDescription>
              {t('water.weeklyDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine />
              </div>
            ) : state.weeklyWater.length ? (
              <div className="space-y-3">
                {state.weeklyWater.map((day) => (
                  <WaterDayRow key={day.date} day={day} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Droplets}
                title={t('water.noWeekly')}
                description={t('water.noWeeklyDesc')}
                actionLabel={t('water.logWater')}
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t('mealPlan.todayTitle')}</CardTitle>
            <CardDescription>
              {t('mealPlan.todayDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonBlock />
            ) : state.todayMealPlan ? (
              <MealPlanPanel
                plan={state.todayMealPlan}
                completion={mealCompletion}
                selectedMealType={selectedMealType}
                onMealTypeChange={setSelectedMealType}
                onAddMeal={handleAddMeal}
                isAddingMeal={isAddingMeal}
                completingMealId={completingMealId}
                onCompleteMeal={handleCompleteMeal}
                foodSearchQuery={foodSearchQuery}
                onFoodSearch={handleFoodSearch}
                foodSearchResults={foodSearchResults}
                isSearchingFoods={isSearchingFoods}
                pendingFoods={pendingFoods}
                onAddFoodToMeal={handleAddFoodToMeal}
                onRemoveFoodFromMeal={handleRemoveFoodFromMeal}
              />
            ) : (
              <div className="space-y-5">
                <EmptyState
                  icon={Utensils}
                  title={t('mealPlan.noPlan')}
                  description={t('mealPlan.noPlanDesc')}
                  actionLabel={t('mealPlan.createBelow')}
                />
                <form
                  onSubmit={handleCreateMealPlan}
                  className="grid gap-2 sm:grid-cols-[minmax(0,1fr),auto]"
                >
                  <Input
                    type="number"
                    min={1}
                    placeholder={t('mealPlan.targetCalories')}
                    value={targetCalories}
                    onChange={(event) => setTargetCalories(event.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={isCreatingMealPlan}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:shadow-xl hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreatingMealPlan && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    )}
                    <Plus className="h-4 w-4" />
                    {t('mealPlan.createPlan')}
                  </button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('mealPlan.recentTitle')}</CardTitle>
            <CardDescription>
              {t('mealPlan.recentDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine />
              </div>
            ) : state.mealPlans.length ? (
              <div className="space-y-3">
                {state.mealPlans.map((plan) => (
                  <MealPlanRow key={plan.id} plan={plan} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title={t('mealPlan.noRecent')}
                description={t('mealPlan.noRecentDesc')}
                actionLabel={t('mealPlan.createToday')}
              />
            )}
          </CardContent>
        </Card>
      </section>

      {Object.keys(errors).length > 0 && !isLoading && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
          {t('errors.loadFailed')}
        </div>
      )}
    </div>
  )
}

const unwrapResult = <T,>(
  result: PromiseSettledResult<T>,
  key: keyof NutritionState,
  errors: NutritionErrors,
  fallback: T,
): T => {
  if (result.status === 'fulfilled') return result.value
  errors[key] = 'loadFailed'
  return fallback
}

const getMealCompletion = (plan: MealPlanResponse) => {
  if (!plan.meals.length) return 0
  const completedMeals = plan.meals.filter((meal) => meal.completed).length
  return clampPercentage((completedMeals / plan.meals.length) * 100)
}

const MetricCardNutrition = ({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: IconType
  label: string
  value: string
  detail: string
}) => (
  <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </CardContent>
  </Card>
)

const MealPlanPanel = ({
  plan,
  completion,
  selectedMealType,
  onMealTypeChange,
  onAddMeal,
  isAddingMeal,
  completingMealId,
  onCompleteMeal,
  foodSearchQuery,
  onFoodSearch,
  foodSearchResults,
  isSearchingFoods,
  pendingFoods,
  onAddFoodToMeal,
  onRemoveFoodFromMeal,
}: {
  plan: MealPlanResponse
  completion: number
  selectedMealType: MealType
  onMealTypeChange: (type: MealType) => void
  onAddMeal: () => void
  isAddingMeal: boolean
  completingMealId: string | null
  onCompleteMeal: (mealId: string) => void
  foodSearchQuery: string
  onFoodSearch: (query: string) => void
  foodSearchResults: FoodResponse[]
  isSearchingFoods: boolean
  pendingFoods: Record<MealType, PendingFood[]>
  onAddFoodToMeal: (mealType: MealType, food: FoodResponse) => void
  onRemoveFoodFromMeal: (mealType: MealType, foodId: string) => void
}) => {
  const { t } = useTranslation(['nutrition', 'common'])

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-bold text-foreground">
              {plan.totalCalories}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.targetCalories
                ? t('mealPlan.ofCalories', { target: plan.targetCalories })
                : t('mealPlan.caloriesLoggedToday')}
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {Math.round(completion)}%
          </span>
        </div>
        <ProgressBar value={plan.caloriesPercentage ?? completion} className="mt-5" />
      </div>

      {plan.meals.length > 0 && (
        <div className="space-y-3">
          {plan.meals.map((meal) => (
            <MealItem
              key={meal.id}
              meal={meal}
              isCompleting={completingMealId === meal.id}
              onComplete={onCompleteMeal}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-muted-foreground">
          {t('meal.addMeal')}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={selectedMealType}
            onChange={(event) => onMealTypeChange(event.target.value as MealType)}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {MEAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`mealTypes.${type}`)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isAddingMeal || pendingFoods[selectedMealType].length === 0}
            onClick={() => void onAddMeal()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAddingMeal ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {t('meal.add')}
          </button>
        </div>
        <FoodSearchInput
          query={foodSearchQuery}
          onSearch={onFoodSearch}
          results={foodSearchResults}
          isSearching={isSearchingFoods}
          onAddFood={(food) => onAddFoodToMeal(selectedMealType, food)}
        />
        {pendingFoods[selectedMealType].length > 0 && (
          <div className="space-y-1">
            {pendingFoods[selectedMealType].map(({ food }) => (
              <div
                key={food.id}
                className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{food.name}</p>
                  <p className="truncate text-muted-foreground">
                    {food.caloriesPerServing} {food.servingUnit.toLowerCase()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveFoodFromMeal(selectedMealType, food.id)}
                  className="ml-2 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const MealItem = ({
  meal,
  isCompleting,
  onComplete,
}: {
  meal: MealResponse
  isCompleting: boolean
  onComplete: (mealId: string) => void
}) => {
  const { t } = useTranslation(['nutrition'])

  return (
    <div
      className={`rounded-2xl border border-border bg-background p-3 transition ${
        meal.completed ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {meal.name || t(`mealTypes.${meal.mealType}`)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {meal.calories} {t('mealPlan.calories')} · {meal.foods.length} {t('meal.foods', { count: meal.foods.length })}
          </p>
          {meal.foods.length > 0 && (
            <div className="mt-2 space-y-1">
              {meal.foods.map((mealFood) => (
                <div
                  key={mealFood.id}
                  className="flex items-center justify-between rounded-xl bg-muted/50 px-2 py-1 text-xs"
                >
                  <span className="text-foreground">
                    {mealFood.food.name}
                    {mealFood.servings > 1 ? ` ×${mealFood.servings}` : ''}
                  </span>
                  <span className="text-muted-foreground">
                    {mealFood.totalCalories} {t('mealPlan.calories')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              meal.completed
                ? 'bg-green-500/10 text-green-600'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {meal.completed ? t('meal.done') : t('meal.planned')}
          </span>
          {!meal.completed && (
            <button
              type="button"
              disabled={isCompleting}
              onClick={() => void onComplete(meal.id)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-green-500/10 text-green-600 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              title={t('meal.markComplete')}
            >
              {isCompleting ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const FoodSearchInput = ({
  query,
  onSearch,
  results,
  isSearching,
  onAddFood,
}: {
  query: string
  onSearch: (query: string) => void
  results: FoodResponse[]
  isSearching: boolean
  onAddFood: (food: FoodResponse) => void
}) => {
  const { t } = useTranslation(['nutrition'])
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    setIsOpen(results.length > 0)
  }, [results])

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('food.searchPlaceholder')}
            value={query}
            onChange={(event) => {
              const value = event.target.value
              clearTimeout(debounceRef.current)
              debounceRef.current = setTimeout(() => onSearch(value), 300)
            }}
            onFocus={() => { if (results.length > 0) setIsOpen(true) }}
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {isSearching && (
            <span className="absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          )}
        </div>
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
          {results.map((food) => (
            <FoodResultItem key={food.id} food={food} onAddFood={onAddFood} />
          ))}
        </div>
      )}
    </div>
  )
}

const FoodResultItem = ({
  food,
  onAddFood,
}: {
  food: FoodResponse
  onAddFood: (food: FoodResponse) => void
}) => {
  return (
    <button
      type="button"
      onClick={() => onAddFood(food)}
      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition hover:bg-accent"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{food.name}</p>
        <p className="truncate text-muted-foreground">
          {food.caloriesPerServing} {food.servingUnit.toLowerCase()} · {food.brand ?? ''}
        </p>
      </div>
      <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </button>
  )
}

const MealPlanRow = ({ plan }: { plan: MealPlanResponse }) => {
  const { t } = useTranslation(['nutrition'])
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {formatDateShort(plan.planDate)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {plan.meals.length} {t('mealPlan.meals', { count: plan.meals.length })} ·{' '}
            {plan.totalCalories} {t('mealPlan.calories')}
          </p>
        </div>
        <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
          {plan.completed ? t('mealPlan.completed') : t('mealPlan.open')}
        </span>
      </div>
      {plan.targetCalories && (
        <ProgressBar
          value={plan.caloriesPercentage ?? 0}
          className="mt-4"
        />
      )}
    </div>
  )
}

const WaterDayRow = ({ day }: { day: DailyWaterIntakeResponse }) => (
  <div className="rounded-2xl border border-border bg-background p-4">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {formatDateShort(day.date)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {day.totalMl} / {day.targetMl} ml
        </p>
      </div>
      <span className="text-sm font-semibold text-primary">
        {Math.round(day.progress)}%
      </span>
    </div>
    <ProgressBar value={day.progress} className="mt-3" />
  </div>
)

export default Nutrition
