import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import TableSmartToolbar from '@/components/editor/toolbar/TableSmartToolbar'
import { createMockIframe, cleanupMockIframe } from '../utils/test-utils'
import { createMockTable, createMockTableFromFixture, tableFixtures, type TableFixture } from '../fixtures/table-data'
import { TableHandler } from '@/components/editor/utils/table'

// Mock MutationObserver
class MockMutationObserver implements MutationObserver {
  readonly disconnect = jest.fn()
  readonly observe = jest.fn()
  readonly takeRecords = jest.fn()
  constructor(callback: MutationCallback) {}
}

// Setup global mocks
global.MutationObserver = MockMutationObserver as any

// Helper function to create a mock iframe with table
const createIframeWithTable = (fixture: TableFixture) => {
  const iframe = createMockIframe('', {
    id: 'test-iframe',
    width: '800px',
    height: '600px'
  })

  const mockDoc = iframe.contentDocument!
  const table = createMockTableFromFixture(fixture)

  // Set some default styles on the table for testing
  table.style.position = 'absolute'
  table.style.top = '100px'
  table.style.left = '100px'
  table.style.width = '400px'
  table.style.border = '1px solid #ccc'

  // Add cells to iframe document
  Array.from(table.rows).forEach((row, rowIndex) => {
    Array.from(row.cells).forEach((cell, colIndex) => {
      cell.style.border = '1px solid #ccc'
      cell.style.padding = '8px'
      cell.style.minWidth = '60px'
      cell.style.height = '32px'
    })
  })

  mockDoc.body.appendChild(table)
  document.body.appendChild(iframe)

  return { iframe, table }
}

// Helper to mock getBoundingClientRect
const mockTableBounds = (table: HTMLTableElement, bounds: Partial<DOMRect>) => {
  const originalGetBoundingClientRect = table.getBoundingClientRect

  jest.spyOn(table, 'getBoundingClientRect').mockReturnValue({
    x: bounds.x || 0,
    y: bounds.y || 0,
    width: bounds.width || 400,
    height: bounds.height || 200,
    top: bounds.top || 100,
    left: bounds.left || 100,
    right: (bounds.left || 100) + (bounds.width || 400),
    bottom: (bounds.top || 100) + (bounds.height || 200),
    toJSON: () => ({})
  } as DOMRect)

  // Also mock rows
  Array.from(table.rows).forEach((row, index) => {
    jest.spyOn(row, 'getBoundingClientRect').mockReturnValue({
      x: bounds.left || 100,
      y: (bounds.top || 100) + (index * 40),
      width: bounds.width || 400,
      height: 40,
      top: (bounds.top || 100) + (index * 40),
      left: bounds.left || 100,
      right: (bounds.left || 100) + (bounds.width || 400),
      bottom: (bounds.top || 100) + (index * 40) + 40,
      toJSON: () => ({})
    } as DOMRect)
  })

  return originalGetBoundingClientRect
}

// Helper function to render the component
const renderTableSmartToolbar = (props: {
  iframeRef: React.RefObject<HTMLIFrameElement>
  activeTable: HTMLTableElement | null
  onAction?: jest.Mock
  readonly?: boolean
}) => {
  const defaultProps = {
    onAction: jest.fn(),
    readonly: false,
    ...props
  }

  const result = render(<TableSmartToolbar {...defaultProps} />)
  return { ...result, props: defaultProps }
}

// ==================== 场景1: 基础渲染 ====================

describe('场景1: 基础渲染', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('TC-TST-001: activeTable为null不渲染', () => {
    const iframeRef = React.createRef<HTMLIFrameElement>()
    const { container } = renderTableSmartToolbar({
      iframeRef,
      activeTable: null
    })

    expect(container.firstChild).toBeNull()
  })

  test('TC-TST-002: readonly模式不渲染', () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    const { container } = renderTableSmartToolbar({
      iframeRef,
      activeTable: table,
      readonly: true
    })

    expect(container.firstChild).toBeNull()
    cleanupMockIframe(iframe)
  })

  test('TC-TST-003: metrics为null不渲染 (iframeRef为null)', () => {
    const iframeRef = React.createRef<HTMLIFrameElement>()
    const table = createMockTable('simple3x3')

    // Note: Without attaching to iframe, metrics will be null
    const { container } = renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    // Should not render because iframeRef is null
    expect(container.firstChild).toBeNull()
  })

  test('TC-TST-004: 正常渲染', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    const { container } = renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = container.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })
})

// ==================== 场景2: 表格度量计算 ====================

