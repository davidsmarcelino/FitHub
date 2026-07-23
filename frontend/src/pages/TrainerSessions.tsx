import { useEffect, useState, useCallback, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { CalendarDays, Plus, Search, Users2, X } from 'lucide-react'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { EmptyState } from '../components/ui/empty-state'
import { Pagination } from '../components/ui/pagination'
import { StatusBadge, sessionStatusColors } from '../components/ui/status-badge'
import {
  getTrainingSessions,
  createSession,
  checkInClient,
  getAttendanceBySession,
  type TrainingSessionResponse,
  type CreateTrainingSessionRequest,
  type AttendanceSessionResponse,
} from '../services/workout.service'
import { searchClients, type ClientProfileResponse } from '../services/user.service'
import { useMountedRef } from '../utils/useMountedRef'
import { getApiErrorMessage } from '../utils/errorHandler'
import { formatDateTime, toBackendDateTime } from '../lib/utils'
import toast from '../utils/toast'

const TrainerSessions = () => {
  const { t } = useTranslation(['sessions', 'common'])
  const [sessions, setSessions] = useState<TrainingSessionResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<TrainingSessionResponse | null>(null)
  const [attendances, setAttendances] = useState<AttendanceSessionResponse[]>([])
  const [isLoadingAttendances, setIsLoadingAttendances] = useState(false)
  const [checkInClientId, setCheckInClientId] = useState('')
  const [clientSearchQuery, setClientSearchQuery] = useState('')
  const [clientSearchResults, setClientSearchResults] = useState<ClientProfileResponse[]>([])
  const [selectedClient, setSelectedClient] = useState<ClientProfileResponse | null>(null)
  const mounted = useMountedRef()

  const doClientSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setClientSearchResults([])
      return
    }
    try {
      const res = await searchClients(query, 0, 10)
      setClientSearchResults(res.content)
    } catch {
      setClientSearchResults([])
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void doClientSearch(clientSearchQuery)
    }, 350)
    return () => clearTimeout(timer)
  }, [clientSearchQuery, doClientSearch])

  const loadSessions = useCallback(async (page = 0) => {
    setIsLoading(true)
    try {
      const result = await getTrainingSessions(page, 12)
      if (mounted.current) {
        setSessions(result.content)
        setTotalPages(result.totalPages)
        setCurrentPage(page)
      }
    } catch {
      toast.error(t('errors.loadFailed'))
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [mounted, t])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  const handleCheckIn = async (sessionId: string) => {
    const clientId = selectedClient?.id ?? checkInClientId.trim()
    if (!clientId) return
    try {
      await checkInClient(sessionId, clientId)
      toast.success(t('common:toast.sessionJoined'))
      setCheckInClientId('')
      setClientSearchQuery('')
      setClientSearchResults([])
      setSelectedClient(null)
      await loadAttendances(sessionId)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  const loadAttendances = async (sessionId: string) => {
    setIsLoadingAttendances(true)
    try {
      const result = await getAttendanceBySession(sessionId)
      if (mounted.current) setAttendances(result)
    } catch {
      // Attendance list will show empty state
    } finally {
      if (mounted.current) setIsLoadingAttendances(false)
    }
  }

  const handleViewAttendance = async (session: TrainingSessionResponse) => {
    setSelectedSession(session)
    await loadAttendances(session.id)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
            <p className="mt-1 text-emerald-100">{t('subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/20 px-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30"
          >
            <Plus className="h-4 w-4" />
            {t('common:buttons.create')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : sessions.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-full rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={session.status}
                        colors={sessionStatusColors}
                        label={t('status.' + session.status)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {t(`type.${session.type}`)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t('startsAt')}: {formatDateTime(session.startTime)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('capacity')}: {session.currentParticipants}/{session.maxParticipants}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleViewAttendance(session)}
                  >
                    <Users2 className="mr-1 h-4 w-4" />
                    {t('viewAttendance')}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => void loadSessions(page)}
            />
          </div>
        </>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title={t('emptyState.title')}
          description={t('emptyState.description')}
        />
      )}

      {isCreateModalOpen && (
        <SessionFormModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false)
            void loadSessions(currentPage)
          }}
        />
      )}

      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-soft-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {t('viewAttendance')}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setSelectedSession(null)
                  setAttendances([])
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:bg-accent"
                aria-label={t('common:buttons.close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t('checkInClient')}</Label>
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={t('common:labels.search')}
                        value={selectedClient ? `${selectedClient.firstname} ${selectedClient.lastname}` : clientSearchQuery}
                        onChange={(e) => {
                          setClientSearchQuery(e.target.value)
                          setSelectedClient(null)
                          setCheckInClientId('')
                        }}
                        className="pl-9"
                      />
                    </div>
                  <Button onClick={() => void handleCheckIn(selectedSession.id)} disabled={!selectedClient && !checkInClientId.trim()}>
                    {t('checkInClient')}
                    </Button>
                  </div>
                  {clientSearchResults.length > 0 && !selectedClient && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
                      {clientSearchResults.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => {
                            setSelectedClient(client)
                            setCheckInClientId(client.id)
                            setClientSearchQuery('')
                            setClientSearchResults([])
                          }}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-accent"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {client.firstname[0]}{client.lastname[0]}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{client.firstname} {client.lastname}</p>
                            <p className="text-xs text-muted-foreground">{client.phone}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedClient && (
                  <p className="text-xs text-muted-foreground">
                    {selectedClient.firstname} {selectedClient.lastname} — {selectedClient.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-foreground">{t('capacity')}</h3>
                {isLoadingAttendances ? (
                  <div className="h-20 animate-pulse rounded-xl bg-muted" />
                ) : attendances.length ? (
                  <div className="space-y-2">
                    {attendances.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-background p-3"
                      >
                        <span className="text-sm text-foreground">
                          {att.client.clientFirstname} {att.client.clientLastname}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(att.checkInTime)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('emptyState.description')}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

const SessionFormModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) => {
  const { t } = useTranslation(['sessions', 'common'])
  const [form, setForm] = useState<CreateTrainingSessionRequest>({
    type: 'GROUP',
    startTime: '',
    endTime: '',
    maxParticipants: 10,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!form.startTime) newErrors.startTime = t('form.validation.startTimeRequired')
    if (!form.endTime) newErrors.endTime = t('form.validation.endTimeRequired')
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      newErrors.endTime = t('form.validation.endTimeAfterStart')
    }
    if (form.maxParticipants < 1) newErrors.maxParticipants = t('form.validation.participantsMin')

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    setIsSubmitting(true)
    try {
      await createSession({
        ...form,
        startTime: toBackendDateTime(form.startTime),
        endTime: toBackendDateTime(form.endTime),
      })
      toast.success(t('common:messages.created'))
      onSuccess()
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-soft-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {t('common:buttons.create')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('form.sessionType')}</Label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'GROUP' | 'PERSONAL' })}
              className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground shadow-soft focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="GROUP">{t('type.GROUP')}</option>
              <option value="PERSONAL">{t('type.PERSONAL')}</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('startsAt')}</Label>
              <Input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
              {errors.startTime && <p className="text-xs text-destructive">{errors.startTime}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t('form.endTime')}</Label>
              <Input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />
              {errors.endTime && <p className="text-xs text-destructive">{errors.endTime}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t('capacity')}</Label>
            <Input
              type="number"
              min="1"
              value={form.maxParticipants}
              onChange={(e) => setForm({ ...form, maxParticipants: parseInt(e.target.value) || 10 })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common:buttons.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common:buttons.loading') : t('common:buttons.create')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default TrainerSessions
