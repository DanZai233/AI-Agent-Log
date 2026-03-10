# 快速开始指南

## 1. 启动服务

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## 2. 在界面中手动添加日志

1. 点击右上角的 "Add Log" 按钮
2. 填写必要信息：
   - Agent（如 Cursor、ClaudeCode 等）
   - User Prompt（你问的问题）
   - AI Response（AI 的回答）
3. 可选填写：
   - Repository URL 和 Name（仓库信息）
   - Branch（分支）
   - Task Type（任务类型：功能实现、重构、测试等）
   - File Path（文件路径）
   - Language（编程语言）
   - Tags（标签，逗号分隔）
4. 点击 "Save Log"

## 3. 使用搜索和筛选

### 搜索
- 在搜索框中输入关键词
- 点击 "Search" 按钮或按回车键
- 结果会显示所有匹配的对话记录

### 筛选
- 点击筛选器图标（漏斗图标）展开筛选面板
- 选择要筛选的：
  - Agent（Cursor、ClaudeCode 等）
  - Repository（仓库名称）
  - Task Type（任务类型）
- 点击 "Search" 应用筛选

## 4. 查看统计

统计功能正在开发中，将展示：
- 总对话次数
- 按代理统计
- 按仓库统计
- 按任务类型统计
- 最近活动趋势

## 5. 使用插件导入历史对话

### 查看可用插件

```bash
node examples/import-cli.ts list
```

### 导入单个文件

```bash
# 导入 JSON 格式的对话
node examples/import-cli.ts file examples/sample-conversations.json

# 导入 Markdown 格式的对话
node examples/import-cli.ts file examples/sample-conversations.md

# 导入 Cursor 历史文件
node examples/import-cli.ts file ~/cursor/history/session.json
```

### 批量导入目录

```bash
# 导入目录下所有支持的文件
node examples/import-cli.ts dir ~/Downloads/conversations
```

### 从粘贴的文本导入

```bash
node examples/import-cli.ts text
```

然后粘贴你的对话内容，按 Ctrl+D (Linux/Mac) 或 Ctrl+Z (Windows) 结束。

### 示例文件

项目提供了示例文件供测试：

- `examples/sample-conversations.json` - JSON 格式示例
- `examples/sample-conversations.md` - Markdown 格式示例

## 6. 生成日报

1. 添加了一些对话记录后
2. 点击右侧的 "Generate Summary" 按钮
3. AI 会分析当天所有的对话并生成总结
4. 需要在 `.env.local` 中配置 `GEMINI_API_KEY`

## 6. 使用 SDK 自动收集

### 基本使用

在你的项目中使用 SDK 自动记录对话：

```typescript
import { getAgentLog } from './sdk';

const logger = getAgentLog({
  apiUrl: 'http://localhost:3000/api/logs',
});

await logger.logConversation(
  'Cursor',
  'How do I implement a REST API?',
  'Here is the implementation...',
  {
    repository_url: 'https://github.com/user/project',
    repository_name: 'my-project',
    branch: 'main',
    task_type: 'feature-implementation',
    file_path: 'src/api/index.ts',
    language: 'typescript',
    tags: ['api', 'express', 'rest']
  }
);
```

### 使用命令行工具

#### 记录新对话

```bash
# 交互式输入
node examples/cli-log.ts --agent Cursor

# 直接提供内容
node examples/cli-log.ts --agent Cursor \
  --prompt "How to implement auth?" \
  --response "Here is the code..." \
  --type feature-implementation \
  --model gpt-4
```

#### 导入历史对话

```bash
# 查看可用插件
node examples/import-cli.ts list

# 导入文件
node examples/import-cli.ts file conversations.json

# 批量导入目录
node examples/import-cli.ts dir ~/Downloads/conversations
```

### Git 上下文自动获取

