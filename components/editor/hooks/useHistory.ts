import { useState, useCallback, useRef } from 'react'

interface HistoryState {
  html: string
  timestamp: number
}

interface HistoryStore {
  past: HistoryState[]
  present: HistoryState
  future: HistoryState[]
}

export default function useHistory(initialContent: string) {
  const historyRef = useRef<HistoryStore>({
    past: [],
    present: { html: initialContent, timestamp: Date.now() },
    future: []
  })
  
  // Force update to trigger re-renders when history changes (for UI buttons)
  const [, forceUpdate] = useState({})

  const push = useCallback((newHtml: string) => {
    const { past, present } = historyRef.current
    
    // Avoid pushing identical content
    if (present.html === newHtml) return

    const newPast = [...past, present]
    if (newPast.length > 50) {
      newPast.shift() // Remove oldest
    }

    historyRef.current = {
      past: newPast,
      present: { html: newHtml, timestamp: Date.now() },
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
    
    return previous.html
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

    return next.html
  }, [])

  const reset = useCallback((content: string) => {
    historyRef.current = {
      past: [],
      present: { html: content, timestamp: Date.now() },
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
    current: historyRef.current.present.html
  }
}
