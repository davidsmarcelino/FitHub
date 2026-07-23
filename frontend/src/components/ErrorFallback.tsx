import { useTranslation } from 'react-i18next'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export function ErrorFallback({ onReload }: { onReload: () => void }) {
  const { t } = useTranslation('common')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-red-50/50 to-white px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-gray-900">{t('errorBoundary.title')}</h1>
      <p className="mt-3 max-w-md text-gray-500">{t('errorBoundary.description')}</p>
      <button
        type="button"
        onClick={onReload}
        className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:brightness-110"
      >
        <RefreshCw className="h-4 w-4" />
        {t('errorBoundary.reload')}
      </button>
    </div>
  )
}
