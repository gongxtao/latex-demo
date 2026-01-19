'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import debounce from 'lodash/debounce'
import EditorToolbar from './EditorToolbar'
import useHistory from './hooks/useHistory'
import ImageResizer from './ImageResizer'

interface EditablePreviewProps {
  selectedFile: string | null
  content: string
  onContentChange: (content: string) => void
  isGenerating?: boolean
}

export default function EditablePreview({ selectedFile, content, onContentChange, isGenerating = false }: EditablePreviewProps) {
  const [isEditing, setIsEditing] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [previewKey, setPreviewKey] = useState(0)
  const scrollPositionRef = useRef({ x: 0, y: 0 })
  const isInitialLoadRef = useRef(true)
  const selectionRef = useRef<{ startPath: number[], startOffset: number, endPath: number[], endOffset: number } | null>(null)
  const isUpdatingRef = useRef(false)
  const globalClickHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)
  const lastSyncedContentRef = useRef(content)
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [iframeBody, setIframeBody] = useState<HTMLElement | null>(null)
  
  // History management
  const { push: pushHistory, undo, redo, canUndo, canRedo } = useHistory(content)

  // Create debounced sync function
  const debouncedSync = useMemo(
    () => debounce((newHtml: string) => {
      onContentChange(newHtml)
      lastSyncedContentRef.current = newHtml
      pushHistory(newHtml)
    }, 1000),
    [onContentChange, pushHistory]
  )

  // Cancel debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSync.cancel()
    }
  }, [debouncedSync])

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

  // Handle input changes
  const handleInput = useCallback(() => {
    if (isUpdatingRef.current) return
    isUpdatingRef.current = true
    const iframeDoc = iframeRef.current?.contentDocument
    if (!iframeDoc) return
    const newHtml = iframeDoc.documentElement.outerHTML
    debouncedSync(newHtml)
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 50)
  }, [debouncedSync])

  const handleUndo = useCallback(() => {
    debouncedSync.flush()
    const newHtml = undo()
    if (newHtml !== null) {
      onContentChange(newHtml)
    }
  }, [undo, onContentChange, debouncedSync])

  const handleRedo = useCallback(() => {
    debouncedSync.flush()
    const newHtml = redo()
    if (newHtml !== null) {
      onContentChange(newHtml)
    }
  }, [redo, onContentChange, debouncedSync])

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
    iframeDoc.close()
    
    // Enable CSS mode for execCommand
    try {
      iframeDoc.execCommand('styleWithCSS', false, 'true')
    } catch (e) {
      console.warn('Failed to enable styleWithCSS', e)
    }
    
    if (iframeDoc.body) {
      setIframeBody(iframeDoc.body)
    }

    // Create global click handler and store reference for cleanup
    // Use event delegation at document level
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Select image
      if (target.tagName === 'IMG') {
        setSelectedImage(target as HTMLImageElement)
        return
      }
      
      // Don't deselect if clicking on resizer handle
      if (target.classList.contains('resizer-handle')) {
        return
      }

      // Deselect otherwise
      setSelectedImage(null)
    }

    // Store reference for cleanup
    globalClickHandlerRef.current = handleGlobalClick

    // Add without event capture to let other events work normally
    setTimeout(() => {
      iframeDoc.addEventListener('click', handleGlobalClick, false)
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
          
          const newHtml = iframeDoc.documentElement.outerHTML
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
        style.textContent = `
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
            iframeDoc.removeEventListener('click', globalClickHandlerRef.current, false)
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

  const toggleEditMode = () => {
    // If we're exiting edit mode, sync the latest content first
    if (isEditing) {
      const iframe = iframeRef.current
      const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document
      if (iframeDoc) {
        const latestHtml = iframeDoc.documentElement.outerHTML
        onContentChange(latestHtml)
      }
    }
    setIsEditing(!isEditing)
    setPreviewKey(prev => prev + 1)
  }

  const handleRefresh = () => {
    setPreviewKey(prev => prev + 1)
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
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Editable Preview Area */}
      <div className="flex-1 overflow-auto bg-gray-50 p-4">
        {selectedFile ? (
          <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden relative">
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
            {iframeBody && createPortal(
              <ImageResizer 
                target={selectedImage}
                iframeDoc={iframeRef.current?.contentDocument || null}
                onUpdate={() => {
                  if (iframeRef.current?.contentDocument) {
                    const newHtml = iframeRef.current.contentDocument.documentElement.outerHTML
                    debouncedSync(newHtml)
                  }
                }}
              />,
              iframeBody
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

