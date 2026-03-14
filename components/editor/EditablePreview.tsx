'use client'

import { useState, useEffect, useRef, useCallback, useMemo, RefObject, Ref, forwardRef, useImperativeHandle } from 'react'
import { createPortal } from 'react-dom'
import debounce from 'lodash/debounce'
import EditorToolbar from './EditorToolbar'
import { HistoryManager } from '@/lib/editor-core'
import type { EditorState } from '@/lib/editor-core'
import ImageResizer from './ImageResizer'
import FloatingImageLayer, { FloatingImageItem } from './FloatingImageLayer'
import TableSmartToolbar from './toolbar/TableSmartToolbar'
import { useEditablePreviewInteractions } from './hooks/useEditablePreviewInteractions'
import { useEditablePreviewContentSync } from './hooks/useEditablePreviewContentSync'

import { TableHandler } from './utils/table'

const EDITOR_STYLE_CSS = `
  html, body {
    min-height: 100%;
  }
  body p, body div, body h1, body h2, body h3, body h4, body h5, body h6, body blockquote {
    margin: 0;
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
  @media print {
    @page {
      size: A4;
      margin: 0;
    }
    html, body {
      width: 210mm;
      margin: 0 auto;
      padding: 0;
    }
    body {
      padding: 15mm;
      box-sizing: border-box;
    }
    body[contenteditable="true"]:focus {
      outline: none;
    }
  }
`

interface EditablePreviewProps {
  selectedFile: string | null
  content: string
  onContentChange: (content: string) => void
  floatingImages: FloatingImageItem[]
  onFloatingImagesChange: (images: FloatingImageItem[]) => void
  isGenerating?: boolean
  initialEditing?: boolean
  hideControls?: boolean
  hideToolbar?: boolean
  iframeRef?: RefObject<HTMLIFrameElement>
  previewRef?: Ref<EditablePreviewRef>
}

// Exposed methods for parent components
export interface EditablePreviewRef {
  insertFloatingImage: (imageUrl: string) => void
}

/**
 * 转换为 EditorState 格式
 */
function toEditorState(content: string, floatingImages: FloatingImageItem[]): EditorState {
  return {
    content,
    floatingImages,
    isEditing: false,
    readonly: false,
    selection: null,
    selectedImage: null,
    selectedFloatingImageId: null,
    activeTable: null,
    toolbarVisible: true,
    sidebarVisible: false
  }
}

/**
 * 从 EditorState 转换回来
 */
function fromEditorState(state: EditorState): { html: string; floatingImages: FloatingImageItem[] } {
  return {
    html: state.content,
    floatingImages: state.floatingImages
  }
}

