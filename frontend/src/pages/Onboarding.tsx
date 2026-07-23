import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Droplets, Ruler, UserRound, Weight } from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  type ClientGender,
  createClientProfile,
  type CreateClientProfileRequest,
} from '../services/profile.service'
import { useAuthStore } from '../store/useAuthStore'
import { getApiErrorMessage } from '../utils/errorHandler'
import toast from '../utils/toast'

type OnboardingForm = {
  firstname: string
  lastname: string
  phone: string
  birthdate: string
  height: string
  weight: string
  dailyWaterTarget: string
  gender: ClientGender
}

type OnboardingErrors = Partial<Record<keyof OnboardingForm, string>>

const phonePattern = /^\+[1-9]\d{1,14}$/

const Onboarding = () => {
  const { t } = useTranslation(['onboarding', 'common'])
  const navigate = useNavigate()
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser)
  const [form, setForm] = useState<OnboardingForm>({
    firstname: '',
    lastname: '',
    phone: '',
    birthdate: '',
    height: '170',
    weight: '70',
    dailyWaterTarget: '2500',
    gender: 'OTHER',
  })
  const [errors, setErrors] = useState<OnboardingErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit = useMemo(
    () => Object.keys(validateOnboardingForm(form, t)).length === 0,
    [form, t],
  )

  const updateField = (field: keyof OnboardingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateOnboardingForm(form, t)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      toast.error(t('errors.fillFields'))
      return
    }

    const payload: CreateClientProfileRequest = {
      firstname: form.firstname.trim(),
      lastname: form.lastname.trim(),
      phone: form.phone.trim(),
      birthdate: form.birthdate || null,
      height: Number(form.height),
      weight: Number(form.weight),
      dailyWaterTarget: Number(form.dailyWaterTarget),
      gender: form.gender,
    }

    setIsSubmitting(true)

    try {
      await createClientProfile(payload)
      await fetchCurrentUser()
      toast.success(t('success.created', { ns: 'common' }))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          t('common:errors.serverError'),
        ),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mx-auto w-full max-w-3xl"
      >
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
          <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
          <p className="mt-1 text-emerald-100">{t('subtitle')}</p>
        </div>

        <Card className="mt-6 border-border bg-card shadow-soft-lg">
          <CardHeader className="space-y-4">
            <div>
              <CardDescription>
                {t('subtitle')}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  id="firstname"
                  label={t('fields.firstName')}
                  value={form.firstname}
                  error={errors.firstname}
                  onChange={(value) => updateField('firstname', value)}
                  placeholder={t('placeholders.firstName')}
                />
                <FormField
                  id="lastname"
                  label={t('fields.lastName')}
                  value={form.lastname}
                  error={errors.lastname}
                  onChange={(value) => updateField('lastname', value)}
                  placeholder={t('placeholders.lastName')}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  id="phone"
                  label={t('fields.phone')}
                  value={form.phone}
                  error={errors.phone}
                  onChange={(value) => updateField('phone', value)}
                  placeholder={t('fields.phonePlaceholder')}
                />
                <FormField
                  id="birthdate"
                  label={t('fields.birthdate')}
                  type="date"
                  value={form.birthdate}
                  error={errors.birthdate}
                  onChange={(value) => updateField('birthdate', value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <IconField
                  id="height"
                  label={t('fields.height')}
                  icon={<Ruler className="h-4 w-4 text-muted-foreground" />}
                  type="number"
                  value={form.height}
                  error={errors.height}
                  onChange={(value) => updateField('height', value)}
                />
                <IconField
                  id="weight"
                  label={t('fields.weight')}
                  icon={<Weight className="h-4 w-4 text-muted-foreground" />}
                  type="number"
                  step="0.1"
                  value={form.weight}
                  error={errors.weight}
                  onChange={(value) => updateField('weight', value)}
                />
                <IconField
                  id="dailyWaterTarget"
                  label={t('fields.waterTarget')}
                  icon={<Droplets className="h-4 w-4 text-muted-foreground" />}
                  type="number"
                  value={form.dailyWaterTarget}
                  error={errors.dailyWaterTarget}
                  onChange={(value) => updateField('dailyWaterTarget', value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gender">{t('fields.gender')}</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <select
                    id="gender"
                    value={form.gender}
                    onChange={(event) =>
                      updateField('gender', event.target.value as ClientGender)
                    }
                    className={`flex h-10 w-full rounded-xl border bg-background px-9 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring ${
                      errors.gender ? 'border-destructive' : 'border-border'
                    }`}
                  >
                    <option value="MALE">{t('fields.genderLabels.male')}</option>
                    <option value="FEMALE">{t('fields.genderLabels.female')}</option>
                    <option value="OTHER">{t('fields.genderLabels.other')}</option>
                  </select>
                </div>
                {errors.gender && (
                  <p className="text-xs text-destructive">{errors.gender}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !canSubmit}
              >
                {isSubmitting && (
                  <span className="mr-2 inline-flex h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                )}
                {isSubmitting ? t('submitting') : t('submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

const validateOnboardingForm = (form: OnboardingForm, t: (key: string) => string): OnboardingErrors => {
  const errors: OnboardingErrors = {}

  if (!form.firstname.trim()) errors.firstname = t('common:validation.firstNameRequired')
  if (!form.lastname.trim()) errors.lastname = t('common:validation.lastNameRequired')
  if (!phonePattern.test(form.phone.trim())) {
    errors.phone = t('common:validation.phoneFormat')
  }
  if (!form.gender) errors.gender = t('common:validation.genderRequired')
  if (!isPositiveNumber(form.height)) errors.height = t('common:validation.heightPositive')
  if (!isPositiveNumber(form.weight)) errors.weight = t('common:validation.weightPositive')
  if (!isPositiveInteger(form.dailyWaterTarget)) {
    errors.dailyWaterTarget = t('common:validation.waterTargetPositive')
  }
  if (form.birthdate && Number.isNaN(Date.parse(form.birthdate))) {
    errors.birthdate = t('common:validation.birthdateValid')
  }

  return errors
}

const isPositiveNumber = (value: string) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) && numericValue > 0
}

const isPositiveInteger = (value: string) => {
  const numericValue = Number(value)
  return Number.isInteger(numericValue) && numericValue > 0
}

type FormFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: string
  step?: string
  placeholder?: string
}

const FormField = ({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  step,
  placeholder,
}: FormFieldProps) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type={type}
      step={step}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={error ? 'border-destructive' : undefined}
    />
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
)

type IconFieldProps = FormFieldProps & {
  icon: ReactNode
}

const IconField = ({ icon, ...props }: IconFieldProps) => (
  <div className="space-y-1.5">
    <Label htmlFor={props.id}>{props.label}</Label>
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-3.5">{icon}</span>
      <Input
        id={props.id}
        type={props.type}
        step={props.step}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        className={`pl-9 ${props.error ? 'border-destructive' : ''}`}
      />
    </div>
    {props.error && <p className="text-xs text-destructive">{props.error}</p>}
  </div>
)

export default Onboarding
