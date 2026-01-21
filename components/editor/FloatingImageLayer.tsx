import React, { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export interface FloatingImageItem {
  id: string
  src: string
  x: number
  y: number
  width: number
  height: number
}

interface FloatingImageLayerProps {
  images: FloatingImageItem[]
  onChange: (images: FloatingImageItem[]) => void
  isEditing: boolean
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export default function FloatingImageLayer({
  images,
  onChange,
  isEditing,
  selectedId,
  onSelect
}: FloatingImageLayerProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [currentSize, setCurrentSize] = useState<{ width: number; height: number } | null>(null)
  const imagesRef = useRef(images)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const ignoreNextGlobalDownRef = useRef(false)

  const updateImage = useCallback((id: string, updates: Partial<FloatingImageItem>) => {
    onChange(
      imagesRef.current.map(image =>
        image.id === id ? { ...image, ...updates } : image
      )
    )
  }, [onChange])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    if (!isEditing) return

    const handleGlobalMouseDown = (event: MouseEvent) => {
      if (ignoreNextGlobalDownRef.current) {
        ignoreNextGlobalDownRef.current = false
        return
      }

      const target = event.target as Node | null
      if (layerRef.current && target && layerRef.current.contains(target)) {
        return
      }

      onSelect(null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onSelect(null)
      }
    }

    window.addEventListener('mousedown', handleGlobalMouseDown, true)
    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('mousedown', handleGlobalMouseDown, true)
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isEditing, onSelect])

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (!isEditing) return
    e.preventDefault()
    e.stopPropagation()
    onSelect(id)
    ignoreNextGlobalDownRef.current = true

    const image = imagesRef.current.find(item => item.id === id)
    if (!image) return

    const startX = e.clientX
    const startY = e.clientY
    const startLeft = image.x
    const startTop = image.y

    const onMouseMove = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const dx = event.clientX - startX
      const dy = event.clientY - startY
      updateImage(id, { x: startLeft + dx, y: startTop + dy })
    }

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const handleResizeMouseDown = (e: React.MouseEvent, id: string, direction: string) => {
    if (!isEditing) return
    e.preventDefault()
    e.stopPropagation()
    onSelect(id)
    setIsResizing(true)

    const image = imagesRef.current.find(item => item.id === id)
    if (!image) return

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = image.width
    const startHeight = image.height
    const startLeft = image.x
    const startTop = image.y
    const ratio = startWidth / startHeight

    setCurrentSize({ width: Math.round(startWidth), height: Math.round(startHeight) })

    const onMouseMove = (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const dx = event.clientX - startX
      const dy = event.clientY - startY

      let newWidth = startWidth
      let newHeight = startHeight
      let newLeft = startLeft
      let newTop = startTop

      if (['nw', 'ne', 'sw', 'se'].includes(direction)) {
        if (direction.includes('e')) newWidth = startWidth + dx
        if (direction.includes('w')) newWidth = startWidth - dx
        newWidth = Math.max(20, newWidth)
        newHeight = newWidth / ratio
        if (direction.includes('w')) newLeft = startLeft + (startWidth - newWidth)
        if (direction.includes('n')) newTop = startTop + (startHeight - newHeight)
      } else {
        if (direction === 'e') newWidth = startWidth + dx
        if (direction === 'w') newWidth = startWidth - dx
        if (direction === 's') newHeight = startHeight + dy
        if (direction === 'n') newHeight = startHeight - dy
        newWidth = Math.max(20, newWidth)
        newHeight = Math.max(20, newHeight)
        if (direction === 'w') newLeft = startLeft + (startWidth - newWidth)
        if (direction === 'n') newTop = startTop + (startHeight - newHeight)
      }

      setCurrentSize({ width: Math.round(newWidth), height: Math.round(newHeight) })
      updateImage(id, { width: newWidth, height: newHeight, x: newLeft, y: newTop })
    }

    const onMouseUp = () => {
      setIsResizing(false)
      setCurrentSize(null)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    width: '10px',
    height: '10px',
    backgroundColor: '#fff',
    border: '1px solid #3b82f6',
    zIndex: 50,
    pointerEvents: 'auto',
    boxShadow: '0 0 2px rgba(0,0,0,0.2)'
  }

  const renderHandle = (id: string, dir: string, cursor: string, pos: React.CSSProperties) => (
    <div
      className="floating-resizer-handle"
      style={{ ...handleStyle, ...pos, cursor }}
      onMouseDown={(e) => handleResizeMouseDown(e, id, dir)}
    />
  )

  return (
    <div ref={layerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2147483647 }}>
      {images.map(image => {
        const isSelected = image.id === selectedId
        return (
          <div
            key={image.id}
            style={{
              position: 'absolute',
              left: image.x,
              top: image.y,
              width: image.width,
              height: image.height,
              pointerEvents: isEditing ? 'auto' : 'none'
            }}
            onMouseDown={(e) => handleMouseDown(e, image.id)}
          >
            <Image
              src={image.src}
              alt=""
              width={Math.round(image.width)}
              height={Math.round(image.height)}
              style={{ width: '100%', height: '100%', display: 'block', cursor: 'move' }}
              unoptimized
            />
            {isEditing && isSelected && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: '1px solid #3b82f6',
                  pointerEvents: 'none'
                }}
              >
                {isResizing && currentSize && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -30,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none'
                    }}
                  >
                    {currentSize.width} x {currentSize.height}
                  </div>
                )}
                {renderHandle(image.id, 'nw', 'nw-resize', { top: -6, left: -6 })}
                {renderHandle(image.id, 'ne', 'ne-resize', { top: -6, right: -6 })}
                {renderHandle(image.id, 'sw', 'sw-resize', { bottom: -6, left: -6 })}
                {renderHandle(image.id, 'se', 'se-resize', { bottom: -6, right: -6 })}
                {renderHandle(image.id, 'n', 'n-resize', { top: -6, left: '50%', transform: 'translateX(-50%)' })}
                {renderHandle(image.id, 's', 's-resize', { bottom: -6, left: '50%', transform: 'translateX(-50%)' })}
                {renderHandle(image.id, 'w', 'w-resize', { left: -6, top: '50%', transform: 'translateY(-50%)' })}
                {renderHandle(image.id, 'e', 'e-resize', { right: -6, top: '50%', transform: 'translateY(-50%)' })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
