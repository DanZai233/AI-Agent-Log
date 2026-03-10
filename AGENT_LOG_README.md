# Agent Log - AI 对话自动收集与检索系统

自动收集和检索各种 AI Agent 的对话记录，支持丰富的元数据和强大的搜索功能。

## 功能特性

- ✅ **自动收集**: 通过 SDK 自动记录各种 AI Agent 的交互
- ✅ **丰富元数据**: 支持仓库信息、模型、分支、文件路径、任务类型、标签等
- ✅ **全文搜索**: 快速搜索历史对话内容
- ✅ **多维度筛选**: 按时间、Agent、模型、仓库、任务类型等筛选
- ✅ **会话管理**: 将相关对话组织成会话
- ✅ **统计分析**: 查看使用趋势和分布统计
- ✅ **插件系统**: 支持从多种格式导入历史对话
- ✅ **SQLite 存储**: 轻量级、无需额外数据库
- ✅ **Web UI**: 现代化的界面查看和管理日志

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
# 编辑 .env.local 添加你的 GEMINI_API_KEY（可选，用于生成日报）
```

### 3. 启动服务

```bash
npm run dev
```

访问 http://localhost:3000 查看界面

## 使用 SDK 自动收集

### 安装 SDK

将 `sdk/` 目录复制到你的项目，或直接使用：

```typescript
import { getAgentLog } from './sdk';
```

### 基本使用

```typescript
const logger = getAgentLog({
  apiUrl: 'http://localhost:3000/api/logs',
});

await logger.logConversation(
  'Cursor',
  'How do I implement REST API?',
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

### 会话管理

```typescript
logger.startSession('session-123');
await logger.logConversation('Cursor', 'Help with feature A', '...');
await logger.logConversation('Cursor', 'Help with feature B', '...');
logger.endSession();
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

### 搜索历史记录

```typescript
const results = await logger.search('docker setup', {
  repository: 'api-server',
  task_type: 'setup'
});

console.log(results);
```

## 插件系统

### 查看可用插件

```bash
node examples/import-cli.ts list
```

### 从文件导入

```bash
# 导入 JSON 文件
node examples/import-cli.ts file cursor-history.json

# 导入 Markdown 文件
node examples/import-cli.ts file conversations.md
```

### 从目录批量导入

```bash
# 导入目录下所有支持的文件
node examples/import-cli.ts dir ~/Downloads/conversations
```

### 从文本导入

```bash
# 从粘贴的文本导入
node examples/import-cli.ts text
# 然后粘贴你的对话内容，按 Ctrl+D 结束
```

### 支持的格式

#### JSON 格式

```json
[
  {
    "agent": "Cursor",
    "model": "gpt-4",
    "user_prompt": "How do I implement authentication?",
    "ai_response": "Here's the implementation...",
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

#### Cursor 历史格式

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Help me with this code..."
    },
    {
      "role": "assistant",
      "content": "Here's the solution..."
    }
  ],
  "model": "gpt-4",
  "repository": {
    "url": "https://github.com/user/repo",
    "name": "my-repo"
  }
}
```

#### Markdown 格式

```markdown
---
agent: Cursor
model: gpt-4
repository_url: https://github.com/user/repo
tags: [refactoring, react]
task_type: refactoring
---

**User:** How do I refactor this component?

**Assistant:** I'll help you refactor the component. Here's the improved version...
```

### 自定义插件

```typescript
import { LogPlugin, ImportedConversation } from './plugins/plugin-system';

export const CustomPlugin: LogPlugin = {
  name: 'custom-importer',
  description: 'My custom importer',
  version: '1.0.0',
  
  canImportFile(filename: string): boolean {
    return filename.endsWith('.myformat');
  },
  
  canImportText(text: string): boolean {
    return text.startsWith('MYFORMAT');
  },
  
  async importFromFile(filePath: string): Promise<ImportedConversation[]> {
    // 实现你的导入逻辑
    return [];
  },
  
  async importFromText(text: string): Promise<ImportedConversation[]> {
    // 实现你的导入逻辑
    return [];
  },
};

// 注册插件
import pluginManager from './plugins/plugin-system';
pluginManager.registerImportPlugin(CustomPlugin);
```

## 命令行工具

使用 CLI 快速记录对话：

```bash
# 交互式输入
node examples/cli-log.js --agent Cursor

