import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Bell,
  BellOff,
  CheckCheck,
  CreditCard,
  Dumbbell,
  FileText,
  Gift,
  HeartPulse,
  MessageSquare,
  Star,
  Trophy,
  Users2,
} from 'lucide-react'
import {
  getNotifications,
  getNotificationSummary,
  markAsRead,
  markAllAsRead,
  type NotificationResponse,
  type NotificationSummaryResponse,
} from '../services/notification.service'
import { API_BASE_URL } from '../services/api'
import toast from '../utils/toast'
import { useMountedRef } from '../utils/useMountedRef'

const Notifications = () => {
  const { t } = useTranslation(['notifications', 'common'])
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [summary, setSummary] = useState<NotificationSummaryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const eventSourceRef = useRef<EventSource | null>(null)
  const mounted = useMountedRef()

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [notiPage, summaryData] = await Promise.allSettled([
        getNotifications(0, 30),
        getNotificationSummary(),
      ])
      if (mounted.current) {
        if (notiPage.status === 'fulfilled') setNotifications(notiPage.value.content)
        if (summaryData.status === 'fulfilled') setSummary(summaryData.value)
      }
    } catch {
      // Handled by empty state UI
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [mounted])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    let reconnectTimeout: ReturnType<typeof setTimeout>
    let reconnectAttempts = 0
    const maxReconnectDelay = 30_000

    const connect = () => {
      try {
        const es = new EventSource(
          `${API_BASE_URL}/notifications/stream?token=${token}`,
        )
        es.onmessage = () => {
          reconnectAttempts = 0
          void loadData()
        }
        es.onerror = () => {
          es.close()
          const delay = Math.min(1000 * 2 ** reconnectAttempts, maxReconnectDelay)
          reconnectAttempts++
          reconnectTimeout = setTimeout(connect, delay)
        }
        eventSourceRef.current = es
      } catch {
        // SSE not supported
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimeout)
      eventSourceRef.current?.close()
    }
  }, [loadData])

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setSummary((prev) => (prev ? { ...prev, unreadCount: 0 } : prev))
      toast.success(t('common:toast.allRead'))
    } catch {
      toast.error(t('common:toast.readFailed'))
    }
  }

  const handleMarkRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      )
      setSummary((prev) =>
        prev ? { ...prev, unreadCount: Math.max(0, prev.unreadCount - 1) } : prev,
      )
    } catch {
      toast.error(t('common:toast.readFailed'))
    }
  }

  const unreadCount = summary?.unreadCount ?? notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
            <p className="mt-1 text-emerald-100">
              {unreadCount > 0
                ? t('unreadCount', { count: unreadCount })
                : t('allCaughtUp')}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void handleMarkAllRead()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white/20 px-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30"
            >
              <CheckCheck className="h-4 w-4" />
              {t('markAllRead')}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : notifications.length ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkRead={() => void handleMarkRead(notification.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background">
            <BellOff className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-semibold text-foreground">{t('noData')}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t('noDataDesc')}
          </p>
        </div>
      )}
    </div>
  )
}

const notificationIcons: Record<string, typeof Bell> = {
  SESSION_REMINDER: Bell,
  SESSION_CANCELLED: Bell,
  SESSION_RESCHEDULED: Bell,
  MEMBERSHIP_EXPIRING: CreditCard,
  MEMBERSHIP_EXPIRED: CreditCard,
  MEMBERSHIP_ACTIVATED: CreditCard,
  PAYMENT_SUCCESS: CreditCard,
  PAYMENT_FAILED: CreditCard,
  PAYMENT_REFUNDED: CreditCard,
  NEW_WORKOUT_PLAN: Dumbbell,
  WORKOUT_COMPLETED: Dumbbell,
  GOAL_ACHIEVED: Trophy,
  MILESTONE_REACHED: Trophy,
  NEW_MESSAGE: MessageSquare,
  NEW_REVIEW: Star,
  TRAINER_ASSIGNED: Users2,
  GENERAL_ANNOUNCEMENT: Gift,
  MAINTENANCE_SCHEDULED: FileText,
  PROFILE_UPDATE_REMINDER: HeartPulse,
  MEASUREMENT_REMINDER: HeartPulse,
}

const priorityColors: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground',
  NORMAL: 'bg-primary/10 text-primary',
  MEDIUM: 'bg-blue-500/10 text-blue-600',
  HIGH: 'bg-amber-500/10 text-amber-600',
  URGENT: 'bg-red-500/10 text-red-600',
}

const NotificationRow = ({
  notification,
  onMarkRead,
}: {
  notification: NotificationResponse
  onMarkRead: () => void
}) => {
  const { t } = useTranslation(['notifications'])
  const Icon = notificationIcons[notification.type] ?? Bell

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border bg-card p-4 transition-colors ${
        notification.read
          ? 'border-border'
          : 'border-primary/30 bg-primary/5'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${priorityColors[notification.priority] ?? 'bg-muted text-muted-foreground'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">
              {notification.title}
            </p>
            {!notification.read && (
              <button
                type="button"
                onClick={onMarkRead}
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                {t('markRead')}
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
          <p className="mt-2 text-xs text-muted-foreground">{notification.timeAgo}</p>
        </div>
      </div>
    </motion.div>
  )
}

export default Notifications
