import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import {
  assignPlanToClient,
  type WorkoutPlanResponse,
} from '../../services/workout.service'
import { searchClients, type ClientProfileResponse } from '../../services/user.service'
import { getApiErrorMessage } from '../../utils/errorHandler'
import { toBackendDateTime, toDateInputValue } from '../../lib/utils'
import toast from '../../utils/toast'

type AssignPlanModalProps = {
  isOpen: boolean
  onClose: () => void
  plan: WorkoutPlanResponse
  onAssigned: () => Promise<void>
}

export const AssignPlanModal = ({
  isOpen,
  onClose,
  plan,
  onAssigned,
}: AssignPlanModalProps) => {
  const { t } = useTranslation(['workouts', 'common'])
  const [searchQuery, setSearchQuery] = useState('')
  const [clients, setClients] = useState<ClientProfileResponse[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [startDate, setStartDate] = useState(() => toDateInputValue())
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setSearchQuery('')
    setClients([])
    setSelectedClientId('')
    setStartDate(toDateInputValue())
  }, [isOpen])

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setClients([])
      return
    }
    setIsSearching(true)
    try {
      const res = await searchClients(query, 0, 10)
      setClients(res.content)
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('assign.searchFailed')))
    } finally {
      setIsSearching(false)
    }
  }, [t])

  useEffect(() => {
    const timer = setTimeout(() => {
      void doSearch(searchQuery)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery, doSearch])

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedClientId || !startDate) return

    setIsSubmitting(true)
    try {
      await assignPlanToClient(plan.id, {
        clientId: selectedClientId,
        startDate: toBackendDateTime(startDate),
      })
      toast.success(t('assign.toastSuccess'))
      await onAssigned()
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('assign.toastError')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="max-h-[calc(100vh-3rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-soft-lg"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('assign.badge')}
                </p>
                <h2 className="mt-1 text-xl font-bold text-foreground">{t('assign.title')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.name}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:bg-emerald-50 hover:text-emerald-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="space-y-1.5">
                <span className="text-xs text-foreground">{t('assign.searchClient')} *</span>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('assign.searchPlaceholder')}
                />
                {isSearching && (
                  <p className="text-xs text-muted-foreground">{t('common:messages.loading')}</p>
                )}
                {clients.length > 0 && !selectedClientId && (
                  <div className="mt-1 rounded-xl border border-border bg-background">
                    {clients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => {
                          setSelectedClientId(client.id!)
                          setSearchQuery(`${client.firstname} ${client.lastname}`)
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-accent first:rounded-t-xl last:rounded-b-xl"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {(client.firstname?.[0] ?? '').toUpperCase()}{(client.lastname?.[0] ?? '').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{client.firstname} {client.lastname}</p>
                          <p className="text-xs text-muted-foreground">{client.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </label>

              {selectedClient && (
                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">
                    {selectedClient.firstname} {selectedClient.lastname}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedClient.phone}</p>
                </div>
              )}

              <label className="space-y-1.5">
                <span className="text-xs text-foreground">{t('assign.startDate')} *</span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-xl px-4"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  {t('common:buttons.cancel')}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:brightness-110 px-4"
                  disabled={isSubmitting || !selectedClientId || !startDate}
                >
                  {isSubmitting && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  )}
                  {isSubmitting ? t('assign.assigning') : t('assign.assignButton')}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
