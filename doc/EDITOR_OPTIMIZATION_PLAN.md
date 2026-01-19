# 编辑器深度优化方案与实施细则

本文档为 `latex-demo` 项目的编辑器模块提供深度的技术优化方案。本方案旨在解决当前基于 `contentEditable` 和 `execCommand` 实现中存在的架构缺陷、性能瓶颈及标准兼容性问题。

## 📅 阶段一：核心稳定性与性能 (立即执行)

### 1. 重构撤销/重做机制 (Custom History Stack)

#### 🔴 问题深度分析
当前直接调用 `document.execCommand('undo')` 严重依赖浏览器原生行为。
1.  **覆盖范围不足**：浏览器通常只记录键盘输入。JavaScript 触发的 DOM 修改（如：拖拽调整图片大小、点击按钮插入表格、代码块格式化）**不会**进入浏览器原生撤销栈。
2.  **状态不一致**：用户调整图片大小后按 Ctrl+Z，预期的“恢复图片大小”不会发生，反而可能撤销了上一步的文字输入，导致严重的体验割裂。

#### 🔵 技术解决方案
在 React 层实现一个完全受控的 **历史记录栈 (History Stack)**，接管所有的状态变更管理。

*   **数据结构**：
    ```typescript
    interface HistoryState {
      html: string;           // 完整的 HTML 快照
      selection: SelectionPath; // 光标位置（用于撤销后恢复光标）
      timestamp: number;
    }
    ```
*   **快照策略**：
    *   **关键帧 (Keyframe)**：在执行“插入表格”、“修改图片”、“应用格式”等重操作**之前**，强制记录一次快照。
    *   **输入防抖 (Debounce)**：在连续打字过程中，不记录每一步，而是当用户停止输入 500ms 后记录一次快照。

#### 🛠️ 实施步骤
1.  **创建 Hook**: 新建 `components/editor/hooks/useHistory.ts`。
    *   实现 `past` (栈), `present` (当前), `future` (栈) 的状态管理。
    *   暴露 `push(content)`, `undo()`, `redo()`, `canUndo`, `canRedo` 方法。
2.  **集成到 Preview**: 在 `EditablePreview.tsx` 中引入 `useHistory`。
    *   **初始化**：组件加载时，将初始内容 push 到栈中。
    *   **替换原生 Undo**：拦截 `Ctrl+Z` 和 `Ctrl+Y` (或 `Ctrl+Shift+Z`) 键盘事件，阻止默认行为，调用 Hook 的 `undo/redo`。
    *   **对接工具栏**：将 `undo/redo` 方法传递给 `EditorToolbar`，替换原有的 `execCommand` 调用。
3.  **埋点触发**：
    *   在 `handleInput` 中加入防抖逻辑调用 `push`。
    *   在 `ImagePicker` 插入图片后立即调用 `push`。
    *   在 `TablePicker` 插入表格后立即调用 `push`。
    *   在图片拖拽结束 (`onMouseUp`) 时调用 `push`。

---

### 2. 性能优化：非受控输入与防抖 (Uncontrolled & Debounce)

#### 🔴 问题深度分析
当前 `EditablePreview` 是完全受控组件。
*   `handleInput` 会在每次键盘敲击时触发 -> 获取 `innerHTML` -> 调用父组件 `onContentChange` -> 父组件 setState -> 重新渲染 `EditablePreview`。
*   这种**“打字 -> 全量序列化 -> React Render -> DOM Diff”** 的链路在文档较长（>50KB）时会产生明显的输入延迟（Input Lag）。

#### 🔵 技术解决方案
采用 **“UI 非受控 + 数据最终一致性”** 策略。

#### 🛠️ 实施步骤
1.  **本地状态分离**：
    *   `EditablePreview` 内部维护一个 `localContent` Ref 或者仅依赖 iframe 自身的 DOM 状态。
    *   不再将父组件传入的 `content` prop 作为 iframe 的 value 强制绑定（除非是初始加载或文件切换）。
2.  **防抖同步**：
    *   引入 `lodash.debounce` (或手写)。
    *   创建一个 `debouncedSync = debounce(onContentChange, 1000)`。
    *   在 `handleInput` 中仅调用 `debouncedSync`，不再立即触发 React 更新。
3.  **保存时强制同步**：
    *   在用户点击“保存”或“生成 PDF”按钮时，确保读取 iframe 当前最新的 `innerHTML`，绕过防抖延迟。

---

## 📅 阶段二：标准化与兼容性 (中期目标)

### 3. 废弃 execCommand，拥抱 CSS (Modern Styling)

