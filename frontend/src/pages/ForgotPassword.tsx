import type { FormEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Dumbbell, Mail, Send } from 'lucide-react'
import { forgotPassword } from '../services/auth.service'
import { getApiErrorMessage } from '../utils/errorHandler'
import toast from '../utils/toast'

const ForgotPassword = () => {
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      const response = await forgotPassword({ email: email.trim() })
      const message =
        response.message ||
        t('forgotPassword.success.sent')
      setSuccess(message)
      toast.success(message)
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        t('forgotPassword.errors.sendFailed'),
      )
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
            {t('forgotPassword.title')}
          </h1>
          <p className="mt-2 text-sm text-emerald-100">
            {t('forgotPassword.subtitle')}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                {t('forgotPassword.emailLabel')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="flex h-10 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm text-foreground shadow-soft transition-all placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={t('forgotPassword.emailPlaceholder')}
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
              disabled={isSubmitting}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{isSubmitting ? t('forgotPassword.submittingButton') : t('forgotPassword.submitButton')}</span>
            </button>
          </form>

          <Link
            to="/login"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPassword
