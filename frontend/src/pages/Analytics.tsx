import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Activity,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Users2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { MetricCard } from '../components/ui/metric-card'
import {
  getDashboardAnalytics,
  getAttendanceStats,
  getRevenueStats,
  type AttendanceStatsResponse,
  type DashboardAnalyticsResponse,
} from '../services/dashboard.service'
import { formatCurrency } from '../lib/utils'
import { useMountedRef } from '../utils/useMountedRef'

const Analytics = () => {
  const { t } = useTranslation('analytics')
  const [analytics, setAnalytics] = useState<DashboardAnalyticsResponse | null>(null)
  const [attendance, setAttendance] = useState<AttendanceStatsResponse[]>([])
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<7 | 14 | 30>(30)
  const mounted = useMountedRef()

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const now = new Date()
        const startDate = new Date(now)
        startDate.setDate(startDate.getDate() - period)
        const from = startDate.toISOString().slice(0, 10)
        const to = now.toISOString().slice(0, 10)

        const [analyticsResult, attendanceResult, revenueResult] = await Promise.allSettled([
          getDashboardAnalytics(),
          getAttendanceStats(from, to),
          getRevenueStats(from, to),
        ])

        if (mounted.current) {
          if (analyticsResult.status === 'fulfilled') setAnalytics(analyticsResult.value)
          if (attendanceResult.status === 'fulfilled') setAttendance(attendanceResult.value)
          if (revenueResult.status === 'fulfilled') setRevenueData(revenueResult.value)
        }
      } catch {
        // handled by Promise.allSettled
      } finally {
        if (mounted.current) setIsLoading(false)
      }
    }
    void load()
  }, [period, mounted])

  const chartData = useMemo(
    () =>
      attendance.map((a) => ({
        date: new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        checkIns: a.checkIns,
      })),
    [attendance],
  )

  const totalCheckIns = useMemo(
    () => attendance.reduce((sum, a) => sum + a.checkIns, 0),
    [attendance],
  )

  const avgCheckIns = useMemo(
    () => (attendance.length > 0 ? Math.round(totalCheckIns / attendance.length) : 0),
    [attendance, totalCheckIns],
  )

  const peakDay = useMemo(() => {
    if (!attendance.length) return null
    return attendance.reduce((max, a) => (a.checkIns > max.checkIns ? a : max), attendance[0])
  }, [attendance])

  const revenueChartData = useMemo(
    () =>
      revenueData.map((r) => ({
        date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        revenue: r.revenue,
      })),
    [revenueData],
  )

  const totalRevenue = useMemo(
    () => revenueData.reduce((sum, r) => sum + r.revenue, 0),
    [revenueData],
  )

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{t('title')}</h1>
            <p className="mt-1 text-emerald-100">{t('subtitle')}</p>
          </div>
          <div className="flex gap-1 rounded-xl bg-white/20 p-1 backdrop-blur-sm">
            {([7, 14, 30] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                  period === p
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                {p}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Users2}
              title={t('metrics.activeClients')}
              value={analytics?.activeClients?.toString() ?? '0'}
              tone="bg-blue-500"
            />
            <MetricCard
              icon={CalendarDays}
              title={t('metrics.activeMemberships')}
              value={analytics?.activeMemberships?.toString() ?? '0'}
              tone="bg-emerald-500"
            />
            <MetricCard
              icon={DollarSign}
              title={t('metrics.revenue')}
              value={formatCurrency(analytics?.revenue)}
              tone="bg-violet-500"
            />
            <MetricCard
              icon={Activity}
              title={t('metrics.todayCheckIns')}
              value={analytics?.todayCheckIns?.toString() ?? '0'}
              tone="bg-amber-500"
            />
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              label={t('chart.totalCheckIns')}
              value={totalCheckIns.toString()}
              detail={`${period}d`}
              tone="bg-sky-500"
            />
            <SummaryCard
              label={t('chart.avgCheckIns')}
              value={avgCheckIns.toString()}
              detail={t('chart.perDay')}
              tone="bg-indigo-500"
            />
            <SummaryCard
              label={t('chart.peakDay')}
              value={peakDay ? peakDay.checkIns.toString() : '—'}
              detail={
                peakDay
                  ? new Date(peakDay.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : t('chart.noData')
              }
              tone="bg-rose-500"
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr),minmax(300px,0.5fr)]">
            <Card>
              <CardHeader>
                <CardTitle>{t('chart.title')}</CardTitle>
                <CardDescription>{t('chart.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorCheckIns" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          dataKey="date"
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                            fontSize: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="checkIns"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorCheckIns)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                    {t('chart.noData')}
                  </div>
                )}
              </CardContent>
            </Card>

            {revenueChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('revenue.title')}</CardTitle>
                  <CardDescription>{t('revenue.subtitle', { amount: totalRevenue.toLocaleString(), period })}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueChartData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          dataKey="date"
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => formatCurrency(value)}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                            fontSize: '12px',
                          }}
                          formatter={(value) => [formatCurrency(Number(value)), t('metrics.revenue')]}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--success))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('popularSessions.title')}</CardTitle>
                  <CardDescription>{t('popularSessions.subtitle')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.popularSessions && analytics.popularSessions.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.popularSessions.map((session, index) => (
                        <motion.div
                          key={session.sessionId}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="rounded-xl bg-muted px-4 py-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {session.trainerName}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {t('popularSessions.attendees', { count: session.attendanceCount })}
                              </p>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                              <TrendingUp className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
                      {t('popularSessions.noData')}
                    </div>
                  )}
                </CardContent>
              </Card>

              {analytics && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('quickStats.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <QuickStatRow
                        label={t('quickStats.conversionRate')}
                        value={
                          analytics.activeMemberships > 0 && analytics.activeClients > 0
                            ? `${Math.round((analytics.activeMemberships / analytics.activeClients) * 100)}%`
                            : '—'
                        }
                      />
                      <QuickStatRow
                        label={t('quickStats.revenuePerClient')}
                        value={
                          analytics.activeClients > 0
                            ? formatCurrency(Math.round(analytics.revenue / analytics.activeClients))
                            : '—'
                        }
                      />
                      <QuickStatRow
                        label={t('quickStats.avgCheckIn')}
                        value={avgCheckIns.toString()}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

const SummaryCard = ({
  label,
  value,
  detail,
  tone,
}: {
  label: string
  value: string
  detail: string
  tone: string
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25, delay: 0.1 }}
  >
    <Card className="h-full">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <span className="text-lg font-bold text-white">{value}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

const QuickStatRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-bold text-foreground">{value}</span>
  </div>
)

export default Analytics
