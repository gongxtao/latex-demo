'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import EditorToolbar, { EditorToolbarProps } from '@/components/editor/EditorToolbar'

interface UnifiedToolbarProps extends EditorToolbarProps {
  onNewDocument: () => void
  onOpenTemplateModal: () => void
  onCopyHTML: () => void
  onExportPDF: () => void
  saveStatus?: 'saving' | 'saved' | 'unsaved'
}

export default function UnifiedToolbar({
  onNewDocument,
  onOpenTemplateModal,
  onCopyHTML,
  onExportPDF,
  saveStatus,
  ...toolbarProps
}: UnifiedToolbarProps) {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false)
  const fileMenuRef = useRef<HTMLDivElement>(null)
  const [fileMenuPosition, setFileMenuPosition] = useState({ top: 0, left: 0 })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setIsFileMenuOpen(false)
      }
    }

    if (isFileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isFileMenuOpen])

  // Calculate file menu position when it opens
  useEffect(() => {
    if (isFileMenuOpen && fileMenuRef.current) {
      const rect = fileMenuRef.current.getBoundingClientRect()
      setFileMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      })
    }
  }, [isFileMenuOpen])

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return '保存中...'
      case 'saved':
        return '已保存'
      case 'unsaved':
        return '未保存'
      default:
        return ''
    }
  }

  const getSaveStatusColor = () => {
    switch (saveStatus) {
      case 'saving':
        return 'text-blue-600'
      case 'saved':
        return 'text-green-600'
      case 'unsaved':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  const fileMenuContent = (
    <div
      className="absolute w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]"
      style={{
        top: `${fileMenuPosition.top}px`,
        left: `${fileMenuPosition.left}px`
      }}
    >
      <div className="py-1">
        <button
          onClick={() => {
            onNewDocument()
            setIsFileMenuOpen(false)
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建空白文档
        </button>
        <button
          onClick={() => {
            onOpenTemplateModal()
            setIsFileMenuOpen(false)
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          选择模板...
        </button>
        <hr className="my-1 border-gray-200" />
        <button
          onClick={() => {
            onCopyHTML()
            setIsFileMenuOpen(false)
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          复制 HTML
        </button>
        <button
          onClick={() => {
            onExportPDF()
            setIsFileMenuOpen(false)
          }}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          导出 PDF
        </button>
      </div>
    </div>
  )

  return (
    <div className="sticky top-0 z-50 flex flex-col bg-white border-b border-gray-300 shadow-sm">
      {/* Main Toolbar Row */}
      <div className="flex items-center px-2 py-1 gap-2">
        {/* File Menu Dropdown */}
        <div className="relative" ref={fileMenuRef}>
          <button
            onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded flex items-center gap-1"
          >
            <span>文件</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Editor Toolbar */}
        <div className="flex-1">
          <EditorToolbar {...toolbarProps} />
        </div>

        {/* Save Status */}
        <div className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap ${getSaveStatusColor()}`}>
          {getSaveStatusText()}
        </div>
      </div>

      {/* File Menu Portal */}
      {isFileMenuOpen && typeof document !== 'undefined' && createPortal(
        fileMenuContent,
        document.body
      )}
    </div>
  )
}
