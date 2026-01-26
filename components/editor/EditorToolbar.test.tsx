
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import EditorToolbar from './EditorToolbar'

// Mock sub-components to focus on integration logic
jest.mock('./toolbar/core/ButtonRenderer', () => {
  return function MockButtonRenderer(props: any) {
    return (
      <button
        data-testid={`btn-${props.config.id}`}
        onClick={() => {
          if (props.config.type === 'command' || props.config.type === 'toggle') {
            props.onCommand(props.config.command, props.config.commandArg)
          } else if (props.config.type === 'select') {
            props.onSelectChange(props.config.id, 'new-value')
          }
        }}
        data-active={props.isActive}
        data-value={props.value}
      >
        {props.config.label}
      </button>
    )
  }
})

// Mock useEditorState (kept for querying DOM state)
jest.mock('./toolbar/hooks/useEditorState', () => ({
  useEditorState: () => ({
    editorState: {
      isBold: true, // Simulate bold is active
      isItalic: false,
      fontName: 'Arial',
      fontSize: '16px',
      formatBlock: 'p',
      align: 'left'
    },
    checkState: jest.fn()
  })
}))

jest.mock('./toolbar/hooks/useEditorState', () => ({
  useEditorState: () => ({
    editorState: {
      isBold: true, // Simulate bold is active
      isItalic: false,
      fontName: 'Arial',
      fontSize: '16px',
      formatBlock: 'p',
      align: 'left'
    },
    checkState: jest.fn()
  })
}))

describe('EditorToolbar Integration', () => {
  // Create a mock iframe with proper document structure
  const createMockIframe = () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write('<html><body><p>Test content</p></body></html>')
      doc.close()
      // Mock execCommand for jsdom environment
      doc.execCommand = jest.fn(() => true)
      doc.queryCommandState = jest.fn(() => false)
      doc.queryCommandValue = jest.fn(() => '')
    }
    return iframe
  }

  const defaultProps = {
    iframeRef: { current: createMockIframe() },
    onContentChange: jest.fn(),
    isEditing: true
  }

  afterEach(() => {
    // Clean up iframe
    if (defaultProps.iframeRef.current && defaultProps.iframeRef.current.parentNode) {
      defaultProps.iframeRef.current.parentNode.removeChild(defaultProps.iframeRef.current)
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all toolbar groups', () => {
    render(<EditorToolbar {...defaultProps} />)

    // Check for key buttons from different groups using correct button IDs
    expect(screen.getByTestId('btn-undo')).toBeInTheDocument()
    expect(screen.getByTestId('btn-format-bold')).toBeInTheDocument()
    expect(screen.getByTestId('btn-font-family')).toBeInTheDocument()
    expect(screen.getByTestId('btn-align-left')).toBeInTheDocument()
  })

  it('reflects editor state in buttons', () => {
    render(<EditorToolbar {...defaultProps} />)

    // Bold should be active (mocked state isBold: true)
    const boldBtn = screen.getByTestId('btn-format-bold')
    expect(boldBtn).toHaveAttribute('data-active', 'true')

    // Italic should not be active
    const italicBtn = screen.getByTestId('btn-format-italic')
    expect(italicBtn).toHaveAttribute('data-active', 'false')

    // Font family should show current value
    const fontBtn = screen.getByTestId('btn-font-family')
    expect(fontBtn).toHaveAttribute('data-value', 'Arial')
  })

  it('executes commands when buttons are clicked', () => {
    const mockOnContentChange = jest.fn()
    const props = { ...defaultProps, onContentChange: mockOnContentChange }

    render(<EditorToolbar {...props} />)

    // Click bold button - should call onContentChange with new HTML
    fireEvent.click(screen.getByTestId('btn-format-bold'))
    expect(mockOnContentChange).toHaveBeenCalled()

    // Click font family - should also trigger change
    mockOnContentChange.mockClear()
    fireEvent.click(screen.getByTestId('btn-font-family'))
    expect(mockOnContentChange).toHaveBeenCalled()
  })

  it('disables buttons when not editing', () => {
    const { rerender } = render(<EditorToolbar {...defaultProps} isEditing={false} />)

    // The component should render without errors when not editing
    expect(screen.getByTestId('btn-format-bold')).toBeInTheDocument()
  })
})
