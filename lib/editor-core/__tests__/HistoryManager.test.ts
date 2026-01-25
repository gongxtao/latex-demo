/**
 * HistoryManager Unit Tests
 */

import { HistoryManager } from '../history/HistoryManager'
import type { EditorState } from '../types'

describe('HistoryManager', () => {
  let manager: HistoryManager

  beforeEach(() => {
    manager = new HistoryManager(10)
  })

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

  describe('History Management', () => {
    it('should push state to history', () => {
      const state = createMockState('<p>State 1</p>')
      manager.push(state)

      // Need at least 2 states to undo
      expect(manager.canUndo()).toBe(false)
      expect(manager.canRedo()).toBe(false)
      expect(manager.getStats().past).toBe(1)
    })

    it('should push multiple states', () => {
      manager.push(createMockState('<p>State 1</p>'))
      manager.push(createMockState('<p>State 2</p>'))
      manager.push(createMockState('<p>State 3</p>'))

      const stats = manager.getStats()
      expect(stats.past).toBe(3)
    })

    it('should respect max size limit', () => {
      const smallManager = new HistoryManager(3)

      smallManager.push(createMockState('<p>1</p>'))
      smallManager.push(createMockState('<p>2</p>'))
      smallManager.push(createMockState('<p>3</p>'))
      smallManager.push(createMockState('<p>4</p>'))

      const stats = smallManager.getStats()
      expect(stats.past).toBe(3) // Should be capped at 3
    })
  })

  describe('Undo Operations', () => {
    it('should undo to previous state', () => {
      manager.push(createMockState('<p>State 1</p>'))
      manager.push(createMockState('<p>State 2</p>'))

      const previous = manager.undo()

      expect(previous).not.toBeNull()
      expect(previous!.content).toBe('<p>State 1</p>')
      expect(manager.canUndo()).toBe(false) // Only one state left
      expect(manager.canRedo()).toBe(true)
    })

    it('should return null when no history to undo', () => {
      const result = manager.undo()
      expect(result).toBeNull()
    })

    it('should support multiple undos', () => {
      manager.push(createMockState('<p>1</p>'))
      manager.push(createMockState('<p>2</p>'))
      manager.push(createMockState('<p>3</p>'))

      expect(manager.undo()?.content).toBe('<p>2</p>')
      expect(manager.undo()?.content).toBe('<p>1</p>')
      expect(manager.undo()).toBeNull()
    })
  })

  describe('Redo Operations', () => {
    it('should redo after undo', () => {
      manager.push(createMockState('<p>State 1</p>'))
      manager.push(createMockState('<p>State 2</p>'))

      manager.undo()
      const next = manager.redo()

      expect(next).not.toBeNull()
      expect(next!.content).toBe('<p>State 2</p>')
      expect(manager.canRedo()).toBe(false)
      expect(manager.canUndo()).toBe(true)
    })

    it('should return null when no history to redo', () => {
      const result = manager.redo()
      expect(result).toBeNull()
    })

    it('should clear redo history on new state', () => {
      manager.push(createMockState('<p>1</p>'))
      manager.push(createMockState('<p>2</p>'))

      manager.undo()
      expect(manager.canRedo()).toBe(true)

      // Push new state clears redo
      manager.push(createMockState('<p>3</p>'))
      expect(manager.canRedo()).toBe(false)
    })
  })

  describe('History Clear', () => {
    it('should clear all history', () => {
      manager.push(createMockState('<p>1</p>'))
      manager.push(createMockState('<p>2</p>'))
      manager.undo()

      manager.clear()

      expect(manager.canUndo()).toBe(false)
      expect(manager.canRedo()).toBe(false)
      expect(manager.getStats().past).toBe(0)
      expect(manager.getStats().future).toBe(0)
    })
  })

  describe('Max Size Management', () => {
    it('should update max size', () => {
      manager.setMaxSize(5)

      for (let i = 0; i < 10; i++) {
        manager.push(createMockState(`<p>${i}</p>`))
      }

      const stats = manager.getStats()
      expect(stats.past).toBe(5)
      expect(stats.maxSize).toBe(5)
    })

    it('should truncate existing history when reducing max size', () => {
      for (let i = 0; i < 10; i++) {
        manager.push(createMockState(`<p>${i}</p>`))
      }

      expect(manager.getStats().past).toBe(10)

      manager.setMaxSize(3)

      expect(manager.getStats().past).toBe(3)
    })
  })

  describe('Enabled State', () => {
    it('should respect enabled state', () => {
      manager.setEnabled(false)

      manager.push(createMockState('<p>1</p>'))

      expect(manager.getStats().past).toBe(0)
      expect(manager.canUndo()).toBe(false)
    })

    it('should toggle enabled state', () => {
      expect(manager.isEnabled()).toBe(true)

      manager.setEnabled(false)
      expect(manager.isEnabled()).toBe(false)

      manager.setEnabled(true)
      expect(manager.isEnabled()).toBe(true)
    })
  })

  describe('State Immutability', () => {
    it('should not mutate original state objects', () => {
      const originalState = createMockState('<p>Original</p>')
      manager.push(originalState)

      // Modify the original object
      originalState.content = '<p>Modified</p>'

      // The stored state should remain unchanged
      const retrieved = manager.undo()
      expect(retrieved).toBeNull() // Only one state, can't undo
    })

    it('should return copies of states', () => {
      manager.push(createMockState('<p>1</p>'))
      manager.push(createMockState('<p>2</p>'))

      const state1 = manager.undo()
      state1!.content = '<p>Modified</p>'

      // Redo should still return the original state
      const state2 = manager.redo()
      expect(state2!.content).toBe('<p>2</p>')
    })
  })

  describe('Statistics', () => {
    it('should return accurate statistics', () => {
      manager.push(createMockState('<p>1</p>'))
      manager.push(createMockState('<p>2</p>'))
      manager.push(createMockState('<p>3</p>'))

      manager.undo()

      const stats = manager.getStats()
      expect(stats.past).toBe(2)
      expect(stats.future).toBe(1)
      expect(stats.maxSize).toBe(10)
      expect(stats.enabled).toBe(true)
    })
  })
})
