# AI 对话导入使用指南

## OpenCode 导入

### 问题说明

如果你有 OpenCode 但自动导入提示找不到，可能有以下原因：

1. OpenCode 使用不同的名称
2. 数据存储在非标准位置
3. 需要手动指定路径

### 解决方案

#### 方案 1：使用调试模式扫描

```bash
npm run import:scan --debug
```

这会显示所有检查的路径，帮助找到 OpenCode 的实际位置。

#### 方案 2：手动指定数据路径

如果你知道 OpenCode 对话数据的存储位置，可以手动指定：

```bash
# 从特定文件导入
npm run import:opencode /path/to/conversations.json

# 从目录导入
npm run import:opencode ~/Library/Application\ Support/SomeOtherTool/data
```

#### 方案 3：手动导出 OpenCode 对话

1. 打开 OpenCode
2. 查看"聊天历史"或"导出"功能
3. 导出为 JSON 或 Markdown 格式
4. 保存为文件
5. 使用文件导入功能：

```bash
# 导入 JSON 文件
node examples/import-cli.ts file your-conversations.json

# 导入 Markdown 文件
node examples/import-cli.ts file your-conversations.md
```

#### 方案 4：找到 OpenCode 的实际位置

手动查找 OpenCode 的数据目录：

```bash
# 搜索整个 Application Support
find ~/Library/Application\ Support -iname "*opencode*" -o -iname "*editor*" 2>/dev/null

# 或搜索包含 conversation/chat 的文件
find ~/Library/Application\ Support -type f -name "*.json" -exec grep -l "conversation\|chat" {} \; 2>/dev/null
```

### OpenCode 可能的路径

OpenCode 可能存储在：

```
~/Library/Application Support/OpenCode/
~/Library/Application Support/SomeEditorName/
~/.config/OpenCode/
~/.config/SomeEditorName/
~/OpenCode/.config/
```

### 文件导入格式

如果手动导出，使用以下格式：

#### JSON 格式

```json
[
  {
    "agent": "OpenCode",
    "model": "gpt-4",
    "user_prompt": "How do I implement auth?",
    "ai_response": "Here's the implementation...",
    "timestamp": "2026-03-10T10:30:00Z",
    "repository_url": "https://github.com/user/repo",
    "repository_name": "my-repo",
    "branch": "main",
    "task_type": "feature-implementation",
    "file_path": "src/auth/index.ts",
    "language": "typescript",
    "tags": ["authentication", "jwt"]
  }
]
```

#### Markdown 格式

```markdown
---
agent: OpenCode
model: gpt-4
repository_url: https://github.com/user/repo
repository_name: my-repo
branch: main
tags: [authentication]
task_type: feature-implementation
file_path: src/auth/index.ts
language: typescript
---

**User:** How do I implement auth?

**Assistant:** Here's the implementation...
```

### 调试命令

使用调试模式查看所有检查的路径：

```bash
# 扫描所有工具（调试模式）
npm run import:scan --debug

# 导入特定工具（调试模式）
npm run import:opencode --debug

# 导入所有工具（调试模式）
npm run import:all --debug
```

调试模式会显示：
- ✓ 检查成功的路径
- ✗ 检查失败的路径
- 实际使用的数据路径

### 社区支持

如果这些方案都不行：

1. 提供更多信息到 issue：
   - 你使用的 OpenCode 版本
   - 操作系统版本
   - OpenCode 的安装路径
   - `npm run import:scan --debug` 的输出
   
2. 贡献导入器代码：
   - Fork 项目
   - 在 `plugins/auto-importer.ts` 中添加 OpenCode 的支持
   - 提供文件格式和路径信息

---

更多帮助：[README.md](./README.md) | [TOOL_SETUP.md](./TOOL_SETUP.md)