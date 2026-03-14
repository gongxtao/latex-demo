import { renderHook, act } from '@testing-library/react'
import { useEditorStorage } from './useEditorStorage'

describe('useEditorStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.restoreAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('clears storage error when save succeeds again', () => {
    const setItemSpy = jest.spyOn(window.localStorage, 'setItem')
    let shouldThrow = true
    setItemSpy.mockImplementation(() => {
      if (shouldThrow) {
        throw new Error('QuotaExceededError')
      }
    })

    const { result } = renderHook(() => useEditorStorage())

    act(() => {
      result.current.setHtmlContent('<p>large-content</p>')
    })
    expect(result.current.hasStorageError).toBe(true)
    expect(result.current.htmlContent).toBe('<p>large-content</p>')
    expect(console.error).toHaveBeenCalled()

    shouldThrow = false
    act(() => {
      result.current.setHtmlContent('<p>small-content</p>')
    })
    expect(result.current.hasStorageError).toBe(false)
  })
})
