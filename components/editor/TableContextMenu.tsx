import React, { useEffect, useRef, useState } from 'react'

interface TableContextMenuProps {
  target: HTMLTableElement | null
  position: { x: number; y: number } | null
  onClose: () => void
  onAction: (action: string) => void
}

const TableContextMenu: React.FC<TableContextMenuProps> = ({ target, position, onClose, onAction }) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  if (!target || !position) return null

  const menuItems = [
    { label: 'Insert Row Above', action: 'insertRowBefore' },
    { label: 'Insert Row Below', action: 'insertRowAfter' },
    { label: 'Delete Row', action: 'deleteRow' },
    { type: 'separator' },
    { label: 'Insert Column Left', action: 'insertColumnBefore' },
    { label: 'Insert Column Right', action: 'insertColumnAfter' },
    { label: 'Delete Column', action: 'deleteColumn' },
    { type: 'separator' },
    { label: 'Delete Table', action: 'deleteTable' }
  ]

  return (
    <div
      ref={menuRef}
      className="fixed bg-white shadow-lg rounded-md border border-gray-200 py-1 z-[9999]"
      style={{ top: position.y, left: position.x }}
    >
      {menuItems.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={index} className="h-px bg-gray-200 my-1" />
        }
        return (
          <button
            key={index}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            onClick={() => {
              onAction(item.action!)
              onClose()
            }}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export default TableContextMenu
