import { cn } from '../../lib/utils'

type FormFieldProps = {
  label: string
  error?: string
  children: React.ReactNode
  className?: string
}

export const FormField = ({ label, error, children, className }: FormFieldProps) => (
  <div className={cn('space-y-1.5', className)}>
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
)

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export const Input = ({ label, error, className, ...props }: InputProps) => {
  const input = (
    <input
      className={cn(
        'flex h-10 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )

  if (!label) return input

  return <FormField label={label} error={error}>{input}</FormField>
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
}

export const Textarea = ({ label, error, className, ...props }: TextareaProps) => {
  const textarea = (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )

  if (!label) return textarea

  return <FormField label={label} error={error}>{textarea}</FormField>
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
}

export const Select = ({ label, error, className, options, ...props }: SelectProps) => {
  const select = (
    <select
      className={cn(
        'flex h-10 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground transition-all focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50',
        error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
        className,
      )}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )

  if (!label) return select

  return <FormField label={label} error={error}>{select}</FormField>
}
