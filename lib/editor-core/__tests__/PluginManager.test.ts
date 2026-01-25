/**
 * PluginManager Unit Tests
 */

import { PluginManager } from '../plugin/PluginManager'
import { EventBus } from '../plugin/EventBus'
import { CommandManager, StateManager, HistoryManager } from '..'
import type { Plugin, EditorAPI } from '../plugin/types'

describe('PluginManager', () => {
  let manager: PluginManager
  let commandManager: CommandManager
  let stateManager: StateManager
  let historyManager: HistoryManager
  let eventBus: EventBus
  let api: EditorAPI

  beforeEach(() => {
    commandManager = new CommandManager()
    stateManager = new StateManager()
    historyManager = new HistoryManager()
    eventBus = new EventBus()

    api = {
      commands: commandManager,
      state: stateManager,
      history: historyManager,
      events: eventBus,
      utils: {
        getDocument: () => null
      }
    }

    manager = new PluginManager(api, eventBus)
  })

  const createMockPlugin = (name: string): Plugin => ({
    name,
    version: '1.0.0',
    install: jest.fn(),
    uninstall: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn()
  })

  describe('Plugin Registration', () => {
    it('should register a plugin', async () => {
      const plugin = createMockPlugin('test-plugin')

      await manager.register(plugin)

      expect(manager.hasPlugin('test-plugin')).toBe(true)
      expect(plugin.install).toHaveBeenCalledWith(api, undefined)
    })

    it('should register plugin with config', async () => {
      const plugin = createMockPlugin('test-plugin')
      const config = { option: 'value' }

      await manager.register(plugin, config)

      expect(plugin.install).toHaveBeenCalledWith(api, config)
    })

    it('should throw error for duplicate plugin', async () => {
      const plugin = createMockPlugin('test-plugin')

      await manager.register(plugin)

      await expect(manager.register(plugin)).rejects.toThrow('already registered')
    })

    it('should check dependencies', async () => {
      const pluginWithDeps: Plugin = {
        name: 'plugin-with-deps',
        version: '1.0.0',
        dependencies: ['required-plugin'],
        install: jest.fn()
      }

      await expect(manager.register(pluginWithDeps)).rejects.toThrow('requires plugin')
    })

    it('should warn about missing peer dependencies', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        peerDependencies: ['recommended-plugin'],
        install: jest.fn()
      }

      await manager.register(plugin)

      expect(consoleSpy).toHaveBeenCalled()
      const warningMessage = consoleSpy.mock.calls[0][0]
      expect(warningMessage).toContain('recommends plugin')

      consoleSpy.mockRestore()
    })

    it('should emit plugin-load event', async () => {
      const plugin = createMockPlugin('test-plugin')
      const loadHandler = jest.fn()

      eventBus.on('plugin-load', loadHandler)

      await manager.register(plugin)

      expect(loadHandler).toHaveBeenCalledWith(plugin)
    })
  })

  describe('Plugin Unregistration', () => {
    it('should unregister a plugin', async () => {
      const plugin = createMockPlugin('test-plugin')

      await manager.register(plugin)
      expect(manager.hasPlugin('test-plugin')).toBe(true)

      await manager.unregister('test-plugin')

      expect(manager.hasPlugin('test-plugin')).toBe(false)
      expect(plugin.uninstall).toHaveBeenCalled()
    })

    it('should throw error for unknown plugin', async () => {
      await expect(manager.unregister('unknown')).rejects.toThrow('not found')
    })

    it('should deactivate active plugin before unregistering', async () => {
      const plugin = createMockPlugin('test-plugin')

      await manager.register(plugin)
      await manager.activate('test-plugin')

      await manager.unregister('test-plugin')

      expect(plugin.deactivate).toHaveBeenCalled()
    })

    it('should emit plugin-unload event', async () => {
      const plugin = createMockPlugin('test-plugin')
      const unloadHandler = jest.fn()

      eventBus.on('plugin-unload', unloadHandler)

      await manager.register(plugin)
      await manager.unregister('test-plugin')

      expect(unloadHandler).toHaveBeenCalledWith(plugin)
    })
  })

  describe('Plugin Activation', () => {
    it('should activate a registered plugin', async () => {
      const plugin = createMockPlugin('test-plugin')

      await manager.register(plugin)
      await manager.activate('test-plugin')

      expect(manager.isPluginActive('test-plugin')).toBe(true)
      expect(plugin.activate).toHaveBeenCalled()
    })

    it('should throw error for unknown plugin', async () => {
      await expect(manager.activate('unknown')).rejects.toThrow('not found')
    })

    it('should throw error when activating already active plugin', async () => {
      const plugin = createMockPlugin('test-plugin')

      await manager.register(plugin)
      await manager.activate('test-plugin')

      await expect(manager.activate('test-plugin')).rejects.toThrow('not in registered state')
    })

    it('should emit plugin-activate event', async () => {
      const plugin = createMockPlugin('test-plugin')
      const activateHandler = jest.fn()

      eventBus.on('plugin-activate', activateHandler)

      await manager.register(plugin)
      await manager.activate('test-plugin')

      expect(activateHandler).toHaveBeenCalledWith(plugin)
    })
  })

  describe('Plugin Deactivation', () => {
    it('should deactivate an active plugin', async () => {
      const plugin = createMockPlugin('test-plugin')

      await manager.register(plugin)
      await manager.activate('test-plugin')
      await manager.deactivate('test-plugin')

      expect(manager.isPluginActive('test-plugin')).toBe(false)
      expect(plugin.deactivate).toHaveBeenCalled()
    })

    it('should throw error for unknown plugin', async () => {
      await expect(manager.deactivate('unknown')).rejects.toThrow('not found')
    })

    it('should throw error when deactivating non-active plugin', async () => {
      const plugin = createMockPlugin('test-plugin')

      await manager.register(plugin)

      await expect(manager.deactivate('test-plugin')).rejects.toThrow('not active')
    })

    it('should emit plugin-deactivate event', async () => {
      const plugin = createMockPlugin('test-plugin')
      const deactivateHandler = jest.fn()

      eventBus.on('plugin-deactivate', deactivateHandler)

      await manager.register(plugin)
      await manager.activate('test-plugin')
      await manager.deactivate('test-plugin')

      expect(deactivateHandler).toHaveBeenCalledWith(plugin)
    })
  })

  describe('Plugin Queries', () => {
    it('should get plugin by name', async () => {
      const plugin = createMockPlugin('test-plugin')

      await manager.register(plugin)

      expect(manager.getPlugin('test-plugin')).toBe(plugin)
    })

    it('should return undefined for unknown plugin', () => {
      expect(manager.getPlugin('unknown')).toBeUndefined()
    })

    it('should get all plugins', async () => {
      const plugin1 = createMockPlugin('plugin1')
      const plugin2 = createMockPlugin('plugin2')

      await manager.register(plugin1)
      await manager.register(plugin2)

      const plugins = manager.getAllPlugins()

      expect(plugins).toHaveLength(2)
      expect(plugins).toContain(plugin1)
      expect(plugins).toContain(plugin2)
    })

    it('should get all plugin names', async () => {
      await manager.register(createMockPlugin('plugin1'))
      await manager.register(createMockPlugin('plugin2'))

      const names = manager.getPluginNames()

      expect(names).toContain('plugin1')
      expect(names).toContain('plugin2')
    })

    it('should get plugin instance', async () => {
      const plugin = createMockPlugin('test-plugin')

      await manager.register(plugin)

      const instance = manager.getPluginInstance('test-plugin')

      expect(instance).toBeDefined()
      expect(instance!.plugin).toBe(plugin)
      expect(instance!.state).toBe('registered')
    })

    it('should get plugin state', async () => {
      const plugin = createMockPlugin('test-plugin')

      await manager.register(plugin)

      expect(manager.getPluginState('test-plugin')).toBe('registered')

      await manager.activate('test-plugin')

      expect(manager.getPluginState('test-plugin')).toBe('active')
    })
  })

  describe('Plugin Extensions', () => {
    it('should register command extensions', async () => {
      const plugin: Plugin = {
        name: 'command-plugin',
        version: '1.0.0',
        install: jest.fn(),
        extends: {
          commands: {
            customCommand: {
              execute: jest.fn()
            }
          }
        }
      }

      await manager.register(plugin)

      expect(commandManager.has('customCommand')).toBe(true)
    })

    it('should register event listener extensions', async () => {
      const eventHandler = jest.fn()
      const plugin: Plugin = {
        name: 'event-plugin',
        version: '1.0.0',
        install: jest.fn(),
        extends: {
          eventListeners: [
            {
              event: 'custom-event',
              handler: eventHandler
            }
          ]
        }
      }

      await manager.register(plugin)
      eventBus.emit('custom-event', 'test')

      expect(eventHandler).toHaveBeenCalledWith('test')
    })

    it('should unregister extensions when plugin is unregistered', async () => {
      const plugin: Plugin = {
        name: 'command-plugin',
        version: '1.0.0',
        install: jest.fn(),
        uninstall: jest.fn(),
        extends: {
          commands: {
            customCommand: {
              execute: jest.fn()
            }
          }
        }
      }

      await manager.register(plugin)
      expect(commandManager.has('customCommand')).toBe(true)

      await manager.unregister('command-plugin')
      expect(commandManager.has('customCommand')).toBe(false)
    })
  })
})
