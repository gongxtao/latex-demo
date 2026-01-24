# 测试基础设施快速开始指南

## 安装完成

测试基础设施已全部创建并验证通过！现在可以开始编写测试了。

## 快速开始

### 1. 运行测试

```bash
# 运行所有测试
npm test

# 监视模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 2. 编写第一个测试

在 `__tests__` 目录下创建测试文件：

```typescript
// __tests__/components/MyComponent.test.tsx
import { render, screen } from '@/test';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### 3. 使用Fixtures

```typescript
import { getContentFixture } from '@/test';

describe('Editor Tests', () => {
  it('uses editor fixture', () => {
    const fixture = getContentFixture('fullResume');
    console.log(fixture.html); // 完整简历HTML
    console.log(fixture.sectionCount); // 6
  });
});
```

### 4. 使用Mock工具

```typescript
import {
  createMockImage,
  createMockTable,
  simulateDrag
} from '@/test';

describe('Mock Tests', () => {
  it('creates mock image', () => {
    const img = createMockImage({
      src: 'data:image/test',
      alt: 'Test',
      width: 100,
      height: 100
    });

    document.body.appendChild(img);
    expect(img.width).toBe(100);
  });
});
```

## 常用导入

```typescript
// 统一导入（推荐）
import {
  // 测试工具
  render,
  screen,
  renderWithProviders,
  waitForRAF,

  // Mock工厂
  createMockImage,
  createMockTable,
  createMockSelection,

  // Fixtures
  getContentFixture,
} from '@/test';

// 或单独导入
import { renderWithProviders } from '@/test/utils/test-utils';
import { getContentFixture } from '@/test/fixtures/editor-content';
```

## 测试模板

### 基础组件测试

```typescript
import { render, screen } from '@/test';
import { Component } from '@/components/Component';

describe('Component', () => {
  it('renders', () => {
    render(<Component />);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
```

### 带Mock的测试

```typescript
import { render, waitForRAF } from '@/test';
import { Editor } from '@/components/Editor';
import { withImage } from '@/test/fixtures/editor-content';

describe('Editor', () => {
  it('handles images', async () => {
    const { container } = render(<Editor />);

    const editor = container.querySelector('[contenteditable]');
    editor.innerHTML = withImage.html;

    await waitForRAF();

    expect(editor.querySelectorAll('img')).toHaveLength(1);
  });
});
```

### 拖放测试

```typescript
import { simulateDrag } from '@/test';

describe('Drag and Drop', () => {
  it('handles drag', () => {
    const source = document.createElement('div');
    const target = document.createElement('div');

    simulateDrag(source, target, {
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 100
    });
  });
});
```

## 可用的Fixtures

### 编辑器内容
- `simple` - 简单纯文本
- `withImage` - 包含图片
- `withTable` - 包含表格
- `withFormatting` - 包含格式化
- `fullResume` - 完整简历

### 浮动图片
- `single` - 单个图片
- `multiple` - 多个图片
- `rotated` - 旋转图片
- `overlapping` - 重叠图片

### 表格数据
- `simple2x2` - 2x2表格
- `simple3x3` - 3x3表格
- `withMergedCells` - 合并单元格
- `resumeStyle` - 简历风格

## 常见问题

### Q: 如何测试异步操作？

```typescript
it('handles async', async () => {
  await waitForRAF();
  expect(element).toHaveClass('loaded');
});
```

### Q: 如何模拟窗口大小变化？

```typescript
import { setupResizeObserverMock } from '@/test';

beforeAll(() => {
  setupResizeObserverMock();
});

it('responds to resize', () => {
  const observer = new ResizeObserver(callback);
  observer.observe(element);
  // ...
});
```

### Q: 如何测试拖放？

```typescript
import { simulateDrag } from '@/test';

simulateDrag(source, target, {
  startX: 0,
  startY: 0,
  endX: 100,
  endY: 100
});
```

## 文档资源

- **完整文档**: `/test/README.md`
- **示例代码**: `/test/examples/example.test.tsx`
- **完成总结**: `/test/COMPLETION_SUMMARY.md`
- **验证报告**: `/test/VERIFICATION_REPORT.md`

## 下一步

1. 查看 `/test/examples/example.test.tsx` 了解更多示例
2. 阅读 `/test/README.md` 查看完整API文档
3. 开始编写你的第一个测试！
4. 运行 `npm run test:coverage` 查看覆盖率

## 提示

- 使用 `npm run test:watch` 在开发时自动运行测试
- 使用 `getContentFixture()` 获取预定义的测试数据
- 使用 `createMock*` 函数创建DOM元素
- 所有Mock都是类型安全的，享受TypeScript的智能提示！

祝测试愉快！
