'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import debounce from 'lodash/debounce'
import EditorToolbar from './EditorToolbar'
import useHistory from './hooks/useHistory'
import ImageResizer from './ImageResizer'
import FloatingImageLayer, { FloatingImageItem } from './FloatingImageLayer'
import TableSmartToolbar from './toolbar/TableSmartToolbar'

import { TableHandler } from './utils/table'

interface EditablePreviewProps {
  selectedFile: string | null
  content: string
  onContentChange: (content: string) => void
  floatingImages: FloatingImageItem[]
  onFloatingImagesChange: (images: FloatingImageItem[]) => void
  isGenerating?: boolean
}

export default function EditablePreview({
  selectedFile,
  content,
  onContentChange,
  floatingImages,
  onFloatingImagesChange,
  isGenerating = false
}: EditablePreviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [previewKey, setPreviewKey] = useState(0)
  const scrollPositionRef = useRef({ x: 0, y: 0 })
  const isInitialLoadRef = useRef(true)
  const selectionRef = useRef<{ startPath: number[], startOffset: number, endPath: number[], endOffset: number } | null>(null)
  const isUpdatingRef = useRef(false)
  const globalClickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)
  const lastSyncedContentRef = useRef(content)
  const floatingImagesRef = useRef(floatingImages)
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [iframeBody, setIframeBody] = useState<HTMLElement | null>(null)
  const [activeTable, setActiveTable] = useState<HTMLTableElement | null>(null)
  const [selectedFloatingImageId, setSelectedFloatingImageId] = useState<string | null>(null)
  const [iframeScroll, setIframeScroll] = useState({ x: 0, y: 0 })
  const previewContainerRef = useRef<HTMLDivElement>(null)
  
  // History management
  const { push: pushHistory, undo, redo, canUndo, canRedo } = useHistory({
    html: content,
    floatingImages
  })

  // Create debounced sync function
  const debouncedSync = useMemo(
    () => debounce((newHtml: string) => {
      onContentChange(newHtml)
      lastSyncedContentRef.current = newHtml
      pushHistory({ html: newHtml, floatingImages: floatingImagesRef.current })
    }, 1000),
    [onContentChange, pushHistory]
  )

  // Cancel debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSync.cancel()
    }
  }, [debouncedSync])

  useEffect(() => {
    floatingImagesRef.current = floatingImages
  }, [floatingImages])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const iframeDoc = iframe.contentDocument
    const iframeWindow = iframe.contentWindow
    if (!iframeDoc || !iframeWindow) return
    let rafId = 0
    const updateScroll = () => {
      const docEl = iframeDoc.documentElement
      const body = iframeDoc.body
      const x = docEl?.scrollLeft ?? body?.scrollLeft ?? 0
      const y = docEl?.scrollTop ?? body?.scrollTop ?? 0
      setIframeScroll({ x, y })
    }
    const handleScroll = () => {
      if (rafId !== 0) return
      rafId = iframeWindow.requestAnimationFrame(() => {
        rafId = 0
        updateScroll()
      })
    }
    updateScroll()
    iframeWindow.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (rafId !== 0) {
        iframeWindow.cancelAnimationFrame(rafId)
      }
      iframeWindow.removeEventListener('scroll', handleScroll)
    }
  }, [content, previewKey, isEditing])

  // Helper function to get node path
  const getNodePath = (node: Node): number[] => {
    const path: number[] = []
    let current: Node | null = node

    while (current && current.parentNode) {
      const parent = current.parentNode as Node
      const index = Array.from(parent.childNodes).indexOf(current as ChildNode)
      path.unshift(index)
      current = parent
      if (current === iframeRef.current?.contentDocument?.body) break
    }

    return path
  }

  // Helper function to get node from path
  const getNodeFromPath = (path: number[], root: Node): Node | null => {
    let current: Node | null = root

    for (const index of path) {
      if (!current || !current.childNodes[index]) return null
      current = current.childNodes[index]
    }

    return current
  }

  // Save selection before update
  const saveSelection = useCallback((iframeDoc: Document) => {
    const selection = iframeDoc.getSelection()
    if (!selection || selection.rangeCount === 0) {
      selectionRef.current = null
      return
    }

    const range = selection.getRangeAt(0)
    selectionRef.current = {
      startPath: getNodePath(range.startContainer),
      startOffset: range.startOffset,
      endPath: getNodePath(range.endContainer),
      endOffset: range.endOffset
    }
  }, [])

  // Restore selection after update
  const restoreSelection = useCallback((iframeDoc: Document) => {
    if (!selectionRef.current) return

    try {
      const selection = iframeDoc.getSelection()
      if (!selection) return

      const startNode = getNodeFromPath(selectionRef.current.startPath, iframeDoc.body)
      const endNode = getNodeFromPath(selectionRef.current.endPath, iframeDoc.body)

      if (startNode && endNode) {
        const range = iframeDoc.createRange()
        range.setStart(startNode, Math.min(selectionRef.current.startOffset, startNode.textContent?.length || 0))
        range.setEnd(endNode, Math.min(selectionRef.current.endOffset, endNode.textContent?.length || 0))

        selection.removeAllRanges()
        selection.addRange(range)

        // Keep focus
        if (iframeDoc.body) {
          iframeDoc.body.focus()
        }
      }
    } catch (e) {
      // If restoration fails, just continue
      console.warn('Failed to restore selection:', e)
    }
  }, [])

  // Helper to get clean HTML without editor artifacts
  const getCleanHtml = (doc: Document): string => {
    // Clone the document element to avoid modifying the live DOM
    const clone = doc.documentElement.cloneNode(true) as HTMLElement
    
    // Remove all resizer roots (handle potential duplicates from bad saves)
    const resizerRoots = clone.querySelectorAll('#image-resizer-root')
    resizerRoots.forEach(el => el.remove())
    
    // Remove all editor styles
    const editorStyles = clone.querySelectorAll('#editor-style')
    editorStyles.forEach(el => el.remove())

    // Remove contenteditable attributes from body and all children
    if (clone.tagName === 'BODY' || clone.querySelector('body')) {
       const body = clone.tagName === 'BODY' ? clone : clone.querySelector('body')
       if (body) {
         body.removeAttribute('contenteditable')
         body.removeAttribute('style') // Remove outline/cursor styles
         
         // Remove contenteditable from all descendants
         const editables = body.querySelectorAll('[contenteditable]')
         editables.forEach(el => el.removeAttribute('contenteditable'))
       }
    }
    
    return clone.outerHTML
  }

  // Handle input changes
  const handleInput = useCallback(() => {
    if (isUpdatingRef.current) return
    isUpdatingRef.current = true
    const iframeDoc = iframeRef.current?.contentDocument
    if (!iframeDoc) return
    
    const newHtml = getCleanHtml(iframeDoc)
    debouncedSync(newHtml)
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 50)
  }, [debouncedSync])

  const handleUndo = useCallback(() => {
    debouncedSync.flush()
    const nextState = undo()
    if (nextState !== null) {
      onContentChange(nextState.html)
      lastSyncedContentRef.current = nextState.html
      onFloatingImagesChange(nextState.floatingImages)
      setSelectedFloatingImageId(null)
    }
  }, [undo, onContentChange, debouncedSync, onFloatingImagesChange])

  const handleRedo = useCallback(() => {
    debouncedSync.flush()
    const nextState = redo()
    if (nextState !== null) {
      onContentChange(nextState.html)
      lastSyncedContentRef.current = nextState.html
      onFloatingImagesChange(nextState.floatingImages)
      setSelectedFloatingImageId(null)
    }
  }, [redo, onContentChange, debouncedSync, onFloatingImagesChange])

  // Image resize functionality moved to ImageResizer component

  useEffect(() => {
    if (!iframeRef.current || !content) return
    if (isUpdatingRef.current) return // Prevent recursive updates

    const iframe = iframeRef.current
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

    if (!iframeDoc) return

    // Check if we need to update
    const isIframeEmpty = !iframeDoc.body || iframeDoc.body.childNodes.length === 0
    // Only write if content is different from last synced (external update) OR if iframe is empty (reload/refresh)
    if (content === lastSyncedContentRef.current && !isIframeEmpty) {
      return
    }

    // If we are writing new content, cancel any pending debounced updates
    debouncedSync.cancel()
    lastSyncedContentRef.current = content

    // Save current state before updating
    if (!isInitialLoadRef.current && iframeDoc.body && isEditing) {
      // Save scroll position
      scrollPositionRef.current = {
        x: iframeDoc.documentElement.scrollLeft || iframeDoc.body.scrollLeft,
        y: iframeDoc.documentElement.scrollTop || iframeDoc.body.scrollTop
      }

      // Save selection
      saveSelection(iframeDoc)
    }

    // Write content to iframe
    iframeDoc.open()
    iframeDoc.write(content)
    // Inject a dedicated root for the resizer to avoid interference
    iframeDoc.write('<div id="image-resizer-root" style="position: absolute; top: 0; left: 0; width: 0; height: 0; overflow: visible; z-index: 2147483647;"></div>')
    iframeDoc.close()
    
    // Enable CSS mode for execCommand
    try {
      iframeDoc.execCommand('styleWithCSS', false, 'true')
    } catch (e) {
      console.warn('Failed to enable styleWithCSS', e)
    }
    
    if (iframeDoc.body) {
      // Find our dedicated root
      const resizerRoot = iframeDoc.getElementById('image-resizer-root')
      setIframeBody(resizerRoot || iframeDoc.body)
    }

    // Create global click handler and store reference for cleanup
    // Use event delegation at document level
    const handleGlobalClick = (e: MouseEvent) => {
      // If not in edit mode, prevent selection and interaction
      if (!isEditing) {
        setSelectedImage(null)
        setActiveTable(null)
        return
      }

      let target = e.target as HTMLElement
      // Handle text nodes (nodeType 3)
      if (target.nodeType === 3 && target.parentElement) {
        target = target.parentElement
      }
      
      // Select image
      if (target.tagName === 'IMG') {
        setSelectedImage(target as HTMLImageElement)
        return
      }

      // Detect table
      // Prioritize clicking inside a table cell to activate it
      const table = target.closest('table')
      if (table) {
          // If we are clicking a different table or no table was active, set it
          if (activeTable !== table) {
              setActiveTable(table as HTMLTableElement)
          }
      } else {
          // Only deselect if we are NOT clicking on the SmartToolbar
          // The SmartToolbar is outside the iframe, so clicks there won't trigger this iframe click listener.
          // BUT, we might be clicking empty space in iframe.
          setActiveTable(null)
          setSelectedImage(null)
      }
    }
    
    // Handle context menu to activate table
    const handleContextMenu = (e: MouseEvent) => {
        if (!isEditing) return
        let target = e.target as HTMLElement
        if (target.nodeType === 3 && target.parentElement) {
          target = target.parentElement
        }

        const table = target.closest('table')
        if (table) {
            setActiveTable(table as HTMLTableElement)
        }
    }
    
    // Handle global mousedown for deselection (more reliable than click)
    const handleGlobalMouseDown = (e: MouseEvent) => {
      if (!isEditing) return
      setSelectedFloatingImageId(null)
      
      let target = e.target as HTMLElement
      // Handle text nodes
      if (target.nodeType === 3 && target.parentElement) {
        target = target.parentElement
      }
      
      // Don't deselect if clicking on image or resizer handle
      if (target.tagName === 'IMG' || target.classList.contains('resizer-handle')) {
        return
      }
      
      // If clicking inside a table, activate it immediately
      const table = target.closest('table')
      if (table) {
          if (activeTable !== table) {
              setActiveTable(table as HTMLTableElement)
          }
          return
      }

      // Deselect image and table if clicking elsewhere
      setSelectedImage(null)
      setActiveTable(null)
    }
    
    // Handle mouseup as fallback for click (sometimes click is swallowed during editing)
    const handleMouseUp = (e: MouseEvent) => {
       if (!isEditing) return
       setSelectedFloatingImageId(null)
       const target = e.target as HTMLElement
       if (target.tagName === 'IMG') {
         setSelectedImage(target as HTMLImageElement)
       }
    }

    // Store reference for cleanup
    globalClickHandlerRef.current = handleGlobalClick

    // Add without event capture to let other events work normally
    setTimeout(() => {
      // Use capture for mousedown to ensure we catch it before any stopPropagation
      // Also bind to window to catch everything
      const win = iframeDoc.defaultView || window
      win.addEventListener('mousedown', handleGlobalMouseDown, true)
      iframeDoc.addEventListener('mousedown', handleGlobalMouseDown, true)
      iframeDoc.addEventListener('click', handleGlobalClick, false)
      iframeDoc.addEventListener('mouseup', handleMouseUp, false)
      iframeDoc.addEventListener('contextmenu', handleContextMenu, false)
      
      // Listen for selection changes to clear image selection when cursor moves elsewhere
      iframeDoc.addEventListener('selectionchange', () => {
        if (!isEditing) return
        
        const selection = iframeDoc.getSelection()
        
        // Check if selection is inside a table to activate it
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            let node = range.startContainer
            if (node.nodeType === 3 && node.parentElement) {
                node = node.parentElement
            }
            
            const element = node as HTMLElement
             const table = element.closest('table')
             
             if (table) {
                 setActiveTable(table as HTMLTableElement)
             } else {
                 setActiveTable(null)
             }
         }

        if (selection && !selection.isCollapsed) {
           setTimeout(() => {
             // Logic to clear image selection if needed
           }, 0)
        }
      })
    }, 100)

    // Add paste event handler for Ctrl+V image insertion
    const handlePaste = (e: ClipboardEvent) => {
      if (!isEditing) return

      const items = Array.from(e.clipboardData?.items || [])
      const imageItem = items.find(item => item.type.startsWith('image/'))

      if (imageItem) {
        e.preventDefault()
        const file = imageItem.getAsFile()

        if (file) {
          // Check file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            alert('粘贴失败：图片超过5MB，请压缩后重试')
            return
          }

          // Read file as data URL
          const reader = new FileReader()
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string
            if (dataUrl) {
              // Create image element
              const img = iframeDoc.createElement('img')
              img.src = dataUrl
              img.style.maxWidth = '100%'
              img.style.height = 'auto'

              // Get current selection
              const selection = iframeDoc.getSelection()
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0)
                range.deleteContents()
                range.insertNode(img)
                // Move cursor after image
                range.setStartAfter(img)
                range.setEndAfter(img)
                selection.removeAllRanges()
                selection.addRange(range)
              } else {
                // If no selection, append to body
                iframeDoc.body.appendChild(img)
              }
            }
          }
          reader.readAsDataURL(file)
        }
      }
    }

    // Add paste event listener
    iframeDoc.addEventListener('paste', handlePaste)

    // Add keydown event handler for Delete key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return

      // Handle Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        e.stopPropagation()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
        return
      }

      // Check for Delete key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedImage) {
          e.preventDefault()
          e.stopPropagation()
          selectedImage.remove()
          setSelectedImage(null)
          
          const newHtml = getCleanHtml(iframeDoc)
          debouncedSync(newHtml)
          return
        }
      }
    }

    // Add keydown event listener to document
    iframeDoc.addEventListener('keydown', handleKeyDown)

    // Restore state after content loads
    if (!isInitialLoadRef.current) {
      setTimeout(() => {
        if (iframeDoc.body) {
          // Restore scroll position
          iframeDoc.documentElement.scrollLeft = scrollPositionRef.current.x
          iframeDoc.documentElement.scrollTop = scrollPositionRef.current.y
          iframeDoc.body.scrollLeft = scrollPositionRef.current.x
          iframeDoc.body.scrollTop = scrollPositionRef.current.y

          // Restore selection if editing
          if (isEditing) {
            restoreSelection(iframeDoc)
          }
        }
      }, 0)
    } else {
      isInitialLoadRef.current = false
    }

    if (isEditing) {
      // Make the body editable
      if (iframeDoc.body) {
        iframeDoc.body.contentEditable = 'true'
        iframeDoc.body.style.outline = 'none'

        // Add editing styles
        const style = iframeDoc.createElement('style')
        style.id = 'editor-style'
        style.textContent = `
          html, body {
            min-height: 100%;
          }
          body[contenteditable="true"] {
            cursor: text;
          }
          body[contenteditable="true"]:focus {
            outline: 2px solid #3b82f6;
            outline-offset: -2px;
          }
          *[contenteditable="true"] {
            cursor: text;
          }
          img {
            cursor: move;
            max-width: 100%;
          }
        `
        iframeDoc.head.appendChild(style)

        iframeDoc.body.addEventListener('input', handleInput)

        // Add blur handler to flush changes immediately when focus leaves editor
        const handleBlur = () => {
          debouncedSync.flush()
        }
        iframeDoc.body.addEventListener('blur', handleBlur)

        return () => {
          iframeDoc.body.removeEventListener('input', handleInput)
          iframeDoc.body.removeEventListener('blur', handleBlur)
          // Remove global click handler
          if (globalClickHandlerRef.current) {
            const win = iframeDoc.defaultView || window
            win.removeEventListener('mousedown', handleGlobalMouseDown, true)
            iframeDoc.removeEventListener('click', globalClickHandlerRef.current, false)
            iframeDoc.removeEventListener('mousedown', handleGlobalMouseDown, true)
          }
        }
      }
    } else {
      // Make it non-editable
      if (iframeDoc.body) {
        iframeDoc.body.contentEditable = 'false'
      }
    }
  }, [content, isEditing, handleInput, onContentChange, restoreSelection, saveSelection])

  const toggleEditMode = useCallback(() => {
    // If we're exiting edit mode, sync the latest content first
    if (isEditing) {
      const iframe = iframeRef.current
      const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document
      if (iframeDoc) {
        const latestHtml = getCleanHtml(iframeDoc)
        onContentChange(latestHtml)
      }
      
      // Clear all selection states immediately
      setSelectedImage(null)
      setActiveTable(null)
      setSelectedFloatingImageId(null)
      // Clear iframe body to ensure Portals are unmounted
      setIframeBody(null)
    }
    
    // Toggle state
    setIsEditing(prev => !prev)
    setPreviewKey(prev => prev + 1)
  }, [isEditing, onContentChange])

  const handleRefresh = () => {
    setPreviewKey(prev => prev + 1)
  }

  const handleInsertFloatingImage = useCallback((imageUrl: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const baseWidth = 240
    const baseHeight = 160
    const container = previewContainerRef.current
    const rect = container?.getBoundingClientRect()
    const x = rect ? Math.max(0, Math.round(rect.width / 2 - baseWidth / 2)) : 20
    const y = rect ? Math.max(0, Math.round(rect.height / 2 - baseHeight / 2)) : 20

    const nextImages = [
      ...floatingImagesRef.current,
      { id, src: imageUrl, x, y, width: baseWidth, height: baseHeight }
    ]
    onFloatingImagesChange(nextImages)

    const loader = new Image()
    loader.onload = () => {
      const naturalWidth = loader.naturalWidth || baseWidth
      const naturalHeight = loader.naturalHeight || baseHeight
      const targetWidth = Math.min(320, naturalWidth)
      const targetHeight = Math.round(targetWidth * (naturalHeight / naturalWidth))
      const containerRect = previewContainerRef.current?.getBoundingClientRect()
      const centeredX = containerRect ? Math.max(0, Math.round(containerRect.width / 2 - targetWidth / 2)) : x
      const centeredY = containerRect ? Math.max(0, Math.round(containerRect.height / 2 - targetHeight / 2)) : y
      const resizedImages = floatingImagesRef.current.map(item =>
        item.id === id
          ? { ...item, width: targetWidth, height: targetHeight, x: centeredX, y: centeredY }
          : item
      )
      onFloatingImagesChange(resizedImages)
      pushHistory({ html: lastSyncedContentRef.current, floatingImages: resizedImages })
    }
    loader.src = imageUrl
  }, [onFloatingImagesChange, pushHistory])

  const handleFloatingImagesCommit = useCallback(() => {
    pushHistory({ html: lastSyncedContentRef.current, floatingImages: floatingImagesRef.current })
  }, [pushHistory])

  const handleTableAction = (action: string, payload?: any) => {
    if (!activeTable) return
    const handler = new TableHandler(activeTable)
    const index = payload?.index
    const preserveSizes = () => {
      const rowHeights = Array.from(activeTable.rows).map(row => row.getBoundingClientRect().height)
      const colWidths = handler.getColumnMetrics().map(col => col.width)
      return { rowHeights, colWidths }
    }
    const restoreSizes = (sizes: { rowHeights: number[]; colWidths: number[] }) => {
      const nextHandler = new TableHandler(activeTable)
      sizes.rowHeights.forEach((height, rowIndex) => {
        nextHandler.setRowHeight(rowIndex, height)
      })
      nextHandler.applyColumnWidths(sizes.colWidths)
    }

    switch (action) {
      case 'insertRowBefore':
      case 'insertRowAfter':
      case 'deleteRow':
        if (index !== undefined) {
             const row = activeTable.rows[index]
             if (row && row.cells.length > 0) {
                 // Use the first cell of the row as reference
                 const cell = row.cells[0]
                 if (action === 'insertRowBefore') handler.insertRowBefore(cell)
                 if (action === 'insertRowAfter') handler.insertRowAfter(cell)
                 if (action === 'deleteRow') handler.deleteRow(cell)
             }
        }
        break
      case 'insertColumnBefore':
      case 'insertColumnAfter':
      case 'deleteColumn':
        if (index !== undefined && activeTable.rows.length > 0) {
             if (action === 'deleteColumn') {
               handler.deleteColumnAt(index)
             } else {
               const cell = activeTable.rows[0].cells[index]
               if (cell) {
                 if (action === 'insertColumnBefore') handler.insertColumnBefore(cell)
                 if (action === 'insertColumnAfter') handler.insertColumnAfter(cell)
               }
             }
        }
        break
      case 'deleteTable':
        handler.deleteTable()
        setActiveTable(null)
        break
      case 'mergeCells':
        if (payload?.bounds) {
             const sizes = preserveSizes()
             const { startRow, endRow, startCol, endCol } = payload.bounds
             const cells: HTMLTableCellElement[] = []
             for (let r = startRow; r <= endRow; r++) {
                 for (let c = startCol; c <= endCol; c++) {
                     const cell = handler.getCellAt(r, c)
                     if (cell && !cells.includes(cell)) {
                         cells.push(cell)
                     }
                 }
             }
             if (cells.length > 1) {
               handler.mergeCells(cells)
               restoreSizes(sizes)
             }
        }
        break
      case 'splitCell':
        if (payload?.bounds) {
             const sizes = preserveSizes()
             const cell = handler.getCellAt(payload.bounds.startRow, payload.bounds.startCol)
             if (cell) {
               handler.splitCell(cell)
               restoreSizes(sizes)
             }
        }
        break
      case 'valignTop':
      case 'valignMiddle':
      case 'valignBottom':
        if (payload?.bounds) {
             const { startRow, endRow, startCol, endCol } = payload.bounds
             for (let r = startRow; r <= endRow; r++) {
                 for (let c = startCol; c <= endCol; c++) {
                     const cell = handler.getCellAt(r, c)
                     if (cell) {
                         if (action === 'valignTop') cell.style.verticalAlign = 'top'
                         if (action === 'valignMiddle') cell.style.verticalAlign = 'middle'
                         if (action === 'valignBottom') cell.style.verticalAlign = 'bottom'
                     }
                 }
             }
        }
        break
      case 'resizeRow':
        if (index !== undefined && typeof payload?.size === 'number') {
             handler.setRowHeight(index, payload.size)
        }
        break
      case 'resizeColumn':
        if (index !== undefined && typeof payload?.size === 'number') {
             const currentWidths = handler.getColumnMetrics().map(col => col.width)
             currentWidths[index] = payload.size
             handler.applyColumnWidths(currentWidths)
             const totalWidth = currentWidths.reduce((sum, width) => sum + width, 0)
             activeTable.style.width = `${totalWidth}px`
             activeTable.style.tableLayout = 'fixed'
        }
        break
    }

    // Trigger sync
    if (iframeRef.current?.contentDocument) {
      const newHtml = getCleanHtml(iframeRef.current.contentDocument)
      debouncedSync(newHtml)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-50 border-b border-gray-300 px-4 py-2">
        <div className="text-sm font-medium text-gray-700">
          {selectedFile ? (
            <>
              <span>Editing: {selectedFile.split('/').pop()?.replace('.html', '')}</span>
              {isEditing && (
                <span className="ml-3 text-green-600 font-semibold">
                  ✏️ Edit Mode Active - Click anywhere to edit
                </span>
              )}
            </>
          ) : (
            'Please select an HTML file'
          )}
        </div>
      <div className="flex space-x-2">
        <button
          onClick={toggleEditMode}
          disabled={!selectedFile}
          className={`px-4 py-2 rounded-lg transition-colors font-medium ${
            isEditing
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } disabled:bg-gray-300 disabled:cursor-not-allowed`}
        >
          {isEditing ? '🔒 Lock Preview' : '✏️ Enable Editing'}
        </button>
        <button
          onClick={handleRefresh}
          disabled={!selectedFile}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          title="Refresh Preview"
        >
          🔄 Refresh
        </button>
      </div>
    </div>

      {/* EditorToolbar with minimal props */}
      <EditorToolbar
        iframeRef={iframeRef}
        onContentChange={debouncedSync}
        isEditing={!!selectedFile && isEditing}
        disabled={!selectedFile}
        onFloatingImageInsert={handleInsertFloatingImage}
      />

      {/* Editable Preview Area */}
      <div 
        className="flex-1 overflow-auto bg-gray-50 p-4 relative"
        onMouseDown={(e) => {
          // Clear selection when clicking on the gray background area
          if (isEditing && e.target === e.currentTarget) {
            setSelectedImage(null)
            setActiveTable(null)
            setSelectedFloatingImageId(null)
          }
        }}
      >
        {selectedFile ? (
          <div 
            className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden relative"
            ref={previewContainerRef}
            onMouseDown={(e) => {
              // Also clear when clicking on the paper margin (if any)
              if (isEditing && e.target === e.currentTarget) {
                setSelectedImage(null)
                setActiveTable(null)
                setSelectedFloatingImageId(null)
              }
            }}
          >
            {/* Generating Overlay */}
            {isGenerating && (
              <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white px-4 py-2 z-10 flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-medium">✨ Generating your resume in real-time...</span>
              </div>
            )}
            <iframe
              key={previewKey}
              ref={iframeRef}
              className="w-full h-full min-h-[800px] border-0"
              title="Editable Preview"
            />
            {selectedFile && floatingImages.length > 0 && (
              <FloatingImageLayer
                images={floatingImages}
                onChange={onFloatingImagesChange}
                isEditing={isEditing}
                selectedId={selectedFloatingImageId}
                onSelect={setSelectedFloatingImageId}
                onCommit={handleFloatingImagesCommit}
                scrollOffset={iframeScroll}
              />
            )}
            {/* Render resizer outside iframe but position it over it, OR render inside if using Portal correctly */}
            {isEditing && iframeBody && createPortal(
        <ImageResizer 
          target={selectedImage}
          iframeDoc={iframeRef.current?.contentDocument || null}
          onUpdate={() => {
            if (iframeRef.current?.contentDocument) {
              const newHtml = getCleanHtml(iframeRef.current.contentDocument)
              debouncedSync(newHtml)
            }
          }}
        />,
        iframeBody
      )}

      {/* Table Smart Toolbar */}
      {isEditing && activeTable && (
        <TableSmartToolbar
          iframeRef={iframeRef}
          activeTable={activeTable}
          onAction={handleTableAction}
        />
      )}
    </div>
  ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-lg">
            Please select an HTML file to start editing
          </div>
        )}
      </div>

      {/* Editing Tips */}
      {isEditing && selectedFile && (
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-2">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Click anywhere in the preview to edit text directly.
            Use the toolbar to format text, add links, images, and tables.
            Click &quot;Lock Preview&quot; when done editing, then save your changes.
          </p>
        </div>
      )}
    </div>
  )
}
