/**
 * useEditorCommands Hook
 * Centralizes editor command execution logic
 * Handles format application, selection preservation, and change notification
 */

import { useRef, RefObject, useState, useEffect } from 'react'
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
  const [isFormatPainterActive, setIsFormatPainterActive] = useState(false)
  const savedStylesRef = useRef<Record<string, any>>({})

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

  // Helper to apply line height to block
  const applyLineHeight = (doc: Document, value: string) => {
    const selection = doc.getSelection()
    if (!selection || selection.rangeCount === 0) return
    
    // Find parent block element
    let node = selection.anchorNode
    // If node is text node, get parent
    if (node && node.nodeType === 3) {
      node = node.parentNode
    }
    
    // Traverse up to find a block element
    while (node && node !== doc.body) {
      const el = node as HTMLElement
      const display = typeof window !== 'undefined' ? window.getComputedStyle(el).display : 'block'
      
      // Simple check for block elements or common text containers
      if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE'].includes(el.nodeName) || display === 'block') {
        el.style.lineHeight = value
        break
      }
      node = node.parentNode
    }
  }

  // ============================================================================
  // Text Formatting Commands
  // ============================================================================

  const captureStyles = (doc: Document) => {
    const styles: Record<string, any> = {}
    
    // Query boolean states
    const booleanStates = ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'insertOrderedList', 'insertUnorderedList']
    booleanStates.forEach(cmd => {
      try {
        styles[cmd] = doc.queryCommandState(cmd)
      } catch (e) {
        styles[cmd] = false
      }
    })

    // Query value states
    try {
      styles.foreColor = doc.queryCommandValue('foreColor')
      styles.backColor = doc.queryCommandValue('backColor') || doc.queryCommandValue('hiliteColor')
      styles.fontName = doc.queryCommandValue('fontName')
      styles.fontSize = doc.queryCommandValue('fontSize')
      
      // Query block states
      if (doc.queryCommandState('justifyCenter')) styles.justify = 'justifyCenter'
      else if (doc.queryCommandState('justifyRight')) styles.justify = 'justifyRight'
      else if (doc.queryCommandState('justifyFull')) styles.justify = 'justifyFull'
      else if (doc.queryCommandState('justifyLeft')) styles.justify = 'justifyLeft'
    } catch (e) {
      console.warn('Failed to query style values', e)
    }

    // Get computed styles for more accuracy
    const selection = doc.getSelection()
    if (selection && selection.rangeCount > 0) {
      const element = selection.anchorNode?.nodeType === 1 
        ? selection.anchorNode as Element 
        : selection.anchorNode?.parentElement

      if (element) {
        const win = doc.defaultView || window
        const computed = win.getComputedStyle(element)
        styles.computedColor = computed.color
        styles.computedBackgroundColor = computed.backgroundColor
        styles.computedFontFamily = computed.fontFamily
        styles.computedFontSize = computed.fontSize
        
        // Block computed styles
        // Find block parent for line height
        let blockNode = element
        while (blockNode && blockNode !== doc.body) {
           const display = win.getComputedStyle(blockNode).display
           if (display === 'block' || display === 'list-item') {
             styles.computedLineHeight = win.getComputedStyle(blockNode).lineHeight
             break
           }
           blockNode = blockNode.parentElement as Element
        }
      }
    }

    return styles
  }

  const applySavedStyles = (doc: Document) => {
    const styles = savedStylesRef.current
    if (!styles) return

    applyFormat(doc => {
      // Apply boolean states
      const booleanStates = ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'insertOrderedList', 'insertUnorderedList']
      booleanStates.forEach(cmd => {
        const currentState = doc.queryCommandState(cmd)
        const targetState = styles[cmd]
        if (currentState !== targetState) {
          doc.execCommand(cmd)
        }
      })

      // Apply justification
      if (styles.justify) {
         const currentJustify = 
            doc.queryCommandState('justifyCenter') ? 'justifyCenter' :
            doc.queryCommandState('justifyRight') ? 'justifyRight' :
            doc.queryCommandState('justifyFull') ? 'justifyFull' : 'justifyLeft'
         
         if (currentJustify !== styles.justify) {
            doc.execCommand(styles.justify)
         }
      }

      // Apply values
      if (styles.foreColor) doc.execCommand('foreColor', false, styles.foreColor)
      
      // Background color
      if (styles.backColor && styles.backColor !== 'rgba(0, 0, 0, 0)' && styles.backColor !== 'transparent') {
         if (doc.queryCommandSupported('hiliteColor')) {
            doc.execCommand('hiliteColor', false, styles.backColor)
         } else {
            doc.execCommand('backColor', false, styles.backColor)
         }
      }
      
      // Font Name
      if (styles.fontName) doc.execCommand('fontName', false, styles.fontName)
      
      // Font Size
      if (styles.computedFontSize) {
         applyStyle(doc, 'fontSize', styles.computedFontSize)
      } else if (styles.fontSize) {
         doc.execCommand('fontSize', false, styles.fontSize)
      }

      // Line Height
      if (styles.computedLineHeight && styles.computedLineHeight !== 'normal') {
         applyLineHeight(doc, styles.computedLineHeight)
      }
    })
  }

  const commands = {
    // History
    undo: () => applyFormat(doc => doc.execCommand('undo')),
    redo: () => applyFormat(doc => doc.execCommand('redo')),
    
    // Format Painter
    formatPainter: () => {
      const doc = getIframeDoc()
      if (!doc) return

      if (isFormatPainterActive) {
        // Deactivate
        setIsFormatPainterActive(false)
        savedStylesRef.current = {}
      } else {
        // Activate and capture
        savedStylesRef.current = captureStyles(doc)
        setIsFormatPainterActive(true)
      }
    },

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
    lineHeight: (value: string) => applyFormat(doc => {
      const selection = doc.getSelection()
      if (!selection || selection.rangeCount === 0) return
      
      // Find parent block element
      let node = selection.anchorNode
      // If node is text node, get parent
      if (node && node.nodeType === 3) {
        node = node.parentNode
      }
      
      // Traverse up to find a block element
      while (node && node !== doc.body) {
        const el = node as HTMLElement
        const display = typeof window !== 'undefined' ? window.getComputedStyle(el).display : 'block'
        
        // Simple check for block elements or common text containers
        if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'BLOCKQUOTE'].includes(el.nodeName) || display === 'block') {
          el.style.lineHeight = value
          break
        }
        node = node.parentNode
      }
    }),

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

  // Handle format painter auto-apply
  useEffect(() => {
    if (!isFormatPainterActive) return

    const doc = getIframeDoc()
    if (!doc) return

    const handleMouseUp = () => {
      const selection = doc.getSelection()
      if (selection && !selection.isCollapsed) {
        // Apply styles and deactivate
        applySavedStyles(doc)
        setIsFormatPainterActive(false)
        savedStylesRef.current = {}
      }
    }

    doc.addEventListener('mouseup', handleMouseUp)
    return () => {
      doc.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isFormatPainterActive])

  return {
    commands,
    isFormatPainterActive,
    isUpdating: isUpdatingRef.current,
    getIframeDoc
  }
}