const EditablePreviewWithRef = function EditablePreview({
  selectedFile,
  content,
  onContentChange,
  floatingImages,
  onFloatingImagesChange,
  isGenerating = false,
  initialEditing = false,
  hideControls = false,
  hideToolbar = false,
  iframeRef: externalIframeRef,
  previewRef: externalPreviewRef
}: EditablePreviewProps) {
  const [isEditing, setIsEditing] = useState(initialEditing)
  const internalIframeRef = useRef<HTMLIFrameElement>(null)
  // Use external ref if provided, otherwise use internal ref
  const iframeRef = (externalIframeRef || internalIframeRef) as RefObject<HTMLIFrameElement>
  const [previewKey, setPreviewKey] = useState(0)
  const scrollPositionRef = useRef({ x: 0, y: 0 })
  const isInitialLoadRef = useRef(true)
  const selectionRef = useRef<{ startPath: number[], startOffset: number, endPath: number[], endOffset: number } | null>(null)
  const isUpdatingRef = useRef(false)
  const lastSyncedContentRef = useRef(content)
  const forceContentSyncRef = useRef(false)
  const floatingImagesRef = useRef(floatingImages)
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const selectedImageRef = useRef<HTMLImageElement | null>(null)
  const [iframeBody, setIframeBody] = useState<HTMLElement | null>(null)
  const [activeTable, setActiveTable] = useState<HTMLTableElement | null>(null)
  const activeTableRef = useRef<HTMLTableElement | null>(null)
  const [selectedFloatingImageId, setSelectedFloatingImageId] = useState<string | null>(null)
  const selectedFloatingImageIdRef = useRef<string | null>(null)
  const [iframeScroll, setIframeScroll] = useState({ x: 0, y: 0 })
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const updateLockTimeoutRef = useRef<number | null>(null)
  const restoreStateTimeoutRef = useRef<number | null>(null)

  // HistoryManager - 直接使用核心引擎
  const historyManagerRef = useRef<HistoryManager | null>(null)
  if (!historyManagerRef.current) {
    historyManagerRef.current = new HistoryManager(50)
    // 初始化
    historyManagerRef.current.initialize(toEditorState(content, floatingImages))
  }
  const historyManager = historyManagerRef.current

  // Create debounced sync function
  const debouncedSync = useMemo(
    () => debounce((newHtml: string) => {
      onContentChange(newHtml)
      lastSyncedContentRef.current = newHtml
      // 保存到历史
      historyManager.push(toEditorState(newHtml, floatingImagesRef.current))
    }, 1000),
    [onContentChange, historyManager]
  )

  // Cancel debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSync.cancel()
      const updateLockTimeout = updateLockTimeoutRef.current
      if (updateLockTimeout !== null) {
        window.clearTimeout(updateLockTimeout)
      }
    }
  }, [debouncedSync])

  // 同步 floatingImages
  useEffect(() => {
    floatingImagesRef.current = floatingImages
  }, [floatingImages])

  // 同步 selectedFloatingImageId
  useEffect(() => {
    selectedFloatingImageIdRef.current = selectedFloatingImageId
  }, [selectedFloatingImageId])

  useEffect(() => {
    selectedImageRef.current = selectedImage
  }, [selectedImage])

  useEffect(() => {
    activeTableRef.current = activeTable
  }, [activeTable])

  // 监听外部 content 变化，触发 iframe 同步
  useEffect(() => {
    if (content !== lastSyncedContentRef.current && !isUpdatingRef.current) {
      forceContentSyncRef.current = true
    }
  }, [content])

  // iframe scroll tracking
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
  }, [previewKey, iframeRef])

  // Helper function to get node path
  const getNodePath = useCallback((node: Node): number[] => {
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
  }, [iframeRef])

  const handleSelectFloatingImage = useCallback((id: string | null) => {
    selectedFloatingImageIdRef.current = id
    setSelectedFloatingImageId(id)
    if (id) {
      setSelectedImage(null)
      setActiveTable(null)
    }
  }, [])

  // Helper function to get node from path
  const getNodeFromPath = useCallback((path: number[], root: Node): Node | null => {
    let current: Node | null = root

    for (const index of path) {
      if (!current || !current.childNodes[index]) return null
      current = current.childNodes[index]
    }

    return current
  }, [])

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
  }, [getNodePath])

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
  }, [getNodeFromPath])

  // Helper to get clean HTML without editor artifacts
  const getCleanHtml = useCallback((doc: Document): string => {
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
         const blocks = body.querySelectorAll('p,div,h1,h2,h3,h4,h5,h6,blockquote')
         blocks.forEach(el => {
           const text = el.textContent?.replace(/[\u00A0\u200B]/g, '').trim() || ''
           const hasNonBrElement = Array.from(el.children).some(child => child.tagName !== 'BR')
           const hasMeaningfulElement = el.querySelector('img,table,svg,video,iframe')
           if (!text && !hasNonBrElement && !hasMeaningfulElement) {
             el.remove()
           }
         })
       }
    }

    return clone.outerHTML
  }, [])

  // Handle input changes
  const handleInput = useCallback(() => {
    if (isUpdatingRef.current) return
    isUpdatingRef.current = true
    const iframeDoc = iframeRef.current?.contentDocument
    if (!iframeDoc) return

    const newHtml = getCleanHtml(iframeDoc)
    debouncedSync(newHtml)
    if (updateLockTimeoutRef.current !== null) {
      window.clearTimeout(updateLockTimeoutRef.current)
    }
    updateLockTimeoutRef.current = window.setTimeout(() => {
      isUpdatingRef.current = false
    }, 50)
  }, [debouncedSync, getCleanHtml, iframeRef])

  const handleUndo = useCallback(() => {
    debouncedSync.flush()
    const previous = historyManager.undo()
    if (previous !== null) {
      const { html, floatingImages: newImages } = fromEditorState(previous)
      forceContentSyncRef.current = true
      onContentChange(html)
      lastSyncedContentRef.current = html
      onFloatingImagesChange(newImages)
      handleSelectFloatingImage(null)
    }
  }, [historyManager, onContentChange, debouncedSync, onFloatingImagesChange, handleSelectFloatingImage])

  const handleRedo = useCallback(() => {
    debouncedSync.flush()
    const next = historyManager.redo()
    if (next !== null) {
      const { html, floatingImages: newImages } = fromEditorState(next)
      forceContentSyncRef.current = true
      onContentChange(html)
      lastSyncedContentRef.current = html
      onFloatingImagesChange(newImages)
      handleSelectFloatingImage(null)
    }
  }, [historyManager, onContentChange, debouncedSync, onFloatingImagesChange, handleSelectFloatingImage])

  // 暴露历史操作方法
  const canUndo = historyManager.canUndo()
  const canRedo = historyManager.canRedo()
  const canUndoRef = useRef(canUndo)
  const canRedoRef = useRef(canRedo)

  useEffect(() => {
    canUndoRef.current = canUndo
    canRedoRef.current = canRedo
  }, [canUndo, canRedo])

  const isAtLineEnd = useCallback((range: Range): boolean => {
    const endContainer = range.endContainer
    const endOffset = range.endOffset

    if (endContainer.nodeType === Node.TEXT_NODE) {
      const textNode = endContainer as Text
      if (endOffset < textNode.length) {
        return false
      }
      const parent = endContainer.parentNode
      if (parent && parent.nextSibling) {
        let nextSibling: ChildNode | null = parent.nextSibling
        while (nextSibling) {
          if (nextSibling.nodeType === Node.TEXT_NODE) {
            const text = (nextSibling as Text).textContent?.trim()
            if (text && text.length > 0) {
              return false
            }
          } else if (nextSibling.nodeType === Node.ELEMENT_NODE) {
            const element = nextSibling as Element
            if (element.tagName !== 'BR') {
              return false
            }
          }
          nextSibling = nextSibling.nextSibling
        }
      }
      return true
    }

    if (endContainer.nodeType === Node.ELEMENT_NODE) {
      const element = endContainer as Element
      const childNodes = Array.from(element.childNodes)
      for (let i = endOffset; i < childNodes.length; i++) {
        const child = childNodes[i]
        if (child.nodeType === Node.TEXT_NODE) {
          const text = (child as Text).textContent?.trim()
          if (text && text.length > 0) {
            return false
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          if ((child as Element).tagName !== 'BR') {
            return false
          }
        }
      }
      return true
    }

    return false
  }, [])

  useEditablePreviewContentSync({
    iframeRef,
    content,
    isEditing,
    isUpdatingRef,
    forceContentSyncRef,
    lastSyncedContentRef,
    isInitialLoadRef,
    scrollPositionRef,
    restoreStateTimeoutRef,
    saveSelection,
    restoreSelection,
    debouncedSync,
    setIframeBody,
    handleInput,
    editorStyleCss: EDITOR_STYLE_CSS
  })

  useEditablePreviewInteractions({
    iframeRef,
    isEditing,
    activeTableRef,
    selectedImageRef,
    selectedFloatingImageIdRef,
    floatingImagesRef,
    canUndoRef,
    canRedoRef,
    setSelectedImage,
    setActiveTable,
    handleSelectFloatingImage,
    onFloatingImagesChange,
    onFloatingImageDelete: (nextImages) => {
      historyManager.push(toEditorState(lastSyncedContentRef.current, nextImages))
    },
    handleUndo,
    handleRedo,
    isAtLineEnd,
    getCleanHtml,
    debouncedSync
  })

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
      handleSelectFloatingImage(null)
      // Clear iframe body to ensure Portals are unmounted
      setIframeBody(null)
    }

    // Toggle state
    setIsEditing(prev => !prev)
    setPreviewKey(prev => prev + 1)
  }, [isEditing, onContentChange, handleSelectFloatingImage, getCleanHtml, iframeRef])

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
    floatingImagesRef.current = nextImages
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
      const resizedImages = nextImages.map(item =>
        item.id === id
          ? { ...item, width: targetWidth, height: targetHeight, x: centeredX, y: centeredY }
          : item
      )
      floatingImagesRef.current = resizedImages
      onFloatingImagesChange(resizedImages)
      historyManager.push(toEditorState(lastSyncedContentRef.current, resizedImages))
    }
    loader.src = imageUrl
  }, [onFloatingImagesChange, historyManager])

  const handleFloatingImagesCommit = useCallback(() => {
    historyManager.push(toEditorState(lastSyncedContentRef.current, floatingImagesRef.current))
  }, [historyManager])

  // Expose insertFloatingImage method to parent components via previewRef
  useImperativeHandle(externalPreviewRef, () => ({
    insertFloatingImage: handleInsertFloatingImage
  }), [handleInsertFloatingImage])

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
      {/* Control Buttons - only show if not hidden */}
      {!hideControls && (
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
      )}

      {/* EditorToolbar - only show if not hidden */}
      {!hideToolbar && (
        <EditorToolbar
          iframeRef={iframeRef}
          onContentChange={debouncedSync}
          isEditing={!!selectedFile && isEditing}
          disabled={!selectedFile}
          onFloatingImageInsert={handleInsertFloatingImage}
          onUndo={handleUndo}
          onRedo={handleRedo}
          refreshToken={previewKey}
        />
      )}

      {/* Editable Preview Area */}
      <div
        className="flex-1 overflow-auto bg-gray-50 p-4 relative"
        onMouseDown={(e) => {
          // Clear selection when clicking on the gray background area
          if (isEditing && e.target === e.currentTarget) {
            setSelectedImage(null)
            setActiveTable(null)
            handleSelectFloatingImage(null)
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
                handleSelectFloatingImage(null)
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
              sandbox="allow-same-origin allow-modals"
            />
            {selectedFile && floatingImages.length > 0 && (
              <FloatingImageLayer
                images={floatingImages}
                onChange={onFloatingImagesChange}
                isEditing={isEditing}
                selectedId={selectedFloatingImageId}
                onSelect={handleSelectFloatingImage}
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
    </div>
  )
}

// Forward ref and export
const EditablePreview = forwardRef<EditablePreviewRef, EditablePreviewProps>((props, ref) => {
  // Use ref as previewRef to expose insertFloatingImage method
  const enhancedProps = { ...props, previewRef: ref }
  return <EditablePreviewWithRef {...enhancedProps} />
})

EditablePreview.displayName = 'EditablePreview'

export default EditablePreview
