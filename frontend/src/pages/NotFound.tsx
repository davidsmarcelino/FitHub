import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

const NotFound = () => {
  const { t } = useTranslation('common')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50/50 to-white px-4 text-center">
      <p className="text-8xl font-bold bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">404</p>
      <h1 className="mt-6 text-2xl font-bold text-gray-900">{t('notFound.title')}</h1>
      <p className="mt-3 max-w-md text-gray-500">{t('notFound.description')}</p>
      <Link
        to="/"
        className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:brightness-110"
      >
        <Home className="h-4 w-4" />
        {t('notFound.backToHome')}
      </Link>
    </div>
  )
}

export default NotFound
