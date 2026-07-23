import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Dumbbell, Lock, ShieldCheck } from 'lucide-react'
import { resetPassword } from '../services/auth.service'
import { getApiErrorMessage } from '../utils/errorHandler'
import toast from '../utils/toast'

const ResetPassword = () => {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [token, setToken] = useState(searchParams.get('token') ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const tokenPreview = useMemo(() => {
    if (!token) return t('auth:resetPassword.noToken')
    if (token.length <= 8) return token
    return `${token.slice(0, 4)}••••${token.slice(-4)}`
  }, [token, t])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (password.length < 8) {
      setError(t('resetPassword.errors.passwordTooShort'))
      return
    }

    if (password !== confirmPassword) {
      setError(t('resetPassword.errors.passwordMismatch'))
      return
    }

    setIsSubmitting(true)

    try {
      const response = await resetPassword({
        token: token.trim(),
        password,
        confirmPassword,
      })
      const message = response.message || t('resetPassword.success.reset')
      setSuccess(message)
      toast.success(message)
      timeoutRef.current = setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1200)
    } catch (err) {
      const message = getApiErrorMessage(err, t('resetPassword.errors.resetFailed'))
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-center text-white md:p-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">
            {t('resetPassword.title')}
          </h1>
          <p className="mt-2 text-sm text-emerald-100">
            {t('resetPassword.subtitle')}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
              {t('resetPassword.tokenPreview', { preview: tokenPreview })}
            </div>

            <div className="space-y-2">
              <label htmlFor="token" className="text-sm font-medium text-foreground">
                {t('resetPassword.tokenLabel')}
              </label>
              <input
                id="token"
                required
                value={token}
                onChange={(event) => setToken(event.target.value)}
                className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground shadow-soft transition-all placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={t('resetPassword.tokenPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                {t('resetPassword.passwordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground shadow-soft transition-all placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={t('resetPassword.passwordPlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-foreground"
              >
                {t('resetPassword.confirmPasswordLabel')}
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground shadow-soft transition-all placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !token.trim()}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting && (
                <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              <span>{isSubmitting ? t('resetPassword.submittingButton') : t('resetPassword.submitButton')}</span>
            </button>
          </form>

          <Link
            to="/login"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('resetPassword.backToLogin')}
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default ResetPassword
