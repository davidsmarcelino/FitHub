import * as React from 'react'
import { cn } from '../../lib/utils'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  default:
    'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-soft hover:shadow-soft-md hover:from-emerald-600 hover:to-emerald-700',
  outline:
    'border border-border bg-white text-foreground hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200',
  ghost: 'text-foreground hover:bg-emerald-50 hover:text-emerald-700',
  secondary: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-11 px-6 text-base',
  icon: 'h-9 w-9',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'
