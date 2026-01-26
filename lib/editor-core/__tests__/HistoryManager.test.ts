/**
 * HistoryManager Unit Tests
 * 重新设计后的 HistoryManager 测试
 */

import { HistoryManager } from '../history/HistoryManager'
import type { EditorState } from '../types'

describe('HistoryManager (Redesigned)', () => {
  let manager: HistoryManager

  const createMockState = (content: string): EditorState => ({
    isEditing: false,
    readonly: false,
    selection: null,
    selectedImage: null,
    selectedFloatingImageId: null,
    activeTable: null,
    content,
    floatingImages: [],
    toolbarVisible: true,
    sidebarVisible: false
  })

  beforeEach(() => {
    manager = new HistoryManager(50)
  })

  describe('Initialization', () => {
    it('should initialize with state', () => {
      const state = createMockState('<p>Initial</p>')
      manager.initialize(state)

      expect(manager.getCurrentState()).toEqual(state)
      expect(manager.canUndo()).toBe(false)
      expect(manager.canRedo()).toBe(false)
    })

    it('should be empty before initialization', () => {
      expect(manager.getCurrentState()).toBeNull()
      expect(manager.canUndo()).toBe(false)
      expect(manager.canRedo()).toBe(false)
    })
  })

  describe('Push Operation', () => {
    it('should push first state as present', () => {
      const state = createMockState('<p>State 1</p>')
      manager.push(state)

      expect(manager.getCurrentState()).toEqual(state)
      expect(manager.canUndo()).toBe(false) // past is empty
      expect(manager.canRedo()).toBe(false)
    })

    it('should push second state and move first to past', () => {
      const state1 = createMockState('<p>State 1</p>')
      const state2 = createMockState('<p>State 2</p>')

      manager.push(state1)
      manager.push(state2)

      expect(manager.getCurrentState()).toEqual(state2)
      expect(manager.canUndo()).toBe(true) // has 1 item in past
      expect(manager.canRedo()).toBe(false)

      const stats = manager.getStats()
      expect(stats.past).toBe(1)
      expect(stats.future).toBe(0)
    })

    it('should clear future on push', () => {
      const state1 = createMockState('<p>State 1</p>')
      const state2 = createMockState('<p>State 2</p>')
      const state3 = createMockState('<p>State 3</p>')

      manager.push(state1)
      manager.push(state2)
      expect(manager.canRedo()).toBe(false)

      manager.undo()
      expect(manager.canRedo()).toBe(true) // has 1 item in future

      manager.push(state3)
      expect(manager.canRedo()).toBe(false) // future cleared
    })
  })

  describe('Undo Operation', () => {
    it('should undo correctly', () => {
      const state1 = createMockState('<p>State 1</p>')
      const state2 = createMockState('<p>State 2</p>')
      const state3 = createMockState('<p>State 3</p>')

      manager.push(state1)
      manager.push(state2)
      manager.push(state3)

      expect(manager.getCurrentState()).toEqual(state3)

      const undo1 = manager.undo()
      expect(undo1).toEqual(state2)
      expect(manager.getCurrentState()).toEqual(state2)
      expect(manager.canUndo()).toBe(true) // 1 item in past
      expect(manager.canRedo()).toBe(true) // 1 item in future

      const undo2 = manager.undo()
      expect(undo2).toEqual(state1)
      expect(manager.getCurrentState()).toEqual(state1)
      expect(manager.canUndo()).toBe(false)
      expect(manager.canRedo()).toBe(true) // 2 items in future
    })

    it('should return null when cannot undo', () => {
      const state = createMockState('<p>Only one</p>')
      manager.push(state)

      const result = manager.undo()
      expect(result).toBeNull()
      expect(manager.getCurrentState()).toEqual(state)
    })
  })

  describe('Redo Operation', () => {
    it('should redo correctly', () => {
      const state1 = createMockState('<p>State 1</p>')
      const state2 = createMockState('<p>State 2</p>')

      manager.push(state1)
      manager.push(state2)
      manager.undo()

      expect(manager.getCurrentState()).toEqual(state1)

      const redoResult = manager.redo()
      expect(redoResult).toEqual(state2)
      expect(manager.getCurrentState()).toEqual(state2)
      expect(manager.canUndo()).toBe(true)
      expect(manager.canRedo()).toBe(false)
    })

    it('should return null when cannot redo', () => {
      const state = createMockState('<p>Only one</p>')
      manager.push(state)

      const result = manager.redo()
      expect(result).toBeNull()
      expect(manager.getCurrentState()).toEqual(state)
    })
  })

  describe('Max Size Limit', () => {
    it('should limit history size', () => {
      const smallManager = new HistoryManager(3)

      for (let i = 1; i <= 5; i++) {
        smallManager.push(createMockState(`<p>${i}</p>`))
      }

      const stats = smallManager.getStats()
      // Should have 3 items in past (max limit)
      // The 4th and 5th items should have been dropped
      // Plus 1 present, so total 4 states tracked (3 in past + 1 present)
      // But since we push and it moves present to past, we have:
      // After 1 push: past=[], present=state1
      // After 2 pushes: past=[state1], present=state2
      // After 3 pushes: past=[state1,state2], present=state3
      // After 4 pushes: past=[state1,state2,state3], present=state4 (state1 dropped)
      // After 5 pushes: past=[state2,state3,state4], present=state5 (state1 dropped again)
      // Final: past has 3 items (state2,state3,state4), present=state5
      expect(stats.past).toBe(3)
      expect(smallManager.getCurrentState()?.content).toBe('<p>5</p>')
    })
  })

  describe('Clear and Reset', () => {
    it('should clear all history', () => {
      const state = createMockState('<p>Test</p>')
      manager.push(state)
      manager.undo()

      manager.clear()

      expect(manager.getCurrentState()).toBeNull()
      expect(manager.canUndo()).toBe(false)
      expect(manager.canRedo()).toBe(false)
      expect(manager.getStats().past).toBe(0)
    })

    it('should reset to new state', () => {
      const state1 = createMockState('<p>Old</p>')
      const state2 = createMockState('<p>New</p>')

      manager.push(state1)
      manager.push(state2)
      manager.undo()

      manager.reset(state2)

      expect(manager.getCurrentState()).toEqual(state2)
      expect(manager.canUndo()).toBe(false)
      expect(manager.canRedo()).toBe(false)
    })
  })

  describe('Enable/Disable', () => {
    it('should respect disabled state', () => {
      const state = createMockState('<p>Test</p>')

      manager.setEnabled(false)
      manager.push(state)

      expect(manager.getStats().enabled).toBe(false)
      // Even after push, past should be empty since disabled
      expect(manager.getStats().past).toBe(0)
    })

    it('should toggle enabled state', () => {
      expect(manager.isEnabled()).toBe(true)

      manager.setEnabled(false)
      expect(manager.isEnabled()).toBe(false)

      manager.setEnabled(true)
      expect(manager.isEnabled()).toBe(true)
    })
  })
})
