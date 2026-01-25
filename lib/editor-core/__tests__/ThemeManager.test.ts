/**
 * ThemeManager Unit Tests
 */

import { ThemeManager, BUILTIN_THEMES } from '../theme/ThemeManager'
import type { Theme } from '../theme/ThemeManager'

describe('ThemeManager', () => {
  let manager: ThemeManager

  beforeEach(() => {
    manager = new ThemeManager()
  })

  describe('Theme Initialization', () => {
    it('should initialize with light theme by default', () => {
      const theme = manager.getTheme()

      expect(theme.name).toBe('light')
      expect(theme.mode).toBe('light')
    })

    it('should initialize with custom theme', () => {
      const customTheme: Theme = {
        name: 'custom',
        mode: 'light',
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          background: '#ffffff',
          surface: '#f0f0f0',
          border: '#cccccc',
          text: '#000000',
          textSecondary: '#666666'
        }
      }

      const customManager = new ThemeManager(customTheme)

      expect(customManager.getThemeName()).toBe('custom')
    })
  })

  describe('Theme Management', () => {
    it('should set theme by name', () => {
      manager.setTheme('dark')

      expect(manager.getThemeName()).toBe('dark')
      expect(manager.getMode()).toBe('dark')
    })

    it('should set theme by object', () => {
      const customTheme: Theme = {
        name: 'custom',
        mode: 'light',
        colors: BUILTIN_THEMES.light.colors
      }

      manager.setTheme(customTheme)

      expect(manager.getThemeName()).toBe('custom')
    })

    it('should throw error for unknown theme', () => {
      expect(() => {
        manager.setTheme('unknown')
      }).toThrow('Theme not found')
    })

    it('should get current theme', () => {
      const theme = manager.getTheme()

      expect(theme).toBeDefined()
      expect(theme.name).toBeDefined()
      expect(theme.colors).toBeDefined()
    })

    it('should get current theme name', () => {
      expect(manager.getThemeName()).toBe('light')

      manager.setTheme('dark')

      expect(manager.getThemeName()).toBe('dark')
    })

    it('should get current mode', () => {
      expect(manager.getMode()).toBe('light')

      manager.setTheme('dark')

      expect(manager.getMode()).toBe('dark')
    })
  })

  describe('Theme Registration', () => {
    it('should register custom theme', () => {
      const customTheme: Theme = {
        name: 'custom',
        mode: 'light',
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          background: '#ffffff',
          surface: '#f0f0f0',
          border: '#cccccc',
          text: '#000000',
          textSecondary: '#666666'
        }
      }

      manager.registerTheme(customTheme)

      expect(manager.getAllThemes()).toContain(customTheme)
    })

    it('should allow switching to custom theme', () => {
      const customTheme: Theme = {
        name: 'custom',
        mode: 'dark',
        colors: BUILTIN_THEMES.dark.colors
      }

      manager.registerTheme(customTheme)
      manager.setTheme('custom')

      expect(manager.getThemeName()).toBe('custom')
    })

    it('should unregister custom theme', () => {
      const customTheme: Theme = {
        name: 'custom',
        mode: 'light',
        colors: BUILTIN_THEMES.light.colors
      }

      manager.registerTheme(customTheme)
      expect(manager.getAllThemes()).toContain(customTheme)

      manager.unregisterTheme('custom')
      expect(manager.getAllThemes()).not.toContain(customTheme)
    })

    it('should not allow unregistering built-in themes', () => {
      expect(() => {
        manager.unregisterTheme('light')
      }).toThrow('Cannot unregister built-in theme')

      expect(() => {
        manager.unregisterTheme('dark')
      }).toThrow('Cannot unregister built-in theme')
    })

    it('should switch to light theme when unregistering current theme', () => {
      const customTheme: Theme = {
        name: 'custom',
        mode: 'light',
        colors: BUILTIN_THEMES.light.colors
      }

      manager.registerTheme(customTheme)
      manager.setTheme('custom')

      manager.unregisterTheme('custom')

      expect(manager.getThemeName()).toBe('light')
    })

    it('should get all themes', () => {
      const themes = manager.getAllThemes()

      expect(themes.length).toBeGreaterThanOrEqual(2)
      expect(themes.find(t => t.name === 'light')).toBeDefined()
      expect(themes.find(t => t.name === 'dark')).toBeDefined()
    })

    it('should get themes grouped by mode', () => {
      const grouped = manager.getThemesByMode()

      expect(grouped.light.length).toBeGreaterThan(0)
      expect(grouped.dark.length).toBeGreaterThan(0)
      expect(grouped.light.every(t => t.mode === 'light')).toBe(true)
      expect(grouped.dark.every(t => t.mode === 'dark')).toBe(true)
    })
  })

  describe('Dark Mode Toggle', () => {
    it('should toggle to dark mode', () => {
      expect(manager.getMode()).toBe('light')

      manager.toggleDarkMode()

      expect(manager.getMode()).toBe('dark')
    })

    it('should toggle back to light mode', () => {
      manager.setTheme('dark')
      manager.toggleDarkMode()

      expect(manager.getMode()).toBe('light')
    })
  })

  describe('Theme Listeners', () => {
    it('should notify listeners on theme change', () => {
      const listener = jest.fn()

      manager.onChange(listener)
      manager.setTheme('dark')

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'dark' })
      )
    })

    it('should return unsubscribe function', () => {
      const listener = jest.fn()

      const unsubscribe = manager.onChange(listener)
      unsubscribe()
      manager.setTheme('dark')

      expect(listener).not.toHaveBeenCalled()
    })

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error')
      })
      const normalListener = jest.fn()

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      manager.onChange(errorListener)
      manager.onChange(normalListener)

      expect(() => {
        manager.setTheme('dark')
      }).not.toThrow()

      expect(normalListener).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in theme listener:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Theme Utilities', () => {
    it('should get theme class for Tailwind', () => {
      expect(manager.getThemeClass()).toBe('')

      manager.setTheme('dark')

      expect(manager.getThemeClass()).toBe('dark')
    })

    it('should get CSS variables', () => {
      const cssVars = manager.getCSSVariables()

      expect(cssVars).toHaveProperty('--editor-primary')
      expect(cssVars).toHaveProperty('--editor-background')
      expect(cssVars['--editor-primary']).toMatch(/^#[0-9a-fA-F]{6}$/)
    })

    it('should include all color variables', () => {
      const cssVars = manager.getCSSVariables()

      const expectedVars = [
        '--editor-primary',
        '--editor-secondary',
        '--editor-background',
        '--editor-surface',
        '--editor-border',
        '--editor-text',
        '--editor-text-secondary'
      ]

      expectedVars.forEach(varName => {
        expect(cssVars).toHaveProperty(varName)
      })
    })
  })
})
