# 编辑器工具栏重构设计方案

## 1. 背景与目标
当前的编辑器工具栏基于原生 HTML 控件实现，存在样式简陋、交互体验差、状态反馈缺失等问题。为了提升用户体验，对齐业界成熟产品（如 canvas-editor），本方案将对工具栏进行全面重构。

**主要目标：**
*   **视觉升级**：采用现代化的 UI 风格，统一图标、间距和配色。
*   **交互优化**：引入 Tooltip、自定义下拉菜单、颜色选择器等高级控件。
*   **功能对齐**：参考 canvas-editor 的功能布局，重新组织工具栏结构。
*   **状态反馈**：实现实时的光标状态回显（如光标在粗体文字上时，粗体按钮应高亮）。

## 2. UI 设计规范

### 2.1 布局结构
采用 **单行/多行自适应流式布局**，但按功能逻辑进行严格分组。

*   **容器背景**：`#F3F4F6` (Gray-50) -> `#F8F9FA` (更清爽的亮灰)
*   **高度**：`40px` (单行标准高度)
*   **边框**：底部 `1px solid #E5E7EB`

### 2.2 按钮样式
*   **尺寸**：`32px * 32px` (图标大小 `16px` 或 `18px`)
*   **圆角**：`4px` (小圆角，显得更专业)
*   **状态**：
    *   `Default`: 透明背景，文字色 `#374151`
    *   `Hover`: 背景色 `#E5E7EB` (Gray-200)
    *   `Active` (按下/开启状态): 背景色 `#E5E7EB` + 文字色 `#000000` (或品牌色高亮)
    *   `Disabled`: 透明背景，文字色 `#9CA3AF`，鼠标禁用

### 2.3 分割线
*   **样式**：垂直短线，高度 `20px`，颜色 `#D1D5DB`，左右 margin `4px`。

### 2.4 图标库
*   **选型**：`lucide-react`
*   **理由**：图标线条细腻，风格统一，覆盖了编辑器所需的所有图标（Bold, Italic, Align, Table, etc.），且支持 React 组件形式引入，便于维护。

## 3. 组件架构设计

我们将拆分出以下原子组件：

### 3.1 `ToolbarButton`
基础按钮组件。
*   **Props**: `icon`, `title` (tooltip), `active` (boolean), `onClick`, `disabled`.
*   **Feature**: 内置 Tooltip 支持（鼠标悬停 500ms 显示功能名和快捷键）。

### 3.2 `ToolbarDropdown`
自定义下拉菜单组件，替代原生 `<select>`。
*   **Props**: `label` (显示当前值), `icon`, `content` (下拉内容渲染函数).
*   **Feature**: 点击显示绝对定位的浮层，点击外部自动关闭。用于字体、字号、行高选择。

### 3.3 `ColorPickerDropdown`
专门的颜色选择组件。
*   **UI**: 显示当前颜色下划线。
*   **Dropdown**: 显示预设颜色网格（参考 canvas-editor 的颜色面板） + “无填充”选项。

### 3.4 `ToolbarDivider`
垂直分割线组件。

## 4. 功能模块布局 (参考 canvas-editor)

工具栏将从左到右依次排列以下分组：

### Group 1: 历史记录 (History)
*   `Undo` (撤销)
*   `Redo` (重做)
*   *Divider*

### Group 2: 格式刷 (Format)
*   `Painter` (格式刷 - *新增功能，暂留接口*)
*   `ClearFormat` (清除格式)
*   *Divider*

### Group 3: 字体与字号 (Font)
*   `FontFamily` (字体下拉框)
*   `FontSize` (字号下拉框)
*   `IncreaseFontSize` (增大字号 A+)
*   `DecreaseFontSize` (减小字号 A-)
*   *Divider*

### Group 4: 文本样式 (TextStyle)
*   `Bold` (加粗)
*   `Italic` (斜体)
*   `Underline` (下划线 - *支持下拉选择线型暂不实现，先做单按钮*)
*   `StrikeThrough` (删除线)
*   `Superscript` (上标)
*   `Subscript` (下标)
*   *Divider*

### Group 5: 颜色 (Color)
*   `TextColor` (字体颜色 - 带底部色条)
*   `HighlightColor` (背景高亮 - 带底部色条)
*   *Divider*

### Group 6: 段落 (Paragraph)
*   `AlignLeft` (左对齐)
*   `AlignCenter` (居中)
*   `AlignRight` (右对齐)
*   `AlignJustify` (两端对齐)
*   `LineHeight` (行高 - *新增，下拉框*)
*   *Divider*

### Group 7: 列表与缩进 (List)
*   `UnorderedList` (无序列表)
*   `OrderedList` (有序列表)
*   `TaskList` (任务列表 - *需 execCommand 支持 insertHTML*)
*   `Indent` (增加缩进)
*   `Outdent` (减少缩进)
*   *Divider*

### Group 8: 插入 (Insert)
*   `Table` (表格)
*   `Image` (图片)
*   `Link` (链接)
*   `Quote` (引用)
*   `CodeBlock` (代码块)
*   `HorizontalRule` (分割线)

## 5. 技术实现细节

### 5.1 依赖安装
需要安装以下库：
```bash
npm install lucide-react
npm install @headlessui/react # 用于实现无障碍的 Dropdown 和 Tooltip (可选，也可以手写简易版)
```
*鉴于项目轻量化，建议手写简易的 Dropdown 和 Tooltip 组件，不引入过重的 UI 库。*

### 5.2 状态回显 (Active State)
目前 `EditorToolbar` 只是单向触发命令。需要改造 `EditablePreview`，在 `selectionchange` 或 `mouseup` / `keyup` 事件时，计算当前选区的样式状态，并传递给 Toolbar。

**数据流改造：**
1.  定义 `EditorState` 接口：
    ```typescript
    interface EditorState {
      isBold: boolean
      isItalic: boolean
      isUnderline: boolean
      isStrike: boolean
      textAlign: 'left' | 'center' | 'right' | 'justify'
      fontName: string
      fontSize: string
      // ...
    }
    ```
2.  在 `EditablePreview` 中监听 `document.onselectionchange`。
3.  使用 `document.queryCommandState()` 和 `document.queryCommandValue()` 获取当前状态。
4.  将 `editorState` 传递给 `EditorToolbar`。

## 6. 实施步骤

1.  **准备工作**：安装 `lucide-react`，创建 `icons` 映射文件。
2.  **组件开发**：
    *   开发 `ToolbarButton` (带 Tooltip)。
    *   开发 `ToolbarDropdown` (基础下拉)。
    *   开发 `ColorPicker` (重写现有的 Picker)。
3.  **重组工具栏**：按照设计布局重写 `EditorToolbar.tsx`。
4.  **状态联调**：在 `EditablePreview` 中实现状态侦测逻辑，并对接工具栏的高亮状态。
5.  **样式微调**：调整 CSS，确保视觉效果对齐 canvas-editor。

## 7. 待确认事项
*   是否需要支持“打印”功能？(canvas-editor 有) -> *建议后续迭代*
*   是否需要“查找替换”？ -> *建议后续迭代*
