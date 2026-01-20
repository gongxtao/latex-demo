/**
 * Toolbar configuration
 * Defines the layout and organization of the toolbar rows and groups
 */

import { FONT_FAMILIES, FONT_SIZES, HEADING_OPTIONS } from './constants'

// ============================================================================
// Types
// ============================================================================

export interface ToolbarGroupConfig {
  id: string
  label?: string
  items: any[] // Will be typed more specifically when used
  separator?: boolean // Show separator after this group
}

export interface ToolbarRowConfig {
  id: string
  groups: ToolbarGroupConfig[]
}

export interface ToolbarConfig {
  rows: ToolbarRowConfig[]
}

// ============================================================================
// Toolbar Configuration
// ============================================================================

/**
 * Main toolbar configuration
 * Defines the layout of toolbar rows and their groups
 */
export const TOOLBAR_CONFIG: ToolbarConfig = {
  rows: [
    {
      id: 'row-1',
      groups: [
        {
          id: 'history',
          items: [] // Will be populated with button config
        },
        {
          id: 'font-family',
          items: [
            {
              id: 'font-family',
              type: 'select',
              label: 'Font family selector',
              selectLabel: '',
              options: FONT_FAMILIES,
              defaultValue: 'Arial'
            }
          ]
        },
        {
          id: 'font-size',
          items: [
            {
              id: 'font-size',
              type: 'select',
              label: 'Font size selector',
              selectLabel: '',
              options: FONT_SIZES,
              defaultValue: '16px'
            }
          ]
        },
        {
          id: 'format',
          items: [], // FORMAT_BUTTONS
          separator: false
        },
        {
          id: 'colors',
          items: [], // COLOR_BUTTONS
          separator: false
        },
        {
          id: 'alignment',
          items: [], // ALIGNMENT_BUTTONS
          separator: false
        },
        {
          id: 'indent',
          items: [], // INDENT_BUTTONS
          separator: false
        }
      ]
    },
    {
      id: 'row-2',
      groups: [
        {
          id: 'lists',
          items: [] // LIST_BUTTONS
        },
        {
          id: 'insert',
          items: [], // INSERT_BUTTONS + TABLE_OPERATION_BUTTONS
          separator: true
        },
        {
          id: 'heading',
          items: [
            {
              id: 'heading',
              type: 'select',
              label: 'Heading format selector',
              selectLabel: '',
              options: HEADING_OPTIONS,
              defaultValue: ''
            }
          ]
        },
        {
          id: 'utility',
          items: [] // UTILITY_BUTTONS
        }
      ]
    }
  ]
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all button IDs from the toolbar config
 */
export function getAllButtonIds(config: ToolbarConfig): string[] {
  const ids: string[] = []
  for (const row of config.rows) {
    for (const group of row.groups) {
      for (const item of group.items) {
        if (item.id) {
          ids.push(item.id)
        }
      }
    }
  }
  return ids
}

/**
 * Get a group config by its ID
 */
export function getGroupById(config: ToolbarConfig, groupId: string): ToolbarGroupConfig | undefined {
  for (const row of config.rows) {
    const group = row.groups.find(g => g.id === groupId)
    if (group) return group
  }
  return undefined
}

/**
 * Get the total number of groups across all rows
 */
export function getTotalGroupCount(config: ToolbarConfig): number {
  return config.rows.reduce((total, row) => total + row.groups.length, 0)
}
