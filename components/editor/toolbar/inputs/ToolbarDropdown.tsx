
import React, { useState, useRef, useEffect } from 'react'
import { useDropdownState } from '../hooks/useDropdownState'
import { ChevronDownIcon } from '../../icons'

export interface ToolbarDropdownProps {
  label?: string
  value?: string
  options: Array<{
    value: string
    label: string
    disabled?: boolean
    style?: React.CSSProperties
  }>
  disabled?: boolean
  onChange?: (value: string) => void
  placeholder?: string
  width?: number | string
  className?: string
  editable?: boolean // Support manual input
  // Custom render function for items (e.g., for font preview)
  renderItem?: (item: { value: string; label: string; style?: React.CSSProperties }) => React.ReactNode
}

const ToolbarDropdown: React.FC<ToolbarDropdownProps> = ({
  label,
  value,
  options,
  disabled = false,
  onChange,
  placeholder = 'Select...',
  width = 120,
  className = '',
  editable = false,
  renderItem
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isOpen, toggle, close, open } = useDropdownState({ containerRef })
  const [inputValue, setInputValue] = useState(value || '')

  // Update input value when prop value changes
  useEffect(() => {
    if (value) {
      setInputValue(value)
    }
  }, [value])

  const selectedOption = options.find(opt => opt.value === value)
  const displayLabel = selectedOption ? selectedOption.label : (label || placeholder)

  const handleSelect = (optionValue: string) => {
    if (onChange) {
      onChange(optionValue)
    }
    setInputValue(optionValue)
    close()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value
    setInputValue(newVal)
    // Only update parent if it's a valid value or if we want real-time updates
    // For font size, we might want to debounce or validate
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (onChange) {
        onChange(inputValue)
      }
      close()
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      style={{ width }}
    >
      {editable ? (
        <div className={`
          inline-flex items-center w-full rounded-md border border-gray-300 shadow-sm bg-white
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
          ${isOpen ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
        `}>
          <input
            type="text"
            className="flex-1 min-w-0 px-3 py-1.5 text-sm font-medium text-gray-700 bg-transparent border-none focus:ring-0 focus:outline-none"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={open}
            disabled={disabled}
            placeholder={placeholder}
          />
          <button
            type="button"
            className="px-2 py-1.5 hover:bg-gray-50 focus:outline-none"
            onClick={toggle}
            disabled={disabled}
            tabIndex={-1}
          >
            <ChevronDownIcon size={14} className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`
            inline-flex justify-between items-center w-full rounded-md border border-gray-300 shadow-sm
            px-3 py-1.5 bg-white text-sm font-medium text-gray-700
            hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
            ${isOpen ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
          `}
          onClick={toggle}
          disabled={disabled}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <span className="truncate block flex-1 text-left">
            {displayLabel}
          </span>
          <ChevronDownIcon size={14} className="ml-2 -mr-1 h-4 w-4" />
        </button>
      )}

      {isOpen && !disabled && (
        <div 
          className="origin-top-right absolute left-0 mt-1 min-w-full w-max rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50 max-h-60 overflow-y-auto"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            {options.map((option) => (
              <button
                key={option.value}
                className={`
                  block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900
                  ${option.value === value ? 'bg-gray-100 font-medium' : ''}
                  ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                role="menuitem"
                disabled={option.disabled}
                onClick={() => !option.disabled && handleSelect(option.value)}
                style={option.style}
              >
                {renderItem ? renderItem(option) : option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ToolbarDropdown
