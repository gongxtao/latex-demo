/**
 * Editor Core 在测试环境中的验证测试
 */

import { CommandManager, StateManager, HistoryManager, registerBuiltinCommands } from '@/lib/editor-core'

describe('EditorCore in Test Environment', () => {
  it('should create CommandManager', () => {
    const manager = new CommandManager()
    expect(manager).toBeInstanceOf(CommandManager)

    const handler = jest.fn()
    manager.register('test', handler)

    manager.execute('test', 'arg1', 'arg2')
    expect(handler).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should create StateManager', () => {
    const manager = new StateManager({ content: 'test' })
    expect(manager.getState().content).toBe('test')

    manager.partialUpdate({ content: 'updated' })
    expect(manager.getState().content).toBe('updated')
  })

  it('should create HistoryManager', () => {
    const manager = new HistoryManager()
    expect(manager.canUndo()).toBe(false)
    expect(manager.canRedo()).toBe(false)

    const state1 = { content: 'state1', isEditing: false }
    const state2 = { content: 'state2', isEditing: false }

    manager.push(state1)
    expect(manager.canUndo()).toBe(false) // 需要2个状态才能undo

    manager.push(state2)
    expect(manager.canUndo()).toBe(true)
  })

  it('should register builtin commands', () => {
    const manager = new CommandManager()
    registerBuiltinCommands(manager)

    expect(manager.has('bold')).toBe(true)
    expect(manager.has('italic')).toBe(true)
    expect(manager.has('undo')).toBe(true)
  })
})
