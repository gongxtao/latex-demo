/**
 * ConfigManager Unit Tests
 */

import { ConfigManager, DEFAULT_CONFIG } from '../config/ConfigManager'
import type { EditorConfig } from '../config/types'

describe('ConfigManager', () => {
  let manager: ConfigManager

  beforeEach(() => {
    manager = new ConfigManager()
  })

  describe('Configuration Initialization', () => {
    it('should initialize with default config', () => {
      expect(manager.get('locale')).toBe(DEFAULT_CONFIG.locale)
      expect(manager.get('readonly')).toBe(DEFAULT_CONFIG.readonly)
    })

    it('should initialize with custom config', () => {
      const custom: Partial<EditorConfig> = {
        locale: 'en-US',
        readonly: true
      }

      const customManager = new ConfigManager(custom)

      expect(customManager.get('locale')).toBe('en-US')
      expect(customManager.get('readonly')).toBe(true)
    })

    it('should merge custom config with defaults', () => {
      const custom: Partial<EditorConfig> = {
        locale: 'en-US'
      }

      const customManager = new ConfigManager(custom)

      // 自定义值
      expect(customManager.get('locale')).toBe('en-US')
      // 默认值保留
      expect(customManager.get('readonly')).toBe(DEFAULT_CONFIG.readonly)
    })
  })

  describe('Getting Configuration', () => {
    it('should get all config', () => {
      const config = manager.getAll()

      expect(config).toHaveProperty('locale')
      expect(config).toHaveProperty('readonly')
      expect(config).toHaveProperty('toolbar')
    })

    it('should get specific config value', () => {
      expect(manager.get('locale')).toBe('zh-CN')
    })
  })

  describe('Setting Configuration', () => {
    it('should set config value', () => {
      manager.set('locale', 'en-US')

      expect(manager.get('locale')).toBe('en-US')
    })

    it('should notify listeners on change', () => {
      const listener = jest.fn()
      manager.subscribe('locale', listener)

      manager.set('locale', 'en-US')

      expect(listener).toHaveBeenCalledWith(
        'locale',
        'en-US',
        'zh-CN'
      )
    })

    it('should validate config before setting', () => {
      // 无效的图片大小
      expect(() => {
        manager.set('image', {
          maxSize: -1,
          maxWidth: 100,
          maxHeight: 100,
          defaultWidth: 100,
          defaultHeight: 100,
          resizeHandles: 'all'
        })
      }).toThrow('Invalid config')
    })
  })

  describe('Merging Configuration', () => {
    it('should merge partial config', () => {
      manager.merge({
        locale: 'en-US',
        readonly: true
      })

      expect(manager.get('locale')).toBe('en-US')
      expect(manager.get('readonly')).toBe(true)
    })

    it('should deep merge nested objects', () => {
      manager.merge({
        image: {
          maxSize: 10 * 1024 * 1024
        }
      })

      const imageConfig = manager.get('image')
      expect(imageConfig?.maxSize).toBe(10 * 1024 * 1024)
      // 其他值保留
      expect(imageConfig?.maxWidth).toBe(DEFAULT_CONFIG.image!.maxWidth)
    })

    it('should notify listeners for changed keys only', () => {
      const localeListener = jest.fn()
      const readonlyListener = jest.fn()

      manager.subscribe('locale', localeListener)
      manager.subscribe('readonly', readonlyListener)

      manager.merge({ locale: 'en-US' })

      expect(localeListener).toHaveBeenCalled()
      expect(readonlyListener).not.toHaveBeenCalled()
    })
  })

  describe('Resetting Configuration', () => {
    it('should reset all config to defaults', () => {
      manager.set('locale', 'en-US')
      manager.set('readonly', true)

      manager.reset()

      expect(manager.get('locale')).toBe(DEFAULT_CONFIG.locale)
      expect(manager.get('readonly')).toBe(DEFAULT_CONFIG.readonly)
    })

    it('should reset specific key to default', () => {
      manager.set('locale', 'en-US')

      manager.resetKey('locale')

      expect(manager.get('locale')).toBe(DEFAULT_CONFIG.locale)
    })

    it('should notify listeners on reset', () => {
      const listener = jest.fn()
      manager.set('locale', 'en-US')

      manager.subscribe('locale', listener)
      listener.mockClear()

      manager.resetKey('locale')

      expect(listener).toHaveBeenCalled()
    })
  })

  describe('Configuration Validation', () => {
    it('should validate valid config', () => {
      const result = manager.validate({
        image: {
          maxSize: 5 * 1024 * 1024,
          maxWidth: 800
        }
      })

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect invalid config', () => {
      const result = manager.validate({
        image: {
          maxSize: -1
        }
      })

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should throw error when merging invalid config', () => {
      expect(() => {
        manager.merge({
          image: {
            maxSize: -1
          }
        })
      }).toThrow('Invalid config')
    })
  })

  describe('Configuration Subscriptions', () => {
    it('should subscribe to config changes', () => {
      const listener = jest.fn()
      const unsubscribe = manager.subscribe('locale', listener)

      manager.set('locale', 'en-US')

      expect(listener).toHaveBeenCalledTimes(1)
      unsubscribe()
      manager.set('locale', 'zh-CN')

      expect(listener).toHaveBeenCalledTimes(1)
    })

    it('should support multiple subscribers', () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()

      manager.subscribe('locale', listener1)
      manager.subscribe('locale', listener2)

      manager.set('locale', 'en-US')

      expect(listener1).toHaveBeenCalled()
      expect(listener2).toHaveBeenCalled()
    })

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error')
      })
      const normalListener = jest.fn()

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      manager.subscribe('locale', errorListener)
      manager.subscribe('locale', normalListener)

      expect(() => {
        manager.set('locale', 'en-US')
      }).not.toThrow()

      expect(normalListener).toHaveBeenCalled()
      const errorMessage = consoleSpy.mock.calls[0][0]
      expect(errorMessage).toContain('Error in config listener for')

      consoleSpy.mockRestore()
    })
  })
})
