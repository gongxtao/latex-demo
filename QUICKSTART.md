# 快速启动指南

## 🚀 五步开始使用

### 1️⃣ 安装依赖

```bash
npm install
```

或使用 yarn/pnpm:
```bash
yarn install
# 或
pnpm install
```

### 2️⃣ 配置 API Key

复制环境变量示例文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件，添加你的 OpenRouter API Key：
```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
SITE_URL=http://localhost:3000
```

**如何获取 OpenRouter API Key:**
1. 访问 https://openrouter.ai/
2. 注册并登录账号
3. 前往 "Keys" 页面
4. 创建新的 API Key
5. 复制 Key 并粘贴到 `.env` 文件中

### 3️⃣ 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

### 4️⃣ 开始使用

1. **选择模板**: 在顶部滑动栏中选择一个 LaTeX 简历模板
2. **与 AI 对话**: 在左侧聊天框输入你的简历信息
3. **生成简历**: 点击 "Generate Resume" 按钮
4. **编辑和保存**: 在右侧编辑器中查看、编辑并保存简历

### 5️⃣ 渲染预览

点击右上角的"渲染预览"按钮，查看简历的 HTML 预览效果。

---

## 💡 使用示例

### 示例对话

**用户**: 你好，我想创建一份简历。

**助手**: 你好！我是你的简历助手。请告诉我你的基本信息...

**用户**: 我叫李明，是一名全栈开发工程师，有 3 年工作经验。我毕业于北京大学软件工程专业，2020 年本科毕业。

**助手**: 很好！请告诉我你的主要工作经历和项目经验...

**用户**: 我在 ABC 科技公司工作，主要负责开发电商平台的前后端系统。使用的技术栈包括 React、Node.js、MongoDB、Docker 等。

**助手**: 太棒了！你还有哪些其他技能或项目想要展示的吗？

---

## 🔧 常见问题

### Q: 没有看到任何 LaTeX 文件？
A: 确保 `data` 目录中有 `.tex` 文件。

### Q: 聊天无响应？
A: 检查 `.env` 文件中的 `OPENROUTER_API_KEY` 是否正确配置。

### Q: 生成简历失败？
A: 
1. 检查网络连接
2. 确认 API Key 有效且有足够的额度
3. 查看浏览器控制台的错误信息

### Q: 预览效果不理想？
A: 当前的预览是简化版本，实际效果需要使用专业的 LaTeX 编译器（如 Overleaf）。

---

## 📦 生产部署

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 添加环境变量 `OPENROUTER_API_KEY`
4. 部署

### 其他平台

支持任何 Node.js serverless 平台：
- Netlify
- Railway
- Render
- AWS Amplify

---

## 🎯 下一步

- 尝试不同的 LaTeX 模板
- 自定义聊天提示词
- 导出 PDF（需要集成 LaTeX 编译服务）
- 添加更多个性化功能

---

祝你使用愉快！如有问题，请查看 [README.md](./README.md) 或提交 Issue。

