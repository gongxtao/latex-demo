
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import ButtonRenderer, { ButtonRendererProps } from './ButtonRenderer'
import { ButtonConfig } from '../config/buttonConfigs'

// Mock icons
const MockIcon = () => <div data-testid="mock-icon">Icon</div>

describe('ButtonRenderer', () => {
  const defaultProps: Omit<ButtonRendererProps, 'config'> = {
    disabled: false,
    onCommand: jest.fn(),
    onColorSelect: jest.fn(),
    onSelectChange: jest.fn()
  }

  it('renders a command button correctly', () => {
    const config: ButtonConfig = {
      id: 'test-cmd',
      type: 'command',
      command: 'bold',
      label: 'Bold',
      icon: MockIcon
    }

    render(<ButtonRenderer config={config} {...defaultProps} />)
    
    const button = screen.getByRole('button', { name: 'Bold' })
    expect(button).toBeInTheDocument()
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
    
    fireEvent.click(button)
    expect(defaultProps.onCommand).toHaveBeenCalledWith('bold', undefined)
  })

  it('renders a toggle button correctly and handles active state', () => {
    const config: ButtonConfig = {
      id: 'test-toggle',
      type: 'toggle',
      command: 'italic',
      label: 'Italic',
      icon: MockIcon
    }

    const { rerender } = render(
      <ButtonRenderer config={config} {...defaultProps} isActive={false} />
    )
    
    const button = screen.getByRole('button', { name: 'Italic' })
    expect(button).not.toHaveAttribute('aria-pressed', 'true')
    
    // Rerender with active state
    rerender(<ButtonRenderer config={config} {...defaultProps} isActive={true} />)
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button).toHaveClass('bg-blue-100')
  })

  it('renders a select dropdown correctly (font-family)', () => {
    const config: ButtonConfig = {
      id: 'font-family',
      type: 'select',
      label: 'Font',
      selectLabel: 'Font Family',
      options: [
        { value: 'Arial', label: 'Arial' },
        { value: 'Times New Roman', label: 'Times New Roman' }
      ]
    }

    render(<ButtonRenderer config={config} {...defaultProps} value="Arial" />)
    
    // Check if dropdown button is rendered with current value
    const trigger = screen.getByRole('button', { name: /Arial/i }) // Regex to match flexible content
    expect(trigger).toBeInTheDocument()
    
    // Open dropdown
    fireEvent.click(trigger)
    
    // Check options
    const option = screen.getByText('Times New Roman')
    expect(option).toBeInTheDocument()
    
    // Select option
    fireEvent.click(option)
    expect(defaultProps.onSelectChange).toHaveBeenCalledWith('font-family', 'Times New Roman')
  })

  it('renders a color picker correctly', () => {
    const config: ButtonConfig = {
      id: 'text-color',
      type: 'picker',
      picker: 'color-text',
      label: 'Text color'
    }

    render(<ButtonRenderer config={config} {...defaultProps} />)
    
    // ColorPicker renders a button with exact name
    const button = screen.getByRole('button', { name: 'Text color' })
    expect(button).toBeInTheDocument()
  })
})
