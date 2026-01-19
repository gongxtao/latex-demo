# 编辑器工具栏重构详细设计方案 (v2.0 - 基于现有架构迭代)

## 1. 总体架构设计 (已实现/增强)

基于现有的代码实现，我们确认了 **配置驱动 (Configuration-Driven)** 的核心架构。目前的系统分层已经非常清晰，后续开发将严格遵循此架构。

### 1.1 核心模块现状与目标
*   **Config Layer (`toolbar/config`)**: 
    *   *现状*: 已定义 `BUTTON_GROUPS` 和基础类型。
    *   *目标*: **增强配置能力**，将下拉框（Font/Size）和动态生成的图标逻辑完全纳入配置，消除 `EditorToolbar.tsx` 中的硬编码。
*   **Render Layer (`toolbar/core`)**: 
    *   *现状*: `ButtonRenderer` 已实现，支持 Command/Toggle/Picker 类型。
    *   *目标*: **扩展 Renderer**，支持 `select` 类型组件的渲染，实现“全组件工厂化”。
*   **Logic Layer (`toolbar/hooks`)**: 
    *   *现状*: `useEditorCommands` 已实现。
    *   *目标*: **补全 `useEditorState`**，实现核心的“状态回显”机制。

### 1.2 目录结构 (保持现状)
```
components/editor/
├── icons/                # 图标组件
├── toolbar/
│   ├── config/           # 配置文件 (constants.ts, buttonConfigs.ts)
│   ├── core/             # 核心渲染引擎 (ButtonRenderer.tsx, ToolbarRow.tsx)
│   ├── buttons/          # 原子按钮组件
│   ├── pickers/          # 复杂选择器 (Color, Table, Image)
│   ├── inputs/           # 输入型组件 (Select)
│   ├── hooks/            # 业务逻辑
│   └── EditorToolbar.tsx # 入口文件
```

## 2. 核心功能补全设计

### 2.1 状态同步机制 (`useEditorState` 重构)
这是目前最缺失的一环。我们需要让工具栏“活”起来，感知光标位置的样式。

**实现逻辑：**
1.  **事件监听**：在 `useEditorState` 中监听 `selectionchange` (主)、`mouseup`、`keyup`。
2.  **状态快照**：每次事件触发时，生成一个 `EditorState` 快照。
    ```typescript
    // toolbar/hooks/useEditorState.ts
    const checkState = useCallback(() => {
      const doc = getIframeDoc();
      if (!doc) return;
      
      setState({
        isBold: doc.queryCommandState('bold'),
        isItalic: doc.queryCommandState('italic'),
        // ... 其他 Toggle 状态
        fontName: doc.queryCommandValue('fontName'), // 用于下拉框回显
        fontSize: doc.queryCommandValue('fontSize'),
        // ...
      });
    }, []);
    ```
3.  **性能优化**：使用 `debounce` (100ms) 避免高频重绘。

### 2.2 全配置化渲染 (移除硬编码)
目前 `EditorToolbar.tsx` 中仍手动写了 Font/Size 的 Select 组件。我们将把它们转化为配置。

**配置结构扩展：**
```typescript
// toolbar/config/types.ts
export type ButtonType = 'command' | 'toggle' | 'picker' | 'select'; // 新增 select

export interface SelectConfig extends BaseButtonConfig {
  type: 'select';
  options: Array<{ label: string; value: string }>;
  width?: string;
  onSelect?: (value: string) => void; // 预留，实际走统一 command
}
```

**渲染层升级：**
修改 `ButtonRenderer.tsx`，增加对 `select` 类型的支持，直接渲染 `ToolbarSelect` 组件。

### 2.3 自定义下拉组件 (`ToolbarSelect` 升级)
为了提升体验（如字体预览），我们将原生 `<select>` 升级为自定义 Dropdown。

**设计方案：**
*   **Trigger**: 显示当前选中值 + 下拉箭头。
*   **Panel**: 绝对定位的列表容器。
*   **Item**: 支持自定义渲染（例如：在“宋体”选项上直接应用宋体样式）。
    ```tsx
    <div style={{ fontFamily: option.value }}>{option.label}</div>
    ```

## 3. 实施路线图 (更新版)

### Phase 1: 状态联调 (High Priority)
1.  完善 `useEditorState.ts`，实现事件监听和状态获取。
2.  在 `EditorToolbar.tsx` 中接入 `editorState`。
3.  更新 `ButtonRenderer`，将 `isActive` 状态传递给 `ToggleButton`。
    *   *验证标准*：点击加粗，按钮变蓝；光标移入加粗文字，按钮自动变蓝。

### Phase 2: 全配置化 (Refactor)
1.  在 `toolbarConfig.ts` 中补充 Font Family, Font Size, Heading 的完整配置。
2.  升级 `ButtonRenderer` 支持 `select` 类型。
3.  重写 `EditorToolbar.tsx`，移除所有硬编码 JSX，只保留一个遍历 `rows` 的循环。
    *   *验证标准*：代码行数减少 50%，新增按钮只需改配置。

### Phase 3: 组件增强 (UI Polish)
1.  将 `ToolbarSelect` 改造为自定义 Dropdown。
2.  优化图标系统，移除 `ICON_MAP` 硬编码，改为在配置中直接引用 Icon 组件或通过名称动态查找。

## 4. 总结
新的设计方案不再重新发明轮子，而是**顺势而为**，利用现有的工厂模式架构，填补状态管理的空白，并推进彻底的配置化。这将使代码库极易维护且具备极高的扩展性。
