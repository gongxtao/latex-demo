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

  // Update state when controlled externally
  useEffect(() => {
    if (initialOpen !== undefined && initialOpen !== isOpen) {
      setIsOpen(initialOpen)
    }
  }, [initialOpen])

  // Notify state change
  useEffect(() => {
    onStateChange?.(isOpen)
  }, [isOpen, onStateChange])

  // Close on click outside
  useEffect(() => {
    if (!isOpen || !containerRef) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
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