# 直接提供内容
node examples/cli-log.js --agent Cursor \
  --prompt "How to implement auth?" \
  --response "Here is the code..." \
  --type feature-implementation \
  --file src/auth/index.ts

# 带会话 ID
node examples/cli-log.js --agent Claude \
  --session sess-123 \
  --type refactoring
```

## 集成示例

### 与 Cursor 集成

参见 `examples/cursor-integration.ts`

```typescript
import cursor from '@cursor/sdk';
import { getAgentLog } from './sdk';

const logger = getAgentLog();

cursor.on('response', async (prompt, response) => {
  await logger.logConversation(
    'Cursor',
    prompt,
    response,
    AgentLog.fromGitRepo(process.cwd())
  );
});
```

### 与 OpenCode/ClaudeCode 集成

```typescript
import { getAgentLog } from './sdk';

const logger = getAgentLog();

async function wrapInteraction(
  agent: string,
  prompt: string,
  execute: () => Promise<string>
) {
  const response = await execute();
  
  await logger.logConversation(
    agent,
    prompt,
    response,
    {
      ...getGitContext(),
      task_type: inferTaskType(prompt),
      file_path: extractFilePath(prompt),
      language: detectLanguage(prompt)
    }
  );
  
  return response;
}
```

### 通用包装器

参见 `examples/generic-wrapper.ts`

```typescript
import { withLogging, AgentSession } from './sdk/examples/generic-wrapper';

// 单次交互
const result = await withLogging(
  'ChatGPT',
  'Explain React hooks',
  () => ai.chat('Explain React hooks'),
  { task_type: 'explanation', tags: ['react', 'hooks'] }
);

// 会话模式
const session = new AgentSession('feature-development');
await session.interact('Claude', 'Create API', () => ai.chat(...));
await session.interact('Claude', 'Add tests', () => ai.chat(...));
session.end();
```

## API 接口

### POST /api/logs

记录新的对话日志

```json
{
  "agent": "Cursor",
  "user_prompt": "Your question",
  "ai_response": "AI's response",
  "repository_url": "https://github.com/user/repo",
  "repository_name": "repo-name",
  "branch": "main",
  "tags": ["tag1", "tag2"],
  "session_id": "session-123",
  "task_type": "feature-implementation",
  "file_path": "src/file.ts",
  "language": "typescript"
}
```

### GET /api/logs

获取日志列表

参数:
- `date`: YYYY-MM-DD 格式的日期
- `agent`: 按代理筛选
- `repository`: 按仓库筛选
- `session`: 按会话筛选
- `task_type`: 按任务类型筛选

### GET /api/search

搜索日志

参数:
- `q`: 搜索关键词
- `agent`: 按代理筛选
- `repository`: 按仓库筛选
- `task_type`: 按任务类型筛选
- `start_date`: 开始日期
- `end_date`: 结束日期

### GET /api/stats

获取统计信息

返回:
- `totalLogs`: 总日志数
- `byAgent`: 按代理统计
- `byRepository`: 按仓库统计
- `byTaskType`: 按任务类型统计
- `recentActivity`: 最近7天活动

## 数据库 Schema

```sql
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  repository_url TEXT,
  repository_name TEXT,
  branch TEXT,
  tags TEXT,
  session_id TEXT,
  task_type TEXT,
  file_path TEXT,
  language TEXT
);
```

索引:
- `idx_agent`: 按代理索引
- `idx_timestamp`: 按时间索引
- `idx_repository`: 按仓库索引
- `idx_session`: 按会话索引
- `idx_tags`: 按标签索引

## 支持的任务类型

- `feature-implementation`: 功能实现
- `bug-fix`: Bug 修复
- `refactoring`: 重构
- `code-review`: 代码审查
- `documentation`: 文档
- `debugging`: 调试
- `setup`: 配置搭建
- `explanation`: 解释说明

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS + Vite
- **后端**: Express + Node.js
- **数据库**: SQLite (better-sqlite3)
- **AI 集成**: Google Gemini (可选，用于生成日报)

## 开发

```bash
# 开发模式
npm run dev

# 类型检查
npm run lint

# 构建
npm run build

# 生产环境
npm run start
```

## 许可证

MIT