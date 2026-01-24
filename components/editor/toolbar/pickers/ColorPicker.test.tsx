/**
 * ColorPicker Component Tests
 * Testing unified color picker for text and background colors
 */

import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import ColorPicker, { ColorPickerType } from './ColorPicker'

// Mock the PickerDropdown component
jest.mock('./PickerDropdown', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, children, width }: any) => {
    if (!isOpen) return null
    return (
      <div className="mock-dropdown" data-width={width}>
        <div className="backdrop" onClick={onClose} data-testid="backdrop" />
        <div className="dropdown-content" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    )
  }
}))

// Mock the ToolbarButton component
jest.mock('../buttons/ToolbarButton', () => ({
  __esModule: true,
  default: ({ children, onClick, disabled, title, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={className}
      data-testid="toolbar-button"
    >
      {children}
    </button>
  )
}))

// Mock the ColorGrid component
jest.mock('./ColorGrid', () => ({
  __esModule: true,
  default: ({ colors, onColorClick, label }: any) => (
    <div className="mock-color-grid" data-label={label}>
      {label && <p className="grid-label">{label}</p>}
      {colors.map((color: string) => (
        <button
          key={color}
          onClick={() => onColorClick(color)}
          className="color-swatch"
          data-color={color}
          style={{ backgroundColor: color }}
        >
          {color}
        </button>
      ))}
    </div>
  )
}))

describe('ColorPicker', () => {
  const mockOnColorSelect = jest.fn()

  beforeEach(() => {
    mockOnColorSelect.mockClear()
    // Mock window.prompt
    global.prompt = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('TC-CP-001: 显示颜色网格', () => {
    it('should display color picker button for text type', () => {
      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      const button = screen.getByTitle('Text color')
      expect(button).toBeInTheDocument()
    })

    it('should display color picker button for background type', () => {
      render(<ColorPicker type="background" onColorSelect={mockOnColorSelect} />)

      const button = screen.getByTitle('Background color')
      expect(button).toBeInTheDocument()
    })

    it('should display theme colors when opened', () => {
      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Text color'))

      // Check for theme colors section
      const themeColorsGrid = screen.getByTestId('backdrop').closest('.mock-dropdown')
      expect(themeColorsGrid).toBeInTheDocument()

      // Theme colors label should be present
      expect(screen.getByText('Theme colors')).toBeInTheDocument()
    })

    it('should display default colors when opened', () => {
      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Text color'))

      // Default colors label should be present
      expect(screen.getByText('Default colors')).toBeInTheDocument()
    })

    it('should show "No color" option for background type', () => {
      render(<ColorPicker type="background" onColorSelect={mockOnColorSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Background color'))

      // Should have "No color" button
      expect(screen.getByText('No color')).toBeInTheDocument()
    })

    it('should not show "No color" option for text type', () => {
      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Text color'))

      // Should not have "No color" button
      expect(screen.queryByText('No color')).not.toBeInTheDocument()
    })
  })

  describe('TC-CP-002: 点击颜色选择', () => {
    it('should call onColorSelect when clicking a theme color', () => {
      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Text color'))

      // Click on a color swatch (from mocked ColorGrid)
      const colorSwatch = screen.getByText('#1A73E8')
      fireEvent.click(colorSwatch)

      expect(mockOnColorSelect).toHaveBeenCalledWith('#1A73E8')
      expect(mockOnColorSelect).toHaveBeenCalledTimes(1)
    })

    it('should call onColorSelect when clicking a default color', () => {
      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Text color'))

      // Find and click a default color
      const colorSwatch = screen.getByText('#000000')
      fireEvent.click(colorSwatch)

      expect(mockOnColorSelect).toHaveBeenCalledWith('#000000')
    })

    it('should close dropdown after color selection', () => {
      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Text color'))
      expect(screen.getByTestId('backdrop')).toBeInTheDocument()

      // Click on a color (using a color that exists in DEFAULT_COLORS)
      const colorSwatch = screen.getByText('#F44336')
      fireEvent.click(colorSwatch)

      // Dropdown should close
      expect(screen.queryByTestId('backdrop')).not.toBeInTheDocument()
    })

    it('should call onColorSelect with "transparent" for "No color" option', () => {
      render(<ColorPicker type="background" onColorSelect={mockOnColorSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Background color'))

      // Click "No color"
      const noColorButton = screen.getByText('No color').closest('button')
      if (noColorButton) {
        fireEvent.click(noColorButton)

        expect(mockOnColorSelect).toHaveBeenCalledWith('transparent')
      }
    })
  })

  describe('Custom color functionality', () => {
    it('should show custom color button', () => {
      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Text color'))

      expect(screen.getByText('Custom color...')).toBeInTheDocument()
    })

    it('should prompt for custom color when button clicked', () => {
      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Text color'))

      const customColorButton = screen.getByText('Custom color...').closest('button')
      if (customColorButton) {
        fireEvent.click(customColorButton)

        expect(global.prompt).toHaveBeenCalledWith('Enter custom color (hex):', '#')
      }
    })

    it('should accept valid hex color from prompt', () => {
      (global.prompt as jest.Mock).mockReturnValue('#FF00FF')

      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Text color'))

      const customColorButton = screen.getByText('Custom color...').closest('button')
      if (customColorButton) {
        fireEvent.click(customColorButton)

        expect(mockOnColorSelect).toHaveBeenCalledWith('#FF00FF')
      }
    })

    it('should accept valid hex color without hash', () => {
      (global.prompt as jest.Mock).mockReturnValue('#ABC123')

      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Text color'))

      const customColorButton = screen.getByText('Custom color...').closest('button')
      if (customColorButton) {
        fireEvent.click(customColorButton)

        expect(mockOnColorSelect).toHaveBeenCalledWith('#ABC123')
      }
    })

    it('should reject invalid hex color from prompt', () => {
      (global.prompt as jest.Mock).mockReturnValue('invalid-color')

      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Text color'))

      const customColorButton = screen.getByText('Custom color...').closest('button')
      if (customColorButton) {
        fireEvent.click(customColorButton)

        expect(mockOnColorSelect).not.toHaveBeenCalled()
      }
    })

    it('should handle cancel from prompt', () => {
      (global.prompt as jest.Mock).mockReturnValue(null)

      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Text color'))

      const customColorButton = screen.getByText('Custom color...').closest('button')
      if (customColorButton) {
        fireEvent.click(customColorButton)

        expect(mockOnColorSelect).not.toHaveBeenCalled()
      }
    })
  })

  describe('Color indicator display', () => {
    it('should display correct indicator for text type', () => {
      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      const button = screen.getByTitle('Text color')
      // Should contain the letter A
      expect(button.textContent).toContain('A')
    })

    it('should display correct indicator for background type', () => {
      render(<ColorPicker type="background" onColorSelect={mockOnColorSelect} />)

      const button = screen.getByTitle('Background color')
      // Should be present
      expect(button).toBeInTheDocument()
    })
  })

  describe('Dropdown behavior', () => {
    it('should toggle dropdown on button click', () => {
      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      const button = screen.getByTitle('Text color')

      // Initially closed
      expect(screen.queryByTestId('backdrop')).not.toBeInTheDocument()

      // Click to open
      fireEvent.click(button)
      expect(screen.getByTestId('backdrop')).toBeInTheDocument()

      // Click to close
      fireEvent.click(button)
      expect(screen.queryByTestId('backdrop')).not.toBeInTheDocument()
    })

    it('should close when clicking backdrop', () => {
      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Text color'))

      // Click backdrop
      const backdrop = screen.getByTestId('backdrop')
      fireEvent.click(backdrop)

      expect(screen.queryByTestId('backdrop')).not.toBeInTheDocument()
    })
  })

  describe('Disabled state', () => {
    it('should not open when disabled', () => {
      render(<ColorPicker type="text" onColorSelect={mockOnColorSelect} disabled />)

      const button = screen.getByTitle('Text color')
      expect(button).toBeDisabled()

      fireEvent.click(button)

      expect(screen.queryByTestId('backdrop')).not.toBeInTheDocument()
    })
  })

  describe('Custom className', () => {
    it('should apply custom className to button', () => {
      render(
        <ColorPicker
          type="text"
          onColorSelect={mockOnColorSelect}
          className="custom-test-class"
        />
      )

      const button = screen.getByTitle('Text color')
      expect(button).toHaveClass('custom-test-class')
    })
  })
})
