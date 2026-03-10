# Cursor 对话导入说明

## 重要发现

经过测试发现，Cursor AI 编辑器的对话历史存储方式和预期不同：

### Cursor 的实际数据存储

Cursor 在你的系统中找到了以下数据：

1. **History 目录** (`~/Library/Application Support/Cursor/User/History/`)
   - 包含 264+ 个会话目录（如 `-1086b650`, `-109c4`）
   - 每个会话目录包含 `entries.json` 文件
   - 这些 `entries.json` 是**编辑历史**，不是 AI 对话

2. **GlobalStorage 目录** (`~/Library/Application Support/Cursor/User/GlobalStorage/`)
   - 包含设置和工作空间信息
   - 没有找到对话历史

### 为什么导入结果为 0？

Cursor 可能：
1. **不保存 AI 对话到本地**
   - Cursor 使用云端 API 存储对话
   - 对话历史存储在 Cursor 云服务器上
   - 本地只有编辑历史和缓存

2. **使用不同的存储格式**
   - 对话可能存储在加密格式中
   - 或使用 LevelDB/其他我们尚未解析的数据库

3. **需要手动导出**
   - 需要在 Cursor 中手动导出对话
   - 然后使用文件导入功能

## 手动导出 Cursor 对话

### 方法 1：使用 Cursor 的导出功能（如果可用）

1. 打开 Cursor
2. 进入聊天界面
3. 查找导出选项（可能在菜单或设置中）
4. 导出为 JSON 或 Markdown 格式
5. 使用 Agent Log 导入：

```bash
node examples/import-cli.ts file your-exported-conversations.json
```

### 方法 2：复制对话内容

如果 Cursor 没有导出功能：

1. 打开 Cursor 的聊天历史
2. 逐个对话复制内容
3. 保存为 JSON 或 Markdown 格式
4. 手动组织成可导入的格式

#### JSON 格式示例

```json
[
  {
    "agent": "Cursor",
    "model": "gpt-4",
    "user_prompt": "How do I implement authentication in React?",
    "ai_response": "Here's a complete implementation of authentication using React Context and JWT tokens...",
    "timestamp": "2026-03-10T10:30:00Z",
    "repository_url": "https://github.com/user/repo",
    "repository_name": "my-repo",
    "branch": "main",
    "task_type": "feature-implementation",
    "file_path": "src/auth/AuthContext.tsx",
    "language": "typescript",
    "tags": ["authentication", "react", "jwt"]
  }
]
```

#### Markdown 格式示例

```markdown
---
agent: Cursor
model: gpt-4
repository_url: https://github.com/user/repo
repository_name: my-repo
branch: main
tags: [authentication, react]
task_type: feature-implementation
file_path: src/auth/AuthContext.tsx
language: typescript
---

**User:** How do I implement authentication in React?

**Assistant:** Here's a complete implementation of authentication using React Context and JWT tokens...

[Rest of the response]
```

### 方法 3：使用浏览器开发者工具（高级）

如果 Cursor 使用浏览器 API 或有 Web 版本：

1. 打开 Cursor
2. 打开开发者工具 (F12)
3. 进入 Network 或 Application 标签
4. 查找 API 请求或 LocalStorage
5. 提取对话数据（如果可见）
6. 保存并导入

## 自动收集替代方案

如果无法从 Cursor 导出历史对话，可以考虑：

### 1. 使用 Agent Log SDK 记录新对话

在未来使用 Cursor 时，自动记录每次对话：

```typescript
// 在 Cursor 中使用或创建一个插件
import { getAgentLog } from '/path/to/Agent-Log/sdk';

const logger = getAgentLog({
  apiUrl: 'http://localhost:3000/api/logs',
});

// 每次与 Cursor 交互后调用
await logger.logConversation(
  'Cursor',
  userPrompt,
  aiResponse,
  {
    model: 'gpt-4',
    repository_url: getCurrentRepoUrl(),
    repository_name: getCurrentRepoName(),
    task_type: inferTaskType(userPrompt),
    file_path: getCurrentFile(),
    language: getLanguage(),
  }
);
```

### 2. 使用浏览器扩展

创建一个浏览器扩展来：
1. 监听 Cursor Web 界面
2. 捕获对话内容
3. 自动发送到 Agent Log

### 3. 使用剪贴板监控

创建一个工具监控剪贴板，当你复制 Cursor 的对话时自动保存。

## 其他工具的导入

### ClaudeCode / Claude Desktop

Claude Desktop 通常有更好的本地存储支持：

```bash
npm run import:claude
```

### OpenCode

```bash
npm run import:opencode
```

### VS Code with Copilot

```bash
npm run import:copilot
```

## 总结

- ❌ **Cursor**: 本地数据不包含 AI 对话历史（只有编辑历史）
- ⚠️  需要手动导出或使用 SDK 记录新对话
- ✅ **ClaudeCode / OpenCode**: 可能可以自动导入
- ✅ **其他格式**: 支持文件导入（JSON, Markdown）

## 建议

1. **短期**: 使用手动导入功能，从 Cursor 复制对话到文件
2. **中期**: 使用 Agent Log SDK 自动记录新的对话
3. **长期**: 等待 Cursor 添加对话导出功能或开放本地存储 API

## 获取帮助

如果你找到了 Cursor 对话的本地存储位置或格式，欢迎：

1. 提 issue 到项目：https://github.com/DanZai233/AI-Agent-Log/issues
2. 提供文件路径和格式说明
3. 我们会更新导入器支持

---

查看完整文档：[README.md](./README.md)