import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Bell,
  Eye,
  EyeOff,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  ShieldCheck,
  Send,
  Star,
  User2,
  X,
  XCircle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/form-field'
import { Modal } from '../components/ui/modal'
import { MetricCard } from '../components/ui/metric-card'
import { StatusBadge, membershipStatusColors } from '../components/ui/status-badge'
import { searchClients, type ClientProfileResponse } from '../services/user.service'
import {
  createMembership,
  activateMembership,
  freezeMembership,
  unfreezeMembership,
  cancelMembership,
  extendMembership,
  getMembershipByClientId,
  type MembershipResponse,
} from '../services/membership.service'
import {
  getDashboardAnalytics,
  type DashboardAnalyticsResponse,
} from '../services/dashboard.service'
import {
  getAllReviews,
  updateReviewVisibility,
  type TrainerReviewResponse,
} from '../services/review.service'
import { formatDate, formatCurrency } from '../lib/utils'
import { broadcastNotification, type NotificationPriority, type NotificationType } from '../services/notification.service'
import { getApiErrorMessage } from '../utils/errorHandler'
import { useMountedRef } from '../utils/useMountedRef'
import toast from '../utils/toast'

type AdminTab = 'overview' | 'memberships' | 'broadcast' | 'reviews'

const getAdminTabs = (t: (key: string) => string): { key: AdminTab; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] => [
  { key: 'overview', label: t('tabs.overview'), icon: BarChart3 },
  { key: 'memberships', label: t('tabs.memberships'), icon: CreditCard },
  { key: 'reviews', label: t('tabs.reviews'), icon: Star },
  { key: 'broadcast', label: t('tabs.broadcast'), icon: Send },
]

const Admin = () => {
  const { t } = useTranslation(['admin', 'common'])
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
        <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-emerald-100">{t('subtitle')}</p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1" role="tablist">
        {getAdminTabs(t).map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'memberships' && <MembershipTab />}
      {activeTab === 'reviews' && <ReviewsTab />}
      {activeTab === 'broadcast' && <BroadcastTab />}
    </div>
  )
}

const OverviewTab = () => {
  const { t } = useTranslation(['admin', 'common'])
  const [analytics, setAnalytics] = useState<DashboardAnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mounted = useMountedRef()

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getDashboardAnalytics()
        if (mounted.current) setAnalytics(data)
      } catch {
        if (mounted.current) setError(t('common:errors.serverError'))
      } finally {
        if (mounted.current) setIsLoading(false)
      }
    }
    void load()
  }, [mounted, t])

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        icon={ShieldCheck}
        title={t('overview.activeClients')}
        value={analytics?.activeClients?.toString() ?? '0'}
        tone="bg-blue-500"
      />
      <MetricCard
        icon={CreditCard}
        title={t('overview.activeMemberships')}
        value={analytics?.activeMemberships?.toString() ?? '0'}
        tone="bg-emerald-500"
      />
      <MetricCard
        icon={BarChart3}
        title={t('overview.revenue')}
        value={formatCurrency(analytics?.revenue)}
        tone="bg-violet-500"
      />
      <MetricCard
        icon={Bell}
        title={t('overview.todayCheckIns')}
        value={analytics?.todayCheckIns?.toString() ?? '0'}
        tone="bg-amber-500"
      />
    </section>
  )
}

