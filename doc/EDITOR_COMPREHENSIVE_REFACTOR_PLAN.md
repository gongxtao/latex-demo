# Editor 组件全面重构方案

## 目录

1. [执行摘要](#执行摘要)
2. [当前问题分析](#当前问题分析)
3. [重构目标与原则](#重构目标与原则)
4. [架构设计](#架构设计)
5. [插件系统设计](#插件系统设计)
6. [配置系统设计](#配置系统设计)
7. [主题系统设计](#主题系统设计)
8. [组件重构方案](#组件重构方案)
9. [分阶段实施计划](#分阶段实施计划)
10. [测试策略](#测试策略)
11. [风险管理](#风险管理)
12. [成功标准](#成功标准)

---

## 执行摘要

### 重构概述

本重构方案旨在将 Editor 组件改造为一个**高度可复用、可扩展、可配置**的富文本编辑器组件。基于 **Next.js + Tailwind CSS** 技术栈，重构后将具备：

- **插件化架构**：支持功能扩展和第三方插件集成
- **高度可配置**：工具栏、快捷键、功能限制等完全可配置
- **主题系统**：基于 Tailwind 的主题切换和自定义样式
- **模块化设计**：代码结构清晰，易于维护和扩展
- **完善的测试**：保持现有的 209 个测试用例全部通过

### 预期收益

| 收益项 | 当前状态 | 重构后 | 提升 |
|--------|----------|--------|------|
| 可扩展性 | 无插件系统 | 插件化架构 | 质的飞跃 |
| 可配置性 | 硬编码配置 | 完全可配置 | 90% |
| 代码复用率 | 仅限单一场景 | 项目内多场景复用 | 80% |
| 维护成本 | 高（耦合重） | 低（模块化） | 降低 60% |
| 主题定制 | 困难 | 基于 Tailwind 易于定制 | 70% |

### 时间估算

- **总时间**：约 90 小时
- **阶段数**：5 个主要阶段
- **团队配置**：1-2 名开发者
- **建议周期**：4-6 周

---

## 当前问题分析

### 1. 配置灵活性不足

#### 1.1 硬编码配置

**问题示例：**
```typescript
// 当前硬编码的配置
const DEFAULT_FONT_SIZES = ['1', '2', '3', '4', '5', '6', '7']  // ❌
const MAX_TABLE_SIZE = 10  // ❌
const MAX_IMAGE_SIZE = 5 * 1024 * 1024  // ❌
const DEFAULT_COLORS = [  // ❌
  '#000000', '#FFFFFF', '#FF0000', ...
]
```

**影响：**
- 无法根据业务需求调整限制
- 不同场景需要修改源码
- 难以进行 A/B 测试

#### 1.2 工具栏布局固定

**问题：**
```typescript
// 工具栏布局写死
const TOOLBAR_LAYOUT = [
  ['undo', 'redo'],
  ['bold', 'italic', 'underline'],
  // ... 固定顺序
]
```

**影响：**
- 无法自定义按钮顺序
- 无法隐藏不需要的功能
- 无法添加自定义按钮

### 2. 缺少插件系统

**问题表现：**
- 添加新功能需要修改核心代码
- 无法集成第三方插件
- 功能扩展困难

**示例场景：**
```typescript
// 想添加"代码高亮"功能，需要：
// 1. 修改 EditablePreview.tsx (1140 行)
// 2. 修改 useEditorCommands.ts (404 行)
// 3. 修改 EditorToolbar.tsx (386 行)
// 4. 添加配置文件
// 风险高、工作量大、难以维护
```

### 3. 代码组织问题

**问题表现：**
- 组件之间耦合较重
- 状态分散在多个 useState
- 逻辑复用困难

**示例：**
```typescript
// EditablePreview.tsx 中有 10+ 个 useState
const [isEditing, setIsEditing] = useState(false)
const [selectedImage, setSelectedImage] = useState(null)
const [activeTable, setActiveTable] = useState(null)
// ... 状态分散，难以管理
```

---

## 重构目标与原则

### 重构目标

#### 主要目标（Must Have）

1. **实现插件系统**
   - 设计插件 API
   - 提供生命周期钩子
   - 支持事件系统
   - 允许动态注册命令和工具栏按钮

2. **高度可配置**
   - 工具栏完全可配置（顺序、显示/隐藏）
   - 快捷键可自定义
   - 功能限制可调整（图片大小、表格尺寸等）
   - 支持运行时配置更新

3. **代码模块化**
   - 核心引擎抽象（命令管理、状态管理、历史管理）
   - 组件解耦，降低耦合度
   - 提升代码复用性

4. **主题系统**
   - 基于 Tailwind 的主题配置
   - 支持暗色模式
   - 支持自定义颜色方案

#### 次要目标（Should Have）

5. **性能优化**
   - 虚拟滚动（大文档）
   - 懒加载组件
   - 优化重渲染

6. **TypeScript 强化**
   - 完整的类型定义
   - 泛型支持
   - 类型推导

7. **文档完善**
   - API 文档
   - 使用示例
   - 最佳实践

#### 附加目标（Nice to Have）

8. **辅助功能**
   - ARIA 属性
   - 键盘导航
   - 屏幕阅读器支持

### 设计原则

1. **渐进增强**：确保基础功能在任何环境下可用
2. **向后兼容**：不破坏现有功能
3. **测试驱动**：每个重构都有测试保护
4. **文档先行**：API 设计先于实现
5. **性能优先**：不因架构牺牲性能

---

## 架构设计

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        Editor 组件                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Core Engine                         │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │   Command   │  │    State     │  │   History   │  │  │
│  │  │   Manager   │  │   Manager    │  │   Manager   │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↕                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Plugin System                        │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │   Plugin    │  │    Event     │  │   Hook      │  │  │
│  │  │   Registry  │  │    Bus       │  │  System     │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↕                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 UI Components                         │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │   Toolbar   │  │   Editor     │  │    Status   │  │  │
│  │  │   Builder   │  │    Area      │  │    Bar      │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ↕                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Configuration & Theme                    │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │  │
│  │  │   Config    │  │    Theme     │  │   I18n      │  │  │
│  │  │   Manager   │  │   Provider   │  │  Provider   │  │  │
│  │  └─────────────┘  └──────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                    Storage Abstraction                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐        │
│  │   Memory    │  │   Local      │  │   Remote    │        │
│  │   Storage   │  │   Storage    │  │   Storage   │        │
│  └─────────────┘  └──────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 核心模块设计

#### 1. Core Engine（核心引擎）

**职责：**
- 编辑命令执行
- 状态管理
- 历史记录管理

**接口设计：**
```typescript
// core/CommandManager.ts
interface CommandManager {
  // 执行命令
  execute(command: string, ...args: any[]): void

  // 注册自定义命令
  registerCommand(name: string, handler: CommandHandler): void

  // 检查命令状态
  queryState(command: string): boolean

  // 检查命令值
  queryValue(command: string): string
}

interface CommandHandler {
  (doc: Document, ...args: any[]): void
}
```

```typescript
// core/StateManager.ts
interface StateManager {
  // 获取当前状态
  getState(): EditorState

  // 更新状态
  setState(partial: Partial<EditorState>): void

  // 订阅状态变化
  subscribe(listener: StateListener): () => void
}

interface EditorState {
  content: string
  selection: Selection | null
  floatingImages: FloatingImageItem[]
  activeTable: HTMLTableElement | null
  isEditing: boolean
  // ... 其他状态
}
```

```typescript
// core/HistoryManager.ts
interface HistoryManager {
  // 保存当前状态
  push(state: EditorState): void

  // 撤销
  undo(): EditorState | null

  // 重做
  redo(): EditorState | null

  // 检查是否可撤销
  canUndo(): boolean

  // 检查是否可重做
  canRedo(): boolean

  // 清空历史
  clear(): void
}
```

#### 2. Plugin System（插件系统）

**插件接口：**
```typescript
// plugin/Plugin.ts
interface Plugin {
  // 插件名称
  name: string

  // 插件版本
  version: string

  // 插件依赖
  dependsOn?: string[]

  // 初始化
  init(editor: EditorAPI): void | Promise<void>

  // 销毁
  destroy(): void

  // 配置选项
  config?: PluginConfig

  // 扩展点
  extends?: {
    commands?: Record<string, CommandHandler>
    toolbar?: ToolbarExtension
    shortcuts?: ShortcutConfig[]
    hooks?: HookRegistry
  }
}

// 插件 API
interface EditorAPI {
  commands: CommandManager
  state: StateManager
  history: HistoryManager
  events: EventBus
  config: ConfigManager
  theme: ThemeManager
}
```

**事件系统：**
```typescript
// plugin/EventBus.ts
interface EventBus {
  // 订阅事件
  on(event: string, handler: EventHandler): () => void

  // 订阅一次
  once(event: string, handler: EventHandler): () => void

  // 取消订阅
  off(event: string, handler: EventHandler): void

  // 触发事件
  emit(event: string, ...args: any[]): void

  // 批量触发
  emitBatch(events: Array<{event: string, args: any[]}>): void
}

// 内置事件类型
type EditorEvent =
  | 'content-change'
  | 'selection-change'
  | 'before-command'
  | 'after-command'
  | 'image-insert'
  | 'table-insert'
  | 'floating-image-insert'
  | 'state-restore'
  | 'plugin-load'
  | 'plugin-unload'
```

**生命周期钩子：**
```typescript
// plugin/HookRegistry.ts
interface HookRegistry {
  // 内容改变前
  beforeContentChange: AsyncSeriesHook<ContentChangeContext>

  // 内容改变后
  afterContentChange: AsyncSeriesHook<ContentChangeContext>

  // 命令执行前
  beforeCommand: AsyncWaterfallHook<CommandContext>

  // 命令执行后
  afterCommand: AsyncSeriesHook<CommandContext>

  // 插件加载前
  beforePluginLoad: AsyncWaterfallHook<Plugin>

  // 插件加载后
  afterPluginLoad: AsyncSeriesHook<Plugin>
}

// Hook 类型
type AsyncSeriesHook<T> = (context: T) => Promise<void>
type AsyncWaterfallHook<T> = (context: T) => Promise<T>
```

#### 3. Configuration System（配置系统）

**配置接口：**
```typescript
// config/EditorConfig.ts
interface EditorConfig {
  // 基础配置
  locale: string
  readonly: boolean
  spellcheck: boolean

  // 内容配置
  content: {
    initialContent: string
    placeholder: string
    sanitize: boolean
    allowedTags: string[]
    allowedAttributes: Record<string, string[]>
  }

  // 工具栏配置
  toolbar: ToolbarConfig

  // 快捷键配置
  shortcuts: ShortcutConfig[]

  // 图片配置
  image: {
    maxSize: number // bytes
    maxWidth: number // px
    maxHeight: number // px
    defaultWidth: number
    defaultHeight: number
    resizeHandles: 'all' | 'corners' | 'disabled'
  }

  // 表格配置
  table: {
    maxSize: { rows: number, cols: number }
    defaultSize: { rows: number, cols: number }
    resizeEnabled: boolean
    mergeEnabled: boolean
    splitEnabled: boolean
  }

  // 浮动图片配置
  floatingImage: {
    enabled: boolean
    defaultWidth: number
    defaultHeight: number
    minSize: number
    maxSize: number
  }

  // 历史配置
  history: {
    maxSize: number
    debounceDelay: number
  }

  // 存储配置
  storage: StorageConfig

  // 主题配置
  theme: ThemeConfig

  // 插件配置
  plugins: PluginConfig[]
}

// 工具栏配置
interface ToolbarConfig {
  // 工具栏位置
  position: 'top' | 'bottom' | 'floating'

  // 工具栏行
  rows: ToolbarRow[]

  // 自定义按钮
  customButtons: CustomButton[]
}

interface ToolbarRow {
  groups: ToolbarGroup[]
}

interface ToolbarGroup {
  id: string
  items: ToolbarItem[]
  separator?: boolean
}

type ToolbarItem =
  | ToolbarButton
  | ToolbarSelect
  | ToolbarColorPicker
  | ToolbarDropdown

interface ToolbarButton {
  type: 'button'
  id: string
  icon: React.ComponentType | string
  tooltip: string
  command: string
  commandArgs?: any[]
  disabled?: boolean
  active?: (state: EditorState) => boolean
}

interface ToolbarSelect {
  type: 'select'
  id: string
  items: Array<{value: string, label: string}>
  defaultValue: string
  command: string
  onChange?: (value: string) => void
}

// 快捷键配置
interface ShortcutConfig {
  key: string
  command: string
  commandArgs?: any[]
  preventDefault?: boolean
}
```

**配置管理器：**
```typescript
// config/ConfigManager.ts
interface ConfigManager {
  // 获取配置
  get<K extends keyof EditorConfig>(key: K): EditorConfig[K]

  // 设置配置
  set<K extends keyof EditorConfig>(
    key: K,
    value: EditorConfig[K]
  ): void

  // 合并配置
  merge(config: Partial<EditorConfig>): void

  // 重置为默认配置
  reset(): void

  // 验证配置
  validate(config: Partial<EditorConfig>): ValidationResult
}
```

#### 4. Theme System（主题系统）

**主题接口：**
```typescript
// theme/Theme.ts
interface Theme {
  name: string

  // 颜色变量
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    border: string
    text: string
    textSecondary: string
    error: string
    warning: string
    success: string
    info: string
  }

  // 字体变量
  typography: {
    fontFamily: string
    fontSize: {
      xs: string
      sm: string
      md: string
      lg: string
      xl: string
    }
    fontWeight: {
      normal: number
      medium: number
      semibold: number
      bold: number
    }
    lineHeight: {
      tight: number
      normal: number
      relaxed: number
    }
  }

  // 间距变量
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }

  // 圆角变量
  borderRadius: {
    sm: string
    md: string
    lg: string
    full: string
  }

  // 阴影变量
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }

  // 过渡变量
  transitions: {
    fast: string
    normal: string
    slow: string
  }

  // 组件特定样式
  components: {
    toolbar: ToolbarTheme
    button: ButtonTheme
    input: InputTheme
    dropdown: DropdownTheme
    modal: ModalTheme
  }
}

interface ToolbarTheme {
  background: string
  border: string
  padding: string
  gap: string
  height: string
}

interface ButtonTheme {
  primary: ButtonVariantTheme
  secondary: ButtonVariantTheme
  ghost: ButtonVariantTheme
}

interface ButtonVariantTheme {
  background: string
  color: string
  hoverBackground: string
  activeBackground: string
  disabledBackground: string
  disabledColor: string
}
```

**主题管理器：**
```typescript
// theme/ThemeManager.ts
interface ThemeManager {
  // 设置主题
  setTheme(theme: Theme | string): void

  // 获取当前主题
  getTheme(): Theme

  // 注册主题
  registerTheme(theme: Theme): void

  // 获取 CSS 变量
  getCSSVariables(): Record<string, string>

  // 切换暗色模式
  toggleDarkMode(): void

  // 监听主题变化
  onChange(listener: (theme: Theme) => void): () => void
}
```

#### 5. Storage Abstraction（存储抽象）

**存储接口：**
```typescript
// storage/Storage.ts
interface Storage {
  // 保存数据
  set(key: string, value: any): Promise<void>

  // 获取数据
  get<T>(key: string): Promise<T | null>

  // 删除数据
  remove(key: string): Promise<void>

  // 清空数据
  clear(): Promise<void>

  // 检查是否存在
  has(key: string): Promise<boolean>

  // 获取所有键
  keys(): Promise<string[]>
}

// 内存存储
class MemoryStorage implements Storage {
  private store = new Map<string, any>()

  async set(key: string, value: any): Promise<void> {
    this.store.set(key, value)
  }

  async get<T>(key: string): Promise<T | null> {
    return this.store.get(key) ?? null
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key)
  }

  async clear(): Promise<void> {
    this.store.clear()
  }

  async has(key: string): Promise<boolean> {
    return this.store.has(key)
  }

  async keys(): Promise<string[]> {
    return Array.from(this.store.keys())
  }
}

// LocalStorage 适配器
class LocalStorageAdapter implements Storage {
  async set(key: string, value: any): Promise<void> {
    const serialized = JSON.stringify(value)
    localStorage.setItem(key, serialized)
  }

  async get<T>(key: string): Promise<T | null> {
    const serialized = localStorage.getItem(key)
    if (serialized === null) return null
    try {
      return JSON.parse(serialized) as T
    } catch {
      return null
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key)
  }

  async clear(): Promise<void> {
    localStorage.clear()
  }

  async has(key: string): Promise<boolean> {
    return localStorage.getItem(key) !== null
  }

  async keys(): Promise<string[]> {
    return Object.keys(localStorage)
  }
}

// IndexedDB 适配器
class IndexedDBAdapter implements Storage {
  private db: IDBDatabase | null = null
  private dbName = 'editor-storage'
  private storeName = 'key-value'

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
    })
  }

  async set(key: string, value: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(value, key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error)
    })
  }

  async remove(key: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key)
    return value !== null
  }

  async keys(): Promise<string[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAllKeys()

      request.onsuccess = () => resolve(request.result as string[])
      request.onerror = () => reject(request.error)
    })
  }
}

// 远程存储适配器
interface RemoteStorageOptions {
  baseUrl: string
  headers?: Record<string, string>
  timeout?: number
}

class RemoteStorageAdapter implements Storage {
  private options: RemoteStorageOptions

  constructor(options: RemoteStorageOptions) {
    this.options = options
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.options.baseUrl}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.options.headers,
        ...options?.headers
      },
      signal: AbortSignal.timeout(this.options.timeout ?? 5000)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  async set(key: string, value: any): Promise<void> {
    await this.request(`/storage/${key}`, {
      method: 'PUT',
      body: JSON.stringify(value)
    })
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.request<T>(`/storage/${key}`, {
        method: 'GET'
      })
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  async remove(key: string): Promise<void> {
    await this.request(`/storage/${key}`, {
      method: 'DELETE'
    })
  }

  async clear(): Promise<void> {
    await this.request('/storage', {
      method: 'DELETE'
    })
  }

  async has(key: string): Promise<boolean> {
    try {
      await this.get(key)
      return true
    } catch {
      return false
    }
  }

  async keys(): Promise<string[]> {
    return this.request<string[]>('/storage/keys', {
      method: 'GET'
    })
  }
}
```

---

## 插件系统设计

### 插件 API 设计

#### 1. 基础插件接口

```typescript
// plugin/types.ts
export interface Plugin<
  TConfig extends Record<string, any> = any
> {
  // 插件元信息
  name: string
  version: string
  description?: string
  author?: string

  // 依赖管理
  dependencies?: string[]
  peerDependencies?: string[]

  // 配置 schema（用于验证）
  configSchema?: object

  // 生命周期钩子
  install: (api: EditorAPI, config?: TConfig) => void | Promise<void>
  uninstall?: () => void | Promise<void>

  // 插件激活时
  activate?: () => void | Promise<void>

  // 插件停用时
  deactivate?: () => void | Promise<void>

  // 扩展点
  extends?: PluginExtensions
}

export interface PluginExtensions {
  // 自定义命令
  commands?: Record<string, CommandExtension>

  // 工具栏扩展
  toolbar?: ToolbarExtension

  // 快捷键扩展
  shortcuts?: ShortcutExtension[]

  // 事件监听器
  eventListeners?: EventListenerExtension[]

  // 生命周期钩子
  hooks?: HookExtension
}

export interface CommandExtension {
  execute: (doc: Document, ...args: any[]) => void
  queryState?: () => boolean
  queryValue?: () => string
}

export interface ToolbarExtension {
  position?: 'left' | 'right' | 'custom'
  groups?: ToolbarGroup[]
  buttons?: ToolbarButton[]
}

export interface ShortcutExtension {
  key: string
  command: string
  commandArgs?: any[]
}

export interface EventListenerExtension {
  event: string
  handler: (...args: any[]) => void
  priority?: number
}

export interface HookExtension {
  beforeContentChange?: (context: ContentChangeContext) => void | Promise<void>
  afterContentChange?: (context: ContentChangeContext) => void | Promise<void>
  beforeCommand?: (context: CommandContext) => CommandContext | Promise<CommandContext>
  afterCommand?: (context: CommandContext) => void | Promise<void>
}
```

#### 2. 插件管理器

```typescript
// plugin/PluginManager.ts
export class PluginManager {
  private plugins = new Map<string, PluginInstance>()
  private api: EditorAPI

  constructor(api: EditorAPI) {
    this.api = api
  }

  // 注册插件
  async register<TConfig extends Record<string, any>>(
    plugin: Plugin<TConfig>,
    config?: TConfig
  ): Promise<void> {
    // 检查依赖
    await this.checkDependencies(plugin)

    // 创建插件实例
    const instance: PluginInstance = {
      plugin,
      config,
      state: 'registered'
    }

    this.plugins.set(plugin.name, instance)

    // 安装插件
    await this.installPlugin(instance)

    // 触发插件加载事件
    this.api.events.emit('plugin-load', plugin)
  }

  // 注销插件
  async unregister(name: string): Promise<void> {
    const instance = this.plugins.get(name)
    if (!instance) {
      throw new Error(`Plugin not found: ${name}`)
    }

    // 停用插件
    if (instance.state === 'active') {
      await this.deactivatePlugin(instance)
    }

    // 卸载插件
    await this.uninstallPlugin(instance)

    // 移除插件
    this.plugins.delete(name)

    // 触发插件卸载事件
    this.api.events.emit('plugin-unload', instance.plugin)
  }

  // 激活插件
  async activate(name: string): Promise<void> {
    const instance = this.plugins.get(name)
    if (!instance) {
      throw new Error(`Plugin not found: ${name}`)
    }

    if (instance.state !== 'registered') {
      throw new Error(`Plugin is not in registered state: ${name}`)
    }

    await instance.plugin.activate?.()
    instance.state = 'active'
  }

  // 停用插件
  async deactivate(name: string): Promise<void> {
    const instance = this.plugins.get(name)
    if (!instance) {
      throw new Error(`Plugin not found: ${name}`)
    }

    if (instance.state !== 'active') {
      throw new Error(`Plugin is not in active state: ${name}`)
    }

    await this.deactivatePlugin(instance)
  }

  // 获取插件
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name)?.plugin
  }

  // 获取所有插件
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).map(p => p.plugin)
  }

  // 检查插件是否已注册
  hasPlugin(name: string): boolean {
    return this.plugins.has(name)
  }

  // 检查插件是否已激活
  isPluginActive(name: string): boolean {
    return this.plugins.get(name)?.state === 'active'
  }

  // 私有方法：安装插件
  private async installPlugin(instance: PluginInstance): Promise<void> {
    const { plugin, config } = instance

    // 调用插件的 install 方法
    await plugin.install(this.api, config)

    // 注册扩展
    if (plugin.extends) {
      await this.registerExtensions(plugin, plugin.extends)
    }

    instance.state = 'registered'
  }

  // 私有方法：卸载插件
  private async uninstallPlugin(instance: PluginInstance): Promise<void> {
    const { plugin } = instance

    // 调用插件的 uninstall 方法
    await plugin.uninstall?.()

    // 注销扩展
    if (plugin.extends) {
      await this.unregisterExtensions(plugin, plugin.extends)
    }
  }

  // 私有方法：激活插件
  private async deactivatePlugin(instance: PluginInstance): Promise<void> {
    await instance.plugin.deactivate?.()
    instance.state = 'registered'
  }

  // 私有方法：注册扩展
  private async registerExtensions(
    plugin: Plugin,
    extensions: PluginExtensions
  ): Promise<void> {
    // 注册命令
    if (extensions.commands) {
      for (const [name, command] of Object.entries(extensions.commands)) {
        this.api.commands.registerCommand(name, command.execute)
      }
    }

    // 注册工具栏
    if (extensions.toolbar) {
      // TODO: 实现工具栏扩展注册
    }

    // 注册快捷键
    if (extensions.shortcuts) {
      for (const shortcut of extensions.shortcuts) {
        // TODO: 实现快捷键注册
      }
    }

    // 注册事件监听器
    if (extensions.eventListeners) {
      for (const listener of extensions.eventListeners) {
        this.api.events.on(listener.event, listener.handler)
      }
    }

    // 注册钩子
    if (extensions.hooks) {
      // TODO: 实现钩子注册
    }
  }

  // 私有方法：注销扩展
  private async unregisterExtensions(
    plugin: Plugin,
    extensions: PluginExtensions
  ): Promise<void> {
    // 注销命令
    if (extensions.commands) {
      for (const name of Object.keys(extensions.commands)) {
        this.api.commands.unregisterCommand(name)
      }
    }

    // 注销事件监听器
    if (extensions.eventListeners) {
      for (const listener of extensions.eventListeners) {
        this.api.events.off(listener.event, listener.handler)
      }
    }
  }

  // 私有方法：检查依赖
  private async checkDependencies(plugin: Plugin): Promise<void> {
    const { dependencies = [], peerDependencies = [] } = plugin

    // 检查 dependencies
    for (const dep of dependencies) {
      if (!this.hasPlugin(dep)) {
        throw new Error(
          `Plugin "${plugin.name}" requires plugin "${dep}" to be installed first`
        )
      }
    }

    // 检查 peerDependencies
    for (const dep of peerDependencies) {
      if (!this.hasPlugin(dep)) {
        console.warn(
          `Plugin "${plugin.name}" recommends plugin "${dep}" to be installed`
        )
      }
    }
  }
}

interface PluginInstance {
  plugin: Plugin
  config?: any
  state: 'registered' | 'active'
}
```

### 插件示例

#### 示例 1：代码高亮插件

```typescript
// plugins/CodeHighlightPlugin.ts
import { Plugin, EditorAPI } from '../types'

export const CodeHighlightPlugin: Plugin = {
  name: 'code-highlight',
  version: '1.0.0',
  description: 'Syntax highlighting for code blocks',
  author: 'Your Name',

  dependencies: [],

  async install(api: EditorAPI, config?: { theme: string }) {
    const theme = config?.theme || 'github'

    // 注册代码块高亮命令
    api.commands.registerCommand('highlightCode', (doc) => {
      const codeBlocks = doc.querySelectorAll('pre code')
      codeBlocks.forEach((block) => {
        // 应用高亮
        // ...
      })
    })

    // 监听内容变化
    api.events.on('content-change', () => {
      api.commands.execute('highlightCode')
    })

    // 添加工具栏按钮
    api.toolbar.addButton({
      id: 'highlight-code',
      icon: 'code',
      tooltip: 'Highlight Code',
      command: 'highlightCode'
    })
  },

  async uninstall(api: EditorAPI) {
    api.commands.unregisterCommand('highlightCode')
  },

  extends: {
    commands: {
      highlightCode: {
        execute: (doc) => {
          const codeBlocks = doc.querySelectorAll('pre code')
          codeBlocks.forEach((block) => {
            // 应用高亮逻辑
          })
        }
      }
    }
  }
}
```

#### 示例 2：字数统计插件

```typescript
// plugins/WordCountPlugin.ts
export const WordCountPlugin: Plugin = {
  name: 'word-count',
  version: '1.0.0',
  description: 'Count words and characters in the document',

  install(api: EditorAPI) {
    // 添加状态栏
    const statusBar = document.createElement('div')
    statusBar.className = 'word-count-status'
    document.body.appendChild(statusBar)

    // 更新字数
    const updateCount = () => {
      const doc = api.state.getDocument()
      const text = doc.body.innerText
      const words = text.split(/\s+/).filter(w => w.length > 0).length
      const chars = text.length

      statusBar.textContent = `${words} words, ${chars} characters`
    }

    api.events.on('content-change', updateCount)

    // 初始更新
    updateCount()
  },

  uninstall() {
    const statusBar = document.querySelector('.word-count-status')
    statusBar?.remove()
  }
}
```

#### 示例 3：自动保存插件

```typescript
// plugins/AutoSavePlugin.ts
export const AutoSavePlugin: Plugin = {
  name: 'auto-save',
  version: '1.0.0',
  description: 'Automatically save content',

  install(api: EditorAPI, config?: { interval: number }) {
    const interval = config?.interval || 30000 // 30 seconds

    let timer: NodeJS.Timeout

    const startAutoSave = () => {
      timer = setInterval(() => {
        const content = api.state.getContent()
        // 保存到存储
        api.storage.set('auto-save', content)
      }, interval)
    }

    const stopAutoSave = () => {
      clearInterval(timer)
    }

    // 编辑开始时启动自动保存
    api.events.on('focus', startAutoSave)

    // 编辑结束时停止自动保存
    api.events.on('blur', stopAutoSave)

    // 初始启动
    startAutoSave()
  },

  uninstall(api: EditorAPI) {
    // 清理工作
  }
}
```

---

## 配置系统设计

### 配置管理器实现

```typescript
// config/ConfigManager.ts
export class ConfigManager {
  private config: EditorConfig
  private defaults: EditorConfig
  private validators: Map<keyof EditorConfig, Validator<any>>
  private listeners: Set<ConfigListener>

  constructor(initialConfig?: Partial<EditorConfig>) {
    this.defaults = this.getDefaultConfig()
    this.config = { ...this.defaults, ...initialConfig }
    this.validators = new Map()
    this.listeners = new Set()

    this.setupValidators()
  }

  // 获取配置值
  get<K extends keyof EditorConfig>(key: K): EditorConfig[K] {
    return this.config[key]
  }

  // 设置配置值
  set<K extends keyof EditorConfig>(
    key: K,
    value: EditorConfig[K]
  ): void {
    const oldValue = this.config[key]
    const validator = this.validators.get(key)

    // 验证新值
    if (validator && !validator.validate(value)) {
      throw new Error(`Invalid value for config key "${key}"`)
    }

    // 更新配置
    this.config[key] = value

    // 通知监听器
    this.notifyListeners(key, value, oldValue)
  }

  // 合并配置
  merge(config: Partial<EditorConfig>): void {
    for (const [key, value] of Object.entries(config)) {
      this.set(key as keyof EditorConfig, value as any)
    }
  }

  // 重置为默认配置
  reset(): void {
    this.config = { ...this.defaults }
    this.notifyListeners('*', this.config, this.config)
  }

  // 验证配置
  validate(config: Partial<EditorConfig>): ValidationResult {
    const errors: string[] = []

    for (const [key, value] of Object.entries(config)) {
      const validator = this.validators.get(key as keyof EditorConfig)

      if (validator && !validator.validate(value)) {
        errors.push(
          `Invalid value for "${key}": ${validator.message}`
        )
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // 订阅配置变化
  onChange(listener: ConfigListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // 私有方法：获取默认配置
  private getDefaultConfig(): EditorConfig {
    return {
      locale: 'en',
      readonly: false,
      spellcheck: true,
      content: {
        initialContent: '',
        placeholder: 'Type something...',
        sanitize: true,
        allowedTags: ['p', 'br', 'strong', 'em', 'u', 'a', 'img', 'table'],
        allowedAttributes: {
          'a': ['href', 'target'],
          'img': ['src', 'alt', 'width', 'height']
        }
      },
      toolbar: {
        position: 'top',
        rows: [
          {
            groups: [
              {
                id: 'history',
                items: [
                  { type: 'button', id: 'undo', command: 'undo' },
                  { type: 'button', id: 'redo', command: 'redo' }
                ],
                separator: true
              }
            ]
          }
        ],
        customButtons: []
      },
      shortcuts: [
        { key: 'Mod+z', command: 'undo' },
        { key: 'Mod+Shift+z', command: 'redo' },
        { key: 'Mod+b', command: 'bold' },
        { key: 'Mod+i', command: 'italic' },
        { key: 'Mod+u', command: 'underline' }
      ],
      image: {
        maxSize: 5 * 1024 * 1024, // 5MB
        maxWidth: 1200,
        maxHeight: 1200,
        defaultWidth: 300,
        defaultHeight: 200,
        resizeHandles: 'all'
      },
      table: {
        maxSize: { rows: 20, cols: 20 },
        defaultSize: { rows: 3, cols: 3 },
        resizeEnabled: true,
        mergeEnabled: true,
        splitEnabled: true
      },
      floatingImage: {
        enabled: true,
        defaultWidth: 240,
        defaultHeight: 160,
        minSize: 50,
        maxSize: 800
      },
      history: {
        maxSize: 100,
        debounceDelay: 1000
      },
      storage: {
        type: 'memory',
        options: {}
      },
      theme: {
        name: 'light',
        themes: []
      },
      plugins: []
    }
  }

  // 私有方法：设置验证器
  private setupValidators(): void {
    // Locale 验证器
    this.validators.set('locale', {
      validate: (value) => /^[a-z]{2}(-[A-Z]{2})?$/.test(value),
      message: 'Locale must be in format "en" or "en-US"'
    })

    // 图片大小验证器
    this.validators.set('image', {
      validate: (value) => {
        return (
          value.maxSize > 0 &&
          value.maxWidth > 0 &&
          value.maxHeight > 0
        )
      },
      message: 'Image size must be positive'
    })

    // 表格大小验证器
    this.validators.set('table', {
      validate: (value) => {
        return (
          value.maxSize.rows > 0 &&
          value.maxSize.cols > 0 &&
          value.defaultSize.rows > 0 &&
          value.defaultSize.cols > 0
        )
      },
      message: 'Table size must be positive'
    })
  }

  // 私有方法：通知监听器
  private notifyListeners<K extends keyof EditorConfig>(
    key: K,
    newValue: EditorConfig[K],
    oldValue: EditorConfig[K]
  ): void {
    this.listeners.forEach(listener => {
      listener(key, newValue, oldValue)
    })
  }
}

// 类型定义
interface Validator<T> {
  validate(value: T): boolean
  message: string
}

interface ValidationResult {
  valid: boolean
  errors: string[]
}

type ConfigListener = <K extends keyof EditorConfig>(
  key: K,
  newValue: EditorConfig[K],
  oldValue: EditorConfig[K]
) => void
```

### 工具栏配置构建器

```typescript
// config/ToolbarBuilder.ts
export class ToolbarBuilder {
  private config: ToolbarConfig

  constructor() {
    this.config = {
      position: 'top',
      rows: [],
      customButtons: []
    }
  }

  // 设置位置
  setPosition(position: 'top' | 'bottom' | 'floating'): this {
    this.config.position = position
    return this
  }

  // 添加行
  addRow(): ToolbarRowBuilder {
    const rowBuilder = new ToolbarRowBuilder()
    this.config.rows.push(rowBuilder.build())
    return rowBuilder
  }

  // 添加自定义按钮
  addCustomButton(button: CustomButton): this {
    this.config.customButtons.push(button)
    return this
  }

  // 构建配置
  build(): ToolbarConfig {
    return this.config
  }
}

export class ToolbarRowBuilder {
  private groups: ToolbarGroup[] = []

  // 添加按钮组
  addGroup(
    id: string,
    items: ToolbarItem[],
    separator = false
  ): this {
    this.groups.push({ id, items, separator })
    return this
  }

  // 添加分隔符
  addSeparator(): this {
    return this
  }

  // 构建行配置
  build(): ToolbarRow {
    return { groups: this.groups }
  }
}

// 使用示例
const toolbarConfig = new ToolbarBuilder()
  .setPosition('top')
  .addRow()
    .addGroup('history', [
      { type: 'button', id: 'undo', command: 'undo' },
      { type: 'button', id: 'redo', command: 'redo' }
    ], true)
    .addGroup('format', [
      { type: 'button', id: 'bold', command: 'bold' },
      { type: 'button', id: 'italic', command: 'italic' },
      { type: 'button', id: 'underline', command: 'underline' }
    ], true)
  .build()
```

---

## 主题系统设计

### 基于 Tailwind CSS 的主题系统

**设计原则：**
- 利用 Tailwind 的 `dark:` 前缀实现暗色模式
- 使用 Tailwind Config 自定义颜色和样式
- 通过 className 组合实现主题切换

### 主题配置

```typescript
// theme/ThemeConfig.ts
export interface ThemeConfig {
  name: string
  mode: 'light' | 'dark'
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    border: string
    text: string
    textSecondary: string
  }
}

// 默认主题配置
export const defaultThemes: Record<string, ThemeConfig> = {
  light: {
    name: 'light',
    mode: 'light',
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      background: '#ffffff',
      surface: '#f9fafb',
      border: '#e5e7eb',
      text: '#111827',
      textSecondary: '#6b7280'
    }
  },
  dark: {
    name: 'dark',
    mode: 'dark',
    colors: {
      primary: '#60a5fa',
      secondary: '#9ca3af',
      background: '#111827',
      surface: '#1f2937',
      border: '#374151',
      text: '#f9fafb',
      textSecondary: '#9ca3af'
    }
  }
}
```

### 主题管理器

```typescript
// theme/ThemeManager.ts
export class ThemeManager {
  private currentTheme: ThemeConfig
  private themes: Record<string, ThemeConfig>
  private listeners: Set<(theme: ThemeConfig) => void>

  constructor(initialTheme: ThemeConfig, themes: Record<string, ThemeConfig>) {
    this.currentTheme = initialTheme
    this.themes = themes
    this.listeners = new Set()
  }

  // 设置主题
  setTheme(themeName: string): void {
    const theme = this.themes[themeName]
    if (!theme) {
      throw new Error(`Theme not found: ${themeName}`)
    }

    this.currentTheme = theme
    this.applyTheme(theme)
    this.notifyListeners()
  }

  // 获取当前主题
  getTheme(): ThemeConfig {
    return this.currentTheme
  }

  // 切换暗色模式
  toggleDarkMode(): void {
    const newMode = this.currentTheme.mode === 'light' ? 'dark' : 'light'
    const themeName = newMode === 'dark' ? 'dark' : 'light'
    this.setTheme(themeName)
  }

  // 监听主题变化
  onChange(listener: (theme: ThemeConfig) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // 获取 Tailwind className 前缀
  getThemeClass(): string {
    return this.currentTheme.mode === 'dark' ? 'dark' : ''
  }

  // 私有方法：应用主题
  private applyTheme(theme: ThemeConfig): void {
    const root = document.documentElement

    // 设置 dark 类
    if (theme.mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // 设置 data-theme 属性
    root.setAttribute('data-theme', theme.name)
  }

  // 私有方法：通知监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentTheme))
  }
}
```

### Tailwind 配置

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // 手动控制暗色模式
  theme: {
    extend: {
      colors: {
        // 编辑器主题颜色
        primary: 'var(--editor-primary)',
        secondary: 'var(--editor-secondary)',
        background: 'var(--editor-background)',
        surface: 'var(--editor-surface)',
        border: 'var(--editor-border)',
        text: {
          DEFAULT: 'var(--editor-text)',
          secondary: 'var(--editor-text-secondary)'
        }
      }
    }
  }
}
```

### 在组件中使用

```tsx
// components/Editor.tsx
import { useTheme } from '../hooks/useTheme'

export const Editor: React.FC<EditorProps> = ({ config }) => {
  const { theme, toggleDarkMode } = useTheme()

  return (
    <div className={`${theme.getThemeClass()} bg-white dark:bg-background text-text dark:text-text`}>
      <Toolbar />
      <EditorArea />

      <button onClick={toggleDarkMode}>
        {theme.getTheme().mode === 'light' ? '🌙' : '☀️'}
      </button>
    </div>
  )
}
```

### 主题 Hook

```typescript
// hooks/useTheme.ts
import { useContext } from 'react'
import { ThemeContext } from '../contexts/ThemeContext'

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

### 主题 Provider

```tsx
// contexts/ThemeContext.tsx
import { createContext, ReactNode } from 'react'
import { ThemeManager, defaultThemes } from '../theme/ThemeConfig'

interface ThemeContextValue {
  theme: ThemeManager
  toggleDarkMode: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export const ThemeProvider: React.FC<{
  children: ReactNode
  initialTheme?: string
}> = ({ children, initialTheme = 'light' }) => {
  const themeManager = new ThemeManager(
    defaultThemes[initialTheme],
    defaultThemes
  )

  return (
    <ThemeContext.Provider
      value={{
        theme: themeManager,
        toggleDarkMode: () => themeManager.toggleDarkMode()
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
```
  private registerDefaultThemes(): void {
    // Light Theme
    this.registerTheme({
      name: 'light',
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        background: '#ffffff',
        surface: '#f9fafb',
        border: '#e5e7eb',
        text: '#111827',
        textSecondary: '#6b7280',
        error: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
        info: '#3b82f6'
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          md: '1rem',
          lg: '1.125rem',
          xl: '1.25rem'
        },
        fontWeight: {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      },
      transitions: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms'
      },
      components: {
        toolbar: {
          background: '#ffffff',
          border: '#e5e7eb',
          padding: '0.75rem',
          gap: '0.5rem',
          height: '3rem'
        },
        button: {
          primary: {
            background: '#3b82f6',
            color: '#ffffff',
            hoverBackground: '#2563eb',
            activeBackground: '#1d4ed8',
            disabledBackground: '#e5e7eb',
            disabledColor: '#9ca3af'
          },
          secondary: {
            background: '#f3f4f6',
            color: '#374151',
            hoverBackground: '#e5e7eb',
            activeBackground: '#d1d5db',
            disabledBackground: '#f9fafb',
            disabledColor: '#9ca3af'
          },
          ghost: {
            background: 'transparent',
            color: '#374151',
            hoverBackground: '#f3f4f6',
            activeBackground: '#e5e7eb',
            disabledBackground: 'transparent',
            disabledColor: '#9ca3af'
          }
        }
      }
    })

    // Dark Theme
    this.registerTheme({
      name: 'dark',
      colors: {
        primary: '#60a5fa',
        secondary: '#9ca3af',
        background: '#111827',
        surface: '#1f2937',
        border: '#374151',
        text: '#f9fafb',
        textSecondary: '#9ca3af',
        error: '#f87171',
        warning: '#fbbf24',
        success: '#34d399',
        info: '#60a5fa'
      },
      typography: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          md: '1rem',
          lg: '1.125rem',
          xl: '1.25rem'
        },
        fontWeight: {
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem'
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      },
      transitions: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms'
      },
      components: {
        toolbar: {
          background: '#1f2937',
          border: '#374151',
          padding: '0.75rem',
          gap: '0.5rem',
          height: '3rem'
        },
        button: {
          primary: {
            background: '#3b82f6',
            color: '#ffffff',
            hoverBackground: '#2563eb',
            activeBackground: '#1d4ed8',
            disabledBackground: '#374151',
            disabledColor: '#6b7280'
          },
          secondary: {
            background: '#374151',
            color: '#e5e7eb',
            hoverBackground: '#4b5563',
            activeBackground: '#6b7280',
            disabledBackground: '#1f2937',
            disabledColor: '#6b7280'
          },
          ghost: {
            background: 'transparent',
            color: '#e5e7eb',
            hoverBackground: '#374151',
            activeBackground: '#4b5563',
            disabledBackground: 'transparent',
            disabledColor: '#6b7280'
          }
        }
      }
    })
  }

  // 私有方法：通知监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.currentTheme)
    })
  }
}
```

---

## 组件重构方案

### 组件接口设计

```typescript
// components/Editor.tsx
import React, { useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface EditorProps {
  // 内容
  content: string
  onContentChange: (content: string) => void

  // 配置
  config?: Partial<EditorConfig>

  // 主题
  theme?: Theme

  // 插件
  plugins?: Plugin[]

  // 状态
  readonly?: boolean
  disabled?: boolean

  // 回调
  onFocus?: () => void
  onBlur?: () => void
  onReady?: () => void

  // 样式
  className?: string
  style?: React.CSSProperties

  // Ref
  editorRef?: RefObject<EditorRef>
}

export interface EditorRef {
  // 命令执行
  executeCommand(command: string, ...args: any[]): void

  // 内容操作
  getContent(): string
  setContent(content: string): void

  // 选择操作
  getSelection(): Selection | null
  setSelection(selection: Selection): void

  // 状态查询
  getState(): EditorState

  // 焦点控制
  focus(): void
  blur(): void
}

export const Editor: React.FC<EditorProps> = ({
  content,
  onContentChange,
  config: userConfig = {},
  theme: userTheme,
  plugins = [],
  readonly = false,
  disabled = false,
  onFocus,
  onBlur,
  onReady,
  className,
  style,
  editorRef
}) => {
  // 初始化核心模块
  const configManager = useRef(new ConfigManager(userConfig))
  const themeManager = useRef(new ThemeManager(userTheme || defaultTheme))
  const commandManager = useRef(new CommandManager())
  const stateManager = useRef(new StateManager())
  const historyManager = useRef(new HistoryManager())
  const eventBus = useRef(new EventBus())
  const pluginManager = useRef(new PluginManager(createEditorAPI()))

  const [isReady, setIsReady] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 创建 Editor API
  function createEditorAPI(): EditorAPI {
    return {
      commands: commandManager.current,
      state: stateManager.current,
      history: historyManager.current,
      events: eventBus.current,
      config: configManager.current,
      theme: themeManager.current
    }
  }

  // 初始化
  useEffect(() => {
    const init = async () => {
      // 加载插件
      for (const plugin of plugins) {
        await pluginManager.current.register(plugin)
      }

      setIsReady(true)
      onReady?.()
    }

    init()
  }, [plugins])

  // 内容变化处理
  useEffect(() => {
    if (isReady) {
      stateManager.current.setState({ content })
    }
  }, [content, isReady])

  // 暴露 ref 方法
  useImperativeHandle(editorRef, () => ({
    executeCommand: (command, ...args) => {
      commandManager.current.execute(command, ...args)
    },
    getContent: () => {
      return stateManager.current.getState().content
    },
    setContent: (newContent) => {
      stateManager.current.setState({ content: newContent })
      onContentChange(newContent)
    },
    getSelection: () => {
      return stateManager.current.getState().selection
    },
    setSelection: (selection) => {
      stateManager.current.setState({ selection })
    },
    getState: () => {
      return stateManager.current.getState()
    },
    focus: () => {
      iframeRef.current?.focus()
    },
    blur: () => {
      iframeRef.current?.blur()
    }
  }), [isReady])

  // 获取 CSS 变量
  const cssVars = themeManager.current.getCSSVariables()

  return (
    <div
      className={`editor-container ${className || ''}`}
      style={{ ...cssVars, ...style }}
      data-readonly={readonly}
      data-disabled={disabled}
    >
      {isReady && (
        <>
          <Toolbar
            api={createEditorAPI()}
            config={configManager.current.get('toolbar')}
          />
          <EditorArea
            ref={iframeRef}
            content={content}
            onContentChange={onContentChange}
            config={configManager.current}
            api={createEditorAPI()}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </>
      )}
    </div>
  )
}
```

### 工具栏组件重构

```typescript
// components/Toolbar.tsx
interface ToolbarProps {
  api: EditorAPI
  config: ToolbarConfig
}

export const Toolbar: React.FC<ToolbarProps> = ({ api, config }) => {
  const [state, setState] = useState<EditorState>(api.state.getState())

  // 订阅状态变化
  useEffect(() => {
    const unsubscribe = api.state.subscribe((newState) => {
      setState(newState)
    })
    return unsubscribe
  }, [api])

  if (config.position === 'floating') {
    return createPortal(
      <FloatingToolbar api={api} config={config} state={state} />,
      document.body
    )
  }

  return (
    <div
      className={`toolbar toolbar-${config.position}`}
      role="toolbar"
      aria-label="Editor toolbar"
    >
      {config.rows.map((row, rowIndex) => (
        <div key={rowIndex} className="toolbar-row">
          {row.groups.map((group) => (
            <ToolbarGroup
              key={group.id}
              group={group}
              api={api}
              state={state}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// 工具栏组
interface ToolbarGroupProps {
  group: ToolbarGroup
  api: EditorAPI
  state: EditorState
}

const ToolbarGroup: React.FC<ToolbarGroupProps> = ({ group, api, state }) => {
  return (
    <div className="toolbar-group">
      {group.items.map((item) => (
        <ToolbarItem
          key={item.id}
          item={item}
          api={api}
          state={state}
        />
      ))}
      {group.separator && <div className="toolbar-separator" />}
    </div>
  )
}

// 工具栏项
interface ToolbarItemProps {
  item: ToolbarItem
  api: EditorAPI
  state: EditorState
}

const ToolbarItem: React.FC<ToolbarItemProps> = ({ item, api, state }) => {
  switch (item.type) {
    case 'button':
      return <ToolbarButton item={item} api={api} state={state} />
    case 'select':
      return <ToolbarSelect item={item} api={api} state={state} />
    case 'colorPicker':
      return <ColorPicker item={item} api={api} state={state} />
    default:
      return null
  }
}

// 工具栏按钮
const ToolbarButton: React.FC<{
  item: ToolbarButton
  api: EditorAPI
  state: EditorState
}> = ({ item, api, state }) => {
  const isActive = item.active ? item.active(state) : false
  const isDisabled = item.disabled ?? false

  const handleClick = () => {
    api.commands.execute(item.command, ...(item.commandArgs || []))
  }

  return (
    <button
      className={`toolbar-button ${isActive ? 'active' : ''}`}
      disabled={isDisabled}
      onClick={handleClick}
      title={item.tooltip}
      aria-label={item.tooltip}
      aria-pressed={isActive}
    >
      {typeof item.icon === 'string' ? (
        <span className="icon">{item.icon}</span>
      ) : (
        <item.icon />
      )}
    </button>
  )
}
```

---

## 分阶段实施计划

### 阶段概览

| 阶段 | 名称 | 时间 | 风险 | 优先级 |
|------|------|------|------|--------|
| 1 | 核心架构抽象 | 15h | 低 | P0 |
| 2 | 插件系统实现 | 25h | 高 | P0 |
| 3 | 配置与主题系统 | 20h | 低 | P0 |
| 4 | 组件重构与优化 | 20h | 中 | P0 |
| 5 | 测试与文档 | 10h | 低 | P1 |
| **总计** | - | **90h** | - | - |

### 阶段 1：核心架构抽象（15小时）

#### 目标
- 实现核心模块接口（命令管理、状态管理、历史管理）
- 建立模块化代码结构
- 完成核心功能抽象

#### 具体任务

**任务 1.1：实现 CommandManager（4h）**
```typescript
// core/command/CommandManager.ts
export class CommandManager {
  private commands = new Map<string, CommandHandler>()

  execute(name: string, ...args: any[]): void {
    const handler = this.commands.get(name)
    if (!handler) {
      throw new Error(`Command not found: ${name}`)
    }
    handler(...args)
  }

  register(name: string, handler: CommandHandler): void {
    this.commands.set(name, handler)
  }

  unregister(name: string): void {
    this.commands.delete(name)
  }

  has(name: string): boolean {
    return this.commands.has(name)
  }
}
```

**任务 1.2：实现 StateManager（4h）**
```typescript
// editor-core/src/state/StateManager.ts
export class StateManager {
  private state: EditorState
  private listeners = new Set<StateListener>()

  constructor(initialState: EditorState) {
    this.state = initialState
  }

  getState(): EditorState {
    return this.state
  }

  setState(updater: StateUpdater): void {
    const newState = typeof updater === 'function'
      ? updater(this.state)
      : updater

    const oldState = this.state
    this.state = newState

    this.listeners.forEach(listener => {
      listener(newState, oldState)
    })
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}
```

**任务 1.3：实现 HistoryManager（4h）**
```typescript
// editor-core/src/history/HistoryManager.ts
export class HistoryManager {
  private past: EditorState[] = []
  private future: EditorState[] = []
  private maxSize: number

  constructor(maxSize = 100) {
    this.maxSize = maxSize
  }

  push(state: EditorState): void {
    this.past.push(state)
    if (this.past.length > this.maxSize) {
      this.past.shift()
    }
    this.future = []
  }

  undo(): EditorState | null {
    if (this.past.length === 0) return null

    const current = this.past.pop()!
    this.future.push(current)

    return this.past[this.past.length - 1] ?? null
  }

  redo(): EditorState | null {
    if (this.future.length === 0) return null

    const state = this.future.pop()!
    this.past.push(state)

    return state
  }

  canUndo(): boolean {
    return this.past.length > 1
  }

  canRedo(): boolean {
    return this.future.length > 0
  }

  clear(): void {
    this.past = []
    this.future = []
  }
}
```

**任务 1.4：迁移核心命令（3h）**

将现有的 `useEditorCommands.ts` 中的命令迁移到 CommandManager：

```typescript
// core/command/commands/index.ts
import { CommandManager } from '../CommandManager'

export function registerBuiltinCommands(manager: CommandManager) {
  // 文本格式化
  manager.register('bold', (doc) => doc.execCommand('bold'))
  manager.register('italic', (doc) => doc.execCommand('italic'))
  manager.register('underline', (doc) => doc.execCommand('underline'))
  manager.register('strikeThrough', (doc) => doc.execCommand('strikeThrough'))

  // 段落格式
  manager.register('formatBlock', (doc, tag) => doc.execCommand('formatBlock', false, tag))
  manager.register('justifyLeft', (doc) => doc.execCommand('justifyLeft'))
  manager.register('justifyCenter', (doc) => doc.execCommand('justifyCenter'))
  manager.register('justifyRight', (doc) => doc.execCommand('justifyRight'))

  // 插入命令
  manager.register('insertImage', (doc, src) => {
    const img = doc.createElement('img')
    img.src = src
    insertNodeAtSelection(doc, img)
  })

  // ... 其他命令
}
```

#### 测试验证
```typescript
// __tests__/core/CommandManager.test.ts
describe('CommandManager', () => {
  it('should register and execute commands', () => {
    const manager = new CommandManager()
    const mock = jest.fn()

    manager.register('test', mock)
    manager.execute('test', 'arg1', 'arg2')

    expect(mock).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should throw error for unknown command', () => {
    const manager = new CommandManager()

    expect(() => manager.execute('unknown'))
      .toThrow('Command not found: unknown')
  })
})
```

#### 风险控制
- **风险**：接口设计不完善
- **应对**：参考现有代码，预留扩展空间
- **验证**：每个模块都有单元测试

---

### 阶段 2：插件系统实现（25小时）

#### 目标
- 实现完整的插件系统
- 提供插件 API 和生命周期钩子
- 实现事件系统

#### 具体任务

**任务 2.1：实现插件管理器（8h）**

```typescript
// plugin/PluginManager.ts
export class PluginManager {
  private plugins = new Map<string, PluginInstance>()
  private api: EditorAPI

  constructor(api: EditorAPI) {
    this.api = api
  }

  async register<TConfig>(plugin: Plugin<TConfig>, config?: TConfig) {
    // 检查依赖
    await this.checkDependencies(plugin)

    // 创建实例
    const instance: PluginInstance = {
      plugin,
      config,
      state: 'registered'
    }

    // 安装
    await plugin.install(this.api, config)

    // 注册扩展
    await this.registerExtensions(plugin)

    this.plugins.set(plugin.name, instance)
  }

  async unregister(name: string) {
    // 实现注销逻辑
  }

  async activate(name: string) {
    // 实现激活逻辑
  }

  async deactivate(name: string) {
    // 实现停用逻辑
  }
}
```

**任务 2.2：实现事件系统（7h）**

```typescript
// plugin/EventBus.ts
export class EventBus {
  private listeners = new Map<string, Set<EventHandler>>()

  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)

    return () => this.off(event, handler)
  }

  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(handler => {
      handler(...args)
    })
  }

  off(event: string, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler)
  }
}
```

**任务 2.3：实现生命周期钩子（6h）**

```typescript
// plugin/HookRegistry.ts
export class HookRegistry {
  private hooks: Record<string, Hook[]> = {}

  register(name: string, hook: Hook): void {
    if (!this.hooks[name]) {
      this.hooks[name] = []
    }
    this.hooks[name].push(hook)
  }

  async execute(name: string, context: any): Promise<any> {
    const hooks = this.hooks[name] || []
    let result = context

    for (const hook of hooks) {
      result = await hook(result)
    }

    return result
  }
}
```

**任务 2.4：创建示例插件（4h）**

- 字数统计插件
- 自动保存插件
- 快捷键提示插件

#### 测试验证
- 测试插件注册/注销
- 测试事件系统
- 测试生命周期钩子

#### 风险控制
- **风险**：插件系统复杂度高
- **应对**：
  - 分步实现，逐步测试
  - 提供详细示例和文档
- **验证**：示例插件正常运行

---

### 阶段 3：配置与主题系统（20小时）

#### 目标
- 实现配置管理器
- 实现基于 Tailwind 的主题系统
- 支持运行时配置更新

#### 具体任务

**任务 3.1：实现配置管理器（8h）**

**任务 3.2：实现主题管理器（7h）**

**任务 3.3：工具栏配置系统（5h）**

#### 测试验证

#### 风险控制

---

### 阶段 4：组件重构与优化（20小时）

#### 目标
- 重构现有组件，使用新的核心架构
- 提升组件复用性
- 优化性能

#### 具体任务

**任务 4.1：重构 EditablePreview 组件（8h）**

- 使用新的 CommandManager 替代 useEditorCommands
- 使用 StateManager 统一管理状态
- 使用 HistoryManager 管理历史

**任务 4.2：重构 EditorToolbar 组件（6h）**

- 使用配置系统驱动工具栏
- 支持动态按钮显示/隐藏
- 支持自定义按钮

**任务 4.3：优化 FloatingImageLayer 组件（3h）**

**任务 4.4：性能优化（3h）**

- 减少不必要的重渲染
- 优化事件处理
- 懒加载组件

#### 测试验证
- 运行现有 209 个测试用例
- 确保全部通过
- 性能对比测试

#### 风险控制
- **风险**：重构引入 bug
- **应对**：
  - 分步重构，每步都测试
  - 保留原代码作为参考
- **验证**：所有测试通过

---

### 阶段 5：测试与文档（10小时）

#### 目标
- 完善测试覆盖
- 编写使用文档
- 提供示例

#### 具体任务

**任务 5.1：完善测试（5h）**

- 补充单元测试
- 添加集成测试
- 测试覆盖率 > 80%

**任务 5.2：编写文档（3h）**

- API 文档
- 配置说明
- 插件开发指南

**任务 5.3：提供示例（2h）**

- 基础使用示例
- 自定义配置示例
- 插件开发示例

#### 测试验证
- 运行所有测试
- 检查文档完整性
- 验证示例可运行

#### 风险控制
- **风险**：文档不完善
- **应对**：
  - 提供详细注释
  - 多个示例
- **验证**：用户能根据文档独立使用

---
    }

    // 安装
    await plugin.install(this.api, config)

    // 注册扩展
    await this.registerExtensions(plugin)

    this.plugins.set(plugin.name, instance)
  }

  async unregister(name: string) {
    // 实现注销逻辑
  }

  async activate(name: string) {
    // 实现激活逻辑
  }

  async deactivate(name: string) {
    // 实现停用逻辑
  }
}
```

**任务 3.2：实现事件系统（7h）**

```typescript
// editor-core/src/event/EventBus.ts
export class EventBus {
  private listeners = new Map<string, Set<EventHandler>>()

  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)

    return () => this.off(event, handler)
  }

  once(event: string, handler: EventHandler): () => void {
    const wrappedHandler = (...args: any[]) => {
      handler(...args)
      this.off(event, wrappedHandler)
    }
    return this.on(event, wrappedHandler)
  }

  off(event: string, handler: EventHandler): void {
    this.listeners.get(event)?.delete(handler)
  }

  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(handler => {
      handler(...args)
    })
  }

  emitBatch(events: Array<{event: string, args: any[]}>): void {
    events.forEach(({event, args}) => {
      this.emit(event, ...args)
    })
  }
}
```

**任务 3.3：实现生命周期钩子（8h）**

```typescript
// editor-core/src/hook/HookRegistry.ts
export class HookRegistry {
  private hooks: Record<string, Hook[]> = {}

  register(name: string, hook: Hook): void {
    if (!this.hooks[name]) {
      this.hooks[name] = []
    }
    this.hooks[name].push(hook)
  }

  async execute(name: string, context: any): Promise<any> {
    const hooks = this.hooks[name] || []
    let result = context

    for (const hook of hooks) {
      result = await hook(result)
    }

    return result
  }
}

// 内置钩子
export const builtinHooks = {
  beforeContentChange: new AsyncWaterfallHook(),
  afterContentChange: new AsyncSeriesHook(),
  beforeCommand: new AsyncWaterfallHook(),
  afterCommand: new AsyncSeriesHook(),
  beforePluginLoad: new AsyncWaterfallHook(),
  afterPluginLoad: new AsyncSeriesHook()
}
```

#### 示例插件

**表格插件（从现有代码迁移）：**
```typescript
// plugins/table-plugin/src/index.ts
export const TablePlugin: Plugin = {
  name: 'table',
  version: '1.0.0',
  description: 'Table editing support',

  install(api) {
    // 注册表格命令
    api.commands.register('insertTable', (doc, rows, cols) => {
      const html = createTableHTML(rows, cols)
      doc.execCommand('insertHTML', false, html)
    })

    // 添加工具栏按钮
    api.toolbar.addButton({
      id: 'insert-table',
      icon: TableIcon,
      tooltip: 'Insert Table',
      command: 'insertTable'
    })

    // 监听表格选择
    api.events.on('selection-change', (selection) => {
      const table = findTable(selection)
      if (table) {
        api.events.emit('table-activate', table)
      }
    })
  }
}
```

#### 测试验证
```typescript
// __tests__/plugin/PluginManager.test.ts
describe('PluginManager', () => {
  it('should register and activate plugin', async () => {
    const api = createMockEditorAPI()
    const manager = new PluginManager(api)

    const plugin: Plugin = {
      name: 'test',
      version: '1.0.0',
      install: jest.fn()
    }

    await manager.register(plugin)
    expect(plugin.install).toHaveBeenCalledWith(api)

    expect(manager.hasPlugin('test')).toBe(true)
  })

  it('should check dependencies', async () => {
    const api = createMockEditorAPI()
    const manager = new PluginManager(api)

    const pluginWithDep: Plugin = {
      name: 'test',
      version: '1.0.0',
      dependencies: ['missing-plugin'],
      install: jest.fn()
    }

    await expect(manager.register(pluginWithDep))
      .rejects.toThrow('requires plugin "missing-plugin"')
  })
})
```

#### 风险控制
- **风险**：插件冲突
- **应对**：
  - 实现依赖检查
  - 提供冲突检测
  - 插件隔离
- **验证**：集成测试

---

### 阶段 4：配置与主题系统（20小时）

#### 目标
- 实现配置管理器
- 实现主题管理器
- 提供预设配置和主题

#### 具体任务

**任务 4.1：实现配置管理器（8h）**

见前文配置系统设计

**任务 4.2：实现主题管理器（8h）**

见前文主题系统设计

**任务 4.3：提供预设（4h）**

```typescript
// presets/index.ts
export const presets = {
  minimal: {
    toolbar: {
      rows: [
        {
          groups: [
            { id: 'basic', items: ['bold', 'italic', 'underline'] }
          ]
        }
      ]
    }
  },

  full: {
    toolbar: {
      rows: [
        {
          groups: [
            { id: 'history', items: ['undo', 'redo'] },
            { id: 'format', items: ['bold', 'italic', 'underline', 'strike'] }
          ]
        }
      ]
    }
  }
}

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  highContrast: highContrastTheme
}
```

#### 测试验证
```typescript
// __tests__/config/ConfigManager.test.ts
describe('ConfigManager', () => {
  it('should get and set config values', () => {
    const manager = new ConfigManager()

    expect(manager.get('locale')).toBe('en')

    manager.set('locale', 'zh-CN')
    expect(manager.get('locale')).toBe('zh-CN')
  })

  it('should validate config values', () => {
    const manager = new ConfigManager()

    expect(() => manager.set('locale', 'invalid'))
      .toThrow('Invalid value')
  })
})
```

#### 风险控制
- **风险**：配置冲突
- **应对**：验证器 + 合并策略
- **验证**：单元测试

---

## 测试策略

### 测试金字塔

```
        /\
       /  \        E2E Tests (5%)
      /----\
     /      \      Integration Tests (15%)
    /--------\
   /          \    Unit Tests (80%)
  /------------\
```

### 单元测试

**目标覆盖率：**
- Core 模块：>90%
- React 组件：>80%
- 工具函数：>95%

**测试框架：**
- Jest
- React Testing Library
- @testing-library/user-event

**示例：**
```typescript
// __tests__/core/CommandManager.test.ts
describe('CommandManager', () => {
  it('should execute command', () => {
    const manager = new CommandManager()
    const mock = jest.fn()

    manager.register('test', mock)
    manager.execute('test')

    expect(mock).toHaveBeenCalled()
  })
})
```

### 集成测试

**测试场景：**
1. 完整编辑流程
2. 表格操作
3. 浮动图片操作
4. 插件交互

**示例：**
```typescript
// __tests__/integration/editor-flow.test.ts
describe('Editor Flow', () => {
  it('should complete full edit cycle', async () => {
    const { getByTestId, user } = render(<Editor />)

    // 输入文本
    const editor = getByTestId('editor-area')
    await user.click(editor)
    await user.keyboard('Hello World')

    // 应用格式
    await user.click(getByTestId('button-bold'))

    // 验证内容
    expect(editor.innerHTML).toContain('<strong>Hello World</strong>')

    // 撤销
    await user.click(getByTestId('button-undo'))

    // 验证撤销
    expect(editor.innerHTML).not.toContain('<strong>')
  })
})
```

### 端到端测试

**测试框架：** Playwright

**测试场景：**
1. 用户完整使用流程
2. 跨浏览器兼容性
3. 性能测试

**示例：**
```typescript
// e2e/editor.spec.ts
test('full user workflow', async ({ page }) => {
  await page.goto('/editor')

  // 输入内容
  await page.fill('[data-testid="editor-area"]', 'Test Content')

  // 应用格式
  await page.click('[data-testid="button-bold"]')

  // 验证
  await expect(page.locator('strong')).toContainText('Test Content')
})
```

---

## 风险管理

### 风险矩阵

| 风险 | 概率 | 影响 | 优先级 | 应对措施 |
|------|------|------|--------|----------|
| 功能遗漏 | 中 | 高 | 高 | 测试用例覆盖 |
| 性能下降 | 低 | 中 | 中 | 性能基准测试 |
| 兼容性问题 | 中 | 高 | 高 | 浏览器测试 |
| 插件冲突 | 低 | 中 | 中 | 隔离机制 |
| 时间超期 | 中 | 高 | 高 | 分阶段交付 |

### 关键风险应对

#### 风险 1：功能遗漏

**预防措施：**
- 详细的测试用例清单
- 功能对比矩阵
- 代码审查

**检测方法：**
- 运行完整测试套件
- 手动功能测试
- 用户验收测试

**应对方案：**
- 发现遗漏立即补充
- 建立功能回归测试

#### 风险 2：性能下降

**预防措施：**
- 性能基准测试
- 代码性能分析
- 优化关键路径

**检测方法：**
- Lighthouse 评分
- 渲染性能测试
- 内存泄漏检测

**应对方案：**
- 性能问题优先处理
- 使用 React.memo、useMemo 优化
- 虚拟化长列表

#### 风险 3：兼容性问题

**预防措施：**
- 浏览器兼容性测试
- Polyfill 处理
- 渐进增强

**检测方法：**
- BrowserStack 测试
- 真机测试
- 自动化兼容性测试

**应对方案：**
- 使用标准 API
- 提供 Polyfill
- 降级方案

---

## 成功标准

### 功能标准

- [ ] 所有现有功能正常工作
- [ ] 209 个测试用例全部通过
- [ ] 新增功能有测试覆盖
- [ ] 无关键 Bug

### 质量标准

- [ ] 代码覆盖率 >80%
- [ ] TypeScript 严格模式通过
- [ ] ESLint 无警告
- [ ] 性能无明显下降

### 可用性标准

- [ ] API 文档完整
- [ ] 使用示例清晰
- [ ] 迁移指南详细
- [ ] 插件开发指南完整

### 发布标准

- [ ] 可以作为独立包发布
- [ ] 可以在非 Next.js 项目使用
- [ ] 支持主流浏览器
- [ ] 有完整的 CHANGELOG

---

## 附录

### A. 代码示例

#### A.1 基础使用

```typescript
import { Editor } from '@your-org/editor'

function App() {
  const [content, setContent] = useState('')

  return (
    <Editor
      content={content}
      onContentChange={setContent}
      config={{
        toolbar: {
          position: 'top',
          rows: [/* ... */]
        }
      }}
      theme="light"
    />
  )
}
```

#### A.2 插件开发

```typescript
import { Plugin } from '@your-org/editor'

export const MyPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',

  install(api) {
    api.commands.register('myCommand', (doc) => {
      // 命令逻辑
    })

    api.toolbar.addButton({
      id: 'my-button',
      icon: MyIcon,
      tooltip: 'My Button',
      command: 'myCommand'
    })
  }
}
```

#### A.3 自定义主题

```typescript
import { Theme } from '@your-org/editor'

const customTheme: Theme = {
  name: 'custom',
  colors: {
    primary: '#custom-color',
    // ...
  },
  // ...
}

<Editor theme={customTheme} />
```

### B. 迁移检查清单

#### B.1 功能迁移

- [ ] 基础编辑功能
- [ ] 文本格式化
- [ ] 段落格式化
- [ ] 列表支持
- [ ] 图片插入
- [ ] 浮动图片
- [ ] 表格编辑
- [ ] 链接插入
- [ ] 撤销重做
- [ ] 格式刷
- [ ] 快捷键
- [ ] 工具栏

#### B.2 配置迁移

- [ ] 字体配置
- [ ] 字号配置
- [ ] 颜色配置
- [ ] 图片限制
- [ ] 表格限制
- [ ] 历史配置

#### B.3 样式迁移

- [ ] 工具栏样式
- [ ] 按钮样式
- [ ] 编辑区域样式
- [ ] 悬浮层样式
- [ ] 响应式布局

### C. 性能基准

#### C.1 初始渲染

- 目标：<100ms
- 测试：Performance API

#### C.2 交互响应

- 目标：<50ms
- 测试：Event Timing API

#### C.3 内存占用

- 目标：<50MB
- 测试：Chrome DevTools

---

## 总结

本重构方案提供了一个全面的、分阶段的 Editor 组件重构计划。通过实施此方案，您将获得：

1. **完全独立的编辑器组件**：可在任何 React 项目中使用
2. **插件化架构**：易于扩展和定制
3. **高度可配置**：满足各种使用场景
4. **主题系统**：支持多主题和自定义样式
5. **完善的测试**：保证质量和稳定性

**下一步行动：**
1. 评审本方案
2. 确定优先级和时间表
3. 组建重构团队
4. 开始阶段 1 实施

祝重构顺利！
