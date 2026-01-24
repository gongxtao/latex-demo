'use client'

import { useState, useEffect } from 'react'

export interface Template {
  name: string
  path: string
}

export interface TemplateCategory {
  [key: string]: Template[]
}

interface TemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onTemplateSelect: (templatePath: string) => void
}

const CATEGORY_NAMES: Record<string, string> = {
  'resume-template': '简历模板',
  'cover-letter-template': '求职信模板',
  'invoice': '发票模板',
  'meeting-agenda-template': '会议议程模板'
}

export default function TemplateModal({ isOpen, onClose, onTemplateSelect }: TemplateModalProps) {
  const [templates, setTemplates] = useState<TemplateCategory>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/list-templates')
      const data = await res.json()
      setTemplates(data)
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTemplates = Object.entries(templates).reduce((acc, [category, items]) => {
    const filteredItems = items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (filteredItems.length > 0) {
      acc[category] = filteredItems
    }
    return acc
  }, {} as TemplateCategory)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">选择模板</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="搜索模板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : Object.keys(filteredTemplates).length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              未找到匹配的模板
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredTemplates).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">
                    {CATEGORY_NAMES[category] || category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((template) => (
                      <button
                        key={template.path}
                        onClick={() => {
                          onTemplateSelect(template.path)
                          onClose()
                        }}
                        className="text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <div className="font-medium text-gray-800">{template.name}</div>
                        <div className="text-sm text-gray-500 mt-1">点击加载模板</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}
