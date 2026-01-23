# 测试实现方案

## 一、项目测试架构分析

### 1.1 现有测试配置

| 配置项 | 状态 | 说明 |
|--------|------|------|
| 测试框架 | ✅ Jest 30.2.0 | 已配置 |
| React测试库 | ✅ @testing-library/react 16.3.1 | 已安装 |
| DOM环境 | ✅ jest-environment-jsdom | 已配置 |
| TypeScript | ✅ ts-jest 29.4.6 | 已配置 |
| 测试脚本 | ❌ 缺失 | 需要添加 |
| 覆盖率配置 | ❌ 缺失 | 需要添加 |
| 测试工具函数 | ❌ 缺失 | 需要创建 |

### 1.2 现有测试文件结构

```
├── __tests__/
│   └── components/
│       └── editor/
│           ├── hooks/
│           │   └── useHistory.test.ts          ✅ 已有
│           └── utils/
│               └── style.test.ts               ✅ 已有
└── components/
    └── editor/
        ├── EditorToolbar.test.tsx              ✅ 已有
        ├── toolbar/
        │   ├── core/
        │   │   └── ButtonRenderer.test.tsx     ✅ 已有
        │   ├── hooks/
        │   │   └── useEditorState.test.ts     ✅ 已有
        │   └── pickers/                        ❌ 缺失
        └── utils/
            └── table.test.ts                   ✅ 已有
```

### 1.3 测试模式总结

| 测试类型 | 模式 | 示例 |
|---------|------|------|
| 组件测试 | 组件旁 `.test.tsx` | EditorToolbar.test.tsx |
| Hook测试 | 集中式 `__tests__/hooks/` | useHistory.test.ts |
| 工具函数 | 集中式 `__tests__/utils/` | style.test.ts |
| 类方法 | 文件内测试 | table.test.ts |

---

## 二、测试基础设施搭建

### 2.1 目录结构设计

```
test/
├── __mocks__/
│   ├── next-image.mock.ts         # Next.js Image mock
│   ├── next-router.mock.ts        # Next.js router mock
│   └── globals.d.ts               # 全局类型扩展
├── utils/
│   ├── test-utils.tsx             # 通用测试工具
│   ├── mock-dom.ts                # DOM创建工具
│   ├── mock-resize-observer.ts    # ResizeObserver mock
│   └── mock-mutation-observer.ts  # MutationObserver mock
├── fixtures/
│   ├── editor-content.ts          # 测试HTML内容
│   ├── floating-images.ts         # 浮动图片数据
│   └── table-data.ts              # 表格测试数据
└── setup.ts                       # 测试环境设置
```

### 2.2 测试工具函数设计

#### 2.2.1 通用测试工具 (`test/utils/test-utils.tsx`)

```typescript
/**
 * 通用测试工具函数
 */

import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// 自定义渲染函数，支持默认配置
export const renderWithProviders = (
  component: ReactElement,
  options: RenderOptions = {}
) => {
  return render(component, {
    // 可以添加默认的 Provider 包装
    ...options,
  })
}

// 创建模拟的 iframe 文档
export const createMockIframe = () => {
  const iframe = document.createElement('iframe')
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (doc) {
    doc.body.contentEditable = 'true'
    doc.body.innerHTML = '<p>Test content</p>'
  }

  return { iframe, doc: doc! }
}

// 清理模拟的 iframe
export const cleanupMockIframe = (iframe: HTMLIFrameElement) => {
  document.body.removeChild(iframe)
}

// 等待下一个动画帧
export const waitForRAF = () => {
  return new Promise(resolve => requestAnimationFrame(resolve))
}

// 等待指定时间
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
```

#### 2.2.2 DOM创建工具 (`test/utils/mock-dom.ts`)

```typescript
/**
 * DOM 元素创建工具
 */

// 创建模拟图片元素
export const createMockImage = (options: {
  src?: string
  width?: number
  height?: number
  x?: number
  y?: number
  naturalWidth?: number
  naturalHeight?: number
} = {}) => {
  const img = document.createElement('img')
  img.src = options.src || 'data:image/png;base64,iVBORw0KG...'
  img.width = options.width ?? 200
  img.height = options.height ?? 150
  img.dataset.x = String(options.x ?? 0)
  img.dataset.y = String(options.y ?? 0)

  // Mock natural dimensions
  Object.defineProperty(img, 'naturalWidth', {
    value: options.naturalWidth ?? 200,
    writable: false,
  })
  Object.defineProperty(img, 'naturalHeight', {
    value: options.naturalHeight ?? 150,
    writable: false,
  })

  return img
}

// 创建模拟表格
export const createMockTable = (rows: number, cols: number) => {
  const table = document.createElement('table')

  for (let i = 0; i < rows; i++) {
    const tr = document.createElement('tr')
    for (let j = 0; j < cols; j++) {
      const td = document.createElement('td')
      td.textContent = `R${i}C${j}`
      tr.appendChild(td)
    }
    table.appendChild(tr)
  }

  return table
}

// 创建带选择范围的文档
export const createMockSelection = (text: string) => {
  const span = document.createElement('span')
  span.textContent = text
  document.body.appendChild(span)

  const range = document.createRange()
  range.selectNodeContents(span)

  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)

  return { span, range, selection }
}
```

