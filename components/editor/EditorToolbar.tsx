/**
 * EditorToolbar Component (Refactored)
 * Configuration-driven toolbar implementation
 * Reduced from 413 lines to ~250 lines
 */

'use client'

import React, { RefObject } from 'react'

// Core components
import ToolbarRow from './toolbar/core/ToolbarRow'
import ButtonRenderer from './toolbar/core/ButtonRenderer'

// Groups
import ToolbarGroup from './toolbar/groups/ToolbarGroup'
import ToolbarSeparator from './toolbar/groups/ToolbarSeparator'

// Hooks
import { useEditorCommands } from './toolbar/hooks/useEditorCommands'
import { useEditorState } from './toolbar/hooks/useEditorState'

// Config
import { BUTTON_GROUPS, TOOLBAR_CONFIG } from './toolbar/config'

// Icons
import {
  AlignIcon,
  ListIcon,
  LinkIcon,
  UnlinkIcon,
  DividerIcon,
  UndoIcon,
  RedoIcon,
  IndentIcon,
  OutdentIcon,
  SuperscriptIcon,
  SubscriptIcon,
  RemoveFormatIcon,
  LineSpacingIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikeThroughIcon,
  FloatingImageIcon,
  ImageIcon,
  FormatPainterIcon
} from './icons'

/**
 * Props for the EditorToolbar component
 */
export interface EditorToolbarProps {
  iframeRef: RefObject<HTMLIFrameElement>
  onContentChange: (content: string) => void
  isEditing: boolean
  disabled?: boolean
  onFloatingImageInsert?: (imageUrl: string) => void
}

/**
 * Main toolbar component with configuration-driven rendering
 */
