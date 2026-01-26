import { useState, useCallback, useMemo, useRef } from 'react'
import { HistoryManager } from '@/lib/editor-core'
import type { EditorState } from '@/lib/editor-core'
import { FloatingImageItem } from '../FloatingImageLayer'

interface HistoryState {
  html: string
  floatingImages: FloatingImageItem[]
  timestamp: number
}

/**
 * 将 hook 的状态格式转换为 EditorState 格式
 */
function toEditorState(state: HistoryState): EditorState {
  return {
    content: state.html,
    floatingImages: state.floatingImages,
    isEditing: false,
    readonly: false,
    selection: null,
    selectedImage: null,
    selectedFloatingImageId: null,
    activeTable: null,
    toolbarVisible: true,
    sidebarVisible: false
  }
}

/**
 * 将 EditorState 格式转换回 hook 的状态格式
 */
function fromEditorState(state: EditorState): HistoryState {
  return {
    html: state.content,
    floatingImages: state.floatingImages,
    timestamp: Date.now()
  }
}

/**
 * 比较两个 HistoryState 是否相等（用于避免重复 push）
 */
function isStateEqual(a: HistoryState, b: HistoryState): boolean {
  return (
    a.html === b.html &&
    a.floatingImages.length === b.floatingImages.length &&
    a.floatingImages.every((img, i) =>
      img.id === b.floatingImages[i]?.id &&
      img.src === b.floatingImages[i]?.src &&
      img.x === b.floatingImages[i]?.x &&
      img.y === b.floatingImages[i]?.y &&
      img.width === b.floatingImages[i]?.width &&
      img.height === b.floatingImages[i]?.height
    )
  )
}

/**
 * useHistory Hook - 已迁移到使用 HistoryManager
 *
 * 使用新的核心引擎进行历史管理，同时保持原有 API 不变
 */
export default function useHistory(initialState: { html: string; floatingImages: FloatingImageItem[] }) {
  // 使用 useRef 保持 HistoryManager 实例在重新渲染之间保持不变
  const managerRef = useRef<HistoryManager | null>(null)

  // 创建并初始化 HistoryManager
  if (!managerRef.current) {
    managerRef.current = new HistoryManager(50)
    const initialEditorState = toEditorState({
      html: initialState.html,
      floatingImages: initialState.floatingImages,
      timestamp: Date.now()
    })
    managerRef.current.initialize(initialEditorState)
  }

  // Force update to trigger re-renders when history changes
  const [, forceUpdate] = useState({})

  const push = useCallback((nextState: { html: string; floatingImages: FloatingImageItem[] }) => {
    const manager = managerRef.current
    if (!manager) return

    const current = manager.getCurrentState()
    if (!current) return

    // 转换当前状态为 hook 格式进行比较
    const currentHookState: HistoryState = {
      html: current.content,
      floatingImages: current.floatingImages,
      timestamp: Date.now()
    }

    // 避免推送相同内容
    if (isStateEqual(currentHookState, nextState)) {
      return
    }

    const nextEditorState = toEditorState({
      html: nextState.html,
      floatingImages: nextState.floatingImages,
      timestamp: Date.now()
    })

    manager.push(nextEditorState)
    forceUpdate({})
  }, [])

  const undo = useCallback(() => {
    const manager = managerRef.current
    if (!manager) return null

    const previous = manager.undo()
    if (!previous) return null

    forceUpdate({})
    return fromEditorState(previous)
  }, [])

  const redo = useCallback(() => {
    const manager = managerRef.current
    if (!manager) return null

    const next = manager.redo()
    if (!next) return null

    forceUpdate({})
    return fromEditorState(next)
  }, [])

  const reset = useCallback((nextState: { html: string; floatingImages: FloatingImageItem[] }) => {
    const manager = managerRef.current
    if (!manager) return

    const nextEditorState = toEditorState({
      html: nextState.html,
      floatingImages: nextState.floatingImages,
      timestamp: Date.now()
    })
    manager.reset(nextEditorState)
    forceUpdate({})
  }, [])

  const current = (() => {
    const manager = managerRef.current
    if (!manager) return null
    const state = manager.getCurrentState()
    return state ? fromEditorState(state) : null
  })()

  return {
    push,
    undo,
    redo,
    reset,
    canUndo: managerRef.current?.canUndo() ?? false,
    canRedo: managerRef.current?.canRedo() ?? false,
    current
  }
}
