'use client'

/**
 * Test page for EditPreview E2E tests
 * This page provides a simple environment to test EditablePreview component
 */

import { useState } from 'react'
import EditablePreview from '@/components/editor/EditablePreview'
import { FloatingImageItem } from '@/components/editor/FloatingImageLayer'

const testContent = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
    p { margin: 10px 0; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <h1>Test Resume</h1>
  <p>This is a test resume for EditablePreview E2E tests.</p>
  <p>Select this text to test selection functionality.</p>
  <p>Click here to test cursor positioning.</p>
</body>
</html>`

export default function TestEditablePreviewPage() {
  const [htmlContent] = useState<string>(testContent)
  const [floatingImages, setFloatingImages] = useState<FloatingImageItem[]>([])

  const handleContentChange = (newContent: string) => {
    console.log('Content changed:', newContent.substring(0, 100) + '...')
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>EditablePreview E2E Test Page</h1>
      <p>This page is used for Playwright E2E testing of the EditablePreview component.</p>

      <EditablePreview
        selectedFile="/test/resume.html"
        content={htmlContent}
        onContentChange={handleContentChange}
        floatingImages={floatingImages}
        onFloatingImagesChange={setFloatingImages}
        isGenerating={false}
        initialEditing={false}
        hideControls={false}
        hideToolbar={false}
      />
    </div>
  )
}
