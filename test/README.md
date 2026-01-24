# 测试基础设施

本项目提供了一套完整的测试基础设施，包括工具函数、Mock实现和测试数据fixtures。

## 目录结构

```
test/
├── __mocks__/              # Mock定义
│   ├── globals.d.ts       # 全局类型定义
│   └── next-image.mock.ts # Next.js Image组件Mock
├── utils/                  # 测试工具函数
│   ├── test-utils.tsx     # 核心测试工具
│   ├── mock-dom.ts        # DOM元素Mock工厂
│   ├── mock-resize-observer.ts    # ResizeObserver Mock
│   └── mock-mutation-observer.ts  # MutationObserver Mock
├── fixtures/               # 测试数据fixtures
│   ├── editor-content.ts  # 编辑器内容fixtures
│   ├── floating-images.ts # 浮动图片fixtures
│   └── table-data.ts      # 表格数据fixtures
├── setup.ts               # 测试环境设置
└── index.ts               # 统一导出
```

## 核心功能

### 1. 测试工具函数 (test-utils.tsx)

#### renderWithProviders

渲染组件并包装provider：

```typescript
import { renderWithProviders } from '@/test';

const { getByText } = renderWithProviders(<MyComponent />, {
  providers: [
    { provider: ThemeProvider, props: { theme: mockTheme } }
  ]
});
```

#### createMockIframe

创建Mock iframe元素：

```typescript
const iframe = createMockIframe('<p>Content</p>', {
  id: 'test-iframe',
  width: '100%',
  height: '400px'
});
document.body.appendChild(iframe);
```

#### waitForRAF

等待requestAnimationFrame：

```typescript
await waitForRAF();
// 动画或过渡已完成
```

#### simulatePointerEvents

模拟指针事件：

```typescript
simulatePointerEvents(element, 'pointerdown', {
  clientX: 100,
  clientY: 100
});
```

#### simulateDrag

模拟拖放操作：

```typescript
simulateDrag(source, target, {
  startX: 0,
  startY: 0,
  endX: 100,
  endY: 100
});
```

### 2. DOM Mock工厂 (mock-dom.ts)

#### createMockImage

创建Mock图片元素：

```typescript
const mockImg = createMockImage({
  src: 'data:image/png;base64,...',
  alt: 'Test image',
  width: 100,
  height: 100
});
```

#### createMockTable

创建Mock表格元素：

```typescript
const mockTable = createMockTable({
  rows: 3,
  cols: 2,
  headers: true,
  data: [['H1', 'H2'], ['C1', 'C2'], ['C3', 'C4']]
});
```

#### createMockSelection

创建Mock选择对象：

```typescript
const mockSelection = createMockSelection({
  anchorNode: textNode,
  anchorOffset: 0,
  focusNode: textNode,
  focusOffset: 5,
  type: 'Range'
});
```

### 3. ResizeObserver Mock (mock-resize-observer.ts)

#### 使用Mock ResizeObserver

```typescript
import { setupResizeObserverMock } from '@/test';

// 在测试设置中
setupResizeObserverMock();

// 在测试中
const observer = new ResizeObserver((entries) => {
  entries.forEach(entry => {
    console.log('Resized:', entry.target);
  });
});

observer.observe(element);

// 模拟调整大小
observer.simulateResize(element, { width: 200, height: 150 });
```

#### 创建Spy版本

```typescript
const { observer, mockObserve, mockUnobserve } = createResizeObserverSpy();

expect(mockObserve).toHaveBeenCalledWith(element);
```

### 4. MutationObserver Mock (mock-mutation-observer.ts)

#### 使用Mock MutationObserver

```typescript
import { setupMutationObserverMock } from '@/test';

setupMutationObserverMock();

const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    console.log('Mutation:', mutation.type);
  });
});

observer.observe(element, { childList: true });

// 触发回调
observer.trigger();
```

### 5. 编辑器内容Fixtures (editor-content.ts)

#### 使用预定义内容

```typescript
import { simple, withImage, withTable, fullResume } from '@/test/fixtures';

// 简单内容
const { html, text } = simple;

// 带图片的内容
const { html: htmlWithImage, imageCount } = withImage;

// 完整简历
const { html: resumeHtml, sectionCount } = fullResume;
```

