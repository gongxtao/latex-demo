'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import debounce from 'lodash/debounce'
import EditablePreview from '@/components/editor/EditablePreview'
import UnifiedToolbar from './UnifiedToolbar'
import TemplateModal from './TemplateModal'
import { useEditorStorage, FloatingImageItem } from './useEditorStorage'

type SaveStatus = 'saving' | 'saved' | 'unsaved'

export default function EditorPage() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
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

  // Create debounced save function
  const debouncedSave = useMemo(
    () => debounce((content: string, images: FloatingImageItem[]) => {
      setHtmlContent(content)
      setFloatingImages(images)
      setSaveStatus('saved')
    }, 1000),
    [setHtmlContent, setFloatingImages]
  )

  // Cancel debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel()
    }
  }, [debouncedSave])

  const handleContentChange = useCallback((content: string) => {
    setSaveStatus('unsaved')
    debouncedSave(content, floatingImages)
  }, [debouncedSave, floatingImages])

  const handleFloatingImagesChange = useCallback((images: FloatingImageItem[]) => {
    setSaveStatus('unsaved')
    debouncedSave(htmlContent, images)
  }, [debouncedSave, htmlContent])

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
    if (!iframeDoc) return

    const element = iframeDoc.body
    const opt = {
      margin: 0,
      filename: `document-${Date.now()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    }

    // Dynamically import html2pdf to avoid SSR issues
    const html2pdf = (await import('html2pdf.js')).default
    html2pdf().set(opt).from(element).save()
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
        disabled={!htmlContent}
        onFloatingImageInsert={(imageUrl) => {
          // Handle floating image insert
          console.log('Insert floating image:', imageUrl)
        }}
        onNewDocument={handleNewDocument}
        onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
        onCopyHTML={handleCopyHTML}
        onExportPDF={handleExportPDF}
        saveStatus={saveStatus}
      />

      {/* Scrollable Editor Area */}
      <div className="flex-1 overflow-auto p-8" id="editor-scroll-area">
        <div
          className="mx-auto bg-white shadow-lg"
          style={{ width: '90%', minHeight: 'calc(100vh - 100px)' }}
          ref={containerRef}
        >
          <EditablePreview
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
