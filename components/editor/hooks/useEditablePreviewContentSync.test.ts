import { renderHook, act } from '@testing-library/react'
import { useEditablePreviewContentSync } from './useEditablePreviewContentSync'

describe('useEditablePreviewContentSync', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const createIframeRef = () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const iframeDoc = iframe.contentDocument as Document
    ;(iframeDoc as any).execCommand = jest.fn()
    ;(iframeDoc as any).open = jest.fn()
    ;(iframeDoc as any).write = jest.fn()
    ;(iframeDoc as any).close = jest.fn()
    return { iframe, iframeDoc, iframeRef: { current: iframe } as React.RefObject<HTMLIFrameElement> }
  }

  const createBaseArgs = (overrides: Partial<Parameters<typeof useEditablePreviewContentSync>[0]> = {}) => {
    const { iframeDoc, iframeRef } = createIframeRef()
    const args: Parameters<typeof useEditablePreviewContentSync>[0] = {
      iframeRef,
      content: '<html><body>new</body></html>',
      isEditing: false,
      isUpdatingRef: { current: false },
      forceContentSyncRef: { current: true },
      lastSyncedContentRef: { current: '<html><body>old</body></html>' },
      isInitialLoadRef: { current: true },
      scrollPositionRef: { current: { x: 0, y: 0 } },
      restoreStateTimeoutRef: { current: null },
      saveSelection: jest.fn(),
      restoreSelection: jest.fn(),
      debouncedSync: { cancel: jest.fn(), flush: jest.fn() },
      setIframeBody: jest.fn(),
      handleInput: jest.fn(),
      editorStyleCss: 'body{}',
      ...overrides
    }
    return { iframeDoc, args }
  }

  afterEach(() => {
    document.body.innerHTML = ''
    jest.restoreAllMocks()
  })

  it('writes iframe content when force sync is enabled', () => {
    const { iframeDoc, args } = createBaseArgs()

    renderHook(() =>
      useEditablePreviewContentSync(args)
    )

    expect(args.debouncedSync.cancel).toHaveBeenCalled()
    expect(iframeDoc.open).toHaveBeenCalled()
    expect(iframeDoc.write).toHaveBeenCalledTimes(2)
    expect((iframeDoc.write as jest.Mock).mock.calls[0][0]).toBe('<html><body>new</body></html>')
    expect((iframeDoc.write as jest.Mock).mock.calls[1][0]).toContain('image-resizer-root')
    expect(iframeDoc.close).toHaveBeenCalled()
    expect(args.setIframeBody).toHaveBeenCalled()
    expect(args.lastSyncedContentRef.current).toBe('<html><body>new</body></html>')
  })

  it('binds input and blur handlers in editing mode', () => {
    const { iframeDoc, args } = createBaseArgs({
      isEditing: true,
      lastSyncedContentRef: { current: '' }
    })

    renderHook(() =>
      useEditablePreviewContentSync({
        ...args,
        content: '<html><body><p>a</p></body></html>'
      })
    )

    act(() => {
      iframeDoc.body.dispatchEvent(new Event('input', { bubbles: true }))
      iframeDoc.body.dispatchEvent(new Event('blur', { bubbles: true }))
    })

    expect(args.handleInput).toHaveBeenCalled()
    expect(args.debouncedSync.flush).toHaveBeenCalled()
  })

  it('skips write when content is already synced and iframe is not empty', () => {
    const { iframeDoc, args } = createBaseArgs({
      forceContentSyncRef: { current: false },
      lastSyncedContentRef: { current: '<html><body>new</body></html>' }
    })
    iframeDoc.body.appendChild(document.createElement('div'))

    renderHook(() => useEditablePreviewContentSync(args))

    expect(iframeDoc.open).not.toHaveBeenCalled()
    expect(args.debouncedSync.cancel).not.toHaveBeenCalled()
  })

  it('saves and restores selection for non-initial editing updates', () => {
    const { args } = createBaseArgs({
      isEditing: true,
      isInitialLoadRef: { current: false }
    })

    renderHook(() => useEditablePreviewContentSync(args))

    expect(args.saveSelection).toHaveBeenCalled()
    act(() => {
      jest.runAllTimers()
    })
    expect(args.restoreSelection).toHaveBeenCalled()
  })

  it('skips all work when update lock is active', () => {
    const { iframeDoc, args } = createBaseArgs({
      isUpdatingRef: { current: true }
    })

    renderHook(() => useEditablePreviewContentSync(args))

    expect(iframeDoc.open).not.toHaveBeenCalled()
    expect(args.debouncedSync.cancel).not.toHaveBeenCalled()
  })
})