#### 获取fixture

```typescript
import { getContentFixture } from '@/test/fixtures';

const fixture = getContentFixture('withFormatting');
```

### 6. 浮动图片Fixtures (floating-images.ts)

#### 使用浮动图片配置

```typescript
import { single, multiple, rotated } from '@/test/fixtures/floating-images';

const { images, containerSize } = single;

images.forEach(config => {
  const element = createMockFloatingImage(config);
  container.appendChild(element);
});
```

### 7. 表格数据Fixtures (table-data.ts)

#### 创建表格元素

```typescript
import { createMockTableFromFixture, simple2x2 } from '@/test/fixtures/table-data';

const table = createMockTableFromFixture(simple2x2);
document.body.appendChild(table);
```

#### 创建自定义表格

```typescript
import { createMockTableCell, createMockTableRow } from '@/test/fixtures/table-data';

const cell1 = createMockTableCell({ content: 'Header 1', isHeader: true });
const cell2 = createMockTableCell({ content: 'Data 1' });

const row = createMockTableRow({
  cells: [cell1, cell2],
  isHeader: true
});
```

## 测试脚本

在`package.json`中已配置以下测试脚本：

- `npm test` - 运行所有测试
- `npm run test:watch` - 监视模式运行测试
- `npm run test:coverage` - 生成测试覆盖率报告
- `npm run test:debug` - 调试模式运行测试

## 示例测试

### 基础组件测试

```typescript
import { render, screen } from '@/test';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### 使用Mock的测试

```typescript
import { renderWithProviders, waitForRAF } from '@/test';
import { withImage } from '@/test/fixtures';

describe('Editor with Image', () => {
  it('handles image insertion', async () => {
    const { container } = renderWithProviders(<Editor />);

    const editor = container.querySelector('[contenteditable]');
    editor.innerHTML = withImage.html;

    await waitForRAF();

    const images = editor.querySelectorAll('img');
    expect(images).toHaveLength(withImage.imageCount);
  });
});
```

### 拖放测试

```typescript
import { simulateDrag } from '@/test';

describe('Drag and Drop', () => {
  it('handles image drag', () => {
    const source = document.createElement('div');
    const target = document.createElement('div');

    simulateDrag(source, target, {
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 100
    });

    // 验证拖放行为
  });
});
```

## 配置说明

### jest.config.js

- `setupFilesAfterEnv`: 测试环境设置文件
- `testEnvironment`: 使用jsdom环境
- `moduleNameMapper`: 模块路径映射
- `collectCoverageFrom`: 覆盖率收集配置

### test/setup.ts

测试环境设置文件配置了：

- ResizeObserver Mock
- MutationObserver Mock
- window.prompt/alert/confirm Mock
- getBoundingClientRect Mock
- queryCommand*系列方法Mock
- Selection和Range Mock
- Clipboard API Mock
- IntersectionObserver Mock
- matchMedia Mock
- localStorage/sessionStorage Mock

## 最佳实践

1. **使用fixtures**: 尽量使用预定义的fixtures而不是在测试中硬编码数据
2. **清理副作用**: 在afterEach中清理DOM和Mock
3. **异步操作**: 使用waitForRAF等待动画和过渡完成
4. **类型安全**: 所有Mock都有完整的TypeScript类型定义
5. **可维护性**: 将通用测试逻辑提取到工具函数中

## 扩展指南

### 添加新的Fixture

在相应的fixtures文件中添加：

```typescript
export const myNewFixture = {
  name: 'my-new-fixture',
  description: 'Description',
  // ... fixture data
};
```

### 添加新的Mock工具

在utils目录下创建新文件并导出：

```typescript
// utils/my-new-mock.ts
export function createMockSomething() {
  // Mock implementation
}

// index.ts
export * from './utils/my-new-mock';
```

## 贡献

添加新的测试工具时，请确保：

1. 提供完整的TypeScript类型定义
2. 添加详细的JSDoc注释
3. 包含使用示例
4. 更新本README文档
