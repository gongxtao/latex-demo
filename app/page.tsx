'use client'

import { useState, useEffect } from 'react'
import FileSelector from '@/components/FileSelector'
import ChatBox from '@/components/ChatBox'
import EditablePreview from '@/components/EditablePreview'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Load file content when a file is selected
  useEffect(() => {
    if (selectedFile) {
      fetch(`/api/file-content?filename=${encodeURIComponent(selectedFile)}`)
        .then(res => res.json())
        .then(data => {
          setHtmlContent(data.content)
        })
        .catch(error => {
          console.error('Failed to load file:', error)
          alert('Failed to load file')
        })
    }
  }, [selectedFile])

  // Handle resume generation with streaming
  const handleGenerateResume = async (messages: Message[]) => {
    if (!selectedFile || !htmlContent) {
      alert('Please select an HTML file first')
      return
    }

    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/generate-resume-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          latexContent: htmlContent
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate resume')
      }

      // Read the stream
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let accumulatedHtml = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            try {
              const json = JSON.parse(data)
              if (json.content) {
                accumulatedHtml += json.content
                // Update preview in real-time
                setHtmlContent(accumulatedHtml)
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Clean up markdown code blocks if any
      let finalHtml = accumulatedHtml
      finalHtml = finalHtml.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()
      
      setHtmlContent(finalHtml)
      
      // 自动保存到临时文件，不修改原模板
      try {
        const saveResponse = await fetch('/api/temp-result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            originalFilename: selectedFile,
            content: finalHtml
          })
        })
        
        if (saveResponse.ok) {
          const saveData = await saveResponse.json()
          setTimeout(() => {
            alert(`✅ 简历生成成功！\n\n已保存到临时文件：${saveData.tempFilename}\n\n原模板未被修改。您可以继续编辑预览区域的内容。`)
          }, 500)
        } else {
          throw new Error('保存临时文件失败')
        }
      } catch (saveError) {
        console.error('保存到临时文件失败:', saveError)
        setTimeout(() => {
          alert('⚠️ 简历已生成，但保存到临时文件时出错。内容仍在预览区域，您可以手动保存。')
        }, 500)
      }
      
    } catch (error) {
      console.error('Failed to generate resume:', error)
      alert('Failed to generate resume. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle content change
  const handleContentChange = (newContent: string) => {
    setHtmlContent(newContent)
  }

  // Download as PDF - 使用高质量的服务器端生成
  const handleDownloadPDF = async () => {
    if (!selectedFile || !htmlContent) {
      alert('没有可下载的内容')
      return
    }

    try {
      // 显示加载提示
      const loadingMsg = '⏳ 正在生成高质量PDF，请稍候...'
      console.log(loadingMsg)

      // Extract filename without extension
      const filename = selectedFile.split('/').pop()?.replace('.html', '') || 'resume'

      // 调用服务器端API生成PDF
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          htmlContent: htmlContent,
          filename: filename
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'PDF生成失败')
      }

      // 获取PDF文件blob
      const blob = await response.blob()
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.pdf`
      document.body.appendChild(a)
      a.click()
      
      // 清理
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // 显示成功消息
      setTimeout(() => {
        alert('✅ PDF下载成功！\n\n使用Chromium引擎生成，完美保留所有样式和颜色。')
      }, 300)
    } catch (error) {
      console.error('PDF生成失败:', error)
      alert('❌ PDF生成失败，请重试。\n\n错误信息: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top file selector */}
      <FileSelector
        onFileSelect={setSelectedFile}
        selectedFile={selectedFile}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left side chat box */}
        <div className="w-1/3 min-w-[400px] max-w-[600px] h-full">
          <ChatBox
            onGenerateResume={handleGenerateResume}
            isGenerating={isGenerating}
          />
        </div>

        {/* Right side editable preview */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <EditablePreview
              selectedFile={selectedFile}
              content={htmlContent}
              onContentChange={handleContentChange}
              isGenerating={isGenerating}
            />
          </div>
          
          {/* Download PDF button */}
          {selectedFile && !isGenerating && (
            <div className="bg-gray-50 border-t border-gray-300 px-4 py-3 flex justify-between items-center flex-shrink-0">
              <div className="text-sm text-gray-600">
                📄 Download your resume as a professional A4 PDF document
              </div>
              <button
                onClick={handleDownloadPDF}
                className="px-6 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors shadow-lg flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
