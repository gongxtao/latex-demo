import { act, renderHook } from '@testing-library/react'
import type { FloatingImageItem } from '../FloatingImageLayer'
import { useEditablePreviewInteractions } from './useEditablePreviewInteractions'

describe('useEditablePreviewInteractions', () => {
  const setup = () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const iframeDoc = iframe.contentDocument as Document
    ;(iframeDoc as any).execCommand = jest.fn()
    ;(iframeDoc as any).getSelection = jest.fn(() => ({
      rangeCount: 0
    }))
    const iframeRef = { current: iframe } as React.RefObject<HTMLIFrameElement>

    const activeTableRef = { current: null as HTMLTableElement | null }
    const selectedImageRef = { current: null as HTMLImageElement | null }
    const selectedFloatingImageIdRef = { current: 'img-1' as string | null }
    const floatingImagesRef = {
      current: [
        { id: 'img-1', src: 'a', x: 0, y: 0, width: 10, height: 10 },
        { id: 'img-2', src: 'b', x: 0, y: 0, width: 10, height: 10 }
      ] as FloatingImageItem[]
    }
    const canUndoRef = { current: false }
    const canRedoRef = { current: false }

    const setSelectedImage = jest.fn()
    const setActiveTable = jest.fn()
    const handleSelectFloatingImage = jest.fn()
    const onFloatingImagesChange = jest.fn()
    const onFloatingImageDelete = jest.fn()
    const handleUndo = jest.fn()
    const handleRedo = jest.fn()
    const isAtLineEnd = jest.fn().mockReturnValue(false)
    const getCleanHtml = jest.fn().mockReturnValue('<html></html>')
    const debouncedSync = jest.fn()

    return {
      iframeDoc,
      props: {
        iframeRef,
        isEditing: true,
        activeTableRef,
        selectedImageRef,
        selectedFloatingImageIdRef,
        floatingImagesRef,
        canUndoRef,
        canRedoRef,
        setSelectedImage,
        setActiveTable,
        handleSelectFloatingImage,
        onFloatingImagesChange,
        onFloatingImageDelete,
        handleUndo,
        handleRedo,
        isAtLineEnd,
        getCleanHtml,
        debouncedSync
      }
    }
  }

  afterEach(() => {
    document.body.innerHTML = ''
    jest.restoreAllMocks()
  })

  it('deletes selected floating image on Delete key', () => {
    const { iframeDoc, props } = setup()

    renderHook(() => useEditablePreviewInteractions(props))

    act(() => {
      iframeDoc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))
    })

    expect(props.onFloatingImagesChange).toHaveBeenCalledWith([
      { id: 'img-2', src: 'b', x: 0, y: 0, width: 10, height: 10 }
    ])
    expect(props.handleSelectFloatingImage).toHaveBeenCalledWith(null)
    expect(props.onFloatingImageDelete).toHaveBeenCalledWith([
      { id: 'img-2', src: 'b', x: 0, y: 0, width: 10, height: 10 }
    ])
  })

  it('removes listeners on unmount', () => {
    const { iframeDoc, props } = setup()

    const { unmount } = renderHook(() => useEditablePreviewInteractions(props))
    unmount()

    act(() => {
      iframeDoc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }))
    })

    expect(props.onFloatingImagesChange).not.toHaveBeenCalled()
    expect(props.onFloatingImageDelete).not.toHaveBeenCalled()
  })

  it('handles undo shortcut when canUndo is true', () => {
    const { iframeDoc, props } = setup()
    props.selectedFloatingImageIdRef.current = null
    props.canUndoRef.current = true

    renderHook(() => useEditablePreviewInteractions(props))

    act(() => {
      iframeDoc.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }))
    })

    expect(props.handleUndo).toHaveBeenCalled()
    expect((iframeDoc as any).execCommand).not.toHaveBeenCalledWith('undo')
  })

  it('falls back to native undo when canUndo is false', () => {
    const { iframeDoc, props } = setup()
    props.selectedFloatingImageIdRef.current = null
    props.canUndoRef.current = false

    renderHook(() => useEditablePreviewInteractions(props))

    act(() => {
      iframeDoc.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }))
    })

    expect(props.handleUndo).not.toHaveBeenCalled()
    expect((iframeDoc as any).execCommand).toHaveBeenCalledWith('undo')
  })

  it('handles redo shortcut when canRedo is true', () => {
    const { iframeDoc, props } = setup()
    props.selectedFloatingImageIdRef.current = null
    props.canRedoRef.current = true

    renderHook(() => useEditablePreviewInteractions(props))

    act(() => {
      iframeDoc.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true }))
    })

    expect(props.handleRedo).toHaveBeenCalled()
    expect((iframeDoc as any).execCommand).not.toHaveBeenCalledWith('redo')
  })

  it('appends pasted image when selection range is unavailable', () => {
    const { iframeDoc, props } = setup()
    props.selectedFloatingImageIdRef.current = null
    ;(iframeDoc as any).getSelection = jest.fn(() => ({ rangeCount: 0 }))

    const mockReader = {
      readAsDataURL: jest.fn(),
      onload: null as ((event: any) => void) | null
    }
    ;(global as any).FileReader = jest.fn(() => mockReader)

    renderHook(() => useEditablePreviewInteractions(props))

    const file = new File(['x'], 'a.png', { type: 'image/png' })
    const pasteEvent = new Event('paste', { bubbles: true }) as ClipboardEvent
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        items: [
          {
            type: 'image/png',
            getAsFile: () => file
          }
        ]
      }
    })

    act(() => {
      iframeDoc.dispatchEvent(pasteEvent)
    })
    act(() => {
      mockReader.onload?.({ target: { result: 'data:image/png;base64,abc' } })
    })

    expect(mockReader.readAsDataURL).toHaveBeenCalledWith(file)
    expect(iframeDoc.body.querySelectorAll('img').length).toBe(1)
    expect(props.debouncedSync).toHaveBeenCalledWith('<html></html>')
  })

  it('inserts line break and syncs content on Enter', () => {
    const { iframeDoc, props } = setup()
    props.selectedFloatingImageIdRef.current = null
    props.isAtLineEnd.mockReturnValue(true)

    const range = {
      startContainer: document.createTextNode('hello'),
      endContainer: document.createTextNode('hello'),
      endOffset: 5,
      deleteContents: jest.fn(),
      insertNode: jest.fn(),
      setStartAfter: jest.fn(),
      setEndAfter: jest.fn()
    }
    const selection = {
      rangeCount: 1,
      getRangeAt: jest.fn(() => range),
      removeAllRanges: jest.fn(),
      addRange: jest.fn()
    }
    ;(iframeDoc as any).getSelection = jest.fn(() => selection)

    renderHook(() => useEditablePreviewInteractions(props))

    act(() => {
      iframeDoc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    expect(props.isAtLineEnd).toHaveBeenCalledWith(range)
    expect(range.insertNode).toHaveBeenCalledTimes(1)
    expect(selection.removeAllRanges).toHaveBeenCalled()
    expect(selection.addRange).toHaveBeenCalledWith(range)
    expect(props.debouncedSync).toHaveBeenCalledWith('<html></html>')
  })

  it('creates a caret at body end when Enter is pressed without existing range', () => {
    const { iframeDoc, props } = setup()
    props.selectedFloatingImageIdRef.current = null

    const text = iframeDoc.createTextNode('hello')
    iframeDoc.body.appendChild(text)

    const createdRange = iframeDoc.createRange()
    const selection = {
      rangeCount: 0,
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
      getRangeAt: jest.fn(() => createdRange)
    }
    ;(iframeDoc as any).getSelection = jest.fn(() => selection)

    renderHook(() => useEditablePreviewInteractions(props))

    act(() => {
      iframeDoc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    expect(selection.removeAllRanges).toHaveBeenCalled()
    expect(selection.addRange).toHaveBeenCalled()
    expect(props.debouncedSync).toHaveBeenCalledWith('<html></html>')
  })

  it('ignores non-image paste items', () => {
    const { iframeDoc, props } = setup()
    props.selectedFloatingImageIdRef.current = null
    const fileReaderSpy = jest.fn()
    ;(global as any).FileReader = fileReaderSpy

    renderHook(() => useEditablePreviewInteractions(props))

    const pasteEvent = new Event('paste', { bubbles: true }) as ClipboardEvent
    const preventDefault = jest.fn()
    Object.defineProperty(pasteEvent, 'preventDefault', { value: preventDefault })
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: {
        items: [
          {
            type: 'text/plain',
            getAsFile: () => null
          }
        ]
      }
    })

    act(() => {
      iframeDoc.dispatchEvent(pasteEvent)
    })

    expect(preventDefault).not.toHaveBeenCalled()
    expect(fileReaderSpy).not.toHaveBeenCalled()
    expect(props.debouncedSync).not.toHaveBeenCalled()
  })

  it('uses native enter behavior inside list items and still syncs content', () => {
    jest.useFakeTimers()
    const { iframeDoc, props } = setup()
    props.selectedFloatingImageIdRef.current = null

    const list = iframeDoc.createElement('ul')
    const item = iframeDoc.createElement('li')
    item.textContent = 'list item'
    list.appendChild(item)
    iframeDoc.body.appendChild(list)

    const range = iframeDoc.createRange()
    range.setStart(item.firstChild as Text, 4)
    range.collapse(true)
    const selection = {
      rangeCount: 1,
      getRangeAt: jest.fn(() => range),
      removeAllRanges: jest.fn(),
      addRange: jest.fn()
    }
    ;(iframeDoc as any).getSelection = jest.fn(() => selection)

    renderHook(() => useEditablePreviewInteractions(props))

    act(() => {
      iframeDoc.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      jest.runAllTimers()
    })

    expect(props.isAtLineEnd).not.toHaveBeenCalled()
    expect(props.debouncedSync).toHaveBeenCalledWith('<html></html>')
    jest.useRealTimers()
  })
})
