import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Star } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  getMyTrainerProfile,
  createTrainerProfile,
  updateMyTrainerProfile,
  type TrainerProfileResponse,
} from '../services/profile.service'
import { getSpecializations, type SpecializationResponse } from '../services/specialization.service'
import { getTrainerReviewSummary, type TrainerReviewSummaryResponse } from '../services/trainer.service'
import { useAuthStore } from '../store/useAuthStore'
import { getApiErrorMessage } from '../utils/errorHandler'
import { useMountedRef } from '../utils/useMountedRef'
import toast from '../utils/toast'

type TrainerForm = {
  firstname: string
  lastname: string
  specializationIds: string[]
  experienceYears: string
  description: string
}

type TrainerFormErrors = Partial<Record<keyof TrainerForm, string>>

const createFormFromProfile = (profile: TrainerProfileResponse | null): TrainerForm => ({
  firstname: profile?.firstname ?? '',
  lastname: profile?.lastname ?? '',
  specializationIds: [],
  experienceYears: profile?.experienceYears?.toString() ?? '1',
  description: profile?.description ?? '',
})

const TrainerProfile = () => {
  const { t } = useTranslation(['trainers', 'common'])
  const navigate = useNavigate()
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser)
  const [profile, setProfile] = useState<TrainerProfileResponse | null>(null)
  const [form, setForm] = useState<TrainerForm>(() => createFormFromProfile(null))
  const [formErrors, setFormErrors] = useState<TrainerFormErrors>({})
  const [specializations, setSpecializations] = useState<SpecializationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reviewSummary, setReviewSummary] = useState<TrainerReviewSummaryResponse | null>(null)

  const mounted = useMountedRef()

  const loadReviewSummary = useCallback(async () => {
    try {
      const summary = await getTrainerReviewSummary()
      if (mounted.current) setReviewSummary(summary)
    } catch {
      // Review summary is optional, don't show error
    }
  }, [mounted])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [profileData, specsData] = await Promise.allSettled([
          getMyTrainerProfile(),
          getSpecializations(0, 50),
        ])
        if (mounted.current) {
          if (profileData.status === 'fulfilled') {
            setProfile(profileData.value)
            setForm(createFormFromProfile(profileData.value))
          }
          if (specsData.status === 'fulfilled') {
            setSpecializations(specsData.value.content)
            if (profileData.status === 'fulfilled' && profileData.value?.specializations) {
              const specIds = profileData.value.specializations
                .map((name) => specsData.value.content.find((s) => s.name === name)?.id)
                .filter((id): id is string => !!id)
              setForm((prev) => ({ ...prev, specializationIds: specIds }))
            }
          }
        }
      } catch (err) {
        setError(getApiErrorMessage(err, t('common:errors.serverError')))
      } finally {
        if (mounted.current) setIsLoading(false)
        void loadReviewSummary()
      }
    }
    void load()
  }, [mounted, t, loadReviewSummary])

  const updateField = (field: keyof TrainerForm, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setFormErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const toggleSpecialization = (specId: string) => {
    setForm((prev) => {
      const ids = prev.specializationIds.includes(specId)
        ? prev.specializationIds.filter((id) => id !== specId)
        : [...prev.specializationIds, specId]
      return { ...prev, specializationIds: ids }
    })
    setFormErrors((prev) => {
      const next = { ...prev }
      delete next.specializationIds
      return next
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const errors: TrainerFormErrors = {}
    if (!form.firstname.trim()) errors.firstname = t('common:validation.firstNameRequired')
    if (!form.lastname.trim()) errors.lastname = t('common:validation.lastNameRequired')
    if (!form.experienceYears || Number(form.experienceYears) < 1) errors.experienceYears = t('common:validation.experienceRequired')
    if (!form.description.trim()) errors.description = t('common:validation.descriptionRequired')

    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      toast.error(t('errors.fixFields'))
      return
    }

    setIsSaving(true)
    try {
      if (profile) {
        await updateMyTrainerProfile({
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
          specializationIds: form.specializationIds,
          experienceYears: Number(form.experienceYears),
          description: form.description.trim(),
        })
        toast.success(t('common:toast.updated'))
      } else {
        await createTrainerProfile({
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
          specializationIds: form.specializationIds,
          experienceYears: Number(form.experienceYears),
          description: form.description.trim(),
        })
        toast.success(t('common:toast.created'))
      }
      await fetchCurrentUser()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common:errors.serverError')))
    } finally {
      setIsSaving(false)
    }
  }

  const fullName = profile
    ? `${profile.firstname} ${profile.lastname}`
    : t('newTrainer')

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
        <h1 className="text-2xl font-bold md:text-3xl">{fullName}</h1>
        <p className="mt-1 text-emerald-100">
          {profile ? t('subtitle') : t('setupDesc')}
        </p>
      </div>

      {reviewSummary && reviewSummary.totalReviews > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-border bg-card shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                {t('reviewSummary.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border bg-background p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">
                    {reviewSummary.averageRating?.toFixed(1) ?? '—'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('reviewSummary.averageRating')}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">{reviewSummary.totalReviews}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('reviewSummary.totalReviews')}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">
                    {reviewSummary.professionalismAverage?.toFixed(1) ?? '—'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('reviewSummary.professionalism')}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4 text-center">
                  <p className="text-3xl font-bold text-foreground">
                    {reviewSummary.knowledgeAverage?.toFixed(1) ?? '—'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('reviewSummary.knowledge')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      ) : error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-border bg-card shadow-soft">
            <CardHeader>
              <CardTitle>{profile ? t('editProfile') : t('createProfile')}</CardTitle>
              <CardDescription>
                {profile ? t('editProfileDesc') : t('createProfileDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                   <FormField
                    label={t('common:labels.firstName')}
                    value={form.firstname}
                    error={formErrors.firstname}
                    onChange={(v) => updateField('firstname', v)}
                    placeholder={t('common:labels.firstName')}
                  />
                   <FormField
                    label={t('common:labels.lastName')}
                    value={form.lastname}
                    error={formErrors.lastname}
                    onChange={(v) => updateField('lastname', v)}
                    placeholder={t('common:labels.lastName')}
                  />
                </div>

                <FormField
                  label={t('experienceYears')}
                  type="number"
                  value={form.experienceYears}
                  error={formErrors.experienceYears}
                  onChange={(v) => updateField('experienceYears', v)}
                  placeholder={t('experienceYears')}
                />

                <div className="space-y-1.5">
                  <Label>{t('specializations')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {specializations.map((spec) => (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => toggleSpecialization(spec.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                          form.specializationIds.includes(spec.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border bg-background text-foreground hover:bg-accent'
                        }`}
                      >
                        {form.specializationIds.includes(spec.id) && (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        {spec.name}
                      </button>
                    ))}
                    {specializations.length === 0 && (
                      <p className="text-xs text-muted-foreground">{t('noSpecializations')}</p>
                    )}
                  </div>
                  {formErrors.specializationIds && (
                    <p className="text-xs text-destructive">{formErrors.specializationIds}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">{t('bioDescription')}</Label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className={`min-h-[100px] w-full rounded-xl border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring ${
                      formErrors.description ? 'border-destructive' : 'border-border'
                    }`}
                    placeholder={t('bioPlaceholder')}
                  />
                  {formErrors.description && (
                    <p className="text-xs text-destructive">{formErrors.description}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard', { replace: true })}
                    disabled={isSaving}
                    className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-60"
                  >
                    {t('common:buttons.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-60"
                  >
                    {isSaving && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    )}
                    {isSaving ? t('common:buttons.loading') : profile ? t('common:buttons.saveChanges') : t('common:buttons.create')}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

const FormField = ({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: string
  placeholder?: string
}) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={error ? 'border-destructive' : undefined}
    />
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
)

export default TrainerProfile