const EditorToolbar: React.FC<EditorToolbarProps> = ({
  iframeRef,
  onContentChange,
  isEditing,
  disabled: propsDisabled,
  onFloatingImageInsert
}) => {
  // Icon mapping for button configs
  // Defined inside component to ensure all imports are available and to force re-evaluation
  const iconMap: Record<string, React.ComponentType<any>> = {
    'undo': UndoIcon,
    'redo': RedoIcon,
    'align-left': () => <AlignIcon type="left" />,
    'align-center': () => <AlignIcon type="center" />,
    'align-right': () => <AlignIcon type="right" />,
    'align-justify': () => <AlignIcon type="justify" />,
    'outdent': OutdentIcon,
    'indent': IndentIcon,
    'bulleted-list': () => <ListIcon type="unordered" />,
    'numbered-list': () => <ListIcon type="ordered" />,
    'link': LinkIcon,
    'unlink': UnlinkIcon,
    'hr': DividerIcon,
    'superscript': SuperscriptIcon,
    'subscript': SubscriptIcon,
    'clear-format': RemoveFormatIcon,
    'line-spacing': LineSpacingIcon,
    'format-bold': BoldIcon,
    'format-italic': ItalicIcon,
    'format-underline': UnderlineIcon,
    'format-strike': StrikeThroughIcon,
    'image': ImageIcon,
    'floating-image': FloatingImageIcon,
    'format-painter': FormatPainterIcon
  }

  /**
   * Assign icons to button configs
   */
  const assignIconsToConfigs = (configs: any[]): any[] => {
    if (!configs) return []
    return configs.map(config => ({
      ...config,
      icon: iconMap[config.id]
    }))
  }

  const disabled = propsDisabled || !isEditing

  // Use editor commands hook
  const { commands, isFormatPainterActive } = useEditorCommands({
    iframeRef,
    onContentChange,
    isEditing
  })

  // Use editor state hook
  const { editorState } = useEditorState({ iframeRef })

  // Helper to determine button state
  const getButtonState = (id: string): { isActive: boolean } => {
    switch (id) {
      // Alignment
      case 'align-left': return { isActive: editorState.align === 'left' }
      case 'align-center': return { isActive: editorState.align === 'center' }
      case 'align-right': return { isActive: editorState.align === 'right' }
      case 'align-justify': return { isActive: editorState.align === 'justify' }
      
      // Lists
      case 'bulleted-list': return { isActive: editorState.isUnorderedList }
      case 'numbered-list': return { isActive: editorState.isOrderedList }
      
      // Toggles (Format)
      case 'format-bold': return { isActive: editorState.isBold }
      case 'format-italic': return { isActive: editorState.isItalic }
      case 'format-underline': return { isActive: editorState.isUnderline }
      case 'format-strike': return { isActive: editorState.isStrikeThrough }
      case 'subscript': return { isActive: editorState.isSubscript }
      case 'superscript': return { isActive: editorState.isSuperscript }
      case 'format-painter': return { isActive: isFormatPainterActive }
      
      default: return { isActive: false }
    }
  }

  // Prepare button configs with icons
  const historyButtons = assignIconsToConfigs(BUTTON_GROUPS.history)
  const formatButtons = assignIconsToConfigs(BUTTON_GROUPS.format)
  const colorButtons = BUTTON_GROUPS.colors
  const alignmentButtons = assignIconsToConfigs(BUTTON_GROUPS.alignment)
  const indentButtons = assignIconsToConfigs(BUTTON_GROUPS.indent)
  const listButtons = assignIconsToConfigs(BUTTON_GROUPS.lists)
  const linkButtons = assignIconsToConfigs(BUTTON_GROUPS.links)
  const mediaButtons = assignIconsToConfigs(BUTTON_GROUPS.media)

  // Configs for selects
  const fontFamilyConfig = TOOLBAR_CONFIG.rows[0].groups.find(g => g.id === 'font-family')?.items[0]
  const fontSizeConfig = TOOLBAR_CONFIG.rows[0].groups.find(g => g.id === 'font-size')?.items[0]
  const headingConfig = TOOLBAR_CONFIG.rows[0].groups.find(g => g.id === 'heading')?.items[0]

  // Command handler
  const handleCommand = (command: string, arg?: string) => {
    const cmd = commands[command as keyof typeof commands]
    if (typeof cmd === 'function') {
      if (arg !== undefined) {
        (cmd as (arg: string) => void)(arg)
      } else {
        (cmd as () => void)()
      }
    }
  }

  // Color selection handler
  const handleColorSelect = (color: string, type: 'text' | 'background') => {
    if (type === 'text') {
      commands.foreColor(color)
    } else {
      if (color === 'transparent') {
        commands.removeFormat()
      } else {
        commands.hiliteColor(color)
      }
    }
  }

  // Image selection handler
  const handleImageSelect = (imageUrl: string) => {
    commands.insertImage(imageUrl)
  }

  const handleFloatingImageSelect = (imageUrl: string) => {
    onFloatingImageInsert?.(imageUrl)
  }

  // Table selection handler
  const handleTableSelect = (rows: number, cols: number) => {
    commands.insertTable(rows, cols)
  }

  // Select change handler (for heading format, font, size)
  const handleSelectChange = (id: string, value: string) => {
    switch (id) {
      case 'font-family':
        commands.fontFamily(value)
        break
      case 'font-size':
        commands.fontSize(value)
        break
      case 'heading':
        if (value.startsWith('h')) {
          commands.formatBlock(value)
        } else if (value === 'p') {
          commands.formatBlock('p')
        }
        break
    }
  }

  // Line spacing handler
  const handleLineSpacingSelect = (value: string) => {
    commands.lineHeight(value)
  }

  return (
    <div className="flex flex-col">
      {/* Row 1: Core editing features */}
      <ToolbarRow id="toolbar-row-1" showBorder={false}>
        {/* History */}
        <ToolbarGroup id="history">
          {historyButtons.map(config => (
            <ButtonRenderer
              key={config.id}
              config={config}
              disabled={disabled}
              onCommand={handleCommand}
            />
          ))}
        </ToolbarGroup>
        <ToolbarSeparator />

        {/* Heading Format */}
        <ToolbarGroup id="heading">
          {headingConfig && (
            <ButtonRenderer
              key={headingConfig.id}
              config={headingConfig}
              disabled={disabled}
              value={editorState.formatBlock}
              onSelectChange={handleSelectChange}
            />
          )}
        </ToolbarGroup>

        {/* Font Family */}
        <ToolbarGroup id="font-family">
          {fontFamilyConfig && (
            <ButtonRenderer
              key={fontFamilyConfig.id}
              config={fontFamilyConfig}
              disabled={disabled}
              value={editorState.fontName}
              onSelectChange={handleSelectChange}
            />
          )}
        </ToolbarGroup>
        
        {/* Font Size */}
        <ToolbarGroup id="font-size">
          {fontSizeConfig && (
            <ButtonRenderer
              key={fontSizeConfig.id}
              config={fontSizeConfig}
              disabled={disabled}
              value={editorState.fontSize}
              onSelectChange={handleSelectChange}
            />
          )}
        </ToolbarGroup>
        <ToolbarSeparator />

        {/* Text Formatting */}
        <ToolbarGroup id="format">
          {formatButtons.map(config => (
            <ButtonRenderer
              key={config.id}
              config={config}
              disabled={disabled}
              isActive={getButtonState(config.id).isActive}
              onCommand={handleCommand}
            />
          ))}
        </ToolbarGroup>
        <ToolbarSeparator />

        {/* Colors */}
        <ToolbarGroup id="colors">
          {colorButtons.map(config => (
            <ButtonRenderer
              key={config.id}
              config={config}
              disabled={disabled}
              onColorSelect={handleColorSelect}
            />
          ))}
        </ToolbarGroup>
        <ToolbarSeparator />

        {/* Text Alignment */}
        <ToolbarGroup id="alignment">
          {alignmentButtons.map(config => (
            <ButtonRenderer
              key={config.id}
              config={config}
              disabled={disabled}
              isActive={getButtonState(config.id).isActive}
              onCommand={handleCommand}
            />
          ))}
        </ToolbarGroup>
        <ToolbarSeparator />

        {/* Indentation */}
        <ToolbarGroup id="indent">
          {indentButtons.map(config => (
            <ButtonRenderer
              key={config.id}
              config={config}
              disabled={disabled}
              onCommand={handleCommand}
              onLineSpacingSelect={handleLineSpacingSelect}
            />
          ))}
        </ToolbarGroup>
        <ToolbarSeparator />

        {/* Lists */}
        <ToolbarGroup id="lists">
          {listButtons.map(config => (
            <ButtonRenderer
              key={config.id}
              config={config}
              disabled={disabled}
              isActive={getButtonState(config.id).isActive}
              onCommand={handleCommand}
            />
          ))}
        </ToolbarGroup>
        <ToolbarSeparator />

        {/* Links */}
        <ToolbarGroup id="links">
          {linkButtons.map(config => (
            <ButtonRenderer
              key={config.id}
              config={config}
              disabled={disabled}
              onCommand={handleCommand}
            />
          ))}
        </ToolbarGroup>
        <ToolbarSeparator />

        {/* Media */}
        <ToolbarGroup id="media">
          {mediaButtons.map(config => (
            <ButtonRenderer
              key={config.id}
              config={config}
              disabled={disabled}
              onCommand={handleCommand}
              onImageSelect={handleImageSelect}
              onFloatingImageSelect={handleFloatingImageSelect}
              onTableSelect={handleTableSelect}
            />
          ))}
        </ToolbarGroup>
      </ToolbarRow>
    </div>
  )
}

export default EditorToolbar
