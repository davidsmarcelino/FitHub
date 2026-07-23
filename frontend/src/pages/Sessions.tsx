import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  CheckCircle,
  Clock,
  Dumbbell,
  Users2,
  UserCheck,
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useMountedRef } from '../utils/useMountedRef'
import {
  getTrainingSessions,
  getMyAttendance,
  joinSession,
  joinWaitlist,
  leaveWaitlist,
  type TrainingSessionResponse,
} from '../services/workout.service'
import { getApiErrorMessage } from '../utils/errorHandler'
import toast from '../utils/toast'
import { formatDateTime, getAppDateTimeMs } from '../lib/utils'
import { EmptyState } from '../components/ui/empty-state'
import { Pagination } from '../components/ui/pagination'
import { InfoTile } from '../components/ui/info-tile'
import { StatusBadge, sessionStatusColors } from '../components/ui/status-badge'

type SessionFilter = 'all' | 'upcoming' | 'past'

const Sessions = () => {
  const { t } = useTranslation(['sessions', 'common'])
  const roles = useAuthStore((state) => state.roles)
  const isClient = roles.includes('CLIENT')
  const [sessions, setSessions] = useState<TrainingSessionResponse[]>([])
  const [joinedSessionIds, setJoinedSessionIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<SessionFilter>('all')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const mounted = useMountedRef()

  const loadSessions = useCallback(async (page = 0) => {
    setIsLoading(true)
    setError(null)
    try {
      const [sessionsResult, attendanceResult] = await Promise.allSettled([
        getTrainingSessions(page, 50),
        isClient ? getMyAttendance() : Promise.resolve([]),
      ])
      if (mounted.current) {
        if (sessionsResult.status === 'fulfilled') {
          setSessions(sessionsResult.value.content)
          setTotalPages(sessionsResult.value.totalPages)
          setCurrentPage(page)
        }
        if (attendanceResult.status === 'fulfilled') {
          setJoinedSessionIds(new Set(attendanceResult.value.map((a) => a.session.sessionId)))
        }
      }
    } catch {
      setError(t('errors.loadFailed'))
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [isClient, mounted, t])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  const handleJoin = async (sessionId: string) => {
    setJoiningId(sessionId)
    try {
      await joinSession(sessionId)
      toast.success(t('common:toast.joinedSession'))
      await loadSessions()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('errors.joinFailed')))
    } finally {
      setJoiningId(null)
    }
  }

  const handleWaitlist = async (sessionId: string) => {
    setJoiningId(sessionId)
    try {
      await joinWaitlist(sessionId)
      toast.success(t('waitlisted'))
      await loadSessions()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('errors.joinFailed')))
    } finally {
      setJoiningId(null)
    }
  }

  const handleLeaveWaitlist = async (sessionId: string) => {
    setJoiningId(sessionId)
    try {
      await leaveWaitlist(sessionId)
      toast.success(t('leftWaitlist'))
      await loadSessions()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('errors.leaveWaitlistFailed')))
    } finally {
      setJoiningId(null)
    }
  }

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])
  const upcoming = useMemo(
    () => sessions.filter(
      (s) => getAppDateTimeMs(s.startTime) >= now && s.status === 'SCHEDULED',
    ),
    [sessions, now],
  )
  const past = useMemo(
    () => sessions.filter(
      (s) => getAppDateTimeMs(s.startTime) < now || s.status !== 'SCHEDULED',
    ),
    [sessions, now],
  )

  const filteredSessions = activeFilter === 'upcoming'
    ? upcoming
    : activeFilter === 'past'
      ? past
      : sessions

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
        <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-emerald-100">{t('subtitle')}</p>
      </div>

      {error && !isLoading && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1" role="tablist">
        {(['all', 'upcoming', 'past'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={activeFilter === filter}
            onClick={() => setActiveFilter(filter)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeFilter === filter
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {filter === 'all' && t('filter.all')}
            {filter === 'upcoming' && t('upcoming')}
            {filter === 'past' && t('past')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filteredSessions.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {filteredSessions.map((session) => {
              const isPast = getAppDateTimeMs(session.startTime) < now || session.status !== 'SCHEDULED'
              return (
                <SessionCard
                  key={session.id}
                  session={session}
                  isClient={isClient}
                  isJoining={joiningId === session.id}
                  isJoined={joinedSessionIds.has(session.id)}
                  onJoin={() => void handleJoin(session.id)}
                  onWaitlist={() => void handleWaitlist(session.id)}
                  onLeaveWaitlist={() => void handleLeaveWaitlist(session.id)}
                  isPast={isPast}
                />
              )
            })}
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
    </div>
  )
}

const SessionCard = ({
  session,
  isClient,
  isJoining,
  isJoined,
  onJoin,
  onWaitlist,
  onLeaveWaitlist,
  isPast = false,
}: {
  session: TrainingSessionResponse
  isClient: boolean
  isJoining: boolean
  isJoined: boolean
  onJoin: () => void
  onWaitlist: () => void
  onLeaveWaitlist: () => void
  isPast?: boolean
}) => {
  const { t } = useTranslation(['sessions', 'common'])
  const spotsLeft = session.maxParticipants - session.currentParticipants
  const isFull = spotsLeft <= 0
  const trainerName =
    [session.trainer.firstname, session.trainer.lastname]
      .filter(Boolean)
      .join(' ') || t('fallbacks.trainer')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`h-full rounded-2xl border border-border bg-card p-5 shadow-soft ${isPast ? 'opacity-70' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              session.type === 'GROUP'
                ? 'bg-blue-500/10 text-blue-600'
                : 'bg-violet-500/10 text-violet-600'
            }`}>
              {t('common:enums.trainingType.' + session.type)}
            </span>
            <StatusBadge status={session.status} colors={sessionStatusColors} label={t('status.' + session.status)} />
            {isJoined && !isPast && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600">
                <CheckCircle className="h-3 w-3" />
                {t('joined')}
              </span>
            )}
          </div>
          <h3 className="mt-3 text-base font-semibold text-foreground">
            {t('common:enums.trainingType.' + session.type)}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('withTrainer', { name: trainerName })}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Dumbbell className="h-5 w-5 text-primary" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
        <InfoTile
          icon={Clock}
          label={t('startsAt')}
          value={formatDateTime(session.startTime)}
        />
        <InfoTile
          icon={Users2}
          label={t('capacity')}
          value={`${session.currentParticipants}/${session.maxParticipants}`}
        />
      </div>

      {isClient && !isPast && session.status === 'SCHEDULED' && (
        <div className="mt-4">
          {isJoined ? (
            <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle className="h-3.5 w-3.5" />
              {t('alreadyJoined')}
            </p>
          ) : isFull ? (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isJoining}
                onClick={onWaitlist}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-all hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isJoining ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                ) : null}
                {isJoining ? t('joining') : t('sessionFull')}
              </button>
              <button
                type="button"
                disabled={isJoining}
                onClick={onLeaveWaitlist}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 text-sm font-semibold text-destructive transition-all hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('leaveWaitlist')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isJoining}
              onClick={onJoin}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isJoining ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
              {isJoining ? t('joining') : t('join', { spots: spotsLeft })}
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default Sessions
