import { useEffect, useMemo, useState, type ComponentType, type SVGProps } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  CreditCard,
  Dumbbell,
  LogOut,
  Menu,
  ShieldCheck,
  Target,
  User2,
  Users2,
  Utensils,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/useAuthStore'
import LanguageSwitcher from '../components/LanguageSwitcher'
import type { RoleName } from '../types/user.types'

type NavItem = {
  to: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  roles?: RoleName[]
}

const MainLayout = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const roles = useAuthStore((state) => state.roles)
  const { t } = useTranslation(['navigation'])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false)
    }
    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isMobileMenuOpen])

  const navItems = useMemo<NavItem[]>(
    () => [
      {
        to: '/dashboard',
        label: t('navigation:sidebar.items.dashboard'),
        icon: BarChart3,
      },
      {
        to: '/workouts',
        label: t('navigation:sidebar.items.workouts'),
        icon: Dumbbell,
        roles: ['CLIENT'],
      },
      {
        to: '/nutrition',
        label: t('navigation:sidebar.items.nutrition'),
        icon: Utensils,
        roles: ['CLIENT'],
      },
      {
        to: '/progress',
        label: t('navigation:sidebar.items.progress'),
        icon: Target,
        roles: ['CLIENT'],
      },
      {
        to: '/memberships',
        label: t('navigation:sidebar.items.memberships'),
        icon: CreditCard,
        roles: ['CLIENT'],
      },
      {
        to: '/trainers',
        label: t('navigation:sidebar.items.trainers'),
        icon: Users2,
        roles: ['CLIENT', 'TRAINER', 'ADMIN'],
      },
      {
        to: '/sessions',
        label: t('navigation:sidebar.items.sessions'),
        icon: CalendarDays,
        roles: ['CLIENT', 'TRAINER'],
      },
      {
        to: '/trainer-workouts',
        label: t('navigation:sidebar.items.myPlans'),
        icon: Dumbbell,
        roles: ['TRAINER'],
      },
      {
        to: '/trainer-profile',
        label: t('navigation:sidebar.items.profile'),
        icon: User2,
        roles: ['TRAINER'],
      },
      {
        to: '/trainer-sessions',
        label: t('navigation:sidebar.items.trainerSessions'),
        icon: CalendarDays,
        roles: ['TRAINER'],
      },
      {
        to: '/analytics',
        label: t('navigation:sidebar.items.analytics'),
        icon: Activity,
        roles: ['TRAINER', 'ADMIN'],
      },
      {
        to: '/notifications',
        label: t('navigation:sidebar.items.notifications'),
        icon: Bell,
      },
      {
        to: '/admin',
        label: t('navigation:sidebar.items.admin'),
        icon: ShieldCheck,
        roles: ['ADMIN'],
      },
      {
        to: '/admin/exercises',
        label: t('navigation:sidebar.items.exerciseManagement'),
        icon: Dumbbell,
        roles: ['ADMIN'],
      },
      {
        to: '/admin/foods',
        label: t('navigation:sidebar.items.foodManagement'),
        icon: Utensils,
        roles: ['ADMIN'],
      },
      {
        to: '/profile',
        label: t('navigation:sidebar.items.profile'),
        icon: User2,
        roles: ['CLIENT'],
      },
    ],
    [t],
  )

  const visibleNavItems = navItems.filter((item) => {
    if (!item.roles?.length) return true
    if (!roles.length) return false
    return item.roles.some((role) => roles.includes(role))
  })

  const handleLogout = async () => {
    await logout()
    setIsMobileMenuOpen(false)
    navigate('/login', { replace: true })
  }

  const fullName = [
    user?.clientProfile?.firstname ?? user?.trainerProfile?.firstname,
    user?.clientProfile?.lastname ?? user?.trainerProfile?.lastname,
  ]
    .filter(Boolean)
    .join(' ')

  const userName = fullName || user?.email?.split('@')[0] || t('header.fithubMember')
  const roleLabel = roles.length
    ? roles.map(r => t(`common:fallbacks.${r.toLowerCase()}`)).join(' / ')
    : t('header.member')
  const initials = (fullName || user?.email || 'FH')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  const renderNav = (mobile = false) => (
    <nav className="space-y-1 text-sm font-medium">
      {visibleNavItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => mobile && setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              [
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 text-emerald-700 font-semibold shadow-sm'
                  : 'text-muted-foreground hover:bg-emerald-50 hover:text-emerald-600',
              ].join(' ')
            }
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )

  const accountSummary = (
    <div className="rounded-xl bg-emerald-50 px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-xs font-bold text-white">
          {initials || 'FH'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {userName}
          </p>
          <p className="truncate text-xs text-emerald-600">{roleLabel}</p>
        </div>
      </div>
      {user?.email && (
        <p className="mt-2 truncate text-xs text-muted-foreground">
          {user.email}
        </p>
      )}
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col bg-white px-4 py-6 shadow-soft md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
            <Dumbbell className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
              {t('navigation:sidebar.brand')}
            </p>
            <p className="text-sm font-medium text-foreground">
              {t('navigation:sidebar.subtitle')}
            </p>
          </div>
        </div>

        {renderNav()}

        <div className="mt-auto space-y-4 border-t border-emerald-100 pt-4">
          {accountSummary}

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-xs font-medium text-muted-foreground transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t('navigation:sidebar.signOut')}
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label={t('common:buttons.close')}
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-80 max-w-[86vw] flex-col bg-white px-4 py-5 shadow-soft-lg transition-transform md:hidden',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                {t('navigation:sidebar.brand')}
              </p>
              <p className="text-sm font-medium text-foreground">
                {t('navigation:sidebar.subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={t('common:buttons.close')}
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground transition hover:bg-emerald-50 hover:text-emerald-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {renderNav(true)}

        <div className="mt-auto space-y-4 border-t border-emerald-100 pt-4">
          {accountSummary}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-xs font-medium text-muted-foreground transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t('navigation:sidebar.signOut')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3 md:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-white text-muted-foreground transition hover:bg-emerald-50 hover:text-emerald-600 md:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 md:hidden">
                <Dumbbell className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  {roleLabel}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {userName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />

              <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-2 py-1 md:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-[10px] font-bold text-white">
                  {initials || 'FH'}
                </div>
                <div className="hidden text-xs leading-tight lg:block">
                  <p className="max-w-32 truncate font-medium text-foreground">
                    {userName}
                  </p>
                  <p className="max-w-32 truncate text-[11px] text-emerald-600">
                    {user?.email ?? roleLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
