import axios from 'axios'
import i18n from '../i18n/config'

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: Record<string, unknown>
}

const getAuthMessageByStatus = (status: number): string | null => {
  const messages: Record<number, string> = {
    400: i18n.t('common:errors.badRequest'),
    401: i18n.t('common:errors.unauthorized'),
    403: i18n.t('common:errors.forbidden'),
    404: i18n.t('common:errors.notFound'),
    409: i18n.t('common:errors.conflict'),
    422: i18n.t('common:errors.validationError'),
    429: i18n.t('common:errors.rateLimitError'),
    500: i18n.t('common:errors.error'),
  }
  return messages[status] ?? null
}

export const getApiErrorMessage = (
  error: unknown,
  fallback = i18n.t('common:errors.error'),
) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const responseData = error.response?.data as
      | { message?: string; error?: string }
      | undefined

    if (!error.response) {
      return i18n.t('common:errors.networkError')
    }

    if (status) {
      const authMessage = getAuthMessageByStatus(status)
      if (authMessage) return authMessage
    }

    return responseData?.message || responseData?.error || fallback
  }

  return error instanceof Error ? error.message : fallback
}

export default { getApiErrorMessage }
