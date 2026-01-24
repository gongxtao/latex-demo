'use client'

import { useState, useEffect, useCallback } from 'react'

export interface FloatingImageItem {
  id: string
  src: string
  x: number
  y: number
  width: number
  height: number
}

const STORAGE_KEYS = {
  CONTENT: 'editor-content',
  FLOATING_IMAGES: 'editor-floating-images',
  TEMPLATE: 'editor-template'
}

export function useEditorStorage() {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [floatingImages, setFloatingImages] = useState<FloatingImageItem[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedContent = localStorage.getItem(STORAGE_KEYS.CONTENT)
      const savedImages = localStorage.getItem(STORAGE_KEYS.FLOATING_IMAGES)
      const savedTemplate = localStorage.getItem(STORAGE_KEYS.TEMPLATE)

      if (savedContent) {
        setHtmlContent(savedContent)
      }
      if (savedImages) {
        try {
          setFloatingImages(JSON.parse(savedImages))
        } catch (e) {
          console.error('Failed to parse saved floating images:', e)
        }
      }
      if (savedTemplate) {
        setSelectedTemplate(savedTemplate)
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save content to localStorage
  const saveContent = useCallback((content: string) => {
    localStorage.setItem(STORAGE_KEYS.CONTENT, content)
    setHtmlContent(content)
  }, [])

  // Save floating images to localStorage
  const saveFloatingImages = useCallback((images: FloatingImageItem[]) => {
    localStorage.setItem(STORAGE_KEYS.FLOATING_IMAGES, JSON.stringify(images))
    setFloatingImages(images)
  }, [])

  // Save template to localStorage
  const saveTemplate = useCallback((template: string | null) => {
    if (template) {
      localStorage.setItem(STORAGE_KEYS.TEMPLATE, template)
    } else {
      localStorage.removeItem(STORAGE_KEYS.TEMPLATE)
    }
    setSelectedTemplate(template)
  }, [])

  // Clear all saved data
  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.CONTENT)
    localStorage.removeItem(STORAGE_KEYS.FLOATING_IMAGES)
    localStorage.removeItem(STORAGE_KEYS.TEMPLATE)
    setHtmlContent('')
    setFloatingImages([])
    setSelectedTemplate(null)
  }, [])

  return {
    htmlContent,
    setHtmlContent: saveContent,
    floatingImages,
    setFloatingImages: saveFloatingImages,
    selectedTemplate,
    setSelectedTemplate: saveTemplate,
    isLoaded,
    clearAll
  }
}
