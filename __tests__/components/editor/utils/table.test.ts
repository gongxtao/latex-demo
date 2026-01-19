import { TableHandler } from '@/components/editor/utils/table';

describe('TableHandler', () => {
  let table: HTMLTableElement;
  let tbody: HTMLTableSectionElement;

  beforeEach(() => {
    table = document.createElement('table');
    tbody = document.createElement('tbody');
    table.appendChild(tbody);
  });

  const createRow = (cells: { colspan?: number, rowspan?: number, content?: string }[]) => {
    const tr = document.createElement('tr');
    cells.forEach(cellConfig => {
      const td = document.createElement('td');
      if (cellConfig.colspan) td.colSpan = cellConfig.colspan;
      if (cellConfig.rowspan) td.rowSpan = cellConfig.rowspan;
      td.textContent = cellConfig.content || '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  };

  test('should insert column at the end correctly for simple table', () => {
    // 2x2 table
    createRow([{}, {}]);
    createRow([{}, {}]);

    const handler = new TableHandler(table);
    handler.insertColumnEnd();

    expect(table.rows[0].cells.length).toBe(3);
    expect(table.rows[1].cells.length).toBe(3);
  });

  test('should delete column at the end correctly for simple table', () => {
    // 2x3 table
    createRow([{}, {}, {}]);
    createRow([{}, {}, {}]);

    const handler = new TableHandler(table);
    handler.deleteColumnEnd();

    expect(table.rows[0].cells.length).toBe(2);
    expect(table.rows[1].cells.length).toBe(2);
  });

  test('should handle colspan when deleting column', () => {
    // Row 1: [A] [B (colspan=2)]
    // Row 2: [C] [D] [E]
    createRow([{ content: 'A' }, { content: 'B', colspan: 2 }]);
    createRow([{ content: 'C' }, { content: 'D' }, { content: 'E' }]);

    const handler = new TableHandler(table);
    handler.deleteColumnEnd();

    // Should decrement colspan of B
    expect(table.rows[0].cells[1].colSpan).toBe(1);
    // Should remove E
    expect(table.rows[1].cells.length).toBe(2);
  });

  test('should insert row at the end correctly', () => {
    createRow([{}, {}]);
    
    const handler = new TableHandler(table);
    handler.insertRowEnd();

    expect(table.rows.length).toBe(2);
    expect(table.rows[1].cells.length).toBe(2);
  });

  test('should delete row at the end correctly', () => {
    createRow([{}, {}]);
    createRow([{}, {}]);
    
    const handler = new TableHandler(table);
    handler.deleteRowEnd();

    expect(table.rows.length).toBe(1);
  });

  test('should handle rowspan when deleting row', () => {
    // Row 1: [A (rowspan=2)] [B]
    // Row 2: [C]
    createRow([{ content: 'A', rowspan: 2 }, { content: 'B' }]);
    createRow([{ content: 'C' }]);

    const handler = new TableHandler(table);
    handler.deleteRowEnd();

    expect(table.rows.length).toBe(1);
    // Rowspan of A should be decremented
    expect(table.rows[0].cells[0].rowSpan).toBe(1);
  });
});
