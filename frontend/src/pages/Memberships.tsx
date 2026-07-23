import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  DollarSign,
  PauseCircle,
  XCircle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import {
  getMyActiveMembership,
  getMyMembershipHistory,
  type MembershipResponse,
} from '../services/membership.service'
import { getMyPayments, type PaymentResponse } from '../services/payment.service'
import { formatDate, getAppDateTimeMs } from '../lib/utils'
import { InfoTile } from '../components/ui/info-tile'
import { SummaryCard } from '../components/ui/summary-card'
import {
  StatusBadge,
  membershipStatusColors,
  paymentStatusColors,
} from '../components/ui/status-badge'
import { EmptyState } from '../components/ui/empty-state'
import { useMountedRef } from '../utils/useMountedRef'

const MS_PER_DAY = 86_400_000

const Memberships = () => {
  const { t } = useTranslation(['memberships', 'common'])
  const [active, setActive] = useState<MembershipResponse | null>(null)
  const [history, setHistory] = useState<MembershipResponse[]>([])
  const [payments, setPayments] = useState<PaymentResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const mounted = useMountedRef()

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [activeResult, historyResult, paymentsResult] = await Promise.allSettled([
          getMyActiveMembership(),
          getMyMembershipHistory(),
          getMyPayments(0, 20),
        ])
        if (mounted.current) {
          if (activeResult.status === 'fulfilled') setActive(activeResult.value)
          if (historyResult.status === 'fulfilled') setHistory(historyResult.value.memberships)
          if (paymentsResult.status === 'fulfilled') setPayments(paymentsResult.value.content)
        }
      } catch {
        // handled by Promise.allSettled
      } finally {
        if (mounted.current) setIsLoading(false)
      }
    }
    void load()
  }, [mounted])

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const daysRemaining = useMemo(
    () => active
      ? Math.max(0, Math.ceil((getAppDateTimeMs(active.endDate) - now) / MS_PER_DAY))
      : null,
    [active, now],
  )

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
        <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
        <p className="mt-1 text-emerald-100">{t('subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-56 animate-pulse rounded-2xl bg-muted" />
          <div className="h-56 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : !active && history.length === 0 && payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={t('noActive')}
          description={t('noActiveDesc')}
        />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('activePlan')}</CardTitle>
                <CardDescription>{t('activePlanDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                {active ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
                      <p className="text-sm opacity-80">{t('planType')}</p>
                      <div className="mt-3 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-2xl font-bold">
                            {t('common:enums.membershipType.' + active.type)}
                          </p>
                          <p className="mt-1 text-sm opacity-80">
                            {t('daysRemaining', { count: daysRemaining ?? undefined })}
                          </p>
                        </div>
                        <StatusIcon status={active.status} />
                      </div>
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <InfoTile
                        icon={CalendarDays}
                        label={t('validFrom')}
                        value={formatDate(active.startDate)}
                      />
                      <InfoTile
                        icon={CalendarDays}
                        label={t('validUntil')}
                        value={formatDate(active.endDate)}
                      />
                      <InfoTile
                        icon={CreditCard}
                        label={t('status')}
                        value={t('common:enums.membershipStatus.' + active.status)}
                      />
                      <InfoTile
                        icon={CheckCircle2}
                        label={t('visitsLeft')}
                        value={active.visitsLeft === null ? t('unlimited') : String(active.visitsLeft)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-40 flex-col items-center justify-center text-center">
                    <CreditCard className="h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-3 text-sm font-semibold text-foreground">{t('noActive')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('noActiveDesc')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('summary.title')}</CardTitle>
                <CardDescription>{t('summary.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <SummaryCard
                    label={t('summary.total')}
                    value={history.length.toString()}
                  />
                  <SummaryCard
                    label={t('summary.active')}
                    value={history.filter((m) => m.status === 'ACTIVE').length.toString()}
                  />
                  <SummaryCard
                    label={t('summary.expired')}
                    value={history.filter((m) => m.status === 'EXPIRED').length.toString()}
                  />
                  <SummaryCard
                    label={t('summary.cancelled')}
                    value={history.filter((m) => m.status === 'CANCELLED').length.toString()}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {history.length > 0 ? (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">{t('history')}</h2>
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                {history.map((membership) => (
                  <HistoryRow key={membership.id} membership={membership} />
                ))}
              </div>
            </section>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title={t('history')}
              description={t('common:messages.noData')}
            />
          )}

          {payments.length > 0 ? (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">{t('paymentHistory')}</h2>
              <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                {payments.map((payment) => (
                  <PaymentRow key={payment.id} payment={payment} />
                ))}
              </div>
            </section>
          ) : (
            <EmptyState
              icon={DollarSign}
              title={t('paymentHistory')}
              description={t('common:messages.noData')}
            />
          )}
        </>
      )}
    </div>
  )
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'ACTIVE') return <CheckCircle2 className="h-8 w-8 opacity-90" />
  if (status === 'FROZEN') return <PauseCircle className="h-8 w-8 opacity-90" />
  return <XCircle className="h-8 w-8 opacity-90" />
}

const HistoryRow = ({ membership }: { membership: MembershipResponse }) => {
  const { t } = useTranslation(['memberships', 'common'])

  return (
    <div className="grid gap-3 bg-card p-4 md:grid-cols-[minmax(0,1fr),auto,auto,auto]">
      <div>
        <p className="font-semibold text-foreground">
          {t('planType')} — {t('common:enums.membershipType.' + membership.type)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDate(membership.startDate)} — {formatDate(membership.endDate)}
        </p>
      </div>
      <StatusBadge
        status={membership.status}
        colors={membershipStatusColors}
        label={t('common:enums.membershipStatus.' + membership.status)}
      />
      <div className="text-sm text-muted-foreground">
        {membership.visitsLeft === null ? t('unlimited') : t('visitsLeft', { count: membership.visitsLeft })}
      </div>
    </div>
  )
}

const PaymentRow = ({ payment }: { payment: PaymentResponse }) => {
  const { t } = useTranslation(['memberships', 'common'])

  return (
    <div className="grid gap-3 bg-card p-4 md:grid-cols-[minmax(0,1fr),auto]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <DollarSign className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-foreground">
            ${payment.amount.toFixed(2)} {payment.currency}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDate(payment.paymentDate)}
          </p>
        </div>
      </div>
      <StatusBadge
        status={payment.status}
        colors={paymentStatusColors}
        label={t('common:enums.paymentStatus.' + payment.status)}
      />
    </div>
  )
}

export default Memberships
