# 模板保护功能说明

## 📋 功能概述

为了保护原始模板文件不被AI优化过程意外覆盖，系统现在会自动将所有AI生成的结果保存到临时文件中。

## 🔒 保护机制

### 1. 自动保存到临时文件
- AI优化后的简历会自动保存到 `data/temp_results/` 目录
- 文件命名格式：`原文件名_时间戳.html`
- 例如：`Modern chronological resume_2025-11-05T10-30-25.html`

### 2. 原模板文件保护
- 位于以下目录的模板文件受到保护：
  - `resume-template/` - 简历模板
  - `cover-letter-template/` - 求职信模板
  - `invoice/` - 发票模板
  - `meeting-agenda-template/` - 会议议程模板

- 这些文件不能被直接覆盖，除非明确设置 `allowOverwriteTemplate: true`

### 3. API保护
`/api/file-content` (POST) 现在会检查：
- 如果尝试保存到模板文件，会返回 403 错误
- 错误信息会提示使用临时结果功能
- 只有明确授权才能覆盖模板

## 📁 目录结构

```
data/
├── html/                    # 原始模板（受保护）
│   ├── resume-template/
│   ├── cover-letter-template/
│   ├── invoice/
│   └── meeting-agenda-template/
└── temp_results/            # AI优化结果（临时文件）
    ├── Modern chronological resume_2025-11-05T10-30-25.html
    ├── ATS finance resume_2025-11-05T11-15-40.html
    └── ...
```

## 🎯 使用流程

### 生成简历
1. 选择一个模板文件
2. 在聊天框中输入个人信息
3. 点击"Generate Resume"
4. AI生成的结果会：
   - ✅ 在预览区域实时显示
   - ✅ 自动保存到 `data/temp_results/`
   - ✅ 原模板保持不变

### 成功提示
生成成功后会显示：
```
✅ 简历生成成功！

已保存到临时文件：Modern chronological resume_2025-11-05T10-30-25.html

原模板未被修改。您可以继续编辑预览区域的内容。
```

## 🛠️ API接口

### 保存临时结果
**POST** `/api/temp-result`

请求体：
```json
{
  "originalFilename": "resume-template/Modern chronological resume.html",
  "content": "<html>...</html>"
}
```

响应：
```json
{
  "success": true,
  "tempFilename": "Modern chronological resume_2025-11-05T10-30-25.html",
  "message": "已保存到临时文件: Modern chronological resume_2025-11-05T10-30-25.html"
}
```

### 获取临时文件列表
**GET** `/api/temp-result`

响应：
```json
{
  "files": [
    {
      "name": "Modern chronological resume_2025-11-05T10-30-25.html",
      "size": 15234,
      "modified": "2025-11-05T10:30:25.000Z"
    }
  ]
}
```

### 删除临时文件
**DELETE** `/api/temp-result?filename=xxx.html`

## ⚠️ 注意事项

1. **临时文件管理**
   - 临时文件会一直保存，直到手动删除
   - 建议定期清理不需要的临时文件
   - 每次AI生成都会创建新的临时文件

2. **预览区编辑**
   - 在预览区域的手动编辑不会自动保存
   - 如需保存手动编辑的内容，需要另外实现保存功能
   - 或者下载为PDF保存最终版本

3. **模板安全**
   - 原模板文件现在受到保护，不会被意外覆盖
   - 如果确实需要更新模板，需要手动操作文件系统
   - 或者在代码中明确设置 `allowOverwriteTemplate: true`

## 🔄 回退到旧版本

如果需要移除保护机制，可以：

1. 删除 `/api/temp-result` 路由
2. 在 `/api/file-content` 的POST方法中移除模板检查
3. 在 `app/page.tsx` 中移除自动保存到临时文件的代码

## 📝 更新日志

**2025-11-05**
- ✅ 添加临时结果保存功能
- ✅ 添加模板文件保护机制
- ✅ 自动保存AI生成的结果
- ✅ 防止意外覆盖原模板

## 💡 未来改进

可能的增强功能：
- [ ] 添加临时文件管理界面
- [ ] 支持从临时文件加载内容
- [ ] 临时文件自动过期清理
- [ ] 比较临时结果和原模板的差异
- [ ] 将满意的临时结果应用到新模板