#### 2.2.3 ResizeObserver Mock (`test/utils/mock-resize-observer.ts`)

```typescript
/**
 * ResizeObserver Mock
 */

export class MockResizeObserver implements ResizeObserver {
  callback: ResizeObserverCallback
  targets: Set<Element> = new Set()

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    this.targets.add(target)
  }

  unobserve(target: Element) {
    this.targets.delete(target)
  }

  disconnect() {
    this.targets.clear()
  }

  // 触发所有目标的回调
  trigger() {
    this.targets.forEach(target => {
      const rect = target.getBoundingClientRect()
      this.callback([{
        target,
        contentRect: rect,
        borderBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
        contentBoxSize: [{ inlineSize: rect.width, blockSize: rect.height }],
      } as ResizeObserverEntry], this)
    })
  }
}

// 在全局设置中应用
export const setupResizeObserverMock = () => {
  global.ResizeObserver = MockResizeObserver as any
}
```

#### 2.2.4 MutationObserver Mock (`test/utils/mock-mutation-observer.ts`)

```typescript
/**
 * MutationObserver Mock
 */

export class MockMutationObserver implements MutationObserver {
  callback: MutationCallback
  options: MutationObserverInit = {}
  records: MutationRecord[] = []

  constructor(callback: MutationCallback) {
    this.callback = callback
  }

  observe(target: Node, options?: MutationObserverInit) {
    this.options = options || {}
  }

  disconnect() {
    this.records = []
  }

  takeRecords() {
    return this.records
  }

  // 手动触发突变
  triggerMutations(mutations: MutationRecord[]) {
    this.records.push(...mutations)
    this.callback(mutations, this)
  }
}

export const setupMutationObserverMock = () => {
  global.MutationObserver = MockMutationObserver as any
}
```

### 2.3 测试数据 Fixtures

#### 2.3.1 编辑器内容 (`test/fixtures/editor-content.ts`)

```typescript
export const mockEditorContent = {
  simple: '<p>Simple paragraph</p>',
  withImage: '<p>Text before</p><img src="test.jpg" /><p>Text after</p>',
  withTable: `
    <table>
      <tr><td>A1</td><td>B1</td></tr>
      <tr><td>A2</td><td>B2</td></tr>
    </table>
  `,
  withFormatting: '<p><strong>Bold</strong> and <em>italic</em></p>',
  fullResume: `
    <h1>John Doe</h1>
    <p>Software Engineer</p>
    <h2>Experience</h2>
    <p>Company A - 2020 to 2023</p>
  `,
}
```

#### 2.3.2 浮动图片数据 (`test/fixtures/floating-images.ts`)

```typescript
export const mockFloatingImages = {
  single: [
    { id: 'img-1', x: 100, y: 200, width: 200, height: 150, ratio: 1.33, src: 'test.jpg' },
  ],
  multiple: [
    { id: 'img-1', x: 100, y: 200, width: 200, height: 150, ratio: 1.33, src: 'test1.jpg' },
    { id: 'img-2', x: 400, y: 300, width: 180, height: 120, ratio: 1.5, src: 'test2.jpg' },
  ],
  zeroHeight: [
    { id: 'img-1', x: 100, y: 200, width: 200, height: 0, ratio: 1, src: 'test.jpg' },
  ],
}
```

---

## 三、测试配置更新

### 3.1 更新 `jest.config.js`

```javascript
const nextJest = require('next/jest')
const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/test/setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/test/(.*)$': '<rootDir>/test/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    '!components/**/*.test.{js,jsx,ts,tsx}',
    '!components/**/*.spec.{js,jsx,ts,tsx}',
    '!components/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  modulePathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  testMatch: [
    '**/__tests__/**/*.{js,jsx,ts,tsx}',
    '**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

### 3.2 更新 `package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:related": "jest --onlyFailures"
  }
}
```

### 3.3 创建 `test/setup.ts`

```typescript
/**
 * 测试环境全局设置
 */

import '@testing-library/jest-dom'
import { setupResizeObserverMock } from './utils/mock-resize-observer'
import { setupMutationObserverMock } from './utils/mock-mutation-observer'

