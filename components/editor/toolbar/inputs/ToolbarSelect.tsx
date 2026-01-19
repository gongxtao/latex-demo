/**
 * ToolbarSelect Component
 * A select dropdown for toolbar options
 */

import React, { SelectHTMLAttributes, memo } from 'react'

export interface ToolbarSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Array<{
    value: string
    label: string
    disabled?: boolean
  }>
}

const ToolbarSelect = memo<ToolbarSelectProps>(({
  label,
  options,
  className = '',
  disabled,
  defaultValue,
  ...props
}) => {
  return (
    <select
      disabled={disabled}
      defaultValue={defaultValue || (label ? '' : undefined)}
      className={`
        px-2 py-1 bg-white border rounded
        disabled:bg-gray-100 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {label && (
        <option value="" disabled>
          {label}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  )
})

ToolbarSelect.displayName = 'ToolbarSelect'

export default ToolbarSelect
