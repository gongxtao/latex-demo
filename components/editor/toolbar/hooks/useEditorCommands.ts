/**
 * useEditorCommands Hook
 * Centralizes editor command execution logic
 * Handles format application, selection preservation, and change notification
 */

import { useRef, RefObject } from 'react'
import { applyStyle } from '../../utils/style'

export interface UseEditorCommandsOptions {
  /** Ref to the iframe element */
  iframeRef: RefObject<HTMLIFrameElement>
  /** Callback when content changes */
  onContentChange: (content: string) => void
  /** Whether editing is currently active */
  isEditing: boolean
}

export function useEditorCommands({
  iframeRef,
  onContentChange,
  isEditing
}: UseEditorCommandsOptions) {
  const isUpdatingRef = useRef(false)

  // Get the iframe document
  const getIframeDoc = () => {
    return iframeRef.current?.contentDocument ||
           iframeRef.current?.contentWindow?.document ||
           null
  }

  // Apply a format function to the editor
  const applyFormat = (fn: (doc: Document) => void) => {
    const doc = getIframeDoc()
    if (!doc || !isEditing) return

    // Save current selection before applying format
    const selection = doc.getSelection()
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

    // Apply the format
    fn(doc)

    // Restore focus to iframe
    const iframe = iframeRef.current
    if (iframe) {
      iframe.focus()
    }

    // Restore selection if possible, otherwise place cursor at end
    const body = doc.body
    if (body) {
      if (range && selection) {
        try {
          selection.removeAllRanges()
          selection.addRange(range)
        } catch (e) {
          // If restoration fails, place cursor at end
          const newRange = doc.createRange()
          newRange.selectNodeContents(body)
          newRange.collapse(false)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
      } else if (selection) {
        // No previous selection, place cursor at end
        const newRange = doc.createRange()
        newRange.selectNodeContents(body)
        newRange.collapse(false)
        selection.removeAllRanges()
        selection.addRange(newRange)
      }
    }

    // Notify content change
    isUpdatingRef.current = true
    const newHtml = doc.documentElement.outerHTML
    onContentChange(newHtml)
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 50)
  }

  // Apply a custom style
  const applyCustomStyle = (styleName: string, value: string) => {
    const doc = getIframeDoc()
    if (!doc || !isEditing) return

    applyStyle(doc, styleName, value)

    // Sync change
    isUpdatingRef.current = true
    const newHtml = doc.documentElement.outerHTML
    onContentChange(newHtml)
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 50)
  }

  // ============================================================================
  // Text Formatting Commands
  // ============================================================================

  const commands = {
    // History
    undo: () => applyFormat(doc => doc.execCommand('undo')),
    redo: () => applyFormat(doc => doc.execCommand('redo')),

    // Text format
    bold: () => applyFormat(doc => doc.execCommand('bold')),
    italic: () => applyFormat(doc => doc.execCommand('italic')),
    underline: () => applyFormat(doc => doc.execCommand('underline')),
    strikeThrough: () => applyFormat(doc => doc.execCommand('strikeThrough')),
    superscript: () => applyFormat(doc => doc.execCommand('superscript')),
    subscript: () => applyFormat(doc => doc.execCommand('subscript')),

    // Alignment
    justifyLeft: () => applyFormat(doc => doc.execCommand('justifyLeft')),
    justifyCenter: () => applyFormat(doc => doc.execCommand('justifyCenter')),
    justifyRight: () => applyFormat(doc => doc.execCommand('justifyRight')),
    justifyFull: () => applyFormat(doc => doc.execCommand('justifyFull')),

    // Indentation
    indent: () => applyFormat(doc => doc.execCommand('indent')),
    outdent: () => applyFormat(doc => doc.execCommand('outdent')),

    // Lists
    insertUnorderedList: () => applyFormat(doc => doc.execCommand('insertUnorderedList')),
    insertOrderedList: () => applyFormat(doc => doc.execCommand('insertOrderedList')),

    // Insert
    createLink: (url?: string) => {
      const linkUrl = url || (typeof window !== 'undefined' ? window.prompt('Enter link URL') : null)
      if (!linkUrl) return
      applyFormat(doc => {
        const sel = doc.getSelection()
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
          doc.execCommand('createLink', false, linkUrl)
        } else {
          doc.execCommand('insertHTML', false, `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkUrl}</a>`)
        }
      })
    },
    unlink: () => applyFormat(doc => doc.execCommand('unlink')),
    insertImage: (imageUrl: string) => applyFormat(doc => {
      doc.execCommand('insertImage', false, imageUrl)
      setTimeout(() => {
        doc.body?.dispatchEvent(new Event('input', { bubbles: true }))
      }, 10)
    }),
    insertHorizontalRule: () => applyFormat(doc => doc.execCommand('insertHorizontalRule')),

    // Block format
    formatBlock: (tag: string) => applyFormat(doc => doc.execCommand('formatBlock', false, tag)),

    // Colors
    foreColor: (color: string) => applyFormat(doc => doc.execCommand('foreColor', false, color)),
    hiliteColor: (color: string) => applyFormat(doc => {
      if (doc.queryCommandSupported('hiliteColor')) {
        doc.execCommand('hiliteColor', false, color)
      } else {
        doc.execCommand('backColor', false, color)
      }
    }),

    // Clear formatting
    removeFormat: () => applyFormat(doc => doc.execCommand('removeFormat')),

    // Custom styles
    fontFamily: (name: string) => applyCustomStyle('fontFamily', name),
    fontSize: (size: string) => applyCustomStyle('fontSize', size),

    // Insert table
    insertTable: (rows: number, cols: number) => {
      let html = '<table style="border-collapse: collapse; width: 100%;"><tbody>'
      for (let i = 0; i < rows; i++) {
        html += '<tr>'
        for (let j = 0; j < cols; j++) {
          html += '<td style="border: 1px solid #ccc; padding: 8px; min-width: 60px; height: 32px;"></td>'
        }
        html += '</tr>'
      }
      html += '</tbody></table>'
      applyFormat(doc => doc.execCommand('insertHTML', false, html))
    }
  }

  return {
    commands,
    isUpdating: isUpdatingRef.current,
    getIframeDoc
  }
}
