/**
 * TablePicker Component Tests
 * Testing interactive grid picker for table dimension selection
 */

import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import TablePicker from './TablePicker'

// Mock the PickerDropdown component to avoid portal issues in tests
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

// Mock the TableIcon
jest.mock('../../icons', () => ({
  TableIcon: () => <div data-testid="table-icon">Table</div>
}))

describe('TablePicker', () => {
  const mockOnTableSelect = jest.fn()

  beforeEach(() => {
    mockOnTableSelect.mockClear()
  })

  describe('TC-TP-001: 显示表格预览', () => {
    it('should display interactive table grid when opened', () => {
      render(<TablePicker onTableSelect={mockOnTableSelect} />)

      // Click to open the picker
      const button = screen.getByTitle('Insert table')
      fireEvent.click(button)

      // Check if dropdown is rendered
      const dropdown = screen.getByText('Insert table').closest('.mock-dropdown')
      expect(dropdown).toBeInTheDocument()

      // Check if grid cells are rendered (10x10 = 100 cells)
      const cells = screen.getAllByRole('button')
        .filter(btn => btn.getAttribute('aria-label')?.includes('by'))
      expect(cells.length).toBeGreaterThan(0)
    })

    it('should display quick insert options', () => {
      render(<TablePicker onTableSelect={mockOnTableSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Insert table'))

      // Check for quick insert options
      expect(screen.getByText('2 × 2 table')).toBeInTheDocument()
      expect(screen.getByText('3 × 3 table')).toBeInTheDocument()
      expect(screen.getByText('2 × 3 table')).toBeInTheDocument()
      expect(screen.getByText('3 × 2 table')).toBeInTheDocument()
    })
  })

  describe('TC-TP-002: hover高亮单元格', () => {
    it('should highlight cells on hover', () => {
      render(<TablePicker onTableSelect={mockOnTableSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Insert table'))

      // Find a cell (e.g., 3x3)
      const cell3x3 = screen.getByLabelText('3 by 3 table')
      expect(cell3x3).toBeInTheDocument()

      // Simulate hover by triggering mouseEnter
      fireEvent.mouseEnter(cell3x3)

      // After hover, cells should have highlighted state
      // Check that the cell itself has the highlighted class
      expect(cell3x3).toHaveClass('bg-blue-500')

      // Also check the dimension text appears (use querySelector to get the specific one)
      const dimensionText = document.querySelector('.text-xs.text-gray-500.mt-2.text-center')
      expect(dimensionText?.textContent).toContain('3 × 3')
    })

    it('should update highlight when hovering different cells', () => {
      render(<TablePicker onTableSelect={mockOnTableSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Insert table'))

      // Hover over 2x2 cell first
      const cell2x2 = screen.getByLabelText('2 by 2 table')
      fireEvent.mouseEnter(cell2x2)
      expect(cell2x2).toHaveClass('bg-blue-500')
      let dimensionText = document.querySelector('.text-xs.text-gray-500.mt-2.text-center')
      expect(dimensionText?.textContent).toContain('2 × 2')

      // Then hover over 5x4 cell
      const cell5x4 = screen.getByLabelText('5 by 4 table')
      fireEvent.mouseEnter(cell5x4)
      expect(cell5x4).toHaveClass('bg-blue-500')
      dimensionText = document.querySelector('.text-xs.text-gray-500.mt-2.text-center')
      expect(dimensionText?.textContent).toContain('5 × 4')
    })

    it('should remove highlight on mouse leave', () => {
      render(<TablePicker onTableSelect={mockOnTableSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Insert table'))

      const cell = screen.getByLabelText('4 by 3 table')
      fireEvent.mouseEnter(cell)
      expect(cell).toHaveClass('bg-blue-500')

      // Trigger mouse leave
      fireEvent.mouseLeave(cell)

      // The dimension text should disappear
      expect(screen.queryByText('4 × 3 table')).not.toBeInTheDocument()
    })
  })

  describe('TC-TP-003: 点击确认选择', () => {
    it('should call onTableSelect with correct dimensions when clicking a cell', () => {
      render(<TablePicker onTableSelect={mockOnTableSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Insert table'))

      // Click on a cell (e.g., 3x4)
      const cell = screen.getByLabelText('3 by 4 table')
      fireEvent.click(cell)

      // Verify callback was called with correct dimensions
      expect(mockOnTableSelect).toHaveBeenCalledWith(3, 4)
      expect(mockOnTableSelect).toHaveBeenCalledTimes(1)
    })

    it('should close dropdown after selection', () => {
      render(<TablePicker onTableSelect={mockOnTableSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Insert table'))
      expect(screen.queryByTestId('backdrop')).toBeInTheDocument()

      // Click on a cell
      const cell = screen.getByLabelText('2 by 2 table')
      fireEvent.click(cell)

      // Dropdown should be closed (no longer in document)
      expect(screen.queryByTestId('backdrop')).not.toBeInTheDocument()
    })

    it('should work with quick insert options', () => {
      render(<TablePicker onTableSelect={mockOnTableSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Insert table'))

      // Click on quick insert option
      const quickInsert = screen.getByText('3 × 3 table')
      fireEvent.click(quickInsert)

      expect(mockOnTableSelect).toHaveBeenCalledWith(3, 3)
    })
  })

  describe('TC-TP-004: 点击外部关闭', () => {
    it('should call onClose when clicking backdrop', () => {
      render(<TablePicker onTableSelect={mockOnTableSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Insert table'))

      // Verify dropdown is open
      expect(screen.getByTestId('backdrop')).toBeInTheDocument()

      // Click on backdrop
      const backdrop = screen.getByTestId('backdrop')
      fireEvent.click(backdrop)

      // Dropdown should close
      expect(screen.queryByTestId('backdrop')).not.toBeInTheDocument()
    })

    it('should not close when clicking inside dropdown', () => {
      render(<TablePicker onTableSelect={mockOnTableSelect} />)

      // Open the picker
      fireEvent.click(screen.getByTitle('Insert table'))

      // Click inside dropdown content
      const dropdownContent = screen.getByText('Insert table').closest('.dropdown-content')
      if (dropdownContent) {
        fireEvent.click(dropdownContent)

        // Dropdown should still be open
        expect(screen.getByTestId('backdrop')).toBeInTheDocument()
      }
    })
  })

  describe('Disabled state', () => {
    it('should not open when disabled', () => {
      render(<TablePicker onTableSelect={mockOnTableSelect} disabled />)

      const button = screen.getByTitle('Insert table')
      expect(button).toBeDisabled()

      // Try to click
      fireEvent.click(button)

      // Dropdown should not appear
      expect(screen.queryByTestId('backdrop')).not.toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('should handle maximum table size (10x10)', () => {
      render(<TablePicker onTableSelect={mockOnTableSelect} />)

      fireEvent.click(screen.getByTitle('Insert table'))

      const cell10x10 = screen.getByLabelText('10 by 10 table')
      expect(cell10x10).toBeInTheDocument()

      fireEvent.click(cell10x10)
      expect(mockOnTableSelect).toHaveBeenCalledWith(10, 10)
    })

    it('should handle minimum table size (1x1)', () => {
      render(<TablePicker onTableSelect={mockOnTableSelect} />)

      fireEvent.click(screen.getByTitle('Insert table'))

      const cell1x1 = screen.getByLabelText('1 by 1 table')
      expect(cell1x1).toBeInTheDocument()

      fireEvent.click(cell1x1)
      expect(mockOnTableSelect).toHaveBeenCalledWith(1, 1)
    })
  })
})
