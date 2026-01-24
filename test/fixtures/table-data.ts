/**
 * Table data fixtures for testing
 * Provides test data for table creation, manipulation, and rendering
 */

/**
 * Table cell data interface
 */
export interface TableCell {
  content: string;
  colspan?: number;
  rowspan?: number;
  isHeader?: boolean;
  style?: Partial<CSSStyleDeclaration>;
}

/**
 * Table row data interface
 */
export interface TableRow {
  cells: TableCell[];
  isHeader?: boolean;
  style?: Partial<CSSStyleDeclaration>;
}

/**
 * Table data fixture interface
 */
export interface TableFixture {
  name: string;
  description: string;
  rows: TableRow[];
  expectedBehavior: string;
  rowCount: number;
  colCount: number;
}

/**
 * Simple 2x2 table fixture
 */
export const simple2x2: TableFixture = {
  name: 'simple-2x2-table',
  description: 'Basic 2x2 table without any merged cells',
  rows: [
    {
      isHeader: true,
      cells: [
        { content: 'Header 1', isHeader: true },
        { content: 'Header 2', isHeader: true },
      ],
    },
    {
      cells: [
        { content: 'Cell 1' },
        { content: 'Cell 2' },
      ],
    },
  ],
  expectedBehavior: 'Should render a simple 2x2 table with header row',
  rowCount: 2,
  colCount: 2,
};

/**
 * Simple 3x3 table fixture
 */
export const simple3x3: TableFixture = {
  name: 'simple-3x3-table',
  description: 'Basic 3x3 table without any merged cells',
  rows: [
    {
      isHeader: true,
      cells: [
        { content: 'Header 1', isHeader: true },
        { content: 'Header 2', isHeader: true },
        { content: 'Header 3', isHeader: true },
      ],
    },
    {
      cells: [
        { content: 'Cell 1' },
        { content: 'Cell 2' },
        { content: 'Cell 3' },
      ],
    },
    {
      cells: [
        { content: 'Cell 4' },
        { content: 'Cell 5' },
        { content: 'Cell 6' },
      ],
    },
  ],
  expectedBehavior: 'Should render a simple 3x3 table with header row',
  rowCount: 3,
  colCount: 3,
};

/**
 * Table with merged cells fixture
 */
export const withMergedCells: TableFixture = {
  name: 'table-with-merged-cells',
  description: 'Table with horizontally and vertically merged cells',
  rows: [
    {
      isHeader: true,
      cells: [
        { content: 'Header 1', colspan: 2, isHeader: true },
        { content: 'Header 3', isHeader: true },
      ],
    },
    {
      cells: [
        { content: 'Cell 1', rowspan: 2 },
        { content: 'Cell 2' },
        { content: 'Cell 3' },
      ],
    },
    {
      cells: [
        { content: 'Cell 4' },
        { content: 'Cell 5' },
      ],
    },
  ],
  expectedBehavior: 'Should render table with merged cells using colspan and rowspan',
  rowCount: 3,
  colCount: 3,
};

/**
 * Table with colspan and rowspan fixture
 */
export const withColspanRowspan: TableFixture = {
  name: 'table-with-colspan-rowspan',
  description: 'Complex table with various colspan and rowspan combinations',
  rows: [
    {
      isHeader: true,
      cells: [
        { content: 'Title', colspan: 4, isHeader: true },
      ],
    },
    {
      isHeader: true,
      cells: [
        { content: 'Col 1', isHeader: true },
        { content: 'Col 2', isHeader: true },
        { content: 'Col 3', isHeader: true },
        { content: 'Col 4', isHeader: true },
      ],
    },
    {
      cells: [
        { content: 'Row 1, Col 1', rowspan: 2 },
        { content: 'Row 1, Col 2' },
        { content: 'Row 1, Col 3', colspan: 2 },
      ],
    },
    {
      cells: [
        { content: 'Row 2, Col 2' },
        { content: 'Row 2, Col 3' },
        { content: 'Row 2, Col 4' },
      ],
    },
    {
      cells: [
        { content: 'Row 3, Col 1', colspan: 2, rowspan: 2 },
        { content: 'Row 3, Col 3' },
        { content: 'Row 3, Col 4' },
      ],
    },
    {
      cells: [
        { content: 'Row 4, Col 3' },
        { content: 'Row 4, Col 4' },
      ],
    },
  ],
  expectedBehavior: 'Should render complex table with multiple colspan and rowspan',
  rowCount: 6,
  colCount: 4,
};

