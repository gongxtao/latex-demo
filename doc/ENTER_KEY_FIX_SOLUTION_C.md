# Enter 键换行修复方案 C

## 问题描述

在编辑器中按 Enter 键换行时，出现以下问题：
- 在行末按 Enter 键，第一次没有效果
- 需要按两次 Enter 键才能看到换行效果

## 根本原因

在 HTML 中，单个 `<br>` 标签在行末时不会产生可见的换行效果。这是因为：
- 行末的 `<br>` 后面没有内容，浏览器不会为它创建行框
- 需要两个 `<br>` 标签才能在行末产生可见的换行

## 解决方案 C：智能检测光标位置

根据光标位置决定插入 1 个或 2 个 `<br>` 标签：
- **在行末**：插入 2 个 `<br>` 标签
- **在行中间**：插入 1 个 `<br>` 标签

## 代码修改

### 修改文件
`components/editor/EditablePreview.tsx`

### 修改前（原始实现）

```tsx
// Enter 键处理
if (e.key === 'Enter') {
  e.preventDefault()
  e.stopPropagation()
  const selection = iframeDoc.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    range.deleteContents()

    // 固定插入单个 <br> 标签
    const br = iframeDoc.createElement('br')
    range.insertNode(br)
    range.setStartAfter(br)
    range.setEndAfter(br)

    selection.removeAllRanges()
    selection.addRange(range)
    const newHtml = getCleanHtml(iframeDoc)
    debouncedSync(newHtml)
  }
  return
}
```

### 修改后（方案 C）

**新增辅助函数：**

```tsx
// Helper function to check if cursor is at the end of a line
const isAtLineEnd = (range: Range): boolean => {
  const endContainer = range.endContainer
  const endOffset = range.endOffset

  // If we're in a text node
  if (endContainer.nodeType === Node.TEXT_NODE) {
    const textNode = endContainer as Text
    // Check if we're at the end of the text node
    if (endOffset < textNode.length) {
      return false // Not at end of text node
    }
    // Check if there's more content after this text node in the parent
    const parent = endContainer.parentNode
    if (parent && parent.nextSibling) {
      // Check if next sibling has meaningful content
      let nextSibling = parent.nextSibling
      while (nextSibling) {
        if (nextSibling.nodeType === Node.TEXT_NODE) {
          const text = (nextSibling as Text).textContent?.trim()
          if (text && text.length > 0) {
            return false // Has more text content
          }
        } else if (nextSibling.nodeType === Node.ELEMENT_NODE) {
          const element = nextSibling as Element
          // Ignore BR elements
          if (element.tagName !== 'BR') {
            return false // Has more element content
          }
        }
        nextSibling = nextSibling.nextSibling
      }
    }
    return true // At end of text content
  }

  // If we're in an element node
  if (endContainer.nodeType === Node.ELEMENT_NODE) {
    const element = endContainer as Element
    // Check if there are child nodes after the cursor
    const childNodes = Array.from(element.childNodes)
    for (let i = endOffset; i < childNodes.length; i++) {
      const child = childNodes[i]
      if (child.nodeType === Node.TEXT_NODE) {
        const text = (child as Text).textContent?.trim()
        if (text && text.length > 0) {
          return false
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if ((child as Element).tagName !== 'BR') {
          return false
        }
      }
    }
    return true // No more content after cursor
  }

  return false
}
```

**修改后的 Enter 键处理：**

```tsx
if (e.key === 'Enter') {
  e.preventDefault()
  e.stopPropagation()
  const selection = iframeDoc.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    range.deleteContents()

    // Check if cursor is at line end
    const atLineEnd = isAtLineEnd(range)

    if (atLineEnd) {
      // At line end: insert two <br> elements
      const br1 = iframeDoc.createElement('br')
      const br2 = iframeDoc.createElement('br')
      range.insertNode(br1)
      br1.parentNode?.insertBefore(br2, br1.nextSibling)
      range.setStartAfter(br2)
      range.setEndAfter(br2)
    } else {
      // In middle of line: insert single <br>
      const br = iframeDoc.createElement('br')
      range.insertNode(br)
      range.setStartAfter(br)
      range.setEndAfter(br)
    }

    selection.removeAllRanges()
    selection.addRange(range)
    const newHtml = getCleanHtml(iframeDoc)
    debouncedSync(newHtml)
  }
  return
}
```

