/**
 * StateManager Unit Tests
 */

import { StateManager, DEFAULT_STATE } from '../state/StateManager'
import type { EditorState } from '../types'

describe('StateManager', () => {
  let manager: StateManager

  beforeEach(() => {
    manager = new StateManager()
  })

  describe('State Initialization', () => {
    it('should initialize with default state', () => {
      const state = manager.getState()

      expect(state).toEqual(DEFAULT_STATE)
    })

    it('should initialize with custom state', () => {
      const customState = {
        content: '<p>Hello</p>',
        isEditing: true
      }
      const managerWithCustom = new StateManager(customState)
      const state = managerWithCustom.getState()

      expect(state.content).toBe('<p>Hello</p>')
      expect(state.isEditing).toBe(true)
    })
  })

  describe('State Updates', () => {
    it('should update state with object', () => {
      const newState: Partial<EditorState> = {
        content: '<p>New content</p>',
        isEditing: true
      }

      manager.setState(newState)

      expect(manager.getState().content).toBe('<p>New content</p>')
      expect(manager.getState().isEditing).toBe(true)
    })

    it('should update state with function', () => {
      manager.partialUpdate({ content: '<p>Original</p>' })

      manager.setState((current) => ({
        ...current,
        content: '<p>Updated</p>'
      }))

      expect(manager.getState().content).toBe('<p>Updated</p>')
    })

    it('should support partial updates', () => {
      manager.partialUpdate({
        isEditing: true,
        toolbarVisible: false
      })

      expect(manager.getState().isEditing).toBe(true)
      expect(manager.getState().toolbarVisible).toBe(false)
      // Other fields should remain unchanged
      expect(manager.getState().content).toBe('')
    })
  })

  describe('State Subscriptions', () => {
    it('should notify listeners on state change', () => {
      const listener = jest.fn()
      manager.subscribe(listener)

      manager.partialUpdate({ content: '<p>Changed</p>' })

      expect(listener).toHaveBeenCalledTimes(1)
      const [newState, oldState] = listener.mock.calls[0]
      expect(newState.content).toBe('<p>Changed</p>')
      expect(oldState.content).toBe('')
    })

    it('should return unsubscribe function', () => {
      const listener = jest.fn()
      const unsubscribe = manager.subscribe(listener)

      unsubscribe()

      manager.partialUpdate({ content: '<p>Changed</p>' })

      expect(listener).not.toHaveBeenCalled()
    })

    it('should support multiple listeners', () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()
      const listener3 = jest.fn()

      manager.subscribe(listener1)
      manager.subscribe(listener2)
      manager.subscribe(listener3)

      manager.partialUpdate({ content: '<p>Changed</p>' })

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
      expect(listener3).toHaveBeenCalledTimes(1)
    })

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error')
      })
      const normalListener = jest.fn()

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      manager.subscribe(errorListener)
      manager.subscribe(normalListener)

      expect(() => {
        manager.partialUpdate({ content: '<p>Changed</p>' })
      }).not.toThrow()

      expect(normalListener).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in state listener:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Batch Updates', () => {
    it('should batch multiple state updates', () => {
      const listener = jest.fn()

      manager.subscribe(listener)

      manager.beginBatch()
      manager.partialUpdate({ content: '<p>Step 1</p>' })
      manager.partialUpdate({ content: '<p>Step 2</p>' })
      manager.partialUpdate({ content: '<p>Step 3</p>' })
      manager.endBatch()

      // Listener should only be called once with the final state
      expect(listener).toHaveBeenCalledTimes(1)
      const [newState] = listener.mock.calls[0]
      expect(newState.content).toBe('<p>Step 3</p>')
    })

    it('should support nested batch updates', () => {
      const listener = jest.fn()
      manager.subscribe(listener)

      manager.beginBatch()
      manager.partialUpdate({ content: '<p>Batch 1</p>' })

      manager.beginBatch()
      manager.partialUpdate({ content: '<p>Batch 2</p>' })
      manager.endBatch()

      manager.endBatch()

      // Should only notify once
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('State Reset', () => {
    it('should reset to default state', () => {
      manager.partialUpdate({
        content: '<p>Custom</p>',
        isEditing: true,
        toolbarVisible: false
      })

      manager.reset()

      expect(manager.getState()).toEqual(DEFAULT_STATE)
    })

    it('should notify listeners on reset', () => {
      const listener = jest.fn()
      manager.subscribe(listener)

      manager.partialUpdate({ content: '<p>Changed</p>' })
      listener.mockClear() // Clear calls from partialUpdate

      manager.reset()

      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('Listener Management', () => {
    it('should report listener count', () => {
      expect(manager.getListenerCount()).toBe(0)

      const unsub1 = manager.subscribe(jest.fn())
      expect(manager.getListenerCount()).toBe(1)

      const unsub2 = manager.subscribe(jest.fn())
      expect(manager.getListenerCount()).toBe(2)

      unsub1()
      expect(manager.getListenerCount()).toBe(1)

      unsub2()
      expect(manager.getListenerCount()).toBe(0)
    })
  })
})
