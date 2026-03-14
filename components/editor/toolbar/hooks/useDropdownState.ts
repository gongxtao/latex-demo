/**
 * useDropdownState Hook
 * Manages dropdown state (open/close) with automatic click-outside handling
 */

import { useState, useEffect, RefObject } from 'react'

export interface UseDropdownStateOptions {
  /** Initial open state */
  initialOpen?: boolean
  /** Callback when dropdown state changes */
  onStateChange?: (isOpen: boolean) => void
  /** Optional ref to the dropdown container */
  containerRef?: RefObject<HTMLElement>
}

export function useDropdownState(options: UseDropdownStateOptions = {}) {
  const { initialOpen = false, onStateChange, containerRef } = options
  const [isOpen, setIsOpen] = useState(initialOpen)
  const hasInitialOpen = Object.prototype.hasOwnProperty.call(options, 'initialOpen')

  // Update state when controlled externally
  useEffect(() => {
    if (hasInitialOpen) {
      setIsOpen(prev => (prev === initialOpen ? prev : initialOpen))
    }
  }, [hasInitialOpen, initialOpen])

  // Notify state change
  useEffect(() => {
    onStateChange?.(isOpen)
  }, [isOpen, onStateChange])

  // Close on click outside
  useEffect(() => {
    if (!isOpen || !containerRef) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const isInsideContainer = !!(containerRef.current && containerRef.current.contains(target))
      const isInsidePortal = target instanceof Element && !!target.closest('[data-toolbar-dropdown-portal="true"]')
      if (!isInsideContainer && !isInsidePortal) {
        setIsOpen(false)
      }
    }

    // Handle iframe clicks
    const handleIframeClick = () => {
      setIsOpen(false)
    }

    // Add listener to main document
    document.addEventListener('mousedown', handleClickOutside)
    
    // Add listener to all iframes
    const iframes = document.querySelectorAll('iframe')
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow?.document.addEventListener('mousedown', handleIframeClick)
      } catch (e) {
        // Ignore cross-origin issues
      }
    })

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      iframes.forEach(iframe => {
        try {
          iframe.contentWindow?.document.removeEventListener('mousedown', handleIframeClick)
        } catch (e) {
          // Ignore
        }
      })
    }
  }, [isOpen, containerRef])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Toggle open state
  const toggle = () => setIsOpen(prev => !prev)

  // Open dropdown
  const open = () => setIsOpen(true)

  // Close dropdown
  const close = () => setIsOpen(false)

  return {
    isOpen,
    setIsOpen,
    toggle,
    open,
    close
  }
}