/**
 * Resume-style table fixture
 */
export const resumeStyle: TableFixture = {
  name: 'resume-style-table',
  description: 'Table formatted like a resume with skills and experience',
  rows: [
    {
      cells: [
        {
          content: 'Skills',
          style: { fontWeight: 'bold', backgroundColor: '#f0f0f0' },
        },
        {
          content: 'JavaScript, TypeScript, React, Node.js',
        },
      ],
    },
    {
      cells: [
        {
          content: 'Experience',
          style: { fontWeight: 'bold', backgroundColor: '#f0f0f0' },
        },
        {
          content: 'Senior Software Engineer at Tech Corp (2020-Present)',
        },
      ],
    },
    {
      cells: [
        {
          content: 'Education',
          style: { fontWeight: 'bold', backgroundColor: '#f0f0f0' },
        },
        {
          content: 'BS Computer Science, University of Technology (2019)',
        },
      ],
    },
  ],
  expectedBehavior: 'Should render a resume-style table with styled headers',
  rowCount: 3,
  colCount: 2,
};

/**
 * Empty table fixture
 */
export const empty: TableFixture = {
  name: 'empty-table',
  description: 'Empty table with no rows',
  rows: [],
  expectedBehavior: 'Should render an empty table',
  rowCount: 0,
  colCount: 0,
};

/**
 * Single cell table fixture
 */
export const singleCell: TableFixture = {
  name: 'single-cell-table',
  description: 'Table with a single cell',
  rows: [
    {
      cells: [
        { content: 'Single Cell' },
      ],
    },
  ],
  expectedBehavior: 'Should render a table with one cell',
  rowCount: 1,
  colCount: 1,
};

/**
 * Wide table fixture (many columns)
 */
export const wide: TableFixture = {
  name: 'wide-table',
  description: 'Table with many columns',
  rows: [
    {
      isHeader: true,
      cells: Array.from({ length: 10 }, (_, i) => ({
        content: `Header ${i + 1}`,
        isHeader: true,
      })),
    },
    {
      cells: Array.from({ length: 10 }, (_, i) => ({
        content: `Data ${i + 1}`,
      })),
    },
  ],
  expectedBehavior: 'Should render a wide table with 10 columns',
  rowCount: 2,
  colCount: 10,
};

/**
 * Tall table fixture (many rows)
 */
export const tall: TableFixture = {
  name: 'tall-table',
  description: 'Table with many rows',
  rows: [
    {
      isHeader: true,
      cells: [
        { content: 'ID', isHeader: true },
        { content: 'Name', isHeader: true },
        { content: 'Value', isHeader: true },
      ],
    },
    ...Array.from({ length: 20 }, (_, i) => ({
      cells: [
        { content: `${i + 1}` },
        { content: `Item ${i + 1}` },
        { content: `Value ${i + 1}` },
      ],
    })),
  ],
  expectedBehavior: 'Should render a tall table with 20 data rows',
  rowCount: 21,
  colCount: 3,
};

/**
 * Nested content table fixture
 */
export const withNestedContent: TableFixture = {
  name: 'table-with-nested-content',
  description: 'Table cells containing nested HTML content',
  rows: [
    {
      isHeader: true,
      cells: [
        { content: 'Description', isHeader: true },
        { content: 'Details', isHeader: true },
      ],
    },
    {
      cells: [
        {
          content: 'Text with <strong>bold</strong> and <em>italic</em>',
        },
        {
          content: 'List: <ul><li>Item 1</li><li>Item 2</li></ul>',
        },
      ],
    },
    {
      cells: [
        {
          content: 'Link: <a href="#">Click here</a>',
        },
        {
          content: 'Code: <code>const x = 1;</code>',
        },
      ],
    },
  ],
  expectedBehavior: 'Should render table with nested HTML content in cells',
  rowCount: 3,
  colCount: 2,
};

/**
 * All table fixtures indexed by name
 */