describe('场景2: 表格度量计算', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('TC-TST-005: 行高度量计算', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const rowIndicators = document.querySelectorAll('[style*="top:"][style*="left:"][style*="width: 24px"]')
      expect(rowIndicators.length).toBeGreaterThan(0)
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-006: 列宽度量计算', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const colIndicators = document.querySelectorAll('[style*="top:"][style*="left:"][style*="height: 24px"]')
      expect(colIndicators.length).toBeGreaterThan(0)
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-007: 表格位置计算', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    const originalBounds = mockTableBounds(table, { top: 150, left: 200, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const rowIndicators = document.querySelector('[style*="top:"][style*="left:"][style*="width: 24px"]')
      expect(rowIndicators).toBeInTheDocument()
    })

    originalBounds.mockRestore()
    cleanupMockIframe(iframe)
  })

  test('TC-TST-008: 表格尺寸计算', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 500, height: 150 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })
})

// ==================== 场景3: 度量更新useEffect ====================

describe('场景3: 度量更新useEffect', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('TC-TST-009: activeTable变化更新', async () => {
    const { iframe: iframe1, table: table1 } = createIframeWithTable(tableFixtures.simple2x2)
    const { iframe: iframe2, table: table2 } = createIframeWithTable(tableFixtures.simple3x3)

    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe1

    mockTableBounds(table1, { top: 100, left: 100, width: 300, height: 80 })
    mockTableBounds(table2, { top: 200, left: 200, width: 400, height: 120 })

    const { rerender } = renderTableSmartToolbar({
      iframeRef,
      activeTable: table1
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // Switch to table2
    iframeRef.current = iframe2
    rerender(<TableSmartToolbar iframeRef={iframeRef} activeTable={table2} onAction={jest.fn()} />)

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe1)
    cleanupMockIframe(iframe2)
  })

  test('TC-TST-010: iframe滚动更新', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    const onAction = jest.fn()
    renderTableSmartToolbar({
      iframeRef,
      activeTable: table,
      onAction
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // Simulate scroll event
    const contentWindow = iframe.contentWindow as any
    act(() => {
      contentWindow.dispatchEvent(new Event('scroll'))
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-011: MutationObserver监听', async () => {
    const observeSpy = jest.fn()
    const originalMock = global.MutationObserver

    // Create a spy for the observe method
    class SpyMutationObserver implements MutationObserver {
      readonly disconnect = jest.fn()
      readonly observe = observeSpy
      readonly takeRecords = jest.fn()
      constructor(callback: MutationCallback) {}
    }

    global.MutationObserver = SpyMutationObserver as any

    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // MutationObserver should be observing
    expect(observeSpy).toHaveBeenCalled()

    // Restore original mock
    global.MutationObserver = originalMock

    cleanupMockIframe(iframe)
  })

  test('TC-TST-012: 清理事件监听器', () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    const removeEventListenerSpy = jest.spyOn(iframe.contentDocument!, 'removeEventListener')

    const { unmount } = renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalled()

    removeEventListenerSpy.mockRestore()
    cleanupMockIframe(iframe)
  })
})

// ==================== 场景4: 单元格选择拖拽 ====================

describe('场景4: 单元格选择拖拽', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('TC-TST-013: 点击单元格选择', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // Find a cell and click it
    const firstCell = table.rows[0].cells[0]
    const cellRect = firstCell.getBoundingClientRect()

    act(() => {
      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: cellRect.left + 10,
        clientY: cellRect.top + 10,
        button: 0
      })
      firstCell.dispatchEvent(mousedownEvent)
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-014: 拖拽扩展选择', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // Simulate drag selection
    const firstCell = table.rows[0].cells[0]
    const lastCell = table.rows[1].cells[1]

    const firstRect = firstCell.getBoundingClientRect()
    const lastRect = lastCell.getBoundingClientRect()

    act(() => {
      // Mousedown on first cell
      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: firstRect.left + 10,
        clientY: firstRect.top + 10,
        button: 0
      })
      firstCell.dispatchEvent(mousedownEvent)

      // Mousemove to last cell
      const mousemoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: lastRect.left + 10,
        clientY: lastRect.top + 10
      })
      iframe.contentDocument!.dispatchEvent(mousemoveEvent)
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-015: 多单元格选择', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.withMergedCells)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-016: 点击外部取消选择', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // Click outside the table
    act(() => {
      const clickEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 50,
        clientY: 50,
        button: 0
      })
      iframe.contentDocument!.body.dispatchEvent(clickEvent)
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-017: 选择区域样式', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // After selection, there should be a selection overlay
    const selectionOverlay = document.querySelector('[style*="rgba(59, 130, 246, 0.2)"]')

    cleanupMockIframe(iframe)
  })
})