#### 🔴 问题深度分析
`document.execCommand` 已被 W3C 废弃。
*   它生成的标签古老且不可控（如 `<font size="7">`）。
*   无法精确控制样式（例如无法设置 `line-height` 或具体的 `font-size: 16px`）。

#### 🔵 技术解决方案
自行实现一个 **Selection Style Applier**。

#### 🛠️ 实施步骤
1.  **工具类开发**: 新建 `components/editor/utils/selection.ts`。
    *   实现 `applyStyleToSelection(styleName: string, styleValue: string)`。
    *   **核心逻辑**：
        1.  获取 `window.getSelection().getRangeAt(0)`。
        2.  如果选区只是文本的一部分，使用 `range.surroundContents(span)` 包裹。
        3.  如果选区跨越多个节点，需要遍历 DOM 树，给涉及的文本节点分别包裹 `span` 或修改已有 `span` 的样式。
2.  **替换工具栏逻辑**:
    *   修改 `EditorToolbar.tsx`。
    *   将 `setFontSize` 改为调用 `applyStyleToSelection('fontSize', '16px')`。
    *   将 `applyTextColor` 改为调用 `applyStyleToSelection('color', '#ff0000')`。

---

### 4. 非侵入式图片交互 (Overlay System)

#### 🔴 问题深度分析
当前通过在 `img` 外部包裹 `<div class="image-container">` 来显示缩放手柄。
*   **污染 DOM**：生成的 HTML 包含大量辅助用的 div，导致“所见”与“导出”不一致。
*   **布局破坏**：包裹 div 后，图片原本的 `display: inline` 或 `float` 属性可能失效，导致排版错乱。

#### 🔵 技术解决方案
构建 **Overlay Layer (悬浮覆盖层)**。

#### 🛠️ 实施步骤
1.  **UI 架构调整**:
    *   在 `EditablePreview` 的 iframe 上方（或者 iframe 内部的 body 尾部）创建一个绝对定位的 `div id="editor-overlay"`。
2.  **交互逻辑重写**:
    *   **选中逻辑**：监听 iframe 的 `click` 事件。当点击目标是 `img` 时：
        1.  获取该 img 的 `getBoundingClientRect`。
        2.  计算 img 在 overlay 坐标系中的位置。
        3.  在 overlay 层渲染一个高亮框和 4 个手柄，位置精确覆盖在 img 上。
    *   **缩放逻辑**：
        1.  拖拽 overlay 上的手柄。
        2.  计算偏移量。
        3.  直接修改底层目标 `img` 的 `style.width` 和 `style.height`。
        4.  实时更新 overlay 高亮框的位置以跟随图片变化。
3.  **清理工作**:
    *   移除所有关于 `.image-container` 的代码。
    *   确保导出 HTML 时，不包含 overlay 层元素。

---

## 📅 阶段三：健壮性增强 (长期目标)

### 5. 健壮的表格操作 (Robust Table Operations)

#### 🔴 问题深度分析
当前表格操作仅在 `tr` 层面简单 append/remove `td`。
*   一旦表格中存在合并单元格 (`colspan`/`rowspan`)，简单的 DOM 操作会导致列不对齐，表格结构瞬间崩塌。

#### 🔵 技术解决方案
引入 **Table Matrix (表格矩阵)** 算法。

#### 🛠️ 实施步骤
1.  **矩阵解析**:
    *   编写函数 `parseTableToMatrix(tableElement)`，将 HTML 表格转换为二维数组 `Cell[][]`。
    *   数组中的每个点代表一个物理格子，合并单元格会占据数组中的多个点，并指向同一个 Cell 对象。
2.  **虚拟操作**:
    *   实现 `insertColumn(matrix, index)`：在矩阵的指定索引处插入一列。
    *   如果插入点穿过了一个 `colspan` 的单元格，则增加该单元格的 `colspan` 值，而不是新增单元格。
3.  **DOM 重建**:
    *   操作完成后，根据新的矩阵重新生成 `<tr>` 和 `<td>` 结构，替换旧的 `<tbody>`。

---

## 🚀 推荐执行顺序

1.  **Phase 1.2 (性能防抖)**: 成本最低，收益立竿见影，解决打字卡顿。
2.  **Phase 1.1 (自定义撤销)**: 解决核心体验痛点，防止用户数据丢失。
3.  **Phase 2.2 (图片 Overlay)**: 解决 DOM 污染问题，为高质量 PDF 导出打基础。
4.  **Phase 2.1 (CSS 样式)**: 提升代码质量，面向未来。
5.  **Phase 3 (高级表格)**: 视用户对表格需求的复杂程度而定。
