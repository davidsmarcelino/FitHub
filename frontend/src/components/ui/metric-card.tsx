import { motion } from 'framer-motion'
import { Card, CardContent } from './card'
import type { IconType } from '../../lib/utils'

type MetricCardProps = {
  icon: IconType
  title: string
  value: string | number
  label?: string
  tone: string
}

export const MetricCard = ({ icon: Icon, title, value, label, tone }: MetricCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
  >
    <Card className="h-full overflow-hidden">
      <CardContent className="flex min-h-[140px] items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          </div>
          {label && (
            <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{label}</p>
          )}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardContent>
    </Card>
  </motion.div>
)
