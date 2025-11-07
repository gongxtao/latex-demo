'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-react'
import type { IDomEditor } from '@wangeditor/editor'

interface WangEditorPreviewProps {
  selectedFile: string | null
  content: string
  onContentChange: (content: string) => void
  isGenerating?: boolean
}

// 预设可能的正文容器选择器
const DEFAULT_SELECTORS = ['#content', 'article', 'main', '.content', '.article', '.resume', '#resume', 'section']

export default function WangEditorPreview({ selectedFile, content, onContentChange, isGenerating = false }: WangEditorPreviewProps) {
  const [editor, setEditor] = useState<IDomEditor | null>(null)
  const [containerSelector, setContainerSelector] = useState<string>('')
  const [availableContainers, setAvailableContainers] = useState<string[]>([])
  const [valueHtml, setValueHtml] = useState<string>('')
  const isUpdatingRef = useRef(false)

  // 解析当前 content，识别可用容器并设定默认容器与编辑片段
  useEffect(() => {
    setValueHtml(content)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  // 当选择容器变化时，更新编辑片段
  useEffect(() => {
    try {
      const doc = new DOMParser().parseFromString(content || '', 'text/html')
      const target = doc.querySelector(containerSelector) || doc.body
      setValueHtml(target ? (target as HTMLElement).innerHTML : '')
    } catch (e) {
      // ignore
    }
  }, [containerSelector])

  const editorDefaultConfig = useMemo(() => ({
    placeholder: '在此编辑正文内容（不会修改全局结构与样式）',
  }), [])

  const toolbarDefaultConfig = useMemo(() => ({
    // 可按需扩展菜单配置
  }), [])

  // 编辑器 onChange 时同步到预览（即时回写）
  const handleEditorChange = (ed: IDomEditor) => {
    const html = ed.getHtml()
    setValueHtml(html)
    // applyToPreview(html)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 顶部信息栏 */}
      <div className="flex items-center justify-between bg-gray-50 border-b border-gray-300 px-4 py-2">
        <div className="text-sm font-medium text-gray-700">
          {selectedFile ? (
            <>
              <span>Editing: {selectedFile.split('/').pop()?.replace('.html', '')}</span>
              <span className="ml-3 text-blue-600 font-semibold">富文本编辑模式</span>
            </>
          ) : (
            'Please select an HTML file'
          )}
        </div>
        <div />
      </div>

      {/* 容器选择 */}
      {selectedFile && (
        <div className="bg-gray-50 border-b border-gray-300 px-4 py-2 flex items-center space-x-2">
          <span className="text-sm text-gray-600">正文容器：</span>
          <select
            value={containerSelector}
            onChange={(e) => setContainerSelector(e.target.value)}
            className="px-3 py-1 border rounded bg-white"
          >
            {availableContainers.map((sel) => (
              <option key={sel} value={sel}>{sel}</option>
            ))}
          </select>
        </div>
      )}

      {/* 编辑器与工具栏 */}
      {selectedFile ? (
        <div className="flex flex-col">
          <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
            <Toolbar 
              editor={editor} 
              defaultConfig={toolbarDefaultConfig} 
              mode="default" 
              style={{ borderBottom: '1px solid #ccc' }}/>
          </div>
          <div className="p-4 bg-gray-50">
            <div className="max-w-5xl mx-auto bg-white shadow rounded">
              <Editor
                defaultConfig={editorDefaultConfig}
                value={valueHtml}
                onCreated={setEditor}
                onChange={handleEditorChange}
                mode="default"
                style={{ height: '500px', overflowY: 'auto' }}
              />
            </div>
            <div style={{ marginTop: '15px' }}>{valueHtml}</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400 text-lg">
          Please select an HTML file to start editing
        </div>
      )}
    </div>
  )
}