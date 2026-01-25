/**
 * HistoryManager - 编辑器历史管理器
 *
 * 负责管理编辑器的撤销/重做历史
 */

import type { EditorState } from '../types'

/**
 * 历史项
 */
interface HistoryItem {
  state: EditorState
  timestamp: number
}

/**
 * 历史管理器类
 */
export class HistoryManager {
  private past: HistoryItem[] = []
  private future: HistoryItem[] = []
  private maxSize: number
  private enabled: boolean = true

  constructor(maxSize = 100) {
    this.maxSize = maxSize
  }

  /**
   * 保存当前状态到历史
   * @param state 当前状态
   */
  push(state: EditorState): void {
    if (!this.enabled) return

    // 深拷贝状态
    const stateCopy: EditorState = JSON.parse(JSON.stringify(state))

    this.past.push({
      state: stateCopy,
      timestamp: Date.now()
    })

    // 限制历史大小
    if (this.past.length > this.maxSize) {
      this.past.shift()
    }

    // 清空 redo 历史
    this.future = []
  }

  /**
   * 撤销
   * @returns 撤销后的状态，如果没有可撤销的历史则返回 null
   */
  undo(): EditorState | null {
    if (!this.enabled || this.past.length <= 1) return null

    // 取出当前状态
    const current = this.past.pop()!
    // 放入 future
    this.future.push(current)

    // 返回上一个状态
    const previous = this.past[this.past.length - 1]
    return previous ? JSON.parse(JSON.stringify(previous.state)) : null
  }

  /**
   * 重做
   * @returns 重做后的状态，如果没有可重做的历史则返回 null
   */
  redo(): EditorState | null {
    if (!this.enabled || this.future.length === 0) return null

    // 取出要重做的状态
    const next = this.future.pop()!

    // 放入 past
    this.past.push(next)

    return JSON.parse(JSON.stringify(next.state))
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.enabled && this.past.length > 1
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.enabled && this.future.length > 0
  }

  /**
   * 清空所有历史
   */
  clear(): void {
    this.past = []
    this.future = []
  }

  /**
   * 设置历史最大大小
   * @param size 最大历史条数
   */
  setMaxSize(size: number): void {
    this.maxSize = size
    // 如果当前历史超过新的大小，截断
    while (this.past.length > size) {
      this.past.shift()
    }
  }

  /**
   * 启用/禁用历史记录
   * @param enabled 是否启用
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * 检查历史记录是否启用
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * 获取历史统计信息
   */
  getStats() {
    return {
      past: this.past.length,
      future: this.future.length,
      maxSize: this.maxSize,
      enabled: this.enabled
    }
  }
}
