'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import debounce from 'lodash/debounce'
import EditablePreview, { EditablePreviewRef } from '@/components/editor/EditablePreview'
import UnifiedToolbar from './UnifiedToolbar'
import TemplateModal from './TemplateModal'
import { useEditorStorage, FloatingImageItem } from './useEditorStorage'

type SaveStatus = 'saving' | 'saved' | 'unsaved'

export default function EditorPage() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const editablePreviewRef = useRef<EditablePreviewRef>(null)
  const {
    htmlContent,
    setHtmlContent,
    floatingImages,
    setFloatingImages,
    selectedTemplate,
    setSelectedTemplate,
    clearAll
  } = useEditorStorage()

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')

  // Helper to get the iframe reference
  const getIframe = useCallback(() => {
    return containerRef.current?.querySelector('iframe') || null
  }, [])

  // Simple content change handler - just update state
  const handleContentChange = useCallback((content: string) => {
    setHtmlContent(content)
    setSaveStatus('unsaved')
  }, [setHtmlContent])

  // Simple floating images change handler - just update state
  const handleFloatingImagesChange = useCallback((images: FloatingImageItem[]) => {
    setFloatingImages(images)
    setSaveStatus('unsaved')
  }, [setFloatingImages])

  // Auto-save to localStorage with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (htmlContent) {
        localStorage.setItem('editor-content', htmlContent)
      }
      localStorage.setItem('editor-floating-images', JSON.stringify(floatingImages))
      setSaveStatus('saved')
    }, 1000)

    return () => clearTimeout(timer)
  }, [htmlContent, floatingImages])

  const handleTemplateSelect = useCallback(async (templatePath: string) => {
    try {
      const res = await fetch(`/api/file-content?filename=${templatePath}`)
      const data = await res.json()

      if (data.content) {
        setHtmlContent(data.content)
        setSelectedTemplate(templatePath)
        setFloatingImages([])
        setSaveStatus('saved')
      }
    } catch (error) {
      console.error('Failed to load template:', error)
      alert('加载模板失败，请重试')
    }
  }, [setHtmlContent, setSelectedTemplate, setFloatingImages])

  const handleCopyHTML = useCallback(async () => {
    if (!htmlContent) return

    try {
      await navigator.clipboard.writeText(htmlContent)
      alert('HTML 已复制到剪贴板')
    } catch (error) {
      console.error('Failed to copy HTML:', error)
      alert('复制失败，请重试')
    }
  }, [htmlContent])

  const handleExportPDF = useCallback(async () => {
    const iframe = getIframe()
    if (!iframe) return

    const iframeDoc = iframe.contentDocument
    const iframeWin = iframe.contentWindow
    if (!iframeDoc || !iframeWin) return

    // Store original state
    const body = iframeDoc.body
    const wasEditable = body.getAttribute('contenteditable')

    // Temporarily disable editing for clean print
    body.removeAttribute('contenteditable')

    // Remove focus outline
    const originalOutline = body.style.outline
    body.style.outline = 'none'

    // Add or update print-specific styles
    let printStyle = iframeDoc.getElementById('print-export-styles')
    if (!printStyle) {
      printStyle = iframeDoc.createElement('style')
      printStyle.id = 'print-export-styles'
      iframeDoc.head.appendChild(printStyle)
    }

    printStyle.textContent = `
      @media print {
        @page {
          size: A4;
          margin: 0;
        }
        html {
          width: 210mm;
        }
        body {
          width: 210mm;
          margin: 0 auto;
          padding: 15mm;
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body *:not(input):not(textarea) {
          contenteditable: inherit !important;
        }
      }
      @media screen {
        html, body {
          width: 210mm;
          margin: 0 auto;
        }
        body {
          padding: 15mm;
          box-sizing: border-box;
        }
      }
    `

    // Trigger print
    try {
      iframeWin.print()
    } catch (error) {
      console.error('Print error:', error)
      alert('打印失败，请重试')
    } finally {
      // Restore editing state after print dialog closes
      setTimeout(() => {
        if (wasEditable) {
          body.setAttribute('contenteditable', wasEditable)
        }
        body.style.outline = originalOutline

        // Remove temporary print styles
        if (printStyle && printStyle.parentNode) {
          printStyle.parentNode.removeChild(printStyle)
        }
      }, 100)
    }
  }, [getIframe])

  const handleNewDocument = useCallback(() => {
    if (confirm('确定要新建空白文档吗？当前内容将被清空。')) {
      clearAll()
      const blankHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      padding: 20mm;
      margin: 0;
    }
    p { margin: 0.5em 0; }
  </style>
</head>
<body>
  <p>开始编辑...</p>
</body>
</html>`
      setHtmlContent(blankHtml)
      setSelectedTemplate(null)
      setFloatingImages([])
      setSaveStatus('saved')
    }
  }, [clearAll, setHtmlContent, setSelectedTemplate, setFloatingImages])

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Unified Toolbar with File Menu */}
      <UnifiedToolbar
        iframeRef={iframeRef}
        onContentChange={handleContentChange}
        isEditing={true}
        onFloatingImageInsert={(imageUrl) => {
          // Delegate to EditablePreview's insertFloatingImage method
          editablePreviewRef.current?.insertFloatingImage(imageUrl)
        }}
        onNewDocument={handleNewDocument}
        onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
        onCopyHTML={handleCopyHTML}
        onExportPDF={handleExportPDF}
        saveStatus={saveStatus}
        disableContentActions={!htmlContent}
      />

      {/* Scrollable Editor Area */}
      <div className="flex-1 overflow-auto p-8" id="editor-scroll-area">
        <div
          className="mx-auto bg-white shadow-lg"
          style={{ width: '90%', minHeight: 'calc(100vh - 100px)' }}
          ref={containerRef}
        >
          <EditablePreview
            ref={editablePreviewRef}
            iframeRef={iframeRef}
            selectedFile={selectedTemplate}
            content={htmlContent}
            onContentChange={handleContentChange}
            floatingImages={floatingImages}
            onFloatingImagesChange={handleFloatingImagesChange}
            initialEditing={true}
            hideControls={true}
            hideToolbar={true}
          />
        </div>
      </div>

      {/* Template Modal */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onTemplateSelect={handleTemplateSelect}
      />
    </div>
  )
}