// 设置全局 Mock
setupResizeObserverMock()
setupMutationObserverMock()

// Mock window.prompt
global.prompt = jest.fn(() => 'https://example.com')

// Mock getBoundingClientRect
Element.prototype.getBoundingClientRect = jest.fn(() => ({
  width: 200,
  height: 150,
  top: 100,
  left: 50,
  right: 250,
  bottom: 250,
  x: 50,
  y: 100,
  toJSON: () => ({}),
}))

// Mock queryCommandSupported
document.queryCommandSupported = jest.fn((command: string) => {
  if (command === 'hiliteColor') return false
  return true
})

// 清理每个测试后的状态
afterEach(() => {
  jest.clearAllMocks()
})
```

---

## 四、测试实现优先级与顺序

### 4.1 实施阶段

| 阶段 | 任务 | 用例数 | 预计时间 | 优先级 |
|------|------|--------|----------|--------|
| **阶段0** | 测试基础设施 | - | 2h | P0 |
| **阶段1** | 高风险用例 | 2 | 0.5h | P0 🔴 |
| **阶段1** | ImageResizer | 24 | 3h | P1 |
| **阶段1** | SmartContextMenu | 18 | 3h | P1 |
| **阶段2** | FloatingImageLayer | 23 | 4h | P1 |
| **阶段2** | useEditorCommands | 35 | 5h | P1 |
| **阶段3** | TableSmartToolbar | 45 | 8h | P2 |
| **阶段3** | EditablePreview | 41 | 7h | P2 |
| **阶段4** | Pickers/Inputs | 14 | 2h | P3 |
| **阶段4** | 集成测试 | 10-15 | 4h | P3 |
| - | 测试修复与完善 | - | 4h | - |

### 4.2 详细实施计划

#### 阶段0: 测试基础设施 (2小时)

- [ ] 创建 `test/` 目录结构
- [ ] 创建测试工具函数文件
  - [ ] `test-utils.tsx`
  - [ ] `mock-dom.ts`
  - [ ] `mock-resize-observer.ts`
  - [ ] `mock-mutation-observer.ts`
- [ ] 创建测试数据 fixtures
  - [ ] `editor-content.ts`
  - [ ] `floating-images.ts`
  - [ ] `table-data.ts`
- [ ] 更新 `jest.config.js`
- [ ] 更新 `package.json` 添加测试脚本
- [ ] 创建 `test/setup.ts`
- [ ] 运行现有测试确保不破坏

#### 阶段1: 基础组件 + 高风险用例 (6.5小时)

1. **高风险用例** (0.5h)
   - TC-FI-022: 零高度图片ratio处理
   - TC-EC-032: 格式刷自动应用

2. **ImageResizer.test.tsx** (3h)
   - 创建测试文件
   - 实现10个场景，24个用例
   - 验证覆盖率 >85%

3. **SmartContextMenu.test.tsx** (3h)
   - 创建测试文件
   - 实现7个场景，18个用例
   - 验证覆盖率 >80%

#### 阶段2: 核心交互组件 (9小时)

1. **FloatingImageLayer.test.tsx** (4h)
   - 创建测试文件
   - 实现11个场景，23个用例
   - 验证覆盖率 >80%

2. **useEditorCommands.test.ts** (5h)
   - 创建测试文件
   - 实现14个场景，35个用例
   - 验证覆盖率 >85%

#### 阶段3: 复杂组件 (15小时)

1. **TableSmartToolbar.test.tsx** (8h)
   - 创建测试文件
   - 实现12个场景，45个用例
   - 验证覆盖率 >75%

2. **EditablePreview.test.tsx** (7h)
   - 创建测试文件
   - 实现17个场景，41个用例
   - 验证覆盖率 >75%

#### 阶段4: 工具栏组件与集成测试 (6小时)

1. **Pickers 组件测试** (1.5h)
   - TablePicker.test.tsx
   - ImagePicker.test.tsx
   - ColorPicker.test.tsx
   - ColorGrid.test.tsx

2. **Inputs 组件测试** (0.5h)
   - ToolbarSelect.test.tsx

3. **集成测试** (4h)
   - IT-001: 完整编辑流程
   - IT-002: 表格完整操作
   - IT-003: 浮动图片完整操作
   - IT-004: 格式刷完整流程
   - IT-005: 撤销重做完整流程

---

## 五、测试模板与示例

### 5.1 组件测试模板

```typescript
/**
 * ComponentName.test.tsx
 * 测试文件描述
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ComponentName } from './ComponentName'
import { createMockIframe, cleanupMockIframe } from '@/test/utils/test-utils'

describe('ComponentName', () => {
  let iframe: HTMLIFrameElement
  let doc: Document

  beforeEach(() => {
    const mockIframe = createMockIframe()
    iframe = mockIframe.iframe
    doc = mockIframe.doc
  })

  afterEach(() => {
    cleanupMockIframe(iframe)
  })

  describe('场景1: 描述', () => {
    it('TC-XXX-001: 测试用例名称', () => {
      // Arrange
      const props = { /* 测试props */ }

      // Act
      render(<ComponentName {...props} />)

      // Assert
      expect(screen.getByTestId('something')).toBeInTheDocument()
    })
  })
})
```

### 5.2 Hook测试模板

```typescript
/**
 * hookName.test.ts
 */