## 工作原理

### `isAtLineEnd()` 函数逻辑

1. **检测文本节点中的光标位置**：
   - 如果光标不在文本节点末尾 → 返回 `false`（在行中间）
   - 如果光标在文本节点末尾，继续检查后面是否有内容

2. **检查后续内容**：
   - 遍历光标后面的兄弟节点
   - 如果找到有意义的文本内容（非空白） → 返回 `false`（在行中间）
   - 如果找到非 BR 元素 → 返回 `false`（在行中间）
   - 如果只有 BR 元素或没有内容 → 返回 `true`（在行末）

3. **处理元素节点中的光标**：
   - 检查 endOffset 之后的子节点
   - 如果有非空内容 → 返回 `false`
   - 否则返回 `true`

### Enter 键处理逻辑

```
┌─────────────────────────────────────┐
│  按 Enter 键                        │
└──────────────┬──────────────────────┘
               │
               ▼
       ┌───────────────┐
       │ isAtLineEnd() │
       └───────┬───────┘
               │
        ┌──────┴──────┐
        │             │
     true           false
        │             │
        ▼             ▼
  ┌──────────┐  ┌──────────┐
  │ 插入 2个  │  │ 插入 1个  │
  │ <br> 标签 │  │ <br> 标签 │
  └──────────┘  └──────────┘
```

## 效果示例

### 场景 1：在行末换行

**操作**：在文本 "Hello" 末尾按 Enter

**HTML 变化**：
```
Before: Hello
After:  Hello<br><br>
```

**视觉效果**：立即换行，光标移到新行

### 场景 2：在行中间换行

**操作**：在文本 "Hello|World" 中间按 Enter

**HTML 变化**：
```
Before: HelloWorld
After:  Hello<br>World
```

**视觉效果**：从 "World" 前换行

### 场景 3：连续换行

**操作**：在空行连续按 Enter

**HTML 变化**：
```
第1次 Enter: <br><br>
第2次 Enter: <br><br><br><br>
第3次 Enter: <br><br><br><br><br><br>
```

**注意**：方案 C 在连续换行时会出现指数增长问题（第二次换行会产生 4 行效果）

## 已知问题

方案 C 存在一个问题：
- 在已经包含 `<br><br>` 的行末再次按 Enter 时，会插入 2 个 `<br>`
- 结果是产生 4 个 `<br>`，造成视觉上跳过 2 行

### 问题演示

```
初始状态:  Hello<br><br>|
           ↑ 光标在这里

按 Enter:  Hello<br><br><br><br>
           ↑ 光标移到这里

视觉效果:  Hello

           (空行)
           (空行)
           ↑ 光标
```

## 替代方案

如果方案 C 的问题不可接受，可以考虑：

### 方案 B：使用块级元素
```tsx
// 使用 <p> 标签包裹每行内容
const p = iframeDoc.createElement('p')
p.innerHTML = '<br>'
range.insertNode(p)
```

**优点**：每个换行都是独立的块，行为一致
**缺点**：需要重构整个文档结构，可能有兼容性问题

### 方案 A：使用 CSS
```css
br::after {
  content: "\A";
  white-space: pre;
}
```

**优点**：不需要修改 JavaScript 代码
**缺点**：可能影响其他地方的 BR 渲染

## 修改位置

- **文件**：`components/editor/EditablePreview.tsx`
- **行数**：约 540-637 行
- **修改日期**：2025-01-24
- **版本**：v0.1.0

## 测试建议

1. 测试在行末按 Enter 键
2. 测试在行中间按 Enter 键
3. 测试连续按 Enter 键
4. 测试在不同格式文本（粗体、斜体、链接等）中按 Enter 键
5. 测试在列表、表格等特殊元素中按 Enter 键
