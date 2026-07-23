import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { AuthenticationResponse } from '../types/auth.types'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

const API_TIMEOUT = 30_000

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise: Promise<string> | null = null

const clearStoredSession = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  window.dispatchEvent(new Event('fithub:auth-cleared'))
}

const isPublicAuthPath = (url: string) =>
  url.includes('/auth/signin') ||
  url.includes('/auth/signup') ||
  url.includes('/auth/refresh-token') ||
  url.includes('/account-action/')

const shouldRedirectToLogin = () => {
  const publicPaths = [
    '/login',
    '/register',
    '/verify-email',
    '/forgot-password',
    '/reset-password',
  ]

  return !publicPaths.some((path) => window.location.pathname.includes(path))
}

const redirectToLogin = () => {
  if (shouldRedirectToLogin()) {
    window.location.href = '/login'
  }
}

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken) {
        throw new Error('Missing refresh token')
      }

      const { data } = await refreshApi.post<AuthenticationResponse>(
        '/auth/refresh-token',
        { refreshToken },
      )

      localStorage.setItem('access_token', data.accessToken)
      localStorage.setItem('refresh_token', data.refreshToken)
      window.dispatchEvent(new Event('fithub:auth-refreshed'))

      return data.accessToken
    })().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

// Request interceptor - attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    const requestUrl = config.url ?? ''
    const isPublicRequest = isPublicAuthPath(requestUrl)

    if (token && !isPublicRequest) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  },
)

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined
    const requestUrl = originalRequest?.url ?? ''

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isPublicAuthPath(requestUrl)
    ) {
      originalRequest._retry = true

      try {
        const token = await refreshAccessToken()
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest) as Promise<AxiosResponse>
      } catch (refreshError) {
        clearStoredSession()
        redirectToLogin()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export default api
