
import { renderHook, act } from '@testing-library/react'
import { useEditorState } from './useEditorState'
import { createRef } from 'react'

describe('useEditorState', () => {
  let iframeRef: React.RefObject<HTMLIFrameElement>
  let mockDoc: any

  beforeEach(() => {
    // Mock document
    mockDoc = {
      body: document.createElement('body'),
      queryCommandState: jest.fn().mockReturnValue(false),
      queryCommandValue: jest.fn().mockReturnValue(''),
      getSelection: jest.fn().mockReturnValue({
        anchorNode: document.createElement('div'),
        rangeCount: 1,
        isCollapsed: false
      }),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      readyState: 'complete'
    }

    // Mock window for getComputedStyle
    const mockWindow = {
      getComputedStyle: jest.fn().mockReturnValue({
        fontFamily: 'Arial',
        fontSize: '16px'
      })
    }

    // Mock iframe
    const iframe = document.createElement('iframe')
    Object.defineProperty(iframe, 'contentDocument', {
      get: () => mockDoc
    })
    Object.defineProperty(iframe, 'contentWindow', {
      get: () => mockWindow
    })

    iframeRef = { current: iframe }
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useEditorState({ iframeRef }))
    
    expect(result.current.editorState.isBold).toBe(false)
    expect(result.current.editorState.fontName).toBe('Arial')
  })

  it('should update state when checkState is called', () => {
    // Setup mock return values
    mockDoc.queryCommandState.mockImplementation((cmd: string) => {
      if (cmd === 'bold') return true
      return false
    })
    
    const { result } = renderHook(() => useEditorState({ iframeRef }))
    
    act(() => {
      result.current.checkState()
    })
    
    expect(result.current.editorState.isBold).toBe(true)
    expect(result.current.editorState.isItalic).toBe(false)
  })

  it('should detect alignment', () => {
    mockDoc.queryCommandState.mockImplementation((cmd: string) => {
      if (cmd === 'justifyCenter') return true
      return false
    })
    
    const { result } = renderHook(() => useEditorState({ iframeRef }))
    
    act(() => {
      result.current.checkState()
    })
    
    expect(result.current.editorState.align).toBe('center')
  })
})
