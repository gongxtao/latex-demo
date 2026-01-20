import React, { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import SmartContextMenu from './SmartContextMenu'

interface TableSmartToolbarProps {
  iframeRef: React.RefObject<HTMLIFrameElement>
  activeTable: HTMLTableElement | null
  onAction: (action: string, payload?: any) => void
  readonly?: boolean
}

interface TableMetrics {
  rows: { height: number; top: number; element: HTMLTableRowElement }[]
  cols: { width: number; left: number }[]
  tableTop: number
  tableLeft: number
  tableWidth: number
  tableHeight: number
}

const TableSmartToolbar: React.FC<TableSmartToolbarProps> = ({
  iframeRef,
  activeTable,
  onAction,
  readonly = false
}) => {
  const [metrics, setMetrics] = useState<TableMetrics | null>(null)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const [hoveredCol, setHoveredCol] = useState<number | null>(null)
  const [selection, setSelection] = useState<{ startRow: number, startCol: number, endRow: number, endCol: number } | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    type: 'row' | 'col' | 'cell' | 'selection'
    index?: number
    rowIndex?: number
    colIndex?: number
  } | null>(null)

  const updateMetrics = useCallback(() => {
    if (!activeTable || !iframeRef.current) return
    const iframe = iframeRef.current
    const doc = iframe.contentDocument
    if (!doc) return

    const tableRect = activeTable.getBoundingClientRect()
    
    const rows: TableMetrics['rows'] = []
    const cols: TableMetrics['cols'] = []

    Array.from(activeTable.rows).forEach(row => {
      const rect = row.getBoundingClientRect()
      rows.push({
        height: rect.height,
        top: rect.top,
        element: row
      })
    })

    if (activeTable.rows.length > 0) {
        const firstRow = activeTable.rows[0]
        // Assuming first row cells represent columns. 
        // Note: this is a simplification. For exact grid, we need TableHandler logic.
        Array.from(firstRow.cells).forEach(cell => {
            const rect = cell.getBoundingClientRect()
            cols.push({
                width: rect.width,
                left: rect.left
            })
        })
    }

    setMetrics({
      rows,
      cols,
      tableTop: tableRect.top,
      tableLeft: tableRect.left,
      tableWidth: tableRect.width,
      tableHeight: tableRect.height
    })
  }, [activeTable, iframeRef])

  useEffect(() => {
    if (!activeTable) {
      setMetrics(null)
      return
    }

    updateMetrics()
    
    const iframe = iframeRef.current
    const win = iframe?.contentWindow

    if (win) {
        win.addEventListener('scroll', updateMetrics)
        win.addEventListener('resize', updateMetrics)
        // Close menu on scroll
        win.addEventListener('scroll', () => setContextMenu(null))
    }
    
    const observer = new MutationObserver(updateMetrics)
    observer.observe(activeTable, { 
        subtree: true, 
        childList: true, 
        attributes: true,
        attributeFilter: ['style', 'class', 'width', 'height']
    })

    return () => {
        if (win) {
            win.removeEventListener('scroll', updateMetrics)
            win.removeEventListener('resize', updateMetrics)
            win.removeEventListener('scroll', () => setContextMenu(null))
        }
        observer.disconnect()
    }
  }, [activeTable, iframeRef, updateMetrics])

  // Handle events from iframe
  useEffect(() => {
      const iframe = iframeRef.current
      const doc = iframe?.contentDocument
      if (!doc || readonly || !metrics || !activeTable) return

      const onMouseDown = (e: MouseEvent) => {
          setContextMenu(null) // Close menu on any interaction
          
          // If not left click, ignore
          if (e.button !== 0) return

          let clientX = e.clientX
          let clientY = e.clientY
          
          // Check if clicked inside table?
          const target = e.target as HTMLElement
          const cell = target.closest('td, th')
          if (!cell) {
             // Click outside table cells
             setSelection(null)
             return
          }
          
          // Find row/col index from cell directly is more reliable than coords
          const table = target.closest('table')
          if (table !== activeTable) return

          // We can use TableHandler or just DOM
          // Simple DOM lookup
          const tr = cell.closest('tr') as HTMLTableRowElement
          if (!tr) return
          // const r = tr.rowIndex // This might be absolute index in table
          // We need index in metrics.rows which matches table.rows
          // So tr.rowIndex is correct if metrics.rows is derived from table.rows
          
          // However, for safety and to match the visual grid (which might differ with complex rowspans?)
          // Let's stick to the visual coordinate check which handles the "visual" selection better
          // But wait, the visual check failed before? 
          // The previous issue was "click passing through".
          // Now we are listening on DOCUMENT.
          // Using coordinates is robust against structure but sensitive to scrolling.
          // e.clientX in iframe is relative to viewport. metrics.top is relative to viewport.
          // So the coordinate check is correct.
          
          let gridR = -1
          for (let i = 0; i < metrics.rows.length; i++) {
             const row = metrics.rows[i]
             if (clientY >= row.top && clientY <= row.top + row.height) {
                 gridR = i
                 break
             }
          }
          
          let gridC = -1
          for (let i = 0; i < metrics.cols.length; i++) {
             const col = metrics.cols[i]
             if (clientX >= col.left && clientX <= col.left + col.width) {
                 gridC = i
                 break
             }
          }
          
          if (gridR !== -1 && gridC !== -1) {
              setIsSelecting(true)
              setSelection({ startRow: gridR, startCol: gridC, endRow: gridR, endCol: gridC })
          }
      }
      
      const onMouseMove = (e: MouseEvent) => {
          if (!isSelecting) return
          
          e.preventDefault() 
          
          let clientX = e.clientX
          let clientY = e.clientY
          
          let gridR = -1
          for (let i = 0; i < metrics.rows.length; i++) {
             const row = metrics.rows[i]
             if (clientY >= row.top && clientY <= row.top + row.height) {
                 gridR = i
                 break
             }
          }
          
          let gridC = -1
          for (let i = 0; i < metrics.cols.length; i++) {
             const col = metrics.cols[i]
             if (clientX >= col.left && clientX <= col.left + col.width) {
                 gridC = i
                 break
             }
          }
          
          if (gridR !== -1 && gridC !== -1) {
              setSelection(prev => prev ? { ...prev, endRow: gridR, endCol: gridC } : null)
          }
      }
      
      const onMouseUp = () => {
          setIsSelecting(false)
      }

      const onContextMenu = (e: MouseEvent) => {
          // If right click inside table, show context menu
          const target = e.target as HTMLElement
          const cell = target.closest('td, th')
          if (!cell) return
          
          const table = target.closest('table')
          if (table !== activeTable) return
          
          e.preventDefault()
          
          // Get grid coords
          let gridR = -1
          let gridC = -1
          
          // Similar logic as mousedown
          let clientX = e.clientX
          let clientY = e.clientY
          
          for (let i = 0; i < metrics.rows.length; i++) {
             const row = metrics.rows[i]
             if (clientY >= row.top && clientY <= row.top + row.height) {
                 gridR = i
                 break
             }
          }
          for (let i = 0; i < metrics.cols.length; i++) {
             const col = metrics.cols[i]
             if (clientX >= col.left && clientX <= col.left + col.width) {
                 gridC = i
                 break
             }
          }
          
          // Update selection if needed
          let isInside = false
          if (selection) {
              const r1 = Math.min(selection.startRow, selection.endRow)
              const r2 = Math.max(selection.startRow, selection.endRow)
              const c1 = Math.min(selection.startCol, selection.endCol)
              const c2 = Math.max(selection.startCol, selection.endCol)
              if (gridR >= r1 && gridR <= r2 && gridC >= c1 && gridC <= c2) isInside = true
          }

          if (!isInside && gridR !== -1 && gridC !== -1) {
              setSelection({ startRow: gridR, startCol: gridC, endRow: gridR, endCol: gridC })
          }
          
          // Show menu
          const iframeRect = iframe.getBoundingClientRect()
          const menuX = e.clientX + iframeRect.left
          const menuY = e.clientY + iframeRect.top
          
          // Determine type based on where we clicked
          // If we clicked on a row header (onContextMenu on row div triggers this? No, that's separate)
          // This listener is on the DOCUMENT.
          
          // Wait, we have onContextMenu on the row/col headers too!
          // And we have this global listener on doc.
          // Which one is firing?
          
          // If we click inside table cell, doc listener fires.
          // We need to pass the clicked cell index to the menu if possible.
          
          setContextMenu({
              x: menuX,
              y: menuY,
              type: (selection && isInside && (selection.startRow !== selection.endRow || selection.startCol !== selection.endCol)) ? 'selection' : 'cell',
              rowIndex: gridR,
              colIndex: gridC
          })
      }

      doc.addEventListener('mousedown', onMouseDown)
      doc.addEventListener('mousemove', onMouseMove)
      doc.addEventListener('mouseup', onMouseUp)
      doc.addEventListener('contextmenu', onContextMenu)
      
      return () => {
          doc.removeEventListener('mousedown', onMouseDown)
          doc.removeEventListener('mousemove', onMouseMove)
          doc.removeEventListener('mouseup', onMouseUp)
          doc.removeEventListener('contextmenu', onContextMenu)
      }
  }, [iframeRef, metrics, activeTable, isSelecting, readonly, selection])

  if (!activeTable || !metrics || readonly) return null

  const BAR_SIZE = 24
  const GAP = 2

  const getCellCoords = (x: number, y: number) => {
      if (!iframeRef.current) return { r: -1, c: -1 }
      const iframeRect = iframeRef.current.getBoundingClientRect()
      
      const mx = x - iframeRect.left
      const my = y - iframeRect.top
      
      let r = -1
      for (let i = 0; i < metrics.rows.length; i++) {
          const row = metrics.rows[i]
          if (my >= row.top && my <= row.top + row.height) {
              r = i
              break
          }
      }
      
      let c = -1
      for (let i = 0; i < metrics.cols.length; i++) {
          const col = metrics.cols[i]
          if (mx >= col.left && mx <= col.left + col.width) {
              c = i
              break
          }
      }
      
      return { r, c }
  }

  const getSelectionStyle = () => {
      if (!selection) return { display: 'none' }
      
      const r1 = Math.min(selection.startRow, selection.endRow)
      const r2 = Math.max(selection.startRow, selection.endRow)
      const c1 = Math.min(selection.startCol, selection.endCol)
      const c2 = Math.max(selection.startCol, selection.endCol)
      
      if (r1 >= metrics.rows.length || c1 >= metrics.cols.length) return { display: 'none' }
      
      const top = metrics.rows[r1].top
      const height = (metrics.rows[r2].top + metrics.rows[r2].height) - top
      const left = metrics.cols[c1].left
      const width = (metrics.cols[c2].left + metrics.cols[c2].width) - left
      
      return {
          top, left, width, height,
          display: 'block',
          position: 'absolute' as const,
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          border: '2px solid #3b82f6',
          pointerEvents: 'none' as const,
          zIndex: 5
      }
  }

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* Interaction Layer over table - REMOVED blocking div */}
      
      {/* Selection Highlight */}
      <div style={getSelectionStyle()} />

      {/* Column Indicators */}
      <div className="absolute pointer-events-auto flex" style={{
        top: Math.max(0, metrics.tableTop - BAR_SIZE - GAP),
        left: metrics.tableLeft,
        height: BAR_SIZE
      }}>
        {metrics.cols.map((col, index) => (
          <div
            key={`col-${index}`}
            className={`
              group relative border border-gray-300 bg-gray-50 hover:bg-blue-50 cursor-pointer flex items-center justify-center text-xs text-gray-500
              ${hoveredCol === index ? 'bg-blue-100 border-blue-300' : ''}
            `}
            style={{ width: col.width, height: BAR_SIZE }}
            onMouseEnter={() => setHoveredCol(index)}
            onMouseLeave={() => setHoveredCol(null)}
            onContextMenu={(e) => {
              e.preventDefault()
              setContextMenu({ x: e.clientX, y: e.clientY, type: 'col', index })
            }}
            onClick={() => {
                setSelection({ startRow: 0, endRow: metrics.rows.length - 1, startCol: index, endCol: index })
            }}
          >
            <div className="w-1 h-3 bg-gray-300 rounded-sm" />
            <div 
                className="absolute right-0 top-0 bottom-0 w-4 translate-x-1/2 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer z-20"
                onClick={(e) => {
                    e.stopPropagation()
                    onAction('insertColumnAfter', { index })
                }}
            >
                <div className="w-4 h-4 bg-blue-500 rounded-full text-white flex items-center justify-center text-[10px] shadow-sm transform hover:scale-110">
                    +
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row Indicators */}
      <div className="absolute pointer-events-auto flex flex-col" style={{
        top: metrics.tableTop,
        left: Math.max(0, metrics.tableLeft - BAR_SIZE - GAP),
        width: BAR_SIZE
      }}>
        {metrics.rows.map((row, index) => (
          <div
            key={`row-${index}`}
            className={`
              group relative border border-gray-300 bg-gray-50 hover:bg-blue-50 cursor-pointer flex items-center justify-center text-xs text-gray-500
              ${hoveredRow === index ? 'bg-blue-100 border-blue-300' : ''}
            `}
            style={{ height: row.height, width: BAR_SIZE }}
            onMouseEnter={() => setHoveredRow(index)}
            onMouseLeave={() => setHoveredRow(null)}
            onContextMenu={(e) => {
              e.preventDefault()
              setContextMenu({ x: e.clientX, y: e.clientY, type: 'row', index })
            }}
            onClick={() => {
                setSelection({ startRow: index, endRow: index, startCol: 0, endCol: metrics.cols.length - 1 })
            }}
          >
             <div className="w-3 h-1 bg-gray-300 rounded-sm" />
            <div 
                className="absolute bottom-0 left-0 right-0 h-4 translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer z-20"
                onClick={(e) => {
                    e.stopPropagation()
                    onAction('insertRowAfter', { index })
                }}
            >
                <div className="w-4 h-4 bg-blue-500 rounded-full text-white flex items-center justify-center text-[10px] shadow-sm transform hover:scale-110">
                    +
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Corner Block */}
      <div 
        className="absolute bg-gray-100 border border-gray-300 cursor-pointer hover:bg-blue-100 pointer-events-auto z-20"
        style={{
            top: metrics.tableTop - BAR_SIZE - GAP,
            left: metrics.tableLeft - BAR_SIZE - GAP,
            width: BAR_SIZE,
            height: BAR_SIZE
        }}
        onClick={() => {
            setSelection({ startRow: 0, endRow: metrics.rows.length - 1, startCol: 0, endCol: metrics.cols.length - 1 })
        }}
      />

      {contextMenu && (
        <SmartContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          contextType={contextMenu.type}
          onClose={() => setContextMenu(null)}
          onAction={(action) => {
              // Determine index based on context type and action
              let index = contextMenu.index
              
              if (index === undefined) {
                  // Fallback to row/col index if available
                  if (action.includes('Row') && contextMenu.rowIndex !== undefined) {
                      index = contextMenu.rowIndex
                  } else if (action.includes('Column') && contextMenu.colIndex !== undefined) {
                      index = contextMenu.colIndex
                  }
              }
              
              onAction(action, { 
                  index: index,
                  bounds: selection ? {
                      startRow: Math.min(selection.startRow, selection.endRow),
                      endRow: Math.max(selection.startRow, selection.endRow),
                      startCol: Math.min(selection.startCol, selection.endCol),
                      endCol: Math.max(selection.startCol, selection.endCol)
                  } : undefined
              })
          }}
          canMerge={selection ? (selection.startRow !== selection.endRow || selection.startCol !== selection.endCol) : false}
          canSplit={true} // Simplified check
        />
      )}
    </div>
  )
}

export default TableSmartToolbar