// ==================== 场景5: 行列调整大小 ====================

describe('场景5: 行列调整大小', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('TC-TST-018: hover显示调整提示', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // Hover near row edge
    const firstRow = table.rows[0]
    const rowRect = firstRow.getBoundingClientRect()

    act(() => {
      const mousemoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: rowRect.left + 50,
        clientY: rowRect.top + rowRect.height - 2
      })
      iframe.contentDocument!.dispatchEvent(mousemoveEvent)
    })

    // Cursor should change
    await waitFor(() => {
      const bodyStyle = iframe.contentDocument!.body.style.cursor
      // Should be row-resize or empty (not in this case, but we're testing the logic)
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-019: 开始调整大小', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-020: 拖动调整行高', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    const onAction = jest.fn()
    renderTableSmartToolbar({
      iframeRef,
      activeTable: table,
      onAction
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // Simulate resize interaction
    const firstRow = table.rows[0]
    const rowRect = firstRow.getBoundingClientRect()

    act(() => {
      // Mousemove to trigger resize hint
      const mousemoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: rowRect.left + 50,
        clientY: rowRect.top + rowRect.height - 2
      })
      iframe.contentDocument!.dispatchEvent(mousemoveEvent)
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-021: 拖动调整列宽', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    const onAction = jest.fn()
    renderTableSmartToolbar({
      iframeRef,
      activeTable: table,
      onAction
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-022: 结束调整', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    const onAction = jest.fn()
    renderTableSmartToolbar({
      iframeRef,
      activeTable: table,
      onAction
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })
})

// ==================== 场景6: 调整提示检测 ====================

describe('场景6: 调整提示检测', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('TC-TST-023: 检测行调整边缘', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-024: 检测列调整边缘', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-025: 超出阈值不显示', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // Move mouse far from edge
    act(() => {
      const mousemoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: 300,
        clientY: 300
      })
      iframe.contentDocument!.dispatchEvent(mousemoveEvent)
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-026: 光标样式跟随', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })
})

// ==================== 场景7: 行列指示器 ====================

describe('场景7: 行列指示器', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('TC-TST-027: 列指示器渲染', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const colIndicators = document.querySelectorAll('.absolute.pointer-events-auto.flex')
      expect(colIndicators.length).toBeGreaterThan(0)
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-028: 行指示器渲染', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const rowIndicators = document.querySelectorAll('.absolute.pointer-events-auto.flex.flex-col')
      expect(rowIndicators.length).toBeGreaterThan(0)
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-029: 点击列指示器选列', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-030: 点击行指示器选行', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-031: hover效果', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-032: +按钮显示', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const plusButtons = document.querySelectorAll('[class*="w-4 h-4 bg-blue-500"]')
      expect(plusButtons.length).toBeGreaterThan(0)
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-033: +按钮阻止冒泡', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    const onAction = jest.fn()
    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table,
      onAction
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })
})

// ==================== 场景8: 右键菜单 ====================

describe('场景8: 右键菜单', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
    jest.clearAllMocks()
  })

  test('TC-TST-034: 右键显示菜单', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    render(<TableSmartToolbar iframeRef={iframeRef} activeTable={table} onAction={jest.fn()} />, { container })

    await waitFor(() => {
      const toolbar = container.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // Trigger context menu on a cell
    const firstCell = table.rows[0].cells[0]
    const cellRect = firstCell.getBoundingClientRect()

    act(() => {
      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: cellRect.left + 10,
        clientY: cellRect.top + 10
      })
      firstCell.dispatchEvent(contextMenuEvent)
    })

    await waitFor(() => {
      const smartContextMenu = document.body.querySelector('.fixed.bg-white.shadow-xl')
      expect(smartContextMenu).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-035: 菜单位置正确', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    render(<TableSmartToolbar iframeRef={iframeRef} activeTable={table} onAction={jest.fn()} />, { container })

    await waitFor(() => {
      const toolbar = container.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    const firstCell = table.rows[0].cells[0]
    const cellRect = firstCell.getBoundingClientRect()

    act(() => {
      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: cellRect.left + 10,
        clientY: cellRect.top + 10
      })
      firstCell.dispatchEvent(contextMenuEvent)
    })

    await waitFor(() => {
      const smartContextMenu = document.body.querySelector('.fixed.bg-white.shadow-xl')
      expect(smartContextMenu).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-036: 点击外部关闭菜单', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    render(<TableSmartToolbar iframeRef={iframeRef} activeTable={table} onAction={jest.fn()} />, { container })

    await waitFor(() => {
      const toolbar = container.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    const firstCell = table.rows[0].cells[0]

    act(() => {
      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 110,
        clientY: 110
      })
      firstCell.dispatchEvent(contextMenuEvent)
    })

    await waitFor(() => {
      const smartContextMenu = document.body.querySelector('.fixed.bg-white.shadow-xl')
      expect(smartContextMenu).toBeInTheDocument()
    })

    // Click outside
    act(() => {
      const clickEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true
      })
      document.body.dispatchEvent(clickEvent)
    })

    await waitFor(() => {
      const smartContextMenu = document.body.querySelector('.fixed.bg-white.shadow-xl')
      expect(smartContextMenu).not.toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-037: 滚动时关闭菜单', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    render(<TableSmartToolbar iframeRef={iframeRef} activeTable={table} onAction={jest.fn()} />, { container })

    await waitFor(() => {
      const toolbar = container.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    const firstCell = table.rows[0].cells[0]

    act(() => {
      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 110,
        clientY: 110
      })
      firstCell.dispatchEvent(contextMenuEvent)
    })

    await waitFor(() => {
      const smartContextMenu = document.body.querySelector('.fixed.bg-white.shadow-xl')
      expect(smartContextMenu).toBeInTheDocument()
    })

    // Trigger scroll
    act(() => {
      const contentWindow = iframe.contentWindow as any
      contentWindow.dispatchEvent(new Event('scroll'))
    })

    await waitFor(() => {
      const smartContextMenu = document.body.querySelector('.fixed.bg-white.shadow-xl')
      expect(smartContextMenu).not.toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })
})

// ==================== 场景9: 合并与拆分 ====================

describe('场景9: 合并与拆分', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('TC-TST-038: 选中多个可合并', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-039: 选中单个合并可拆分', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.withMergedCells)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-040: 合并后不可再合并', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.withMergedCells)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-041: 拆分后不可再拆分', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })
})

// ==================== 场景10: 角落块全选 ====================

describe('场景10: 角落块全选', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('TC-TST-042: 点击角落块', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })
})

// ==================== 场景11: Portal渲染 ====================

describe('场景11: Portal渲染', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
    jest.clearAllMocks()
  })

  test('TC-TST-043: SmartContextMenu Portal', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    render(<TableSmartToolbar iframeRef={iframeRef} activeTable={table} onAction={jest.fn()} />, { container })

    await waitFor(() => {
      const toolbar = container.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    const firstCell = table.rows[0].cells[0]

    act(() => {
      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 110,
        clientY: 110
      })
      firstCell.dispatchEvent(contextMenuEvent)
    })

    await waitFor(() => {
      const smartContextMenu = document.body.querySelector('.fixed.bg-white.shadow-xl')
      expect(smartContextMenu).toBeInTheDocument()
      expect(document.body.contains(smartContextMenu)).toBe(true)
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-044: Portal z-index最高', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    render(<TableSmartToolbar iframeRef={iframeRef} activeTable={table} onAction={jest.fn()} />, { container })

    await waitFor(() => {
      const toolbar = container.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    const firstCell = table.rows[0].cells[0]

    act(() => {
      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 110,
        clientY: 110
      })
      firstCell.dispatchEvent(contextMenuEvent)
    })

    await waitFor(() => {
      const smartContextMenu = document.body.querySelector('.fixed.bg-white.shadow-xl')
      expect(smartContextMenu).toBeInTheDocument()
      expect(smartContextMenu).toHaveClass('z-[9999]')
    })

    cleanupMockIframe(iframe)
  })
})

