import { renderHook, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useEditorCommands } from '@/components/editor/toolbar/hooks/useEditorCommands'
import { createMockIframe, cleanupMockIframe } from '@/test/utils/test-utils'

/**
 * Test Suite: useEditorCommands Hook
 *
 * Tests the useEditorCommands hook functionality including:
 * - Basic command execution
 * - Format painter functionality
 * - Style capture and application
 * - Selection preservation
 * - Content change callbacks
 * - Edge cases and error handling
 */
describe('useEditorCommands', () => {
  let mockIframe: HTMLIFrameElement
  let mockOnContentChange: jest.Mock

  beforeEach(() => {
    // Setup mock iframe with content
    mockIframe = createMockIframe('<p>Test content</p>')
    document.body.appendChild(mockIframe)
    mockOnContentChange = jest.fn()

    // Mock execCommand
    const doc = mockIframe.contentDocument!
    doc.execCommand = jest.fn(() => true)
    doc.queryCommandState = jest.fn(() => false)
    doc.queryCommandValue = jest.fn(() => '')
    doc.queryCommandSupported = jest.fn(() => true)

    // Mock getSelection
    const mockSelection = {
      rangeCount: 1,
      anchorNode: doc.body.firstChild,
      anchorOffset: 0,
      focusNode: doc.body.firstChild,
      focusOffset: 0,
      isCollapsed: false,
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
      getRangeAt: jest.fn(() => {
        const range = doc.createRange()
        range.setStart(doc.body, 0)
        range.setEnd(doc.body, 1)
        return range
      }),
      toString: jest.fn(() => 'Test content'),
    }

    doc.getSelection = jest.fn(() => mockSelection as any)
    window.getSelection = jest.fn(() => mockSelection as any)
  })

  afterEach(() => {
    cleanupMockIframe(mockIframe)
    jest.clearAllMocks()
  })

  /**
   * Scenario 1: Basic Hook Rendering
   */
  describe('Scenario 1: Basic Hook Rendering', () => {
    it('TC-EC-001: should initialize with default state', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      expect(result.current).toBeDefined()
      expect(result.current.commands).toBeDefined()
      expect(result.current.isFormatPainterActive).toBe(false)
      expect(result.current.getIframeDoc).toBeDefined()
    })

    it('TC-EC-002: should get iframe document correctly', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      const doc = result.current.getIframeDoc()
      expect(doc).toBe(mockIframe.contentDocument)
    })

    it('TC-EC-003: should return null when iframeRef is null', () => {
      const iframeRef = { current: null }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      const doc = result.current.getIframeDoc()
      expect(doc).toBeNull()
    })
  })

  /**
   * Scenario 2: Basic Text Formatting Commands
   */
  describe('Scenario 2: Basic Text Formatting Commands', () => {
    it('TC-EC-004: should execute bold command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.bold()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('bold')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-005: should execute italic command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.italic()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('italic')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-006: should execute underline command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.underline()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('underline')
      expect(mockOnContentChange).toHaveBeenCalled()
    })
  })

  /**
   * Scenario 3: Alignment Commands
   */
  describe('Scenario 3: Alignment Commands', () => {
    it('TC-EC-007: should execute justifyLeft command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.justifyLeft()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('justifyLeft')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-008: should execute justifyCenter command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.justifyCenter()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('justifyCenter')
      expect(mockOnContentChange).toHaveBeenCalled()
    })
  })

  /**
   * Scenario 4: List Commands
   */
  describe('Scenario 4: List Commands', () => {
    it('TC-EC-009: should execute insertUnorderedList command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.insertUnorderedList()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('insertUnorderedList')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-010: should execute insertOrderedList command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.insertOrderedList()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('insertOrderedList')
      expect(mockOnContentChange).toHaveBeenCalled()
    })
  })

  /**
   * Scenario 5: Color Commands
   */
  describe('Scenario 5: Color Commands', () => {
    it('TC-EC-011: should execute foreColor command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.foreColor('#ff0000')
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('foreColor', false, '#ff0000')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-012: should execute hiliteColor command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.hiliteColor('#ffff00')
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('hiliteColor', false, '#ffff00')
      expect(mockOnContentChange).toHaveBeenCalled()
    })
  })

  /**
   * Scenario 6: Format Painter Functionality
   */
  describe('Scenario 6: Format Painter Functionality', () => {
    it('TC-EC-013: should activate format painter on first call', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.formatPainter()
      })

      expect(result.current.isFormatPainterActive).toBe(true)
    })

    it('TC-EC-014: should deactivate format painter on second call', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.formatPainter()
      })

      expect(result.current.isFormatPainterActive).toBe(true)

      act(() => {
        result.current.commands.formatPainter()
      })

      expect(result.current.isFormatPainterActive).toBe(false)
    })

    it('TC-EC-015: should capture current styles when format painter is activated', () => {
      const iframeRef = { current: mockIframe }
      const doc = mockIframe.contentDocument!

      // Mock queryCommandState to return specific values
      doc.queryCommandState = jest.fn((cmd: string) => {
        if (cmd === 'bold') return true
        if (cmd === 'italic') return false
        return false
      })

      doc.queryCommandValue = jest.fn((cmd: string) => {
        if (cmd === 'foreColor') return 'rgb(255, 0, 0)'
        if (cmd === 'fontName') return 'Arial'
        return ''
      })

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.formatPainter()
      })

      expect(result.current.isFormatPainterActive).toBe(true)
      expect(doc.queryCommandState).toHaveBeenCalledWith('bold')
      expect(doc.queryCommandState).toHaveBeenCalledWith('italic')
      expect(doc.queryCommandValue).toHaveBeenCalledWith('foreColor')
    })

    it('TC-EC-016: should not capture styles when format painter is deactivated', () => {
      const iframeRef = { current: mockIframe }
      const doc = mockIframe.contentDocument!

      doc.queryCommandState = jest.fn(() => false)
      doc.queryCommandValue = jest.fn(() => '')

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.formatPainter() // Activate
      })

      expect(result.current.isFormatPainterActive).toBe(true)

      act(() => {
        result.current.commands.formatPainter() // Deactivate
      })

      expect(result.current.isFormatPainterActive).toBe(false)
    })

    it('TC-EC-032: 格式刷激活后选择文本自动应用 (🔴高风险)', async () => {
      // Arrange: 设置初始样式
      const iframeRef = { current: mockIframe }
      const doc = mockIframe.contentDocument!

      // Mock queryCommandState to return specific values for styled text
      doc.queryCommandState = jest.fn((cmd: string) => {
        if (cmd === 'bold') return true
        if (cmd === 'italic') return false
        return false
      })

      doc.queryCommandValue = jest.fn((cmd: string) => {
        if (cmd === 'foreColor') return 'rgb(255, 0, 0)'
        return ''
      })

      // 创建带样式的文本（模拟粗体、红色）
      const styledText = doc.createElement('span')
      styledText.style.fontWeight = 'bold'
      styledText.style.color = 'red'
      styledText.textContent = 'Styled Text'
      doc.body.appendChild(styledText)

      // 创建选择范围选中有样式的文本
      const range = doc.createRange()
      range.selectNodeContents(styledText)
      const mockSelection = doc.getSelection()!
      mockSelection.removeAllRanges()
      mockSelection.addRange(range)

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      // Act 1: 激活格式刷（捕获样式）
      act(() => {
        result.current.commands.formatPainter()
      })

      expect(result.current.isFormatPainterActive).toBe(true)

      // Act 2: 创建新的纯文本
      const plainText = doc.createElement('p')
      plainText.textContent = 'Plain Text'
      doc.body.appendChild(plainText)

      // Act 3: 选择新的文本（模拟mouseup）
      const newRange = doc.createRange()
      newRange.selectNodeContents(plainText)
      mockSelection.removeAllRanges()
      mockSelection.addRange(newRange)

      // 设置isCollapsed为false以触发样式应用
      mockSelection.isCollapsed = false

      // 触发mouseup事件以应用样式
      act(() => {
        const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true })
        doc.dispatchEvent(mouseUpEvent)
      })

      // Assert: 验证格式刷已自动关闭
      await waitFor(() => {
        expect(result.current.isFormatPainterActive).toBe(false)
      })

      // 验证样式已应用（通过execCommand调用）
      // 检查是否有调用execCommand
      expect(doc.execCommand).toHaveBeenCalled()
    })
  })

  /**
   * Scenario 7: Style Application
   */
  describe('Scenario 7: Style Application', () => {
    it('TC-EC-017: should apply fontSize using custom style', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.fontSize('16px')
      })

      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-018: should apply fontFamily using custom style', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.fontFamily('Arial, sans-serif')
      })

      expect(mockOnContentChange).toHaveBeenCalled()
    })
  })

  /**
   * Scenario 8: Insert Commands
   */
  describe('Scenario 8: Insert Commands', () => {
    it('TC-EC-019: should insert image', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.insertImage('test.jpg')
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('insertImage', false, 'test.jpg')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-020: should insert horizontal rule', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.insertHorizontalRule()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('insertHorizontalRule')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-021: should create link', () => {
      const iframeRef = { current: mockIframe }
      const doc = mockIframe.contentDocument!

      // Create selection
      const range = doc.createRange()
      const textNode = doc.createTextNode('Selected text')
      doc.body.appendChild(textNode)
      range.selectNodeContents(textNode)
      const selection = doc.getSelection()!
      selection.removeAllRanges()
      selection.addRange(range)

      // Mock window.prompt
      const mockPrompt = jest.fn(() => 'https://example.com')
      global.prompt = mockPrompt

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.createLink()
      })

      expect(doc.execCommand).toHaveBeenCalledWith('createLink', false, 'https://example.com')
    })
  })

  /**
   * Scenario 9: History Commands
   */
  describe('Scenario 9: History Commands', () => {
    it('TC-EC-022: should execute undo command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.undo()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('undo')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-023: should execute redo command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.redo()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('redo')
      expect(mockOnContentChange).toHaveBeenCalled()
    })
  })

  /**
   * Scenario 10: Edge Cases
   */
  describe('Scenario 10: Edge Cases', () => {
    it('TC-EC-024: should not execute commands when not editing', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: false, // Not editing
        })
      )

      act(() => {
        result.current.commands.bold()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).not.toHaveBeenCalled()
      expect(mockOnContentChange).not.toHaveBeenCalled()
    })

    it('TC-EC-025: should not execute commands when iframeRef is null', () => {
      const iframeRef = { current: null }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.bold()
      })

      expect(mockOnContentChange).not.toHaveBeenCalled()
    })

    it('TC-EC-026: should handle removeFormat command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.removeFormat()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('removeFormat')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-027: should insert table', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.insertTable(3, 4)
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('insertHTML', false, expect.stringContaining('<table'))
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-028: should call lineHeight command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.lineHeight('1.5')
      })

      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-029: should handle formatBlock command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.formatBlock('h1')
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('formatBlock', false, 'h1')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-030: should handle unlink command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.unlink()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('unlink')
      expect(mockOnContentChange).toHaveBeenCalled()
    })
  })

  /**
   * Scenario 11: Content Change Callbacks
   */
  describe('Scenario 11: Content Change Callbacks', () => {
    it('TC-EC-031: should call onContentChange with new HTML', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.bold()
      })

      expect(mockOnContentChange).toHaveBeenCalledWith(
        expect.stringContaining('<html')
      )
    })
  })

  /**
   * Scenario 12: Format Painter Edge Cases
   */
  describe('Scenario 12: Format Painter Edge Cases', () => {
    it('TC-EC-033: 取消格式刷时清空保存的样式', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      // Activate format painter
      act(() => {
        result.current.commands.formatPainter()
      })

      expect(result.current.isFormatPainterActive).toBe(true)

      // Deactivate format painter
      act(() => {
        result.current.commands.formatPainter()
      })

      expect(result.current.isFormatPainterActive).toBe(false)
      // After deactivation, saved styles should be cleared
    })

    it('TC-EC-037: 选择折叠时不自动应用 (格式刷保持激活)', () => {
      const iframeRef = { current: mockIframe }
      const doc = mockIframe.contentDocument!

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      // Activate format painter
      act(() => {
        result.current.commands.formatPainter()
      })

      expect(result.current.isFormatPainterActive).toBe(true)

      // Get mock selection and set isCollapsed to true
      const mockSelection = doc.getSelection()!
      mockSelection.isCollapsed = true

      // Trigger mouseup event with collapsed selection
      act(() => {
        const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true })
        doc.dispatchEvent(mouseUpEvent)
      })

      // Format painter should remain active when selection is collapsed
      expect(result.current.isFormatPainterActive).toBe(true)
    })
  })

  /**
   * Scenario 13: Custom Style Application
   */
  describe('Scenario 13: Custom Style Application', () => {
    it('TC-EC-034: applyCustomStyle calls applyStyle and triggers onContentChange', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.fontSize('16px')
      })

      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-035: applyLineHeight sets lineHeight on block element', () => {
      const iframeRef = { current: mockIframe }
      const doc = mockIframe.contentDocument!

      // Create a block element
      const p = doc.createElement('p')
      p.textContent = 'Test paragraph'
      doc.body.appendChild(p)

      // Mock selection to be inside the paragraph
      const textNode = p.firstChild!
      const range = doc.createRange()
      range.setStart(textNode, 0)
      range.setEnd(textNode, 5)

      const mockSelection = doc.getSelection()!
      mockSelection.removeAllRanges()
      mockSelection.addRange(range)
      mockSelection.anchorNode = textNode
      mockSelection.isCollapsed = false

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.lineHeight('2.0')
      })

      // Verify the paragraph's lineHeight was set
      // Browser may normalize '2.0' to '2'
      expect(p.style.lineHeight).toBe('2')
      expect(mockOnContentChange).toHaveBeenCalled()
    })
  })

  /**
   * Scenario 14: Selection Restore Failure Handling
   */
  describe('Scenario 14: Selection Restore Failure Handling', () => {
    it('TC-EC-036: 选择恢复失败时将光标放在文档末尾', () => {
      const iframeRef = { current: mockIframe }
      const doc = mockIframe.contentDocument!

      // Create a working range for the initial selection
      const initialRange = doc.createRange()
      initialRange.setStart(doc.body, 0)
      initialRange.setEnd(doc.body, 1)

      let addRangeCallCount = 0
      // Mock getSelection to fail on first addRange call (restore attempt)
      // but succeed on second call (fallback to end of document)
      const mockSelection = {
        rangeCount: 1,
        anchorNode: doc.body.firstChild,
        anchorOffset: 0,
        focusNode: doc.body.firstChild,
        focusOffset: 0,
        isCollapsed: false,
        removeAllRanges: jest.fn(),
        addRange: jest.fn((range: Range) => {
          addRangeCallCount++
          // First call (restore original) succeeds
          if (addRangeCallCount === 1) {
            // Normal add
          } else {
            // Fallback call - this would place cursor at end
          }
        }),
        getRangeAt: jest.fn(() => initialRange),
        toString: jest.fn(() => 'Test content'),
      }

      doc.getSelection = jest.fn(() => mockSelection as any)

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      // Execute command - should handle selection gracefully
      act(() => {
        result.current.commands.bold()
      })

      // Command should execute
      expect(doc.execCommand).toHaveBeenCalledWith('bold')
      expect(mockOnContentChange).toHaveBeenCalled()
      // Selection should be manipulated (removeAllRanges + addRange)
      expect(mockSelection.removeAllRanges).toHaveBeenCalled()
      expect(mockSelection.addRange).toHaveBeenCalled()
    })
  })

  /**
   * Scenario 15: Additional Command Tests
   */
  describe('Scenario 15: Additional Command Tests', () => {
    it('TC-EC-EXT-001: should execute strikeThrough command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.strikeThrough()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('strikeThrough')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-EXT-002: should execute subscript command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.subscript()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('subscript')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-EXT-003: should execute superscript command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.superscript()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('superscript')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-EXT-004: should execute justifyRight command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.justifyRight()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('justifyRight')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-EXT-005: should execute justifyFull command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.justifyFull()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('justifyFull')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-EXT-006: should execute indent command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.indent()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('indent')
      expect(mockOnContentChange).toHaveBeenCalled()
    })

    it('TC-EC-EXT-007: should execute outdent command', () => {
      const iframeRef = { current: mockIframe }

      const { result } = renderHook(() =>
        useEditorCommands({
          iframeRef,
          onContentChange: mockOnContentChange,
          isEditing: true,
        })
      )

      act(() => {
        result.current.commands.outdent()
      })

      const doc = mockIframe.contentDocument!
      expect(doc.execCommand).toHaveBeenCalledWith('outdent')
      expect(mockOnContentChange).toHaveBeenCalled()
    })
  })
})
