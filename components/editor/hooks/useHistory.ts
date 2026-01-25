import { useState, useCallback, useRef } from 'react'
import { FloatingImageItem } from '../FloatingImageLayer'

interface HistoryState {
  html: string
  floatingImages: FloatingImageItem[]
  timestamp: number
}

interface HistoryStore {
  past: HistoryState[]
  present: HistoryState
  future: HistoryState[]
}

/**
 * useHistory Hook - 保留原始实现，稍后进行渐进式重构
 *
 * 注：由于 HistoryManager 的语义与原始实现不同，
 * 暂时保留原始实现，后续统一核心引擎后再迁移
 */
export default function useHistory(initialState: { html: string; floatingImages: FloatingImageItem[] }) {
  const historyRef = useRef<HistoryStore>({
    past: [],
    present: { html: initialState.html, floatingImages: initialState.floatingImages, timestamp: Date.now() },
    future: []
  })

  // Force update to trigger re-renders when history changes (for UI buttons)
  const [, forceUpdate] = useState({})

  const push = useCallback((nextState: { html: string; floatingImages: FloatingImageItem[] }) => {
    const { past, present } = historyRef.current

    // Avoid pushing identical content
    if (present.html === nextState.html &&
        present.floatingImages.length === nextState.floatingImages.length &&
        present.floatingImages.every((img, i) =>
          img.id === nextState.floatingImages[i]?.id &&
          img.src === nextState.floatingImages[i]?.src &&
          img.x === nextState.floatingImages[i]?.x &&
          img.y === nextState.floatingImages[i]?.y &&
          img.width === nextState.floatingImages[i]?.width &&
          img.height === nextState.floatingImages[i]?.height
        )) {
      return
    }

    const newPast = [...past, present]
    if (newPast.length > 50) {
      newPast.shift() // Remove oldest
    }

    historyRef.current = {
      past: newPast,
      present: { html: nextState.html, floatingImages: nextState.floatingImages, timestamp: Date.now() },
      future: []
    }
    forceUpdate({})
  }, [])

  const undo = useCallback(() => {
    const { past, present, future } = historyRef.current
    if (past.length === 0) return null

    const previous = past[past.length - 1]
    const newPast = past.slice(0, past.length - 1)

    historyRef.current = {
      past: newPast,
      present: previous,
      future: [present, ...future]
    }
    forceUpdate({})

    return previous
  }, [])

  const redo = useCallback(() => {
    const { past, present, future } = historyRef.current
    if (future.length === 0) return null

    const next = future[0]
    const newFuture = future.slice(1)

    historyRef.current = {
      past: [...past, present],
      present: next,
      future: newFuture
    }
    forceUpdate({})

    return next
  }, [])

  const reset = useCallback((nextState: { html: string; floatingImages: FloatingImageItem[] }) => {
    historyRef.current = {
      past: [],
      present: { html: nextState.html, floatingImages: nextState.floatingImages, timestamp: Date.now() },
      future: []
    }
    forceUpdate({})
  }, [])

  return {
    push,
    undo,
    redo,
    reset,
    canUndo: historyRef.current.past.length > 0,
    canRedo: historyRef.current.future.length > 0,
    current: historyRef.current.present
  }
}
