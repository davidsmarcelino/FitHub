import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Dumbbell, Mail, Lock, ArrowRight } from 'lucide-react'
import { register } from '../services/auth.service'
import { getApiErrorMessage } from '../utils/errorHandler'
import toast from '../utils/toast'

const Register = () => {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    if (!email || !password || !confirmPassword) {
      setError(t('register.errors.allFieldsRequired'))
      return false
    }
    if (password.length < 8) {
      setError(t('register.errors.passwordTooShort'))
      return false
    }
    if (password !== confirmPassword) {
      setError(t('register.errors.passwordMismatch'))
      return false
    }
    return true
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await register({ email, password, confirmPassword })
      navigate('/verify-email', { replace: true, state: { email } })
    } catch (err) {
      const message = getApiErrorMessage(err, t('register.errors.registrationFailed'))
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: Brand showcase */}
      <div className="relative hidden w-1/2 bg-gradient-to-br from-emerald-600 to-emerald-700 lg:flex lg:flex-col lg:items-center lg:justify-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        <div className="relative z-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
            <Dumbbell className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">FitHub</h2>
          <p className="mt-3 max-w-sm text-emerald-100">Join thousands of athletes and start your fitness journey today.</p>
        </div>
        <div className="absolute bottom-20 left-20 h-32 w-32 rounded-full border border-white/10" />
        <div className="absolute bottom-32 left-32 h-20 w-20 rounded-full border border-white/10" />
        <div className="absolute right-20 top-20 h-24 w-24 rounded-full border border-white/10" />
      </div>

      {/* Right: Form */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25">
              <Dumbbell className="h-7 w-7 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">{t('register.title')}</h1>
          <p className="mt-2 text-sm text-gray-500">{t('register.subtitle')}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('register.emailLabel')}</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder={t('register.emailPlaceholder')} />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('register.passwordLabel')}</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder={t('register.passwordPlaceholder')} />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">{t('register.confirmPasswordLabel')}</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input id="confirmPassword" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder={t('register.confirmPasswordPlaceholder')} />
              </div>
            </div>

            {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

            <button type="submit" disabled={isSubmitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {isSubmitting ? t('register.submittingButton') : t('register.submitButton')}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            {t('register.haveAccount')}{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">{t('register.signIn')}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Register
