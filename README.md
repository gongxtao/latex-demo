# AI Resume Editor - WYSIWYG HTML Editor

An AI-powered resume editor with **What You See Is What You Get** editing experience. Edit resumes directly in the preview window, just like using Microsoft Word.

## ✨ Key Features

### 1. 📁 Template Browser
- Top navigation with categorized HTML templates
- Categories: Resume, Cover Letter, Invoice, Meeting Agenda
- Scroll through multiple professional templates
- One-click template selection

### 2. 💬 AI Assistant
- Left-side chat interface for conversing with AI
- Collect personal information through natural conversation
- Provide work experience, education, skills, and more
- "Generate Resume" button for AI-powered resume creation

### 3. ✏️ WYSIWYG Editor (Main Feature)
- **Direct editing** in the preview window - no HTML code needed
- **Click anywhere to edit** text content
- **Real-time preview** with preserved formatting
- **Enable/Lock editing** mode for safe reviewing
- All styles, layouts, and formatting preserved

### 4. 🤖 AI Generation
- Powered by OpenRouter API (Claude 3.5 Sonnet)
- Generates customized resumes based on conversation
- Modifies HTML templates intelligently
- Serverless architecture - no backend required

### 5. 🔒 Template Protection (NEW)
- **Original templates are protected** - never modified
- **AI results auto-saved** to `data/temp_results/`
- Each generation creates a timestamped file
- Safe to experiment without losing original templates

### 6. 📄 High-Quality PDF Generation (NEW)
- **Powered by Puppeteer** - Uses Chromium rendering engine
- **Perfect dark backgrounds** - Supports all colors including #1a1a1a
- **Vector text** - Searchable and selectable text
- **Small file size** - ~100KB vs ~2MB
- **Fast generation** - 2-3 seconds per PDF

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **编程语言**: TypeScript
- **代码编辑器**: CodeMirror 6
- **AI 服务**: OpenRouter API (Claude 3.5 Sonnet)

## 快速开始

### 1. 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 OpenRouter API Key：

```env
OPENROUTER_API_KEY=your_api_key_here
SITE_URL=http://localhost:3000
```

**获取 API Key:**
1. 访问 [OpenRouter](https://openrouter.ai/)
2. 注册并登录
3. 在设置中获取你的 API Key

### 3. 运行开发服务器

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 🚀 How to Use

### Step 1: Select a Template
Browse and select any HTML template from the top navigation bar.

### Step 2: Chat with AI
Tell the AI about yourself in the left chat box:
- "Hi, I'm John Smith, a frontend engineer with 5 years of experience"
- "I graduated from Stanford University with a CS degree in 2018"
- "My skills include React, TypeScript, Node.js, AWS"

### Step 3: Generate Resume
Click "Generate Resume" button. AI will create a customized resume based on your conversation.
**Note**: The result is automatically saved to `data/temp_results/` - your original template remains unchanged.

### Step 4: Enable Editing
Click "✏️ Enable Editing" button to activate WYSIWYG mode.

### Step 5: Edit Directly
Click anywhere in the preview to edit text. All formatting is preserved.

### Step 6: Download PDF
Click "Download PDF" button to generate a high-quality PDF using Chromium engine.
Perfect for dark backgrounds and complex layouts!

## 📖 Detailed Guide

For comprehensive instructions, see [EDITING_GUIDE.md](./EDITING_GUIDE.md)

## 📁 Project Structure

```
latex-demo/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── chat/            # AI chat endpoint
│   │   ├── files/           # File list endpoint
│   │   ├── file-content/    # File read/write endpoint
│   │   └── generate-resume/ # Resume generation endpoint
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/              # React Components
│   ├── FileSelector.tsx     # Template browser
│   ├── ChatBox.tsx          # AI chat interface
│   └── EditablePreview.tsx  # WYSIWYG editor
├── data/
│   ├── html/                # Original HTML Templates (Protected)
│   │   ├── resume-template/ # Resume templates
│   │   ├── cover-letter-template/ # Cover letters
│   │   ├── invoice/         # Invoice templates
│   │   └── meeting-agenda-template/ # Meeting agendas
│   └── temp_results/        # AI-generated results (Auto-saved)
├── .env.local.example       # Environment variables
├── EDITING_GUIDE.md         # Comprehensive editing guide
├── CHANGELOG.md             # Version history
└── README.md                # This file
```

## API 接口说明

### GET `/api/files`
获取所有 LaTeX 文件列表

### GET `/api/file-content?filename={name}`
读取指定 LaTeX 文件内容

### POST `/api/file-content`
保存 LaTeX 文件内容

### POST `/api/chat`
与 AI 助手对话

### POST `/api/generate-resume`
根据对话内容生成简历

### POST `/api/temp-result`
保存AI生成的结果到临时文件（不覆盖原模板）

### GET `/api/temp-result`
获取所有临时结果文件列表

### DELETE `/api/temp-result?filename={name}`
删除指定的临时结果文件

### POST `/api/generate-pdf`
使用 Puppeteer 生成高质量PDF（支持深色背景和复杂CSS）

### POST `/api/render-latex`
渲染 LaTeX 为 HTML 预览

## ⚠️ Important Notes

1. **Template Protection**: Original templates in `data/html/` are now protected. AI-generated results are automatically saved to `data/temp_results/` with timestamps. See [模板保护说明.md](./模板保护说明.md) for details.

2. **Direct Editing**: Click "Enable Editing" to edit directly in the preview. Changes are tracked in real-time.

3. **API Costs**: OpenRouter API usage incurs costs. Monitor your usage and credits.

4. **Temporary Files**: AI generations create timestamped files in `data/temp_results/`. You may want to periodically clean up old files.

5. **Model**: Currently uses Claude 3.5 Sonnet. You can change models in the API code.

6. **Browser Compatibility**: Works best in modern browsers (Chrome, Firefox, Safari, Edge).

## 部署

### Vercel 部署

1. Fork 此项目到你的 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 在环境变量中配置 `OPENROUTER_API_KEY`
4. 点击部署

### 其他平台

项目支持任何支持 Next.js 的 serverless 平台：
- Netlify
- AWS Amplify
- Railway
- Render

## 开发计划

- [ ] 添加更多 LaTeX 模板
- [ ] 改进 LaTeX 渲染（集成专业渲染引擎）
- [ ] 支持 PDF 导出
- [ ] 添加模板预览功能
- [ ] 支持自定义模板上传
- [ ] 添加简历版本历史
- [ ] 多语言支持

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请提交 Issue。

