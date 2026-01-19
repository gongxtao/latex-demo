import React, { useEffect, useState, useCallback } from 'react'

interface ImageResizerProps {
  target: HTMLImageElement | null
  iframeDoc: Document | null
  onUpdate: () => void
}

export default function ImageResizer({ target, iframeDoc, onUpdate }: ImageResizerProps) {
  const [rect, setRect] = useState<{ top: number, left: number, width: number, height: number } | null>(null)

  const updateRect = useCallback(() => {
    if (target && iframeDoc) {
      const domRect = target.getBoundingClientRect()
      const win = iframeDoc.defaultView
      const scrollX = win?.scrollX || 0
      const scrollY = win?.scrollY || 0
      
      setRect({
        top: domRect.top + scrollY,
        left: domRect.left + scrollX,
        width: domRect.width,
        height: domRect.height
      })
    }
  }, [target, iframeDoc])

  useEffect(() => {
    updateRect()
    
    if (!target || !iframeDoc) return

    // Listen to events that might shift the image
    const win = iframeDoc.defaultView
    win?.addEventListener('resize', updateRect)
    win?.addEventListener('scroll', updateRect)
    iframeDoc.addEventListener('input', updateRect) // Text changes causing reflow
    
    // ResizeObserver for the image itself
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(updateRect)
        ro.observe(target)
    }

    return () => {
        win?.removeEventListener('resize', updateRect)
        win?.removeEventListener('scroll', updateRect)
        iframeDoc.removeEventListener('input', updateRect)
        ro?.disconnect()
    }
  }, [target, iframeDoc, updateRect])

  if (!target || !rect || !iframeDoc) return null

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startWidth = rect.width
    const startHeight = rect.height
    const ratio = startWidth / startHeight

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const dx = e.clientX - startX

      let newWidth = startWidth
      if (direction.includes('e')) newWidth = startWidth + dx
      if (direction.includes('w')) newWidth = startWidth - dx
      
      newWidth = Math.max(20, newWidth)
      const newHeight = newWidth / ratio

      // Apply to image
      target.style.width = `${newWidth}px`
      target.style.height = `${newHeight}px`
      
      // Force update rect locally to sync overlay
      updateRect()
    }

    const onMouseUp = () => {
      iframeDoc.removeEventListener('mousemove', onMouseMove)
      iframeDoc.removeEventListener('mouseup', onMouseUp)
      onUpdate() // Trigger history push
    }

    iframeDoc.addEventListener('mousemove', onMouseMove)
    iframeDoc.addEventListener('mouseup', onMouseUp)
  }

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    width: '10px',
    height: '10px',
    backgroundColor: '#3b82f6',
    border: '1px solid white',
    borderRadius: '50%',
    zIndex: 50,
    pointerEvents: 'auto',
    boxShadow: '0 0 3px rgba(0,0,0,0.5)'
  }

  return (
      <div style={{
          position: 'absolute',
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          border: '1px solid #3b82f6',
          pointerEvents: 'none', // Allow clicking through to image
          zIndex: 49
      }}>
          <div 
            className="resizer-handle"
            style={{ ...handleStyle, top: -5, left: -5, cursor: 'nw-resize' }} 
            onMouseDown={(e) => handleMouseDown(e, 'nw')} 
          />
          <div 
            className="resizer-handle"
            style={{ ...handleStyle, top: -5, right: -5, cursor: 'ne-resize' }} 
            onMouseDown={(e) => handleMouseDown(e, 'ne')} 
          />
          <div 
            className="resizer-handle"
            style={{ ...handleStyle, bottom: -5, left: -5, cursor: 'sw-resize' }} 
            onMouseDown={(e) => handleMouseDown(e, 'sw')} 
          />
          <div 
            className="resizer-handle"
            style={{ ...handleStyle, bottom: -5, right: -5, cursor: 'se-resize' }} 
            onMouseDown={(e) => handleMouseDown(e, 'se')} 
          />
      </div>
  )
}