```typescript
import { AgentLog } from './sdk';

const repoContext = AgentLog.fromGitRepo(
  'https://github.com/user/project',
  'my-project'
);

await logger.logConversation(
  'ClaudeCode',
  'Refactor this component',
  'Here is the refactored code...',
  {
    ...repoContext,
    branch: 'feature/auth',
    file_path: 'src/components/Auth.tsx',
    language: 'typescript',
    task_type: 'refactoring'
  }
);
```

## 7. API 接口

### 记录日志

```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "Cursor",
    "user_prompt": "How do I implement REST API?",
    "ai_response": "Here is the implementation...",
    "repository_url": "https://github.com/user/project",
    "repository_name": "my-project",
    "branch": "main",
    "task_type": "feature-implementation",
    "file_path": "src/api/index.ts",
    "language": "typescript",
    "tags": ["api", "express"]
  }'
```

### 获取日志

```bash
# 获取所有日志
curl http://localhost:3000/api/logs

# 按日期筛选
curl "http://localhost:3000/api/logs?date=2026-03-10"

# 按代理筛选
curl "http://localhost:3000/api/logs?agent=Cursor"

# 按仓库筛选
curl "http://localhost:3000/api/logs?repository=my-project"

# 组合筛选
curl "http://localhost:3000/api/logs?date=2026-03-10&agent=Cursor&task_type=refactoring"
```

### 搜索日志

```bash
# 基本搜索
curl "http://localhost:3000/api/search?q=react"

# 带筛选的搜索
curl "http://localhost:3000/api/search?q=docker&repository=api-server&task_type=setup"

# 日期范围搜索
curl "http://localhost:3000/api/search?q=test&start_date=2026-03-01&end_date=2026-03-10"
```

### 获取统计

```bash
curl http://localhost:3000/api/stats
```

## 8. 数据库

数据库文件是 `logs.db`（SQLite），可以直接用 SQLite 工具查看：

```bash
sqlite3 logs.db

# 查看所有日志
SELECT * FROM logs ORDER BY timestamp DESC;

# 按代理统计
SELECT agent, COUNT(*) as count FROM logs GROUP BY agent;

# 搜索
SELECT * FROM logs WHERE user_prompt LIKE '%react%' OR ai_response LIKE '%react%';
```

## 9. 支持的任务类型

- `feature-implementation`: 功能实现
- `bug-fix`: Bug 修复
- `refactoring`: 重构
- `code-review`: 代码审查
- `documentation`: 文档
- `debugging`: 调试
- `setup`: 配置搭建
- `explanation`: 解释说明

## 10. 常见问题

**Q: 如何删除日志？**

A: 目前 UI 没有删除功能，可以通过数据库直接删除：

```bash
sqlite3 logs.db "DELETE FROM logs WHERE id = 123;"
```

**Q: 如何备份数据？**

A: 直接复制 `logs.db` 文件即可：

```bash
cp logs.db logs.db.backup
```

**Q: 如何重置数据？**

A: 删除 `logs.db` 文件，重启服务会自动创建新的数据库：

```bash
rm logs.db
npm run dev
```

**Q: 日志存储在哪里？**

A: 日志存储在项目根目录的 `logs.db` SQLite 数据库文件中。

**Q: 支持哪些 AI Agent？**

A: 支持任何 AI Agent（Cursor、ClaudeCode、OpenCode、ChatGPT 等），agent 名称可以是任意字符串。

**Q: 可以同时记录多个会话吗？**

A: 可以，使用 `session_id` 字段将相关对话组织成会话。

## 11. 集成示例

查看以下示例了解更多集成方式：

- **Cursor 集成**: `examples/cursor-integration.ts`
- **通用包装器**: `examples/generic-wrapper.ts`
- **CLI 工具**: `examples/cli-log.ts`
- **SDK 文档**: `sdk/README.md`

## 12. 下一步

- 在你的项目中集成 SDK
- 自动记录 AI 对话
- 定期查看统计和趋势
- 使用搜索功能快速找到相关对话