import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Flame,
  Heart,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import LanguageSwitcher from '../components/LanguageSwitcher'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
}

const Landing = () => {
  const { t } = useTranslation('landing')

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FitHub</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              to="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              {t('header.signIn')}
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:brightness-110"
            >
              {t('header.getStarted')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/80 via-white to-white">
        {/* Decorative shapes */}
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-emerald-50 blur-3xl" />

        <div className="container relative mx-auto px-4 py-20 md:px-6 md:py-32 lg:py-40">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: Text */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div variants={fadeUp}>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700">
                  <Zap className="h-4 w-4" />
                  {t('hero.badge')}
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="mt-6 text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl"
              >
                {t('hero.title')}{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  {t('hero.titleHighlight')}
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-lg text-lg text-gray-500"
              >
                {t('hero.subtitle')}
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:brightness-110"
                >
                  {t('hero.ctaPrimary')}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-8 text-base font-semibold text-gray-700 transition-all hover:border-emerald-300 hover:text-emerald-700"
                >
                  {t('hero.ctaSecondary')}
                </Link>
              </motion.div>

              <motion.p variants={fadeUp} className="mt-6 text-sm text-gray-400">
                {t('hero.benefits')}
              </motion.p>
            </motion.div>

            {/* Right: Abstract visual */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              {/* Floating cards */}
              <div className="relative h-[400px] w-full">
                {/* Main card */}
                <div className="absolute right-0 top-0 w-80 rounded-2xl bg-white p-5 shadow-2xl shadow-gray-200/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                      <Dumbbell className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Today's Workout</p>
                      <p className="text-xs text-gray-400">Upper Body Strength</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {['Bench Press 4x8', 'Pull Ups 3x10', 'Shoulder Press 3x12'].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-gray-600">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
                  </div>
                  <p className="mt-2 text-right text-xs text-gray-400">75% complete</p>
                </div>

                {/* Floating stat card */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -left-4 top-32 rounded-xl bg-white p-4 shadow-xl shadow-gray-200/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <Flame className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">486</p>
                      <p className="text-xs text-gray-400">calories burned</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating progress card */}
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute -left-8 bottom-20 rounded-xl bg-white p-4 shadow-xl shadow-gray-200/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Weekly Goal</p>
                      <p className="text-xs text-emerald-600 font-medium">+12% this week</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features - Horizontal scroll */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">{t('features.title')}</h2>
            <p className="mt-4 text-lg text-gray-500">{t('features.subtitle')}</p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {[
              { icon: Dumbbell, title: t('features.workoutLogging.title'), desc: t('features.workoutLogging.description'), color: 'from-emerald-500 to-emerald-600' },
              { icon: BarChart3, title: t('features.progressAnalytics.title'), desc: t('features.progressAnalytics.description'), color: 'from-blue-500 to-blue-600' },
              { icon: Heart, title: t('features.nutritionTracking.title'), desc: t('features.nutritionTracking.description'), color: 'from-rose-500 to-rose-600' },
              { icon: Activity, title: t('features.performanceMetrics.title'), desc: t('features.performanceMetrics.description'), color: 'from-violet-500 to-violet-600' },
              { icon: Target, title: t('features.goalSetting.title'), desc: t('features.goalSetting.description'), color: 'from-amber-500 to-amber-600' },
              { icon: Users, title: t('features.communitySupport.title'), desc: t('features.communitySupport.description'), color: 'from-cyan-500 to-cyan-600' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-lg`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Learn more <ChevronRight className="h-4 w-4" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works - Steps with connecting line */}
      <section className="bg-gray-50 py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">{t('howItWorks.title')}</h2>
            <p className="mt-4 text-lg text-gray-500">{t('howItWorks.subtitle')}</p>
          </motion.div>

          <div className="relative mt-16">
            {/* Connecting line (desktop only) */}
            <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-emerald-200 via-emerald-300 to-emerald-200 lg:block" />

            <div className="grid gap-12 lg:grid-cols-3">
              {[
                { step: 1, icon: Users, title: t('howItWorks.step1.title'), desc: t('howItWorks.step1.description') },
                { step: 2, icon: Dumbbell, title: t('howItWorks.step2.title'), desc: t('howItWorks.step2.description') },
                { step: 3, icon: TrendingUp, title: t('howItWorks.step3.title'), desc: t('howItWorks.step3.description') },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative text-center"
                >
                  <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                    <step.icon className="h-7 w-7" />
                  </div>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    {step.step}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { value: t('stats.users.value'), label: t('stats.users.label'), icon: Users },
              { value: t('stats.workouts.value'), label: t('stats.workouts.label'), icon: Dumbbell },
              { value: t('stats.achievement.value'), label: t('stats.achievement.label'), icon: TrendingUp },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-8 text-center"
              >
                <stat.icon className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-4 text-4xl font-bold text-gray-900">{stat.value}</p>
                <p className="mt-2 text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-emerald-600 to-emerald-700 py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white md:text-4xl">{t('cta.title')}</h2>
            <p className="mt-4 text-lg text-emerald-100">{t('cta.subtitle')}</p>
            <Link
              to="/register"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-8 text-base font-semibold text-emerald-700 shadow-xl transition-all hover:bg-emerald-50 hover:shadow-2xl"
            >
              {t('cta.button')}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                <Dumbbell className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">FitHub</span>
            </div>
            <p className="text-sm text-gray-400">{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
