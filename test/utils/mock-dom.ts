/**
 * DOM element mock creation utilities
 * Provides factory functions for creating mock DOM elements for testing
 */

/**
 * Mock image element configuration interface
 */
interface MockImageOptions {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  id?: string;
  style?: Partial<CSSStyleDeclaration>;
}

/**
 * Creates a mock image element with specified properties
 *
 * @param options - Image element configuration options
 * @returns Mock HTMLImageElement
 *
 * @example
 * ```tsx
 * const mockImg = createMockImage({
 *   src: 'data:image/png;base64,iVBORw0KG...',
 *   alt: 'Test image',
 *   width: 100,
 *   height: 100
 * });
 * document.body.appendChild(mockImg);
 * ```
 */
export function createMockImage(options: MockImageOptions = {}): HTMLImageElement {
  const img = document.createElement('img');

  img.src = options.src || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  img.alt = options.alt || 'Mock image';
  img.className = options.className || '';
  img.id = options.id || '';

  if (options.width !== undefined) {
    img.width = options.width;
  }

  if (options.height !== undefined) {
    img.height = options.height;
  }

  if (options.style) {
    Object.assign(img.style, options.style);
  }

  return img;
}

/**
 * Mock table element configuration interface
 */
interface MockTableOptions {
  rows?: number;
  cols?: number;
  headers?: boolean;
  data?: string[][];
  className?: string;
  id?: string;
  border?: number;
}

/**
 * Creates a mock table element with specified structure
 *
 * @param options - Table element configuration options
 * @returns Mock HTMLTableElement
 *
 * @example
 * ```tsx
 * const mockTable = createMockTable({
 *   rows: 3,
 *   cols: 2,
 *   headers: true,
 *   data: [['Header 1', 'Header 2'], ['Cell 1', 'Cell 2'], ['Cell 3', 'Cell 4']]
 * });
 * document.body.appendChild(mockTable);
 * ```
 */
export function createMockTable(options: MockTableOptions = {}): HTMLTableElement {
  const {
    rows = 3,
    cols = 3,
    headers = true,
    data,
    className = '',
    id = '',
    border = 1,
  } = options;

  const table = document.createElement('table');
  table.className = className;
  table.id = id;
  table.border = String(border);

  // Generate table from data if provided
  if (data && data.length > 0) {
    data.forEach((rowData, rowIndex) => {
      const row = document.createElement(rowIndex === 0 && headers ? 'thead' : 'tr');

      if (row instanceof HTMLTableSectionElement) {
        const headerRow = document.createElement('tr');
        rowData.forEach((cellData) => {
          const th = document.createElement('th');
          th.textContent = cellData;
          headerRow.appendChild(th);
        });
        row.appendChild(headerRow);
        table.appendChild(row);
      } else {
        rowData.forEach((cellData) => {
          const cell = document.createElement(rowIndex === 0 && headers ? 'th' : 'td');
          cell.textContent = cellData;
          row.appendChild(cell);
        });
        table.appendChild(row);
      }
    });
  } else {
    // Generate empty table with specified dimensions
    for (let i = 0; i < rows; i++) {
      const row = document.createElement('tr');

      for (let j = 0; j < cols; j++) {
        const cell = document.createElement(i === 0 && headers ? 'th' : 'td');
        cell.textContent = `${i}-${j}`;
        row.appendChild(cell);
      }

      table.appendChild(row);
    }
  }

  return table;
}

/**
 * Mock selection configuration interface
 */
interface MockSelectionOptions {
  anchorNode?: Node;
  anchorOffset?: number;
  focusNode?: Node;
  focusOffset?: number;
  rangeCount?: number;
  type?: SelectionType;
}

/**
 * Selection type enum
 */
type SelectionType = 'None' | 'Caret' | 'Range';

/**
 * Creates a mock selection object for testing editor selections
 *
 * @param options - Selection configuration options
 * @returns Mock Selection object
 *
 * @example
 * ```tsx
 * const textNode = document.createTextNode('Hello world');
 * const mockSelection = createMockSelection({
 *   anchorNode: textNode,
 *   anchorOffset: 0,
 *   focusNode: textNode,
 *   focusOffset: 5,
 *   type: 'Range'
 * });
 * ```
 */