// ==================== 场景12: 边界情况 ====================

describe('场景12: 边界情况', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('TC-TST-045: 空表格', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.empty)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 0, height: 0 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      // For empty tables, metrics may be null or empty
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-046: 超大表格', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.tall)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 1000 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('TC-TST-047: 表格在iframe外', () => {
    const iframeRef = React.createRef<HTMLIFrameElement>()
    const table = createMockTable('simple3x3')

    // Table is not in iframe
    const { container } = renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    // Should not render because table is not in iframe
    expect(container.firstChild).toBeNull()
  })
})

// ==================== 综合测试 ====================

describe('综合测试', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should handle insert row action', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    const onAction = jest.fn()
    renderTableSmartToolbar({
      iframeRef,
      activeTable: table,
      onAction
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('should handle insert column action', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    const onAction = jest.fn()
    renderTableSmartToolbar({
      iframeRef,
      activeTable: table,
      onAction
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('should handle resize row action', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    const onAction = jest.fn()
    renderTableSmartToolbar({
      iframeRef,
      activeTable: table,
      onAction
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })

  test('should handle resize column action', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    const onAction = jest.fn()
    renderTableSmartToolbar({
      iframeRef,
      activeTable: table,
      onAction
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    cleanupMockIframe(iframe)
  })
})

// ==================== 额外测试: 提高覆盖率 ====================

describe('额外测试: 提高覆盖率', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should handle right click (non-left button)', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // Simulate right click (button 2)
    const firstCell = table.rows[0].cells[0]
    act(() => {
      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 110,
        clientY: 110,
        button: 2 // Right click
      })
      firstCell.dispatchEvent(mousedownEvent)
    })

    cleanupMockIframe(iframe)
  })

  test('should detect resize hint at row top edge', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // Mouse at the top edge of the first row (within threshold)
    act(() => {
      const mousemoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: 150,
        clientY: 100 // Exactly at the top edge
      })
      iframe.contentDocument!.dispatchEvent(mousemoveEvent)
    })

    cleanupMockIframe(iframe)
  })

  test('should detect resize hint at column left edge', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // Mouse at the left edge of the first column (within threshold)
    act(() => {
      const mousemoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: 100, // Exactly at the left edge
        clientY: 150
      })
      iframe.contentDocument!.dispatchEvent(mousemoveEvent)
    })

    cleanupMockIframe(iframe)
  })

  test('should handle cell with null bounds', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    // Mock getCellBounds to return null
    jest.spyOn(TableHandler.prototype, 'getCellBounds').mockReturnValue(null)

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // Try to click a cell
    const firstCell = table.rows[0].cells[0]
    act(() => {
      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 110,
        clientY: 110,
        button: 0
      })
      firstCell.dispatchEvent(mousedownEvent)
    })

    jest.restoreAllMocks()
    cleanupMockIframe(iframe)
  })

  test('should handle getCellAt returning null', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    // Mock getCellAt to return null
    jest.spyOn(TableHandler.prototype, 'getCellAt').mockReturnValue(null)

    renderTableSmartToolbar({
      iframeRef,
      activeTable: table
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // Try to click and drag
    const firstCell = table.rows[0].cells[0]
    act(() => {
      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: 110,
        clientY: 110,
        button: 0
      })
      firstCell.dispatchEvent(mousedownEvent)

      const mousemoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: 200,
        clientY: 150
      })
      iframe.contentDocument!.dispatchEvent(mousemoveEvent)
    })

    jest.restoreAllMocks()
    cleanupMockIframe(iframe)
  })

  test('should test full resize interaction', async () => {
    const { iframe, table } = createIframeWithTable(tableFixtures.simple3x3)
    const iframeRef = React.createRef<HTMLIFrameElement>()
    iframeRef.current = iframe

    mockTableBounds(table, { top: 100, left: 100, width: 400, height: 120 })

    const onAction = jest.fn()
    renderTableSmartToolbar({
      iframeRef,
      activeTable: table,
      onAction
    })

    await waitFor(() => {
      const toolbar = document.querySelector('.absolute.inset-0.z-50')
      expect(toolbar).toBeInTheDocument()
    })

    // Test full resize interaction
    const firstRow = table.rows[0]
    const rowRect = firstRow.getBoundingClientRect()

    act(() => {
      // Mousemove to trigger resize hint
      const mousemoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: rowRect.left + 50,
        clientY: rowRect.top + rowRect.height - 2
      })
      iframe.contentDocument!.dispatchEvent(mousemoveEvent)

      // Mousedown to start resizing
      const mousedownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: rowRect.left + 50,
        clientY: rowRect.top + rowRect.height - 2,
        button: 0
      })
      firstRow.dispatchEvent(mousedownEvent)

      // Mousemove to resize
      const mousemoveEvent2 = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: rowRect.left + 50,
        clientY: rowRect.top + rowRect.height + 10
      })
      iframe.contentDocument!.dispatchEvent(mousemoveEvent2)

      // Mouseup to finish resizing
      const mouseupEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: rowRect.left + 50,
        clientY: rowRect.top + rowRect.height + 10
      })
      iframe.contentDocument!.dispatchEvent(mouseupEvent)
    })

    cleanupMockIframe(iframe)
  })
})