import { renderHook, act } from '@testing-library/react'
import { useHookName } from './hookName'

describe('useHookName', () => {
  it('TC-XXX-001: 测试用例名称', () => {
    const { result } = renderHook(() => useHookName())

    act(() => {
      result.current.someAction()
    })

    expect(result.current.state).toBe('expected')
  })
})
```

### 5.3 交互测试模板

```typescript
/**
 * 交互测试示例
 */

it('TC-XXX-001: 拖拽调整大小', async () => {
  render(<Component />)

  const handle = screen.getByTestId('resizer-se')

  // 开始拖拽
  fireEvent.pointerDown(handle, { clientX: 0, clientY: 0 })

  // 拖动
  fireEvent.pointerMove(document, { clientX: 50, clientY: 50 })

  // 结束拖拽
  fireEvent.pointerUp(document)

  // 验证
  await waitFor(() => {
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({ width: 250, height: 188 })
    )
  })
})
```

---

## 六、Mock策略详解

### 6.1 需要Mock的浏览器API

| API | Mock类型 | 优先级 | 说明 |
|-----|---------|--------|------|
| ResizeObserver | 类Mock | P0 | 图片调整组件必需 |
| MutationObserver | 类Mock | P0 | 表格组件必需 |
| getBoundingClientRect | 函数Mock | P0 | 位置计算必需 |
| setPointerCapture | 函数Mock | P1 | 浮动图片拖拽 |
| releasePointerCapture | 函数Mock | P1 | 浮动图片拖拽 |
| window.prompt | 函数Mock | P1 | 创建链接功能 |
| queryCommandSupported | 函数Mock | P2 | hiliteColor兼容性 |

### 6.2 需要Mock的React组件

| 组件 | Mock原因 |
|------|---------|
| Next.js Image | 组件测试隔离 |
| 复杂子组件 | 减少测试复杂度 |

### 6.3 Mock文件位置

```
test/__mocks__/
├── next-image.mock.ts      # Next.js Image mock
└── globals.d.ts            # 全局类型声明
```

---

## 七、验证标准

### 7.1 测试通过标准

- [ ] 所有新增测试通过
- [ ] 所有现有测试仍然通过
- [ ] 没有测试超时（>5秒）
- [ ] 没有 console.error 或 console.warn

### 7.2 覆盖率标准

| 组件 | 语句 | 分支 | 函数 | 行 |
|------|------|------|------|-----|
| ImageResizer | >85% | >80% | >90% | >85% |
| FloatingImageLayer | >80% | >75% | >85% | >80% |
| useEditorCommands | >85% | >80% | >90% | >85% |
| EditablePreview | >75% | >70% | >80% | >75% |
| TableSmartToolbar | >75% | >70% | >80% | >75% |
| SmartContextMenu | >80% | >75% | >85% | >80% |
| Pickers/Inputs | >70% | >65% | >75% | >70% |

### 7.3 性能标准

- [ ] 完整测试套件运行时间 <45秒
- [ ] 单个测试用例运行时间 <5秒

---

## 八、风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| iframe测试困难 | 测试不稳定 | 创建专门的Mock工具 |
| 异步时序问题 | 测试flaky | 使用 waitFor + act 包装 |
| 拖拽事件复杂 | 测试难以模拟 | 创建 simulatePointerEvents 工具 |
| 现有测试失败 | 阻塞开发 | 先运行现有测试，修复后再添加新测试 |
| 覆盖率不达标 | 需要额外时间 | 预留4小时用于完善 |

---

## 九、总结

本方案遵循以下原则：

1. **渐进式实施** - 从简单到复杂，分阶段完成
2. **高风险优先** - 优先实现可能崩溃的边界情况
3. **测试驱动** - 先写测试，确保重构安全
4. **工具先行** - 先建立测试基础设施，提高后续效率
5. **持续验证** - 每个阶段完成后运行测试，确保质量

**预计总时间**: 38-42 小时
**测试用例总数**: 199
**预计覆盖率**: 75%-85%
