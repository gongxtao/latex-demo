'use client'

import { useState, useEffect, useRef } from 'react'

interface FileCategory {
  category: string
  displayName: string
  files: string[]
}

interface FileSelectorProps {
  onFileSelect: (filename: string) => void
  selectedFile: string | null
}

export default function FileSelector({ onFileSelect, selectedFile }: FileSelectorProps) {
  const [categories, setCategories] = useState<FileCategory[]>([])
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch all HTML file categories
    fetch('/api/files')
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories)
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to fetch file list:', error)
        setLoading(false)
      })
  }, [])

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  // Get file display name (without category prefix and extension)
  const getFileName = (filePath: string) => {
    const parts = filePath.split('/')
    const fileName = parts[parts.length - 1]
    return fileName.replace('.html', '')
  }

  return (
    <div className="w-full bg-gray-100 border-b border-gray-300 shadow-md">
      <div className="relative">
        {/* Left scroll button */}
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-0 bottom-0 z-10 bg-gradient-to-r from-gray-100 to-transparent px-4 hover:from-gray-200"
          aria-label="Scroll left"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* File list scroll container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide space-x-2 px-16 py-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            categories.map((category) => (
              <div key={category.category} className="flex flex-col space-y-2">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide px-2">
                  {category.displayName}
                </div>
                <div className="flex space-x-2">
                  {category.files.map((filePath) => (
                    <button
                      key={filePath}
                      onClick={() => onFileSelect(filePath)}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedFile === filePath
                          ? 'bg-blue-500 text-white border-blue-600 shadow-lg'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:shadow'
                      }`}
                    >
                      <div className="text-sm font-medium whitespace-nowrap">
                        {getFileName(filePath)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right scroll button */}
        <button
          onClick={scrollRight}
          className="absolute right-0 top-0 bottom-0 z-10 bg-gradient-to-l from-gray-100 to-transparent px-4 hover:from-gray-200"
          aria-label="Scroll right"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
