import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getMyClientProfile, getMyTrainerProfile } from '../services/profile.service'
import { useAuthStore } from '../store/useAuthStore'
import { getApiErrorMessage } from '../utils/errorHandler'
import toast from '../utils/toast'

const ProfileOnboardingGate = () => {
  const { t } = useTranslation(['onboarding'])
  const location = useLocation()
  const navigate = useNavigate()
  const roles = useAuthStore((state) => state.roles)
  const user = useAuthStore((state) => state.user)
  const [isCheckingProfile, setIsCheckingProfile] = useState(false)

  const isClient = roles.includes('CLIENT')
  const isTrainer = roles.includes('TRAINER')
  const isOnboardingRoute = location.pathname === '/onboarding'
  const isTrainerProfileRoute = location.pathname === '/trainer-profile'
  const hasClientProfile = user?.clientProfile != null
  const hasTrainerProfile = user?.trainerProfile != null

  useEffect(() => {
    if (!isClient && !isTrainer) {
      setIsCheckingProfile(false)
      return
    }

    if (isClient && !hasClientProfile && !isOnboardingRoute) {
      setIsCheckingProfile(false)
      navigate('/onboarding', { replace: true })
      return
    }

    if (isTrainer && !hasTrainerProfile && !isTrainerProfileRoute) {
      setIsCheckingProfile(false)
      navigate('/trainer-profile', { replace: true })
      return
    }

    if (!isOnboardingRoute && !isTrainerProfileRoute) {
      setIsCheckingProfile(false)
      return
    }

    let isMounted = true
    setIsCheckingProfile(true)

    const checkProfile = isClient
      ? getMyClientProfile()
      : getMyTrainerProfile()

    void checkProfile
      .then(() => {
        if (isMounted && isOnboardingRoute) {
          navigate('/dashboard', { replace: true })
        }
      })
      .catch((err) => {
        if (!isMounted) return

        if (
          axios.isAxiosError(err) &&
          (err.response?.status === 404 || err.response?.status === 500)
        ) {
          if (isClient && !isOnboardingRoute) {
            navigate('/onboarding', { replace: true })
          } else if (isTrainer && !isTrainerProfileRoute) {
            navigate('/trainer-profile', { replace: true })
          }
          return
        }

        toast.error(
          getApiErrorMessage(
            err,
            t('errors.verifyFailed'),
          ),
        )
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingProfile(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isClient, isTrainer, isOnboardingRoute, isTrainerProfileRoute, navigate, hasClientProfile, hasTrainerProfile, t])

  if (!isClient && !isTrainer && (isOnboardingRoute || isTrainerProfileRoute) && roles.length > 0) {
    return <Navigate to="/dashboard" replace />
  }

  if ((isClient || isTrainer) && isCheckingProfile && !isOnboardingRoute && !isTrainerProfileRoute) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-soft-lg">
          <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
          {t('loading')}
        </div>
      </div>
    )
  }

  return <Outlet />
}

export default ProfileOnboardingGate
