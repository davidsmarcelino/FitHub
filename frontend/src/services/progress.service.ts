import api from './api'
import { handleNotFound } from './api-helpers'
import type { PageResponse } from '../types/common.types'
import type {
  BodyMeasurementResponse,
  CreateBodyMeasurementRequest,
  CreateGoalRequest,
  CreatePersonalRecordRequest,
  CreateProgressPhotoRequest,
  GoalResponse,
  MeasurementHistoryResponse,
  PersonalRecordResponse,
  ProgressPhotoResponse,
  UpdateBodyMeasurementRequest,
  UpdateGoalProgressRequest,
  UpdateGoalRequest,
} from '../types/progress.types'

export type {
  BodyMeasurementResponse,
  CreateBodyMeasurementRequest,
  CreateGoalRequest,
  CreatePersonalRecordRequest,
  CreateProgressPhotoRequest,
  GoalResponse,
  GoalStatus,
  GoalType,
  MeasurementHistoryResponse,
  MeasurementUnit,
  PersonalRecordResponse,
  ProgressPhotoResponse,
  RecordType,
} from '../types/progress.types'

// ==================== Goals ====================

export const getActiveGoals = async (
  page = 0,
  size = 3,
): Promise<PageResponse<GoalResponse>> => {
  const { data } = await api.get<PageResponse<GoalResponse>>(
    '/progress/goals/active',
    { params: { page, size } },
  )
  return data
}

export const getGoals = async (
  page = 0,
  size = 10,
): Promise<PageResponse<GoalResponse>> => {
  const { data } = await api.get<PageResponse<GoalResponse>>(
    '/progress/goals',
    { params: { page, size } },
  )
  return data
}

export const getCompletedGoals = async (
  page = 0,
  size = 10,
): Promise<PageResponse<GoalResponse>> => {
  const { data } = await api.get<PageResponse<GoalResponse>>(
    '/progress/goals/completed',
    { params: { page, size } },
  )
  return data
}

export const getGoalById = async (
  goalId: string,
): Promise<GoalResponse> => {
  const { data } = await api.get<GoalResponse>(`/progress/goals/${goalId}`)
  return data
}

export const createGoal = async (
  payload: CreateGoalRequest,
): Promise<GoalResponse> => {
  const { data } = await api.post<GoalResponse>('/progress/goals', payload)
  return data
}

export const updateGoal = async (
  goalId: string,
  payload: UpdateGoalRequest,
): Promise<GoalResponse> => {
  const { data } = await api.put<GoalResponse>(
    `/progress/goals/${goalId}`,
    payload,
  )
  return data
}

export const updateGoalProgress = async (
  goalId: string,
  payload: UpdateGoalProgressRequest,
): Promise<GoalResponse> => {
  const { data } = await api.patch<GoalResponse>(
    `/progress/goals/${goalId}/progress`,
    payload,
  )
  return data
}

export const completeGoal = async (
  goalId: string,
): Promise<void> => {
  await api.patch(`/progress/goals/${goalId}/complete`)
}

// ==================== Body Measurements ====================

export const getLatestBodyMeasurement =
  async (): Promise<BodyMeasurementResponse | null> =>
    handleNotFound(() =>
      api.get<BodyMeasurementResponse>('/progress/measurements/latest').then((r) => r.data),
    )

export const getBodyMeasurements = async (
  page = 0,
  size = 10,
): Promise<PageResponse<BodyMeasurementResponse>> => {
  const { data } = await api.get<PageResponse<BodyMeasurementResponse>>(
    '/progress/measurements',
    { params: { page, size } },
  )
  return data
}

export const getMeasurementHistory =
  async (): Promise<MeasurementHistoryResponse> => {
    const { data } = await api.get<MeasurementHistoryResponse>(
      '/progress/measurements/history',
    )
    return data
  }

export const createBodyMeasurement = async (
  payload: CreateBodyMeasurementRequest,
): Promise<BodyMeasurementResponse> => {
  const { data } = await api.post<BodyMeasurementResponse>(
    '/progress/measurements',
    payload,
  )
  return data
}

export const updateBodyMeasurement = async (
  measurementId: string,
  payload: UpdateBodyMeasurementRequest,
): Promise<BodyMeasurementResponse> => {
  const { data } = await api.put<BodyMeasurementResponse>(
    `/progress/measurements/${measurementId}`,
    payload,
  )
  return data
}

export const getBodyMeasurementById = async (
  measurementId: string,
): Promise<BodyMeasurementResponse> => {
  const { data } = await api.get<BodyMeasurementResponse>(
    `/progress/measurements/${measurementId}`,
  )
  return data
}

// ==================== Personal Records ====================

export const getPersonalRecords = async (
  page = 0,
  size = 10,
): Promise<PageResponse<PersonalRecordResponse>> => {
  const { data } = await api.get<PageResponse<PersonalRecordResponse>>(
    '/progress/records',
    { params: { page, size } },
  )
  return data
}

export const getRecentPersonalRecords = async (
  limit = 5,
): Promise<PageResponse<PersonalRecordResponse>> => {
  const { data } = await api.get<PageResponse<PersonalRecordResponse>>(
    '/progress/records/recent',
    { params: { limit } },
  )
  return data
}

export const getPersonalRecordsByExercise = async (
  exerciseId: string,
  page = 0,
  size = 10,
): Promise<PageResponse<PersonalRecordResponse>> => {
  const { data } = await api.get<PageResponse<PersonalRecordResponse>>(
    `/progress/records/exercise/${exerciseId}`,
    { params: { page, size } },
  )
  return data
}

export const getPersonalRecordById = async (
  recordId: string,
): Promise<PersonalRecordResponse> => {
  const { data } = await api.get<PersonalRecordResponse>(
    `/progress/records/${recordId}`,
  )
  return data
}

export const createPersonalRecord = async (
  payload: CreatePersonalRecordRequest,
): Promise<PersonalRecordResponse> => {
  const { data } = await api.post<PersonalRecordResponse>(
    '/progress/records',
    payload,
  )
  return data
}

// ==================== Progress Photos ====================

export const getProgressPhotos = async (
  page = 0,
  size = 10,
): Promise<PageResponse<ProgressPhotoResponse>> => {
  const { data } = await api.get<PageResponse<ProgressPhotoResponse>>(
    '/progress/photos',
    { params: { page, size } },
  )
  return data
}

export const getProgressPhotoById = async (
  photoId: string,
): Promise<ProgressPhotoResponse> => {
  const { data } = await api.get<ProgressPhotoResponse>(
    `/progress/photos/${photoId}`,
  )
  return data
}

export const createProgressPhoto = async (
  payload: CreateProgressPhotoRequest,
): Promise<ProgressPhotoResponse> => {
  const { data } = await api.post<ProgressPhotoResponse>(
    '/progress/photos',
    payload,
  )
  return data
}
