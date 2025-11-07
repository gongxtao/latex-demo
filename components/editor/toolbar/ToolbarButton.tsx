import React, { ButtonHTMLAttributes } from 'react'

export interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Tooltip title for the button */
  title: string
  /** Icon to display (can be React node, string, or any element) */
  icon?: React.ReactNode
  /** Visual style variant */
  variant?: 'default' | 'color' | 'text'
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg'
}

const ToolbarButton = React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  ({ title, icon, variant = 'default', size = 'md', className = '', disabled, children, ...props }, ref) => {
    const baseStyles = 'transition-colors disabled:cursor-not-allowed disabled:opacity-50'

    const variantStyles = {
      default: 'px-2 py-1 bg-white border rounded hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400',
      color: 'w-8 h-8 border rounded hover:bg-gray-100 disabled:bg-gray-100 disabled:opacity-50',
      text: 'px-2 py-1 font-medium hover:bg-gray-100 rounded disabled:text-gray-400'
    }

    const sizeStyles = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    }

    return (
      <button
        ref={ref}
        title={title}
        aria-label={title}
        disabled={disabled}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {icon || children}
      </button>
    )
  }
)

ToolbarButton.displayName = 'ToolbarButton'

export default ToolbarButton
