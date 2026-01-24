'use client'

interface EditorHeaderProps {
  onTemplateSelect: () => void
  onCopyHTML: () => void
  onExportPDF: () => void
  hasContent: boolean
  saveStatus?: 'saving' | 'saved' | 'unsaved'
}

export default function EditorHeader({
  onTemplateSelect,
  onCopyHTML,
  onExportPDF,
  hasContent,
  saveStatus
}: EditorHeaderProps) {
  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return <span className="text-blue-600">保存中...</span>
      case 'saved':
        return <span className="text-green-600">已保存</span>
      case 'unsaved':
        return <span className="text-orange-600">未保存</span>
      default:
        return null
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      {/* Left: Logo and Title */}
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-gray-800">
          全屏编辑器
        </h1>
        {saveStatus && (
          <span className="text-sm">{getSaveStatusText()}</span>
        )}
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onTemplateSelect}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          选择模板
        </button>
        <button
          onClick={onCopyHTML}
          disabled={!hasContent}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          复制 HTML
        </button>
        <button
          onClick={onExportPDF}
          disabled={!hasContent}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          导出 PDF
        </button>
      </div>
    </header>
  )
}
