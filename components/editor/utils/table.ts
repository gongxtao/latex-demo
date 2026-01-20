export class TableHandler {
  private grid: (HTMLTableCellElement | null)[][] = []
  private rows: HTMLTableRowElement[] = []
  private maxCols: number = 0

  constructor(private table: HTMLTableElement) {
    this.analyze()
  }

  private analyze() {
    this.rows = Array.from(this.table.rows)
    this.grid = []
    this.maxCols = 0

    // Initialize grid
    for (let r = 0; r < this.rows.length; r++) {
      this.grid[r] = []
    }

    // Fill grid
    for (let r = 0; r < this.rows.length; r++) {
      const row = this.rows[r]
      const cells = Array.from(row.cells)
      let currCol = 0

      for (const cell of cells) {
        // Skip filled slots (from rowspans)
        while (this.grid[r][currCol]) {
          currCol++
        }

        const rowspan = cell.rowSpan || 1
        const colspan = cell.colSpan || 1

        // Mark slots
        for (let i = 0; i < rowspan; i++) {
          for (let j = 0; j < colspan; j++) {
            if (this.grid[r + i]) {
              this.grid[r + i][currCol + j] = cell
            }
          }
        }

        currCol += colspan
      }
      if (currCol > this.maxCols) this.maxCols = currCol
    }
  }

  insertColumnBefore(cell: HTMLTableCellElement) {
    const colIndex = this.getCellColIndex(cell)
    if (colIndex === -1) return
    this.insertColumnAt(colIndex)
  }

  insertColumnAfter(cell: HTMLTableCellElement) {
    const colIndex = this.getCellColIndex(cell)
    if (colIndex === -1) return
    this.insertColumnAt(colIndex + cell.colSpan)
  }

  insertColumnAt(index: number) {
    // Iterate all rows and insert a cell at the given grid index
    for (let r = 0; r < this.rows.length; r++) {
      const row = this.rows[r]
      
      // Find the cell that corresponds to this column index
      // Or the cell BEFORE it
      let currentGridCol = 0
      let inserted = false
      
      const cells = Array.from(row.cells)
      
      // Special case: empty row or inserting at 0
      if (index === 0 && cells.length > 0) {
         const newCell = row.insertCell(0)
         this.styleCell(newCell)
         continue
      }

      // Find insertion point
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]
        // Calculate where this cell ends
        const colspan = cell.colSpan || 1
        
        // If we are inserting within a spanned cell?
        // e.g. cell starts at 0, colspan 3. We insert at 1.
        // Then we should increase colspan.
        // BUT, we need to know the GRID index of this cell.
        
        // We can use our analyzed grid
        const cellInGrid = this.grid[r].findIndex(c => c === cell)
        if (cellInGrid === -1) continue // Should not happen
        
        // If insertion index is strictly AFTER this cell
        if (cellInGrid + colspan === index) {
            // Insert after this cell
            const newCell = row.insertCell(i + 1)
            this.styleCell(newCell)
            inserted = true
            break
        }
        
        // If insertion index is INSIDE this cell (spanned)
        if (cellInGrid < index && cellInGrid + colspan > index) {
            cell.colSpan++
            inserted = true
            break
        }
      }
      
      if (!inserted) {
          // Append to end if not found (e.g. index is maxCols)
          const newCell = row.insertCell()
          this.styleCell(newCell)
      }
    }
  }

  deleteColumn(cell: HTMLTableCellElement) {
    const colIndex = this.getCellColIndex(cell)
    if (colIndex === -1) return
    
    // We remove the column at colIndex.
    // BUT if the cell has colspan > 1, we might just be removing one column of it?
    // Usually "Delete Column" deletes the visual column.
    
    // Iterate rows
    const processedCells = new Set<HTMLTableCellElement>()
    
    for (let r = 0; r < this.rows.length; r++) {
        const cellAtPos = this.grid[r][colIndex]
        if (!cellAtPos) continue
        
        if (processedCells.has(cellAtPos)) continue
        processedCells.add(cellAtPos)
        
        if (cellAtPos.colSpan > 1) {
            cellAtPos.colSpan--
        } else {
            cellAtPos.remove()
        }
    }
  }

  insertRowBefore(cell: HTMLTableCellElement) {
    const row = cell.parentElement as HTMLTableRowElement
    const rowIndex = row.rowIndex
    this.insertRowAt(rowIndex)
  }

  insertRowAfter(cell: HTMLTableCellElement) {
    const row = cell.parentElement as HTMLTableRowElement
    const rowIndex = row.rowIndex
    this.insertRowAt(rowIndex + 1) // +1 works for append too
  }
  
  insertRowAt(index: number) {
      const newRow = this.table.insertRow(index)
      // We need to match the column structure.
      // Simply adding maxCols cells is a naive approach but works for simple tables.
      // Correct approach: Check each column index. If a rowspan from above crosses this index, don't add cell.
      
      // Since we inserting a NEW row, any rowspan crossing it must be extended.
      // We need to check the row ABOVE insertion point (index - 1).
      
      const prevRowIndex = index - 1
      
      for (let c = 0; c < this.maxCols; c++) {
          // Check if column c is occupied by a rowspan from above
          let occupied = false
          if (prevRowIndex >= 0) {
              const cellAbove = this.grid[prevRowIndex][c]
              if (cellAbove) {
                  const cellRowIndex = (cellAbove.parentElement as HTMLTableRowElement).rowIndex
                  const cellRowSpan = cellAbove.rowSpan
                  // If cell starts above and ends below insertion
                  if (cellRowIndex + cellRowSpan > index) {
                      cellAbove.rowSpan++
                      occupied = true
                  }
              }
          }
          
          if (!occupied) {
              const newCell = newRow.insertCell()
              this.styleCell(newCell)
          }
      }
  }

  deleteRow(cell: HTMLTableCellElement) {
    const row = cell.parentElement as HTMLTableRowElement
    const rowIndex = row.rowIndex
    
    // Check cells in this row
    const cells = Array.from(row.cells)
    for (const c of cells) {
        if (c.rowSpan > 1) {
            // This cell spans multiple rows.
            // Since we are deleting the STARTING row, we need to move the cell to the next row?
            // This is complex. Standard behavior: content is lost or cell is moved.
            // Simple approach: shrink rowspan? No, cell is anchored here.
            
            // Better approach: Move cell to next row (if exists) and decrement rowspan.
            const nextRow = this.table.rows[rowIndex + 1]
            if (nextRow) {
                // We need to insert this cell into nextRow at correct position.
                // Complex.
                // Fallback: just delete it for now.
            }
        }
    }
    
    // Check cells from ABOVE spanning into this row
    // We need to find them and decrement rowspan.
    const processedCells = new Set<HTMLTableCellElement>()
    for (let c = 0; c < this.maxCols; c++) {
        const cellAtPos = this.grid[rowIndex][c]
        if (!cellAtPos) continue
        
        // If cell started in this row, we handled it (it gets deleted).
        // If cell started above:
        const cellRow = cellAtPos.parentElement as HTMLTableRowElement
        if (cellRow !== row) {
            if (processedCells.has(cellAtPos)) continue
            processedCells.add(cellAtPos)
            cellAtPos.rowSpan--
        }
    }
    
    row.remove()
  }
  
  deleteTable() {
      this.table.remove()
  }

  private getCellColIndex(cell: HTMLTableCellElement): number {
    for (let r = 0; r < this.rows.length; r++) {
        const index = this.grid[r].indexOf(cell)
        if (index !== -1) return index
    }
    return -1
  }

  private styleCell(cell: HTMLTableCellElement) {
      cell.style.border = '1px solid #ccc'
      cell.style.padding = '8px'
      cell.style.minWidth = '60px'
      cell.style.height = '32px'
  }

  insertColumnEnd() {
    // We want to add a cell at `maxCols` for every row.
    // BUT, we must respect existing rowspans.
    // If a cell at `maxCols-1` has `colspan > 1`? No, `maxCols` is the boundary.
    // If a cell has `rowspan` and is at `maxCols`?
    // It means the cell extends infinitely to right? No.
    
    // We iterate rows.
    for (let r = 0; r < this.rows.length; r++) {
      const row = this.rows[r]
      
      // Check slot at `maxCols`.
      // If it's occupied, it means a previous row's cell has rowspan AND extends here?
      // Or current row has a cell that extends here?
      // Since `maxCols` is the bounds, `grid[r][maxCols]` should be null (or undefined).
      // Unless a cell has HUGE colspan.
      
      // Actually, we just need to append a cell to the row.
      // BUT, if the row is "short" (missing cells at end), we might need to pad it?
      // Or if the row has a rowspan passing through it from above?
      
      // Check grid[r][maxCols-1].
      // If `grid[r][maxCols]` is occupied (by a rowspan from above), we don't insert?
      // No, if we add a column, we extend the table width.
      // If a rowspan cell is at the edge, does it extend?
      // Usually "Add Column" adds a new independent cell.
      
      // We assume we append a NEW cell.
      // We need to find the correct DOM position.
      // It should be after the last cell that ends at `maxCols-1`.
      // Or just `row.appendChild(newCell)`.
      
      // WAIT. If `grid[r][maxCols-1]` is occupied by a cell starting at `r-1` (rowspan).
      // Then `row` does NOT have this cell in its children.
      // So `row.appendChild` puts the new cell AFTER the gap.
      // Visually:
      // R1: [Cell 1 (rowspan=2)]
      // R2: (empty) -> `appendChild` -> [New Cell]
      // Grid:
      // R1: [Cell 1]
      // R2: [Cell 1] [New Cell]
      // Result: New Cell is at Col 1.
      // We wanted Col 1?
      // If Table was 1 col wide. Yes.
      
      // What if:
      // R1: [A] [Side (rowspan=2)]
      // R2: [B]
      // MaxCols = 2.
      // Add Col.
      // R1: Append -> [A] [Side] [New]. Correct.
      // R2: Append -> [B] [New].
      // Grid R2: [B] [Side] [New].
      // Layout R2: [B] [New] [Side]?
      // No, HTML table layout puts cells into available slots.
      // R2 Slot 0: [B].
      // R2 Slot 1: Occupied by [Side].
      // R2 Slot 2: [New].
      // So `appendChild` works correctly even with rowspan gaps!
      // Browser handles skipping occupied slots.
      
      // So "Insert Column End" is just `row.appendChild`?
      // YES, provided the row structure is valid.
      // BUT, what if `colspan` spans the whole table?
      // `<tr><td colspan=100>Title</td></tr>`.
      // `maxCols` is 100.
      // Other rows have 2 cols.
      // We add col at 101?
      // Other rows get appended.
      // Title row gets appended?
      // `Title` `New`.
      // Title is 100 wide. New is at 101.
      // Correct.
      
      // So "Insert Column End" is trivial.
      
      // The problem is "Delete Column End".
      // If last cell has colspan > 1, we decrement.
      // If last cell is rowspan from above, we decrement colspan of THAT cell (in prev row)?
      // No, rowspan implies vertical.
      // If we delete last column.
      // We check `grid[r][maxCols-1]`.
      // If it's a cell:
      //   If `colspan > 1`: decrement colspan.
      //   Else: remove cell.
      //   BUT, we must avoid processing the same cell twice (if rowspan > 1).
      
      const newCell = this.table.ownerDocument.createElement('td')
      newCell.style.border = '1px solid #ccc'
      newCell.style.padding = '8px'
      newCell.style.minWidth = '60px'
      newCell.style.height = '32px'
      row.appendChild(newCell)
    }
  }

  deleteColumnEnd() {
    if (this.maxCols <= 0) return

    const targetCol = this.maxCols - 1
    const processedCells = new Set<HTMLTableCellElement>()

    for (let r = 0; r < this.rows.length; r++) {
      const cell = this.grid[r][targetCol]
      if (!cell) continue // Empty slot?
      
      if (processedCells.has(cell)) continue
      processedCells.add(cell)

      if (cell.colSpan > 1) {
        cell.colSpan--
      } else {
        cell.remove()
      }
    }
  }
  
  // Row operations are simple (DOM based) unless rowspan crosses boundaries?
  // Insert Row End: `table.insertRow()`. Add cells.
  // We need to add `maxCols` cells?
  // Or match the structure?
  // Usually we add `maxCols` empty cells.
  // But if a cell in `prevRow` has `rowspan > 1`, it extends to `newRow`.
  // So we shouldn't add a cell at that column.
  // We need to check `grid[lastRow][c]`.
  // If `rowspan` extends beyond last row?
  // `rowspan` usually is exact.
  // If we add a row, we just add empty cells.
  // But if the user wants to extend the table, they assume new row is empty.
  
  // If we delete last row.
  // Check if cells have `rowspan`.
  // If `rowspan > 1`, decrement it (keep cell in upper row).
  // If `rowspan == 1`, remove cell (it's in this row).
  
  insertRowEnd() {
    const newRow = this.table.insertRow()
    // We need to add cells.
    // How many? `maxCols`.
    // BUT, check if any cell from previous rows extends into this new row (infinite rowspan? or just unclosed?)
    // Usually no.
    // So we just add `maxCols` cells.
    for (let c = 0; c < this.maxCols; c++) {
        const newCell = newRow.insertCell()
        newCell.style.border = '1px solid #ccc'
        newCell.style.padding = '8px'
        newCell.style.minWidth = '60px'
        newCell.style.height = '32px'
    }
  }

  deleteRowEnd() {
    const lastRowIndex = this.rows.length - 1
    if (lastRowIndex < 0) return
    
    // Check cells in last row
    // If a cell starts in this row: it gets deleted.
    // If a cell starts ABOVE and spans HERE: we must decrement its rowspan.
    
    const row = this.rows[lastRowIndex]
    
    // Iterate columns to find cells spanning from above
    const processedCells = new Set<HTMLTableCellElement>()
    
    for (let c = 0; c < this.maxCols; c++) {
        const cell = this.grid[lastRowIndex][c]
        if (!cell) continue
        
        if (processedCells.has(cell)) continue
        processedCells.add(cell)
        
        // Check if cell starts in this row
        const cellRow = cell.parentElement as HTMLTableRowElement
        if (cellRow !== row) {
            // Cell starts above. Decrement rowspan.
            if (cell.rowSpan > 1) cell.rowSpan--
        }
        // Else: cell is in this row. It will be removed when row is removed.
    }
    
    row.remove()
  }

  mergeCells(cells: HTMLTableCellElement[]) {
    if (cells.length < 2) return

    // 1. Calculate bounding box
    let minRow = Infinity, maxRow = -Infinity
    let minCol = Infinity, maxCol = -Infinity

    const cellPositions: { cell: HTMLTableCellElement, r: number, c: number }[] = []

    for (const cell of cells) {
      // Find cell position in grid
      for (let r = 0; r < this.rows.length; r++) {
        for (let c = 0; c < this.maxCols; c++) {
          if (this.grid[r][c] === cell) {
            minRow = Math.min(minRow, r)
            maxRow = Math.max(maxRow, r)
            minCol = Math.min(minCol, c)
            maxCol = Math.max(maxCol, c)
            cellPositions.push({ cell, r, c })
          }
        }
      }
    }

    if (minRow === Infinity) return // Should not happen

    // 2. Verify rectangularity
    // The number of cells in the grid within bounds must equal the number of cells provided
    // AND the area (width * height) must match the number of grid slots covered
    
    const targetRowCount = maxRow - minRow + 1
    const targetColCount = maxCol - minCol + 1
    const targetArea = targetRowCount * targetColCount

    // Check if every slot in the bounding box is covered by one of the input cells
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const cellAtPos = this.grid[r][c]
        if (!cellAtPos || !cells.includes(cellAtPos)) {
          return // Selection is not rectangular or contains gaps
        }
      }
    }

    // 3. Merge
    // The top-left cell is the keeper
    const keeper = this.grid[minRow][minCol]
    if (!keeper) return

    // Remove others
    const cellsToRemove = new Set<HTMLTableCellElement>()
    for (const cell of cells) {
      if (cell !== keeper) {
        cellsToRemove.add(cell)
      }
    }
    
    cellsToRemove.forEach(cell => cell.remove())

    // Update keeper
    keeper.rowSpan = targetRowCount
    keeper.colSpan = targetColCount
    
    // Re-analyze to update grid
    this.analyze()
  }

  splitCell(cell: HTMLTableCellElement) {
    const rowspan = cell.rowSpan || 1
    const colspan = cell.colSpan || 1

    if (rowspan === 1 && colspan === 1) return

    // Find position
    let startR = -1, startC = -1
    for (let r = 0; r < this.rows.length; r++) {
      const c = this.grid[r].indexOf(cell)
      if (c !== -1) {
        startR = r
        startC = c
        break
      }
    }

    if (startR === -1) return

    // Reset current cell
    cell.rowSpan = 1
    cell.colSpan = 1

    // Insert new cells for the gaps
    for (let r = startR; r < startR + rowspan; r++) {
      for (let c = startC; c < startC + colspan; c++) {
        if (r === startR && c === startC) continue // This is the original cell

        const row = this.rows[r]
        
        // We need to insert a cell at column c in row r
        // Find the insertion point: the cell at grid[r][c+1]...
        let nextCell: HTMLTableCellElement | null = null
        for (let nextC = c + 1; nextC < this.maxCols; nextC++) {
            const possibleNext = this.grid[r][nextC]
            if (possibleNext && possibleNext.parentElement === row) {
                // Make sure we haven't already seen this cell in our loop (unlikely for right-side neighbors)
                // And ensure it starts in this row (not a rowspan from above)
                nextCell = possibleNext
                break
            }
        }

        const newCell = this.table.ownerDocument.createElement('td')
        this.styleCell(newCell)

        if (nextCell) {
          row.insertBefore(newCell, nextCell)
        } else {
          row.appendChild(newCell)
        }
      }
    }
    
    this.analyze()
  }

  getCellAt(row: number, col: number): HTMLTableCellElement | null {
    if (row >= 0 && row < this.rows.length && col >= 0 && col < this.maxCols) {
      return this.grid[row][col]
    }
    return null
  }
}
