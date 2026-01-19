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
}
