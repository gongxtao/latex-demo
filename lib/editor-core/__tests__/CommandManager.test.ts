/**
 * CommandManager Unit Tests
 */

import { CommandManager } from '../command/CommandManager'

describe('CommandManager', () => {
  let manager: CommandManager
  let mockDocument: Document

  beforeEach(() => {
    manager = new CommandManager()
    // 创建一个模拟的 Document 对象
    mockDocument = {
      execCommand: jest.fn().mockReturnValue(true),
      queryCommandState: jest.fn().mockReturnValue(false),
      queryCommandValue: jest.fn().mockReturnValue(''),
      queryCommandSupported: jest.fn().mockReturnValue(true)
    } as unknown as Document
  })

  describe('Command Registration', () => {
    it('should register a new command', () => {
      const handler = jest.fn()
      manager.register('test', handler)

      expect(manager.has('test')).toBe(true)
    })

    it('should unregister a command', () => {
      const handler = jest.fn()
      manager.register('test', handler)
      expect(manager.has('test')).toBe(true)

      manager.unregister('test')
      expect(manager.has('test')).toBe(false)
    })

    it('should get all command names', () => {
      manager.register('cmd1', jest.fn())
      manager.register('cmd2', jest.fn())
      manager.register('cmd3', jest.fn())

      const names = manager.getCommandNames()
      expect(names).toContain('cmd1')
      expect(names).toContain('cmd2')
      expect(names).toContain('cmd3')
    })

    it('should clear all commands', () => {
      manager.register('cmd1', jest.fn())
      manager.register('cmd2', jest.fn())

      expect(manager.getCommandNames().length).toBe(2)

      manager.clear()
      expect(manager.getCommandNames().length).toBe(0)
    })
  })

  describe('Command Execution', () => {
    it('should execute a registered command', () => {
      const handler = jest.fn()
      manager.register('test', handler)

      manager.execute('test', 'arg1', 'arg2')

      expect(handler).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should throw error for unknown command', () => {
      expect(() => {
        manager.execute('unknown')
      }).toThrow('Command not found: unknown')
    })

    it('should execute command with document parameter', () => {
      const handler = jest.fn()
      manager.register('test', handler)

      manager.execute('test', mockDocument)

      expect(handler).toHaveBeenCalledWith(mockDocument)
    })
  })

  describe('Command State Query', () => {
    it('should return true for command with no state query', () => {
      manager.register('test', jest.fn())

      expect(manager.queryState('test')).toBe(true)
    })

    it('should return command state from state query', () => {
      const stateQuery = jest.fn().mockReturnValue(true)
      manager.register('test', jest.fn(), stateQuery)

      const state = manager.queryState('test')

      expect(state).toBe(true)
      expect(stateQuery).toHaveBeenCalled()
    })

    it('should return false for unregistered command', () => {
      expect(manager.queryState('unknown')).toBe(false)
    })
  })

  describe('Command Value Query', () => {
    it('should return empty string for command with no value query', () => {
      manager.register('test', jest.fn())

      expect(manager.queryValue('test')).toBe('')
    })

    it('should return command value from value query', () => {
      const valueQuery = jest.fn().mockReturnValue('#ff0000')
      manager.register('test', jest.fn(), undefined, valueQuery)

      const value = manager.queryValue('test')

      expect(value).toBe('#ff0000')
      expect(valueQuery).toHaveBeenCalled()
    })

    it('should return empty string for unregistered command', () => {
      expect(manager.queryValue('unknown')).toBe('')
    })
  })
})