const MembershipTab = () => {
  const { t } = useTranslation(['admin', 'common'])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ClientProfileResponse[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientProfileResponse | null>(null)
  const [memberships, setMemberships] = useState<MembershipResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSearchClients = async (query: string) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    setIsSearching(true)
    try {
      const page = await searchClients(query.trim(), 0, 10)
      setSearchResults(page.content)
      setShowDropdown(true)
    } catch {
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectClient = async (client: ClientProfileResponse) => {
    setSelectedClient(client)
    setSearchQuery(`${client.firstname} ${client.lastname}`)
    setShowDropdown(false)
    if (!client.id) {
      toast.error(t('common:errors.notFound'))
      return
    }
    setIsLoading(true)
    try {
      const page = await getMembershipByClientId(client.id, 0, 20)
      setMemberships(page.content)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common:errors.serverError')))
      setMemberships([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearSelection = () => {
    setSelectedClient(null)
    setSearchQuery('')
    setMemberships([])
    setSearchResults([])
  }

  const handleAction = async (
    action: () => Promise<MembershipResponse>,
    label: string,
  ) => {
    try {
      await action()
      toast.success(`${label}`)
      if (selectedClient?.id) {
        const page = await getMembershipByClientId(selectedClient.id, 0, 20)
        setMemberships(page.content)
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common:errors.serverError')))
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">{t('memberships.findClient')}</h3>
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => void handleSearchClients(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                placeholder={t('memberships.searchPlaceholder')}
                className="pl-9"
              />
              {isSearching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                </span>
              )}
            </div>
            {selectedClient && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-3 text-sm text-muted-foreground transition hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-card shadow-soft-lg">
              {searchResults.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => void handleSelectClient(client)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-accent"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {client.firstname?.[0]}{client.lastname?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {client.firstname} {client.lastname}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {client.phone || t('memberships.noPhone')} · {client.gender || '-'}
                    </p>
                  </div>
                  <StatusBadge
                    status={client.active ? 'ACTIVE' : 'INACTIVE'}
                    colors={{ ACTIVE: 'bg-emerald-500/10 text-emerald-600', INACTIVE: 'bg-muted text-muted-foreground' }}
                    label={client.active ? t('common:status.active') : t('common:status.inactive')}
                  />
                </button>
              ))}
            </div>
          )}

          {showDropdown && searchResults.length === 0 && !isSearching && searchQuery.length >= 2 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-border bg-card p-4 shadow-soft-lg">
              <p className="text-sm text-muted-foreground text-center">{t('memberships.noClientsFound')}</p>
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t('memberships.searchHint')}
        </p>
      </div>

      {selectedClient && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/30 bg-primary/5 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              {selectedClient.firstname?.[0]}{selectedClient.lastname?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">
                {selectedClient.firstname} {selectedClient.lastname}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedClient.phone || t('memberships.noPhone')} · {t('memberships.memberSince', { date: formatDate(selectedClient.createdAt) })}
              </p>
            </div>
            {selectedClient.id && (
              <code className="shrink-0 rounded bg-background px-2 py-0.5 text-xs font-mono text-muted-foreground">
                {selectedClient.id.slice(0, 8)}...
              </code>
            )}
          </div>
        </motion.div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          disabled={!selectedClient}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-all hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          {t('memberships.createButton')}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : memberships.length > 0 ? (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
          {memberships.map((m) => (
            <div key={m.id} className="grid gap-3 bg-card p-4 md:grid-cols-[minmax(0,1fr),auto]">
              <div>
                <p className="font-semibold text-foreground">{t(`common:enums.membershipType.${m.type}`)} {t('memberships.planType')}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(m.startDate)} — {formatDate(m.endDate)}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge status={m.status} colors={membershipStatusColors} label={t('common:enums.membershipStatus.' + m.status)} />
                  {m.visitsLeft !== null && (
                    <span className="text-xs text-muted-foreground">
                      {t('memberships.visitsLeft', { count: m.visitsLeft })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {m.status === 'CREATED' && (
                  <ActionBtn icon={PlayCircle} label={t('memberships.actions.activate')} onClick={() => void handleAction(() => activateMembership(m.id), t('memberships.actions.activate'))} />
                )}
                {m.status === 'ACTIVE' && (
                  <ActionBtn icon={PauseCircle} label={t('memberships.actions.freeze')} onClick={() => void handleAction(() => freezeMembership(m.id), t('memberships.actions.freeze'))} />
                )}
                {m.status === 'FROZEN' && (
                  <ActionBtn icon={PlayCircle} label={t('memberships.actions.unfreeze')} onClick={() => void handleAction(() => unfreezeMembership(m.id), t('memberships.actions.unfreeze'))} />
                )}
                {(m.status === 'ACTIVE' || m.status === 'FROZEN') && (
                  <>
                    <ActionBtn icon={CalendarDays} label={t('memberships.actions.extend')} onClick={() => void handleAction(() => extendMembership(m.id, 1), t('memberships.actions.extend'))} />
                    <ActionBtn icon={XCircle} label={t('memberships.actions.cancel')} onClick={() => {
                      if (!window.confirm(t('memberships.cancelConfirm'))) return
                      void handleAction(() => cancelMembership(m.id), t('memberships.actions.cancel'))
                    }} danger />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : selectedClient ? (
        <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <CreditCard className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-semibold text-foreground">{t('memberships.noResults')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('memberships.noMemberships')}</p>
        </div>
      ) : (
        <div className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <User2 className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-semibold text-foreground">{t('memberships.selectClientFirst')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('memberships.selectClientHint')}</p>
        </div>
      )}

      {isCreateOpen && selectedClient?.id && (
        <CreateMembershipModal
          clientId={selectedClient.id}
          onClose={() => setIsCreateOpen(false)}
          onCreated={async () => {
            setIsCreateOpen(false)
            toast.success(t('common:toast.membershipCreated'))
            const page = await getMembershipByClientId(selectedClient.id!, 0, 20)
            setMemberships(page.content)
          }}
        />
      )}
    </div>
  )
}

const ReviewsTab = () => {
  const { t } = useTranslation(['admin', 'common'])
  const [reviews, setReviews] = useState<TrainerReviewResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterVisible, setFilterVisible] = useState<boolean | undefined>(undefined)
  const [hideModalOpen, setHideModalOpen] = useState(false)
  const [hideReviewId, setHideReviewId] = useState<string | null>(null)
  const [hideReason, setHideReason] = useState('')

  const loadReviews = useCallback(async (isVisible?: boolean) => {
    setIsLoading(true)
    try {
      const page = await getAllReviews(0, 50, { isVisible })
      setReviews(page.content)
    } catch {
      toast.error(t('common:errors.serverError'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadReviews(filterVisible)
  }, [filterVisible, loadReviews])

  const handleToggleVisibility = async (reviewId: string, currentVisibility: boolean) => {
    if (currentVisibility) {
      setHideReviewId(reviewId)
      setHideReason('')
      setHideModalOpen(true)
      return
    }
    try {
      await updateReviewVisibility(reviewId, { visible: true })
      toast.success(t('common:toast.reviewVisibilityUpdated'))
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, visible: true } : r,
        ),
      )
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common:errors.serverError')))
    }
  }

  const handleConfirmHide = async (e: FormEvent) => {
    e.preventDefault()
    if (!hideReviewId) return
    try {
      const reason = hideReason.trim() || undefined
      await updateReviewVisibility(hideReviewId, { visible: false, reason })
      toast.success(t('common:toast.reviewVisibilityUpdated'))
      setReviews((prev) =>
        prev.map((r) =>
          r.id === hideReviewId ? { ...r, visible: false } : r,
        ),
      )
      setHideModalOpen(false)
      setHideReviewId(null)
      setHideReason('')
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common:errors.serverError')))
    }
  }

  const filterOptions = [
    { label: t('reviews.filters.all'), value: undefined },
    { label: t('reviews.filters.visible'), value: true },
    { label: t('reviews.filters.hidden'), value: false },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{t('reviews.title')}</h3>
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {filterOptions.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setFilterVisible(option.value)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                filterVisible === option.value
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {review.reviewer.clientFirstname} {review.reviewer.clientLastname}
                    </p>
                    <span className="text-xs text-muted-foreground">&rarr;</span>
                    <p className="text-sm text-muted-foreground">
                      {t('reviews.trainerReview')}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {review.rating}/5
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {review.comment}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleToggleVisibility(review.id, review.visible)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    review.visible
                      ? 'border border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/5'
                      : 'border border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {review.visible ? (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      {t('reviews.visible')}
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      {t('reviews.hidden')}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <Star className="h-8 w-8 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-semibold text-foreground">{t('reviews.noReviews')}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('reviews.noReviewsDesc')}
          </p>
        </div>
      )}

      <Modal
        isOpen={hideModalOpen}
        onClose={() => setHideModalOpen(false)}
        title={t('reviews.hideModalTitle')}
        size="sm"
      >
        <form onSubmit={(e) => void handleConfirmHide(e)} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('reviews.hideModalDescription')}
          </p>
          <Textarea
            value={hideReason}
            onChange={(e) => setHideReason(e.target.value)}
            placeholder={t('reviews.hideReasonPrompt')}
            rows={3}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setHideModalOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-all hover:bg-accent"
            >
              {t('common:actions.cancel')}
            </button>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-xl bg-destructive px-4 text-sm font-semibold text-white transition-all hover:bg-destructive/90"
            >
              {t('reviews.hideButton')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

interface BroadcastForm {
  title: string
  message: string
  priority: NotificationPriority
  type: NotificationType
}

const BroadcastTab = () => {
  const { t } = useTranslation(['admin', 'common'])
  const [form, setForm] = useState<BroadcastForm>({
    title: '',
    message: '',
    priority: 'NORMAL',
    type: 'GENERAL_ANNOUNCEMENT',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) return
    setIsSubmitting(true)
    try {
      await broadcastNotification({
        title: form.title.trim(),
        message: form.message.trim(),
        priority: form.priority,
        type: form.type,
      })
      toast.success(t('common:toast.broadcastSent'))
      setForm({ title: '', message: '', priority: 'NORMAL', type: 'GENERAL_ANNOUNCEMENT' })
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common:errors.serverError')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('broadcast.title')}</CardTitle>
        <CardDescription>{t('broadcast.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1.5">
              <span className="text-xs text-foreground">{t('broadcast.titleLabel')}</span>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder={t('broadcast.titlePlaceholder')}
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-foreground">{t('broadcast.typeLabel')}</span>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as NotificationType }))}
                className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="GENERAL_ANNOUNCEMENT">{t('broadcast.types.GENERAL_ANNOUNCEMENT')}</option>
                <option value="SESSION_REMINDER">{t('broadcast.types.SESSION_REMINDER')}</option>
                <option value="MEMBERSHIP_EXPIRING">{t('broadcast.types.MEMBERSHIP_EXPIRING')}</option>
                <option value="PAYMENT_SUCCESS">{t('broadcast.types.PAYMENT_SUCCESS')}</option>
                <option value="PAYMENT_FAILED">{t('broadcast.types.PAYMENT_FAILED')}</option>
                <option value="PROFILE_UPDATE_REMINDER">{t('broadcast.types.PROFILE_UPDATE_REMINDER')}</option>
                <option value="MAINTENANCE_SCHEDULED">{t('broadcast.types.MAINTENANCE_SCHEDULED')}</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-foreground">{t('broadcast.priorityLabel')}</span>
              <select
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as NotificationPriority }))}
                className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="LOW">{t('broadcast.priorities.LOW')}</option>
                <option value="NORMAL">{t('broadcast.priorities.NORMAL')}</option>
                <option value="HIGH">{t('broadcast.priorities.HIGH')}</option>
                <option value="URGENT">{t('broadcast.priorities.URGENT')}</option>
              </select>
            </label>
          </div>
          <label className="space-y-1.5">
            <span className="text-xs text-foreground">{t('broadcast.messageLabel')}</span>
            <textarea
              className="min-h-[100px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={t('broadcast.messagePlaceholder')}
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !form.title.trim() || !form.message.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-60"
            >
              {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />}
              <Send className="h-4 w-4" />
              {t('broadcast.sendButton')}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

const CreateMembershipModal = ({
  clientId: initialClientId,
  onClose,
  onCreated,
}: {
  clientId?: string
  onClose: () => void
  onCreated: () => Promise<void>
}) => {
  const { t } = useTranslation(['admin', 'common'])
  const [form, setForm] = useState({
    clientId: initialClientId ?? '',
    type: 'MONTHLY' as string,
    durationMonths: '1',
    visitsLimit: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.clientId.trim()) return
    if (form.type === 'VISITS' && !form.visitsLimit.trim()) return
    setIsSubmitting(true)
    try {
      await createMembership({
        clientId: form.clientId.trim(),
        type: form.type as 'MONTHLY' | 'YEARLY' | 'VISITS',
        durationMonths: form.type !== 'VISITS' ? Number(form.durationMonths) : undefined,
        visitsLimit: form.type === 'VISITS' && form.visitsLimit ? Number(form.visitsLimit) : undefined,
      })
      await onCreated()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common:errors.serverError')))
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
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('memberships.createModal.badge')}</p>
            <h2 className="mt-1 text-xl font-bold text-foreground">{t('memberships.createModal.title')}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-accent" aria-label={t('common:buttons.close')}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {initialClientId && (
            <div className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
              {t('memberships.createModal.clientId')}: <code className="font-mono">{initialClientId.slice(0, 12)}...</code>
            </div>
          )}
          <label className="space-y-1.5">
            <span className="text-xs text-foreground">{t('memberships.createModal.planType')}</span>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="MONTHLY">{t('memberships.createModal.types.monthly')}</option>
              <option value="YEARLY">{t('memberships.createModal.types.yearly')}</option>
              <option value="VISITS">{t('memberships.createModal.types.visits')}</option>
            </select>
          </label>
          {form.type !== 'VISITS' && (
            <label className="space-y-1.5">
              <span className="text-xs text-foreground">{t('memberships.createModal.durationMonths')}</span>
              <Input type="number" min={1} value={form.durationMonths} onChange={(e) => setForm((p) => ({ ...p, durationMonths: e.target.value }))} />
            </label>
          )}
          {form.type === 'VISITS' && (
            <label className="space-y-1.5">
              <span className="text-xs text-foreground">{t('memberships.createModal.visitsLimit')}</span>
              <Input type="number" min={1} value={form.visitsLimit} onChange={(e) => setForm((p) => ({ ...p, visitsLimit: e.target.value }))} placeholder={t('memberships.createModal.visitsLimitPlaceholder')} />
            </label>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-60">
              {t('common:buttons.cancel')}
            </button>
            <button type="submit" disabled={isSubmitting || !form.clientId.trim() || (form.type === 'VISITS' && !form.visitsLimit.trim())} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:brightness-110 disabled:opacity-60">
              {isSubmitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />}
              {t('memberships.createModal.createButton')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

const ActionBtn = ({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  onClick: () => void
  danger?: boolean
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition ${
      danger
        ? 'border border-destructive/40 text-destructive hover:bg-destructive/5'
        : 'border border-border text-foreground hover:bg-accent'
    }`}
  >
    <Icon className="h-3.5 w-3.5" />
    {label}
  </button>
)

export default Admin
