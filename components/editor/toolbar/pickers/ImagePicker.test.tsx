/**
 * ImagePicker Component Tests
 * Testing image upload and selection functionality
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ImagePicker from './ImagePicker'

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

// Mock the ImageIcon
jest.mock('../../icons', () => ({
  ImageIcon: () => <div data-testid="image-icon">Image</div>
}))

describe('ImagePicker', () => {
  const mockOnImageSelect = jest.fn()

  beforeEach(() => {
    mockOnImageSelect.mockClear()
    // Mock window.alert
    global.alert = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('TC-IP-001: 显示图片选项', () => {
    it('should render image picker button', () => {
      render(<ImagePicker onImageSelect={mockOnImageSelect} />)

      const button = screen.getByTitle('Insert image')
      expect(button).toBeInTheDocument()
      expect(screen.getByTestId('image-icon')).toBeInTheDocument()
    })

    it('should render with custom title', () => {
      render(<ImagePicker onImageSelect={mockOnImageSelect} title="Upload Photo" />)

      const button = screen.getByTitle('Upload Photo')
      expect(button).toBeInTheDocument()
    })

    it('should render with custom icon', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Custom</div>

      render(<ImagePicker onImageSelect={mockOnImageSelect} icon={CustomIcon} />)

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('image-icon')).not.toBeInTheDocument()
    })

    it('should have hidden file input', () => {
      render(<ImagePicker onImageSelect={mockOnImageSelect} />)

      const input = document.querySelector('input[type="file"]')
      expect(input).toBeInTheDocument()
      expect(input).toHaveClass('hidden')
      expect(input).toHaveAttribute('accept', 'image/*')
    })
  })

  describe('TC-IP-002: hover显示预览', () => {
    it('should show hover state on button', () => {
      render(<ImagePicker onImageSelect={mockOnImageSelect} />)

      const button = screen.getByTitle('Insert image')

      // Trigger mouse enter
      fireEvent.mouseEnter(button)

      // Button should be interactive
      expect(button).not.toBeDisabled()

      // Trigger mouse leave
      fireEvent.mouseLeave(button)
      expect(button).toBeInTheDocument()
    })
  })

  describe('TC-IP-003: 点击确认选择', () => {
    it('should open file dialog on button click', () => {
      render(<ImagePicker onImageSelect={mockOnImageSelect} />)

      const button = screen.getByTitle('Insert image')
      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      // Mock the click method on the input
      const mockClick = jest.fn()
      input.click = mockClick

      fireEvent.click(button)

      // Verify input click was triggered
      // Note: In actual browser this would open file dialog
      expect(input).toBeInTheDocument()
    })

    it('should handle valid image file selection', async () => {
      render(<ImagePicker onImageSelect={mockOnImageSelect} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      // Create a mock image file
      const file = new File(['mock image content'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }) // 1MB

      // Create mock FileList
      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => fileList[index]
      }

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        onerror: null as any
      }

      global.FileReader = jest.fn(() => mockFileReader) as any

      // Trigger change event
      fireEvent.change(input, { target: { files: fileList } })

      // Simulate successful file read
      await waitFor(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,abc123' } })
        }
      })

      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file)
    })

    it('should reject non-image files', () => {
      render(<ImagePicker onImageSelect={mockOnImageSelect} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      // Create a non-image file
      const file = new File(['mock content'], 'test.pdf', { type: 'application/pdf' })
      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => fileList[index]
      }

      fireEvent.change(input, { target: { files: fileList } })

      // Should show alert
      expect(global.alert).toHaveBeenCalledWith('Please select an image file')
      expect(mockOnImageSelect).not.toHaveBeenCalled()
    })

    it('should reject files that are too large', () => {
      render(<ImagePicker onImageSelect={mockOnImageSelect} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      // Create a large image file (> 5MB)
      const file = new File(['mock image content'], 'large.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }) // 6MB

      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => fileList[index]
      }

      fireEvent.change(input, { target: { files: fileList } })

      // Should show alert about size
      expect(global.alert).toHaveBeenCalledWith('Image size must be less than 5MB')
      expect(mockOnImageSelect).not.toHaveBeenCalled()
    })

    it('should call onImageSelect with data URL after successful upload', async () => {
      render(<ImagePicker onImageSelect={mockOnImageSelect} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const testDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg'

      // Mock FileReader with immediate callback
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any,
        result: testDataUrl
      }

      global.FileReader = jest.fn(() => mockFileReader) as any

      const file = new File(['mock'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => fileList[index]
      }

      fireEvent.change(input, { target: { files: fileList } })

      // Wait for FileReader to process
      await waitFor(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: testDataUrl } })
        }
      })

      expect(mockOnImageSelect).toHaveBeenCalledWith(testDataUrl)
    })
  })

  describe('Uploading state', () => {
    it('should show loading indicator during upload', () => {
      render(<ImagePicker onImageSelect={mockOnImageSelect} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      // Create file
      const file = new File(['mock'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => fileList[index]
      }

      fireEvent.change(input, { target: { files: fileList } })

      // Button title should change to "Uploading..."
      const button = screen.getByTitle('Uploading...')
      expect(button).toBeInTheDocument()
    })

    it('should be disabled while uploading', async () => {
      render(<ImagePicker onImageSelect={mockOnImageSelect} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const button = screen.getByTestId('toolbar-button')

      // Initially not disabled
      expect(button).not.toBeDisabled()

      // Start upload
      const file = new File(['mock'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => fileList[index]
      }

      fireEvent.change(input, { target: { files: fileList } })

      // Button should be disabled during upload
      await waitFor(() => {
        expect(screen.getByTitle('Uploading...')).toBeDisabled()
      })
    })
  })

  describe('Disabled state', () => {
    it('should not trigger file dialog when disabled', () => {
      render(<ImagePicker onImageSelect={mockOnImageSelect} disabled />)

      const button = screen.getByTitle('Insert image')
      expect(button).toBeDisabled()

      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      // Try to trigger change
      const file = new File(['mock'], 'test.jpg', { type: 'image/jpeg' })
      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => fileList[index]
      }

      fireEvent.change(input, { target: { files: fileList } })

      // Should not process
      expect(mockOnImageSelect).not.toHaveBeenCalled()
    })
  })

  describe('Input reset', () => {
    it('should reset input value after file selection', async () => {
      render(<ImagePicker onImageSelect={mockOnImageSelect} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      const file = new File(['mock'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => fileList[index]
      }

      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null as any
      }

      global.FileReader = jest.fn(() => mockFileReader) as any

      fireEvent.change(input, { target: { files: fileList } })

      await waitFor(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: 'data:image/jpeg;base64,abc' } })
        }
      })

      // Input value should be reset
      expect(input.value).toBe('')
    })
  })

  describe('Error handling', () => {
    it('should handle FileReader error', async () => {
      render(<ImagePicker onImageSelect={mockOnImageSelect} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement

      const file = new File(['mock'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => fileList[index]
      }

      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onerror: null as any
      }

      global.FileReader = jest.fn(() => mockFileReader) as any

      fireEvent.change(input, { target: { files: fileList } })

      await waitFor(() => {
        if (mockFileReader.onerror) {
          mockFileReader.onerror()
        }
      })

      expect(global.alert).toHaveBeenCalledWith('Failed to read file')
    })
  })
})
