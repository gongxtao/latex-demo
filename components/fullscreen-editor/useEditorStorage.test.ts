import { renderHook, act } from '@testing-library/react'
import { useEditorStorage } from './useEditorStorage'

describe('useEditorStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.restoreAllMocks()
  })

  it('handles quota errors without throwing when saving content', () => {
    const setItemSpy = jest.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    const { result } = renderHook(() => useEditorStorage())

    expect(() => {
      act(() => {
        result.current.setHtmlContent('<p>large-content</p>')
      })
    }).not.toThrow()

    expect(setItemSpy).toHaveBeenCalled()
    expect(result.current.hasStorageError).toBe(true)
    expect(result.current.htmlContent).toBe('<p>large-content</p>')
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

    shouldThrow = false
    act(() => {
      result.current.setHtmlContent('<p>small-content</p>')
    })
    expect(result.current.hasStorageError).toBe(false)
  })
})
