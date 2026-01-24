/**
 * ColorGrid Component Tests
 * Testing color swatch grid display and interaction
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ColorGrid from './ColorGrid'

describe('ColorGrid', () => {
  const mockOnColorClick = jest.fn()
  const testColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']

  beforeEach(() => {
    mockOnColorClick.mockClear()
  })

  describe('TC-CG-001: 渲染颜色块', () => {
    it('should render all color swatches', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
        />
      )

      // Each color should be rendered as a button
      testColors.forEach(color => {
        const swatch = screen.getByTitle(color)
        expect(swatch).toBeInTheDocument()
        expect(swatch.tagName).toBe('BUTTON')
      })
    })

    it('should apply background color to each swatch', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
        />
      )

      // Check that swatches have background color inline style
      testColors.forEach(color => {
        const swatch = screen.getByTitle(color)
        expect(swatch).toHaveAttribute('style')
        // Just check that background-color is present, the format may vary (rgb vs hex)
        expect(swatch.getAttribute('style')).toMatch(/background-color:/)
      })
    })

    it('should render with default swatch size', () => {
      const { container } = render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
        />
      )

      const swatches = container.querySelectorAll('button[style*="background-color"]')
      expect(swatches.length).toBe(testColors.length)
      swatches.forEach(swatch => {
        expect(swatch).toHaveClass('w-6')
        expect(swatch).toHaveClass('h-6')
      })
    })

    it('should render with custom swatch size', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
          swatchSize="w-8 h-8"
        />
      )

      const swatch = screen.getByTitle(testColors[0])
      expect(swatch).toHaveClass('w-8')
      expect(swatch).toHaveClass('h-8')
    })

    it('should render label when provided', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
          label="Test Colors"
        />
      )

      expect(screen.getByText('Test Colors')).toBeInTheDocument()
    })

    it('should not render label when not provided', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
        />
      )

      expect(screen.queryByText('Test Colors')).not.toBeInTheDocument()
    })

    it('should render with correct grid columns', () => {
      const { container } = render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
          columns={3}
        />
      )

      // Check that grid has correct style
      const grid = container.querySelector('.grid')
      expect(grid).toHaveAttribute('style')
      const style = grid?.getAttribute('style')
      expect(style).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')
    })

    it('should render empty array gracefully', () => {
      const { container } = render(
        <ColorGrid
          colors={[]}
          onColorClick={mockOnColorClick}
        />
      )

      const swatches = container.querySelectorAll('button')
      expect(swatches.length).toBe(0)
    })
  })

  describe('TC-CG-002: hover高亮效果', () => {
    it('should add hover effect on mouse enter', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
        />
      )

      const swatch = screen.getByTitle(testColors[0])

      // Trigger mouse enter
      fireEvent.mouseEnter(swatch)

      // Should have hover border class
      expect(swatch).toHaveClass('hover:border-gray-500')
    })

    it('should have transition class for smooth hover', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
        />
      )

      const swatch = screen.getByTitle(testColors[0])

      // Should have transition class
      expect(swatch).toHaveClass('transition-colors')
    })

    it('should handle mouse leave', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
        />
      )

      const swatch = screen.getByTitle(testColors[0])

      // Trigger mouse enter then leave
      fireEvent.mouseEnter(swatch)
      fireEvent.mouseLeave(swatch)

      // Swatch should still be in document
      expect(swatch).toBeInTheDocument()
    })

    it('should maintain border on all swatches', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
        />
      )

      testColors.forEach(color => {
        const swatch = screen.getByTitle(color)
        expect(swatch).toHaveClass('border')
        expect(swatch).toHaveClass('border-gray-300')
      })
    })

    it('should have rounded corners', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
        />
      )

      const swatch = screen.getByTitle(testColors[0])
      expect(swatch).toHaveClass('rounded-sm')
    })
  })

  describe('Click interactions', () => {
    it('should call onColorClick when swatch is clicked', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
        />
      )

      const swatch = screen.getByTitle(testColors[2])
      fireEvent.click(swatch)

      expect(mockOnColorClick).toHaveBeenCalledWith(testColors[2])
      expect(mockOnColorClick).toHaveBeenCalledTimes(1)
    })

    it('should call onColorClick with correct color for each swatch', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
        />
      )

      // Click each swatch and verify
      testColors.forEach((color) => {
        mockOnColorClick.mockClear()
        const swatch = screen.getByTitle(color)
        fireEvent.click(swatch)
        expect(mockOnColorClick).toHaveBeenCalledWith(color)
      })
    })

    it('should handle multiple clicks on same swatch', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
        />
      )

      const swatch = screen.getByTitle(testColors[0])

      fireEvent.click(swatch)
      fireEvent.click(swatch)
      fireEvent.click(swatch)

      expect(mockOnColorClick).toHaveBeenCalledTimes(3)
      expect(mockOnColorClick).toHaveBeenLastCalledWith(testColors[0])
    })
  })

  describe('Accessibility', () => {
    it('should have title attribute on swatches', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
        />
      )

      const swatch = screen.getByTitle(testColors[0])
      expect(swatch).toBeInTheDocument()
    })

    it('should have aria-label describing the color', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
        />
      )

      const swatch = screen.getByLabelText(`Select color ${testColors[0]}`)
      expect(swatch).toBeInTheDocument()
    })

    it('should have button type for all swatches', () => {
      render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
        />
      )

      testColors.forEach(color => {
        const swatch = screen.getByTitle(color)
        expect(swatch.tagName).toBe('BUTTON')
        expect(swatch).toHaveAttribute('type', 'button')
      })
    })
  })

  describe('Custom className', () => {
    it('should apply custom className to container', () => {
      const { container } = render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
          className="custom-grid-class"
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('custom-grid-class')
    })
  })

  describe('Grid layout variations', () => {
    it('should handle single column layout', () => {
      const { container } = render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
          columns={1}
        />
      )

      const grid = container.querySelector('.grid')
      expect(grid).toHaveAttribute('style')
      const style = grid?.getAttribute('style')
      expect(style).toContain('grid-template-columns: repeat(1, minmax(0, 1fr))')
    })

    it('should handle large column count', () => {
      const { container } = render(
        <ColorGrid
          colors={testColors}
          onColorClick={mockOnColorClick}
          columns={20}
        />
      )

      const grid = container.querySelector('.grid')
      expect(grid).toHaveAttribute('style')
      const style = grid?.getAttribute('style')
      expect(style).toContain('grid-template-columns: repeat(20, minmax(0, 1fr))')
    })
  })

  describe('Edge cases', () => {
    it('should handle duplicate colors', () => {
      const duplicateColors = ['#FF0000', '#FF0000', '#00FF00']

      render(
        <ColorGrid
          colors={duplicateColors}
          onColorClick={mockOnColorClick}
        />
      )

      // Should render all duplicates
      const swatches = screen.getAllByTitle('#FF0000')
      expect(swatches.length).toBe(2)
    })

    it('should handle very long color list', () => {
      // Generate unique colors
      const longColorList = Array.from({ length: 100 }, (_, i) =>
        `#${i.toString(16).padStart(6, '0').substring(0, 6)}`
      )

      render(
        <ColorGrid
          colors={longColorList}
          onColorClick={mockOnColorClick}
        />
      )

      // Check that all swatches are rendered
      const swatches = document.querySelectorAll('button[aria-label^="Select color"]')
      expect(swatches.length).toBe(100)
    })
  })
})
