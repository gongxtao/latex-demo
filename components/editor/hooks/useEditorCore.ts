/**
 * useEditorCore Hook
 *
 * 整合 CommandManager、StateManager、HistoryManager 的核心 Hook
 * 用于替代原有的 useEditorCommands 和分散的状态管理
 */

'use client'

import { useRef, useCallback, useMemo } from 'react'
import {
  CommandManager,
  StateManager,
  HistoryManager,
  registerBuiltinCommands,
  DEFAULT_STATE
} from '@/lib/editor-core'

export interface UseEditorCoreOptions {
  /** 初始内容 */
  initialContent?: string
  /** 内容变化回调 */
  onContentChange?: (content: string) => void
  /** iframe 引用 */
  iframeRef?: React.RefObject<HTMLIFrameElement | null>
}

export function useEditorCore(options: UseEditorCoreOptions = {}) {
  const { initialContent = '', onContentChange, iframeRef } = options

  // 初始化核心管理器（使用 useRef 保持单例）
  const commandManagerRef = useRef<CommandManager | null>(null)
  const stateManagerRef = useRef<StateManager | null>(null)
  const historyManagerRef = useRef<HistoryManager | null>(null)

  // 初始化命令管理器
  if (!commandManagerRef.current) {
    commandManagerRef.current = new CommandManager()
    registerBuiltinCommands(commandManagerRef.current)
  }

  // 初始化状态管理器
  if (!stateManagerRef.current) {
    stateManagerRef.current = new StateManager({
      content: initialContent,
      isEditing: false
    })
  }

  // 初始化历史管理器
  if (!historyManagerRef.current) {
    historyManagerRef.current = new HistoryManager()
    // 保存初始状态到历史
    historyManagerRef.current.push(stateManagerRef.current.getState())
  }

  const commandManager = commandManagerRef.current
  const stateManager = stateManagerRef.current
  const historyManager = historyManagerRef.current

  // 获取 iframe document
  const getIframeDoc = useCallback(() => {
    return iframeRef?.current?.contentDocument ||
           iframeRef?.current?.contentWindow?.document ||
           null
  }, [iframeRef])

  // 执行命令
  const executeCommand = useCallback((name: string, ...args: any[]) => {
    const doc = getIframeDoc()
    if (!doc) return

    const currentState = stateManager.getState()
    if (!currentState.isEditing) return

    // 保存当前选择
    const selection = doc.getSelection()
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

    // 执行命令
    commandManager.execute(name, doc, ...args)

    // 恢复焦点和选择
    const iframe = iframeRef?.current
    if (iframe) {
      iframe.focus()
    }

    const body = doc.body
    if (body && selection && range) {
      try {
        selection.removeAllRanges()
        selection.addRange(range)
      } catch (e) {
        // 恢复失败，放置光标到末尾
        const newRange = doc.createRange()
        newRange.selectNodeContents(body)
        newRange.collapse(false)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    }

    // 更新内容
    const newContent = doc.documentElement.outerHTML
    stateManager.partialUpdate({ content: newContent })

    // 保存到历史
    historyManager.push(stateManager.getState())

    // 触发回调
    if (onContentChange) {
      onContentChange(newContent)
    }
  }, [getIframeDoc, stateManager, commandManager, historyManager, onContentChange, iframeRef])

  // 查询命令状态
  const queryCommandState = useCallback((name: string): boolean => {
    const doc = getIframeDoc()
    if (!doc) return false
    return commandManager.queryState(name)
  }, [getIframeDoc, commandManager])

  // 查询命令值
  const queryCommandValue = useCallback((name: string): string => {
    const doc = getIframeDoc()
    if (!doc) return ''
    return commandManager.queryValue(name)
  }, [getIframeDoc, commandManager])

  // 撤销
  const undo = useCallback(() => {
    const previousState = historyManager.undo()
    if (previousState) {
      stateManager.setState(previousState)

      // 更新 iframe 内容
      const doc = getIframeDoc()
      if (doc && previousState.content) {
        doc.documentElement.outerHTML = previousState.content
      }

      if (onContentChange) {
        onContentChange(previousState.content)
      }
    }
  }, [historyManager, stateManager, getIframeDoc, onContentChange])

  // 重做
  const redo = useCallback(() => {
    const nextState = historyManager.redo()
    if (nextState) {
      stateManager.setState(nextState)

      // 更新 iframe 内容
      const doc = getIframeDoc()
      if (doc && nextState.content) {
        doc.documentElement.outerHTML = nextState.content
      }

      if (onContentChange) {
        onContentChange(nextState.content)
      }
    }
  }, [historyManager, stateManager, getIframeDoc, onContentChange])

  // 检查是否可以撤销
  const canUndo = useCallback(() => {
    return historyManager.canUndo()
  }, [historyManager])

  // 检查是否可以重做
  const canRedo = useCallback(() => {
    return historyManager.canRedo()
  }, [historyManager])

  // 设置编辑状态
  const setEditing = useCallback((isEditing: boolean) => {
    stateManager.partialUpdate({ isEditing })
  }, [stateManager])

  // 返回核心 API
  return useMemo(() => ({
    // 管理器实例
    commandManager,
    stateManager,
    historyManager,

    // 命令执行
    executeCommand,
    queryCommandState,
    queryCommandValue,

    // 历史操作
    undo,
    redo,
    canUndo,
    canRedo,

    // 状态操作
    getState: () => stateManager.getState(),
    setState: (state: Partial<typeof DEFAULT_STATE>) => stateManager.partialUpdate(state),
    subscribe: (listener: (newState: any, oldState: any) => void) => stateManager.subscribe(listener),

    // 工具函数
    getIframeDoc,
    setEditing
  }), [
    commandManager,
    stateManager,
    historyManager,
    executeCommand,
    queryCommandState,
    queryCommandValue,
    undo,
    redo,
    canUndo,
    canRedo,
    getIframeDoc,
    setEditing
  ])
}
