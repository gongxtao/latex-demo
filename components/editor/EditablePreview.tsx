'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import EditorToolbar from './EditorToolbar'

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
    onContentChange(newHtml)
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 50)
  }, [onContentChange])

  // Image resize functionality
  const addImageResizer = (iframeDoc: Document) => {
    const images = iframeDoc.querySelectorAll('img')

    images.forEach((img) => {
      // Mark as initialized to prevent double-wrapping
      if (img.hasAttribute('data-image-resizer')) {
        return
      }
      img.setAttribute('data-image-resizer', 'true')

      // Create container
      const container = iframeDoc.createElement('div')
      container.className = 'image-container'
      container.style.position = 'relative'
      container.style.display = 'inline-block'
      container.style.lineHeight = '0'

      img.parentNode?.insertBefore(container, img)
      container.appendChild(img)
      img.style.display = 'block'

      // Create handles
      const handles = {
        tl: iframeDoc.createElement('div'),
        tr: iframeDoc.createElement('div'),
        bl: iframeDoc.createElement('div'),
        br: iframeDoc.createElement('div')
      }

      Object.values(handles).forEach(handle => {
        handle.className = 'image-resize-handle'
        handle.style.cssText = `
          position: absolute;
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          z-index: 10000;
          pointer-events: auto;
          display: none;
          box-shadow: 0 0 3px rgba(0,0,0,0.5);
        `
        container.appendChild(handle)
      })

      // Position handles
      const positionHandles = () => {
        handles.tl.style.left = '-6px'
        handles.tl.style.top = '-6px'
        handles.tl.style.cursor = 'nw-resize'

        handles.tr.style.left = `${img.offsetWidth - 6}px`
        handles.tr.style.top = '-6px'
        handles.tr.style.cursor = 'ne-resize'

        handles.bl.style.left = '-6px'
        handles.bl.style.top = `${img.offsetHeight - 6}px`
        handles.bl.style.cursor = 'sw-resize'

        handles.br.style.left = `${img.offsetWidth - 6}px`
        handles.br.style.top = `${img.offsetHeight - 6}px`
        handles.br.style.cursor = 'se-resize'
      }

      // Dragging
      let isDragging = false
      let startX = 0
      let startY = 0
      let startLeft = 0
      let startTop = 0
      let hasMoved = false

      img.addEventListener('mousedown', (e: MouseEvent) => {
        if (Object.values(handles).includes(e.target as any)) return

        e.preventDefault()
        e.stopPropagation()

        // Hide all handles first
        const allHandles = iframeDoc.querySelectorAll('.image-resize-handle')
        allHandles.forEach(h => (h as HTMLElement).style.display = 'none')

        // Show handles for this image
        showHandles()

        isDragging = true
        hasMoved = false
        startX = e.clientX
        startY = e.clientY
        startLeft = container.offsetLeft
        startTop = container.offsetTop

        const onMouseMove = (e: MouseEvent) => {
          if (!isDragging) return

          const dx = e.clientX - startX
          const dy = e.clientY - startY

          // Only change to absolute and start moving after moved more than 3px
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            hasMoved = true
            if (container.style.position !== 'absolute') {
              container.style.position = 'absolute'
              container.style.zIndex = '9999'
            }
            container.style.left = `${startLeft + dx}px`
            container.style.top = `${startTop + dy}px`
          }
        }

        const onMouseUp = () => {
          isDragging = false
          iframeDoc.removeEventListener('mousemove', onMouseMove)
          iframeDoc.removeEventListener('mouseup', onMouseUp)
        }

        iframeDoc.addEventListener('mousemove', onMouseMove)
        iframeDoc.addEventListener('mouseup', onMouseUp)
      })

      // Function to show handles
      const showHandles = () => {
        positionHandles()
        Object.values(handles).forEach(h => h.style.display = 'block')
      }

      // Resize
      Object.entries(handles).forEach(([corner, handle]) => {
        handle.addEventListener('mousedown', (e: MouseEvent) => {
          e.stopPropagation()
          e.preventDefault()

          const startX = e.clientX
          const startWidth = img.offsetWidth
          const ratio = startWidth / img.offsetHeight

          const onMouseMove = (e: MouseEvent) => {
            const dx = e.clientX - startX
            const newWidth = Math.max(20, startWidth + dx)
            const newHeight = newWidth / ratio

            img.style.width = `${newWidth}px`
            img.style.height = `${newHeight}px`
            positionHandles()
          }

          const onMouseUp = () => {
            iframeDoc.removeEventListener('mousemove', onMouseMove)
            iframeDoc.removeEventListener('mouseup', onMouseUp)
          }

          iframeDoc.addEventListener('mousemove', onMouseMove)
          iframeDoc.addEventListener('mouseup', onMouseUp)
        })
      })
    })

  }

  useEffect(() => {
    if (!iframeRef.current || !content) return
    if (isUpdatingRef.current) return // Prevent recursive updates

    const iframe = iframeRef.current
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

    if (!iframeDoc) return

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

    // Add image resize handles after content is rendered
    const initImageResizer = () => {
      addImageResizer(iframeDoc)
    }

    setTimeout(initImageResizer, 50)

    // Create global click handler and store reference for cleanup
    // Use event delegation at document level
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // Don't prevent event propagation - let image clicks work normally
      // Check if clicked on an image with resizer
      if (target.tagName === 'IMG' && target.hasAttribute('data-image-resizer')) {
        return
      }

      // Check if clicked on a handle
      if (target.classList && target.classList.contains('image-resize-handle')) {
        return
      }

      // Check if clicked on container
      if (target.classList && target.classList.contains('image-container')) {
        return
      }

      // Clicked outside - hide all visible handles
      const visibleHandles = iframeDoc.querySelectorAll('.image-resize-handle[style*="block"], .image-resize-handle:not([style*="none"])')
      visibleHandles.forEach(handle => {
        (handle as HTMLElement).style.display = 'none'
      })
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

              // Trigger image resizer initialization for the new image
              setTimeout(() => {
                const images = iframeDoc.querySelectorAll('img')
                const lastImage = images[images.length - 1]
                if (lastImage && !lastImage.hasAttribute('data-image-resizer')) {
                  // Manually trigger addImageResizer for this specific image
                  const container = iframeDoc.createElement('div')
                  container.className = 'image-container'
                  container.style.position = 'relative'
                  container.style.display = 'inline-block'
                  container.style.lineHeight = '0'

                  lastImage.parentNode?.insertBefore(container, lastImage)
                  container.appendChild(lastImage)
                  lastImage.style.display = 'block'
                  lastImage.setAttribute('data-image-resizer', 'true')

                  // Create handles for this image
                  const handles = {
                    tl: iframeDoc.createElement('div'),
                    tr: iframeDoc.createElement('div'),
                    bl: iframeDoc.createElement('div'),
                    br: iframeDoc.createElement('div')
                  }

                  Object.values(handles).forEach(handle => {
                    handle.className = 'image-resize-handle'
                    handle.style.cssText = `
                      position: absolute;
                      width: 12px;
                      height: 12px;
                      background: #3b82f6;
                      border: 2px solid white;
                      border-radius: 50%;
                      z-index: 10000;
                      pointer-events: auto;
                      display: block;
                      box-shadow: 0 0 3px rgba(0,0,0,0.5);
                    `
                    container.appendChild(handle)
                  })

                  // Position handles
                  const positionHandles = () => {
                    handles.tl.style.left = '-6px'
                    handles.tl.style.top = '-6px'
                    handles.tr.style.left = `${lastImage.offsetWidth - 6}px`
                    handles.tr.style.top = '-6px'
                    handles.bl.style.left = '-6px'
                    handles.bl.style.top = `${lastImage.offsetHeight - 6}px`
                    handles.br.style.left = `${lastImage.offsetWidth - 6}px`
                    handles.br.style.top = `${lastImage.offsetHeight - 6}px`
                  }

                  positionHandles()
                }
              }, 50)
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

      // Check for Delete key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Find visible handles (images being edited)
        const visibleHandles = iframeDoc.querySelectorAll('.image-resize-handle[style*="block"]')

        if (visibleHandles.length > 0) {
          e.preventDefault()
          e.stopPropagation()

          // Get the first visible handle's image
          const handle = visibleHandles[0] as HTMLElement
          const container = handle.parentElement
          const img = container?.querySelector('img')

          if (img && container) {
            // Remove container (which removes img and handles)
            container.remove()

            // Sync content change
            const newHtml = iframeDoc.documentElement.outerHTML
            onContentChange(newHtml)
          }
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

        return () => {
          iframeDoc.body.removeEventListener('input', handleInput)
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
        onContentChange={onContentChange}
        isEditing={!!selectedFile && isEditing}
        disabled={!selectedFile}
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

