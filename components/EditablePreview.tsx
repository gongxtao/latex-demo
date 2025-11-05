'use client'

import { useState, useEffect, useRef } from 'react'

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

  // Helper function to get node path
  const getNodePath = (node: Node): number[] => {
    const path: number[] = []
    let current: Node | null = node
    
    while (current && current.parentNode) {
      const parent = current.parentNode
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
  const saveSelection = (iframeDoc: Document) => {
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
  }

  // Restore selection after update
  const restoreSelection = (iframeDoc: Document) => {
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
  }

  // Setup editable iframe when content loads
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
        `
        iframeDoc.head.appendChild(style)

        // Listen for changes
        const handleInput = () => {
          if (isUpdatingRef.current) return
          
          isUpdatingRef.current = true
          const newHtml = iframeDoc.documentElement.outerHTML
          onContentChange(newHtml)
          
          // Reset flag after a short delay
          setTimeout(() => {
            isUpdatingRef.current = false
          }, 50)
        }

        iframeDoc.body.addEventListener('input', handleInput)
        
        return () => {
          iframeDoc.body.removeEventListener('input', handleInput)
        }
      }
    } else {
      // Make it non-editable
      if (iframeDoc.body) {
        iframeDoc.body.contentEditable = 'false'
      }
    }
  }, [content, isEditing, onContentChange, previewKey])

  const toggleEditMode = () => {
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
            Click "Lock Preview" when done editing, then save your changes.
          </p>
        </div>
      )}
    </div>
  )
}

