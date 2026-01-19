/**
 * Unified ColorPicker Component
 * Replaces the separate ColorPicker and BackgroundColorPicker components
 * Supports both text and background color selection via the 'type' prop
 */

import React, { useState } from 'react'
import ToolbarButton from '../buttons/ToolbarButton'
import PickerDropdown from './PickerDropdown'
import ColorGrid from './ColorGrid'
import { DEFAULT_COLORS, THEME_COLORS } from '../config/constants'

export type ColorPickerType = 'text' | 'background'

export interface ColorPickerProps {
  /** Type of color picker (text or background) */
  type: ColorPickerType
  /** Callback when a color is selected */
  onColorSelect: (color: string) => void
  /** Whether the picker is disabled */
  disabled?: boolean
  /** Additional className for the button */
  className?: string
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  type,
  onColorSelect,
  disabled = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedColor, setSelectedColor] = useState(
    type === 'text' ? '#000000' : 'transparent'
  )

  const handleColorClick = (color: string) => {
    setSelectedColor(color)
    onColorSelect(color)
    setIsOpen(false)
  }

  const handleCustomColor = () => {
    const customColor = window.prompt('Enter custom color (hex):', '#')
    if (customColor && /^#[0-9A-F]{6}$/i.test(customColor)) {
      handleColorClick(customColor)
    }
  }

  const isTextType = type === 'text'
  const label = isTextType ? 'Text color' : 'Background color'

  return (
    <div className="relative">
      {/* Main Color Button */}
      <ToolbarButton
        title={label}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`min-w-[40px] px-2 ${className}`}
      >
        <ColorIndicator type={type} color={selectedColor} />
      </ToolbarButton>

      {/* Dropdown */}
      <PickerDropdown isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {/* Header */}
        <div className="mb-3 border-b border-gray-200 pb-2">
          <p className="text-sm font-medium text-gray-700">{label}</p>
        </div>

        {/* No Color Option (for background type) */}
        {!isTextType && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => handleColorClick('transparent')}
              className="w-full flex items-center gap-3 px-1 py-1.5 hover:bg-gray-50 rounded transition-colors"
            >
              <div className="w-6 h-6 border border-gray-300 rounded-sm flex items-center justify-center relative">
                <div className="absolute w-4 h-0.5 bg-red-600 transform rotate-45" />
              </div>
              <span className="text-sm text-gray-700">No color</span>
            </button>
          </div>
        )}

        {/* Theme Colors */}
        <ColorGrid
          colors={THEME_COLORS}
          onColorClick={handleColorClick}
          label="Theme colors"
        />

        {/* Default Colors */}
        <ColorGrid
          colors={DEFAULT_COLORS}
          onColorClick={handleColorClick}
          label="Default colors"
          columns={10}
        />

        {/* Custom Color */}
        <div className="border-t border-gray-200 pt-3">
          <button
            type="button"
            onClick={handleCustomColor}
            className="w-full text-left px-1 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            Custom...
          </button>
        </div>
      </PickerDropdown>
    </div>
  )
}

export default ColorPicker

// ============================================================================
// Color Indicator Component
// ============================================================================

interface ColorIndicatorProps {
  type: ColorPickerType
  color: string
}

const ColorIndicator: React.FC<ColorIndicatorProps> = ({ type, color }) => {
  if (type === 'text') {
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-700">
          <text x="8" y="10" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" fontFamily="Arial">A</text>
          <rect x="4" y="11.5" width="8" height="1.5" fill="currentColor" opacity="0.8" rx="0.5"/>
        </svg>
        <div
          className="absolute bottom-[3px] left-1/2 transform -translate-x-1/2 w-2 h-0.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    )
  }

  // Background type
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <svg width="16" height="16" viewBox="0 0 16 16" className="text-gray-700">
        <text x="8" y="10" textAnchor="middle" fontSize="10" fontWeight="bold" fill="currentColor" fontFamily="Arial">A</text>
        <rect x="3" y="11" width="10" height="3" fill="currentColor" opacity="0.2" rx="1"/>
      </svg>
      <div
        className="absolute bottom-[3px] left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-sm border border-gray-400"
        style={{
          backgroundColor: color === 'transparent' ? 'white' : color,
          border: color === 'transparent' ? '1px dashed #9CA3AF' : '1px solid rgba(0,0,0,0.1)'
        }}
      />
    </div>
  )
}