export function createMockSelection(options: MockSelectionOptions = {}): Selection {
  const {
    anchorNode = document.createTextNode(''),
    anchorOffset = 0,
    focusNode = document.createTextNode(''),
    focusOffset = 0,
    rangeCount = 1,
    type = 'Range',
  } = options;

  const range = document.createRange();

  try {
    range.setStart(anchorNode, anchorOffset);
    range.setEnd(focusNode, focusOffset);
  } catch (e) {
    // Range may fail if nodes are not in DOM, which is fine for mocks
  }

  // Create a Selection-like object
  const mockSelection = {
    anchorNode,
    anchorOffset,
    focusNode,
    focusOffset,
    rangeCount,
    type,
    isCollapsed: anchorNode === focusNode && anchorOffset === focusOffset,

    addRange: (range: Range) => {
      // Mock implementation
    },

    removeRange: (range: Range) => {
      // Mock implementation
    },

    removeAllRanges: () => {
      // Mock implementation
    },

    getRangeAt: (index: number) => {
      if (index === 0) return range;
      throw new Error('Index out of bounds');
    },

    collapse: (node: Node, offset: number) => {
      // Mock implementation
    },

    extend: (node: Node, offset: number) => {
      // Mock implementation
    },

    collapseToStart: () => {
      // Mock implementation
    },

    collapseToEnd: () => {
      // Mock implementation
    },

    toString: () => {
      if (anchorNode.nodeType === Node.TEXT_NODE && focusNode.nodeType === Node.TEXT_NODE) {
        const anchorText = anchorNode.textContent || '';
        const focusText = focusNode.textContent || '';

        if (anchorNode === focusNode) {
          return anchorText.slice(anchorOffset, focusOffset);
        }

        return anchorText.slice(anchorOffset) + focusText.slice(0, focusOffset);
      }
      return '';
    },
  } as unknown as Selection;

  return mockSelection;
}

/**
 * Creates a mock div element with content and styles
 *
 * @param content - Inner HTML content
 * @param options - Element configuration options
 * @returns Mock HTMLDivElement
 *
 * @example
 * ```tsx
 * const mockDiv = createMockDiv('<p>Content</p>', {
 *   className: 'my-div',
 *   id: 'test-div'
 * });
 * ```
 */
export function createMockDiv(
  content: string = '',
  options: {
    className?: string;
    id?: string;
    style?: Partial<CSSStyleDeclaration>;
  } = {}
): HTMLDivElement {
  const div = document.createElement('div');
  div.innerHTML = content;
  div.className = options.className || '';
  div.id = options.id || '';

  if (options.style) {
    Object.assign(div.style, options.style);
  }

  return div;
}

/**
 * Creates a mock button element with text and event handlers
 *
 * @param text - Button text content
 * @param options - Button configuration options
 * @returns Mock HTMLButtonElement
 *
 * @example
 * ```tsx
 * const mockButton = createMockButton('Click me', {
 *   onClick: jest.fn(),
 *   className: 'btn-primary'
 * });
 * ```
 */
export function createMockButton(
  text: string = '',
  options: {
    onClick?: () => void;
    className?: string;
    id?: string;
    disabled?: boolean;
  } = {}
): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = text;
  button.className = options.className || '';
  button.id = options.id || '';
  button.disabled = options.disabled || false;

  if (options.onClick) {
    button.addEventListener('click', options.onClick);
  }

  return button;
}

/**
 * Creates a mock input element with value and validation
 *
 * @param options - Input element configuration options
 * @returns Mock HTMLInputElement
 *
 * @example
 * ```tsx
 * const mockInput = createMockInput({
 *   type: 'text',
 *   value: 'test',
 *   placeholder: 'Enter text'
 * });
 * ```
 */
export function createMockInput(options: {
  type?: string;
  value?: string;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
} = {}): HTMLInputElement {
  const input = document.createElement('input');
  input.type = options.type || 'text';
  input.value = options.value || '';
  input.placeholder = options.placeholder || '';
  input.className = options.className || '';
  input.id = options.id || '';
  input.disabled = options.disabled || false;

  return input;
}

/**
 * Creates a mock document fragment for testing
 *
 * @param children - Child elements to add to fragment
 * @returns DocumentFragment with children
 *
 * @example
 * ```tsx
 * const fragment = createMockFragment([
 *   createMockDiv('First div'),
 *   createMockDiv('Second div')
 * ]);
 * ```
 */
export function createMockFragment(children: Element[] = []): DocumentFragment {
  const fragment = document.createDocumentFragment();
  children.forEach((child) => fragment.appendChild(child));
  return fragment;
}
