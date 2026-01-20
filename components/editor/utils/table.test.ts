import { TableHandler } from './table'

const createTable = (rows: number, cols: number) => {
  const table = document.createElement('table')
  const tbody = document.createElement('tbody')
  table.appendChild(tbody)
  for (let r = 0; r < rows; r++) {
    const row = document.createElement('tr')
    for (let c = 0; c < cols; c++) {
      row.appendChild(document.createElement('td'))
    }
    tbody.appendChild(row)
  }
  return table
}

describe('TableHandler resize helpers', () => {
  it('clamps row height and applies to row cells', () => {
    const table = createTable(2, 2)
    const handler = new TableHandler(table)
    handler.setRowHeight(0, 10)
    expect(table.rows[0].style.height).toBe('32px')
    expect(table.rows[0].cells[0].style.height).toBe('32px')
    handler.setRowHeight(1, 48)
    expect(table.rows[1].style.height).toBe('48px')
    expect(table.rows[1].cells[1].style.height).toBe('48px')
  })

  it('clamps column width and applies to column cells', () => {
    const table = createTable(2, 2)
    const handler = new TableHandler(table)
    handler.setColumnWidth(1, 20)
    expect(table.rows[0].cells[1].style.width).toBe('60px')
    expect(table.rows[1].cells[1].style.minWidth).toBe('60px')
    handler.setColumnWidth(0, 120)
    expect(table.rows[0].cells[0].style.width).toBe('120px')
    expect(table.rows[1].cells[0].style.minWidth).toBe('120px')
  })

  it('applies column width once for colspan cells', () => {
    const table = document.createElement('table')
    const row1 = table.insertRow()
    const spanCell = row1.insertCell()
    spanCell.colSpan = 2
    const row2 = table.insertRow()
    row2.insertCell()
    row2.insertCell()
    const handler = new TableHandler(table)
    handler.setColumnWidth(0, 110)
    expect(spanCell.style.width).toBe('110px')
    expect(row2.cells[0].style.width).toBe('110px')
  })
})