export const tableFixtures = {
  simple2x2,
  simple3x3,
  withMergedCells,
  withColspanRowspan,
  resumeStyle,
  empty,
  singleCell,
  wide,
  tall,
  withNestedContent,
};

/**
 * Gets a table fixture by name
 *
 * @param name - Name of the fixture
 * @returns Table fixture or undefined if not found
 */
export function getFixture(name: keyof typeof tableFixtures): TableFixture {
  return tableFixtures[name];
}

/**
 * Gets all table fixture names
 *
 * @returns Array of fixture names
 */
export function getFixtureNames(): Array<keyof typeof tableFixtures> {
  return Object.keys(tableFixtures) as Array<keyof typeof tableFixtures>;
}

/**
 * Gets a table fixture by name (alias for getFixture)
 *
 * @param name - Name of the fixture
 * @returns Table fixture or undefined if not found
 */
export function getTableFixture(name: keyof typeof tableFixtures): TableFixture {
  return getFixture(name);
}

/**
 * Creates a mock HTML table element from a fixture name
 *
 * @param name - Name of the fixture
 * @returns HTMLTableElement populated with fixture data
 */
export function createMockTable(name: keyof typeof tableFixtures): HTMLTableElement {
  const fixture = getFixture(name);
  return createMockTableFromFixture(fixture);
}

/**
 * Creates a mock HTML table element from fixture data
 *
 * @param fixture - Table fixture data
 * @returns HTMLTableElement populated with fixture data
 */
export function createMockTableFromFixture(fixture: TableFixture): HTMLTableElement {
  const table = document.createElement('table');
  table.border = '1';

  fixture.rows.forEach((rowData) => {
    const row = document.createElement(rowData.isHeader ? 'thead' : 'tr');

    if (row instanceof HTMLTableSectionElement) {
      // Create thead row
      const tr = document.createElement('tr');
      if (rowData.style) {
        Object.assign(tr.style, rowData.style);
      }

      rowData.cells.forEach((cellData) => {
        const cell = document.createElement('th');
        cell.innerHTML = cellData.content;

        if (cellData.colspan) cell.colSpan = cellData.colspan;
        if (cellData.rowspan) cell.rowSpan = cellData.rowspan;
        if (cellData.style) {
          Object.assign(cell.style, cellData.style);
        }

        tr.appendChild(cell);
      });

      row.appendChild(tr);
      table.appendChild(row);
    } else {
      // Create regular row
      if (rowData.style) {
        Object.assign(row.style, rowData.style);
      }

      rowData.cells.forEach((cellData) => {
        const cell = document.createElement(
          cellData.isHeader || rowData.isHeader ? 'th' : 'td'
        );
        cell.innerHTML = cellData.content;

        if (cellData.colspan) cell.colSpan = cellData.colspan;
        if (cellData.rowspan) cell.rowSpan = cellData.rowspan;
        if (cellData.style) {
          Object.assign(cell.style, cellData.style);
        }

        row.appendChild(cell);
      });

      table.appendChild(row);
    }
  });

  return table;
}

/**
 * Creates a mock table cell element
 *
 * @param cellData - Cell data
 * @param isHeader - Whether cell is a header cell
 * @returns HTMLTableCellElement
 */
export function createMockTableCell(
  cellData: TableCell,
  isHeader: boolean = false
): HTMLTableCellElement {
  const cell = document.createElement(isHeader ? 'th' : 'td');
  cell.innerHTML = cellData.content;

  if (cellData.colspan) cell.colSpan = cellData.colspan;
  if (cellData.rowspan) cell.rowSpan = cellData.rowspan;
  if (cellData.style) {
    Object.assign(cell.style, cellData.style);
  }

  return cell;
}

/**
 * Creates a mock table row element
 *
 * @param rowData - Row data
 * @returns HTMLTableRowElement
 */
export function createMockTableRow(rowData: TableRow): HTMLTableRowElement {
  const row = document.createElement('tr');

  if (rowData.style) {
    Object.assign(row.style, rowData.style);
  }

  rowData.cells.forEach((cellData) => {
    const cell = createMockTableCell(cellData, cellData.isHeader || rowData.isHeader);
    row.appendChild(cell);
  });

  return row;
}
