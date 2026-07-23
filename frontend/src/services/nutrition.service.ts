import api from './api'
import { handleNotFound } from './api-helpers'
import type { MessageResponse, PageResponse } from '../types/common.types'
import type {
  CreateFoodRequest,
  CreateMealPlanRequest,
  CreateMealRequest,
  DailyWaterIntakeResponse,
  FoodResponse,
  LogWaterIntakeRequest,
  MealPlanResponse,
  MealResponse,
  UpdateFoodRequest,
  UpdateMealPlanRequest,
  WaterIntakeResponse,
} from '../types/nutrition.types'

export type {
  CreateMealPlanRequest,
  CreateMealRequest,
  DailyWaterIntakeResponse,
  FoodResponse,
  LogWaterIntakeRequest,
  MealResponse,
  MealPlanResponse,
  UpdateMealPlanRequest,
  WaterIntakeResponse,
} from '../types/nutrition.types'

export const getTodayWaterIntake =
  async (): Promise<DailyWaterIntakeResponse | null> =>
    handleNotFound(() =>
      api.get<DailyWaterIntakeResponse>('/nutrition/water-intake/today').then((r) => r.data),
    )

export const getTodayMealPlan = async (
  date: string,
): Promise<MealPlanResponse | null> =>
  handleNotFound(() =>
    api.get<MealPlanResponse>(`/nutrition/meal-plans/date/${date}`).then((r) => r.data),
  )

export const createMealPlan = async (
  payload: CreateMealPlanRequest,
): Promise<MealPlanResponse> => {
  const { data } = await api.post<MealPlanResponse>(
    '/nutrition/meal-plans',
    payload,
  )
  return data
}

export const updateMealPlan = async (
  planId: string,
  payload: UpdateMealPlanRequest,
): Promise<MealPlanResponse> => {
  const { data } = await api.put<MealPlanResponse>(
    `/nutrition/meal-plans/${planId}`,
    payload,
  )
  return data
}

export const getMyMealPlans = async (
  page = 0,
  size = 5,
): Promise<PageResponse<MealPlanResponse>> => {
  const { data } = await api.get<PageResponse<MealPlanResponse>>(
    '/nutrition/meal-plans',
    {
      params: { page, size },
    },
  )
  return data
}

export const getWeeklyWaterIntake = async (): Promise<
  DailyWaterIntakeResponse[]
> => {
  const { data } = await api.get<DailyWaterIntakeResponse[]>(
    '/nutrition/water-intake/weekly',
  )
  return data
}

export const logWaterIntake = async (
  payload: LogWaterIntakeRequest,
): Promise<WaterIntakeResponse> => {
  const { data } = await api.post<WaterIntakeResponse>(
    '/nutrition/water-intake',
    payload,
  )
  return data
}

export const addMealToPlan = async (
  planId: string,
  payload: CreateMealRequest,
): Promise<MealResponse> => {
  const { data } = await api.post<MealResponse>(
    `/nutrition/meal-plans/${planId}/meals`,
    payload,
  )
  return data
}

export const updateMeal = async (
  mealId: string,
  payload: CreateMealRequest,
): Promise<MealResponse> => {
  const { data } = await api.put<MealResponse>(
    `/nutrition/meals/${mealId}`,
    payload,
  )
  return data
}

export const completeMeal = async (
  mealId: string,
): Promise<MessageResponse> => {
  const { data } = await api.patch<MessageResponse>(
    `/nutrition/meals/${mealId}/complete`,
  )
  return data
}

export const searchFoods = async (
  query: string,
  page = 0,
  size = 20,
): Promise<PageResponse<FoodResponse>> => {
  const { data } = await api.get<PageResponse<FoodResponse>>(
    '/nutrition/foods/search',
    { params: { q: query, page, size } },
  )
  return data
}

export const getFoods = async (
  page = 0,
  size = 50,
): Promise<PageResponse<FoodResponse>> => {
  const { data } = await api.get<PageResponse<FoodResponse>>(
    '/nutrition/foods',
    { params: { page, size } },
  )
  return data
}

export const getFoodByBarcode = async (
  barcode: string,
): Promise<FoodResponse | null> =>
  handleNotFound(() =>
    api.get<FoodResponse>(`/nutrition/foods/barcode/${barcode}`).then((r) => r.data),
  )

export const getWeeklyMealPlans = async (
  startDate: string,
): Promise<PageResponse<MealPlanResponse>> => {
  const { data } = await api.get<PageResponse<MealPlanResponse>>(
    '/nutrition/meal-plans/weekly',
    { params: { startDate } },
  )
  return data
}

export const deactivateFood = async (
  foodId: string,
): Promise<MessageResponse> => {
  const { data } = await api.patch<MessageResponse>(
    `/nutrition/foods/${foodId}/deactivate`,
  )
  return data
}

export const createFood = async (
  payload: CreateFoodRequest,
): Promise<FoodResponse> => {
  const { data } = await api.post<FoodResponse>('/nutrition/foods', payload)
  return data
}

export const updateFood = async (
  foodId: string,
  payload: UpdateFoodRequest,
): Promise<FoodResponse> => {
  const { data } = await api.put<FoodResponse>(`/nutrition/foods/${foodId}`, payload)
  return data
}
