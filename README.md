<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Agent Log - 对话自动收集与检索系统

自动收集和检索各种 AI Agent 的对话记录，支持丰富的元数据和强大的搜索功能。

## 📋 功能特性

- ✅ **自动收集**: 通过 SDK 自动记录各种 AI Agent 的交互
- ✅ **丰富元数据**: 支持仓库信息、模型、分支、文件路径、任务类型、标签等
- ✅ **全文搜索**: 快速搜索历史对话内容
- ✅ **多维度筛选**: 按时间、Agent、模型、仓库、任务类型等筛选
- ✅ **会话管理**: 将相关对话组织成会话
- ✅ **统计分析**: 查看使用趋势和分布统计
- ✅ **插件系统**: 支持从 JSON、Markdown、Cursor 等多种格式导入历史对话
- ✅ **SQLite 存储**: 轻量级、无需额外数据库
- ✅ **Web UI**: 现代化的界面查看和管理日志

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/DanZai233/AI-Agent-Log.git
cd AI-Agent-Log
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量（可选）

```bash
cp .env.example .env.local
```

编辑 `.env.local` 添加你的 `GEMINI_API_KEY`（可选，仅用于生成日报功能）

### 4. 启动服务

```bash
npm run dev
```

访问 http://localhost:3000 查看界面

## 📖 使用教程

### 方式零：一键自动导入（推荐）⭐

这是最简单的方式！自动检测并导入你电脑上所有 AI 工具的对话记录。

#### 扫描已安装的工具

```bash
npm run import scan
```

输出示例：
```
🔍 Scanning for installed AI coding tools...

✅ Found 2 tool(s):

  ✓ Cursor
    📁 /Users/xxx/Library/Application Support/Cursor/User/GlobalStorage/state.vscdb

  ✓ ClaudeCode / Claude Desktop
    📁 /Users/xxx/Library/Application Support/Claude/Local Storage/leveldb

To import conversations, run:

  # Import from all tools
  npm run import all

  # Import from specific tool
  npm run import import cursor
```

#### 从所有工具导入

```bash
# 一键导入所有工具的对话
npm run import all
```

这会自动：
- ✅ 扫描你电脑上已安装的 AI 工具
- ✅ 读取每个工具的对话历史
- ✅ 自动转换为统一格式
- ✅ 批量导入到 Agent Log

输出示例：
```
🔄 Importing from all installed tools...

Found 2 tool(s) to import from:

──────────────────────────────────────────────────
Importing from Cursor...
──────────────────────────────────────────────────
🔍 Scanning Cursor...
📁 Found data at: /Users/xxx/.../state.vscdb
✅ Found 150 conversations
📤 Sending 150 conversations to server...
✅ Imported 150/150 conversations

══════════════════════════════════════════
📊 Import Summary

   Tool: Cursor
   Status: ✅ Success
   Imported: 150 conversations

[...ClaudeCode 导入结果...]

══════════════════════════════════════════
📊 Overall Import Summary

✅ Cursor                         150 conversations
✅ ClaudeCode / Claude Desktop        80 conversations
──────────────────────────────────────────────────
Total imported: 230 conversations
Total errors: 0
══════════════════════════════════════════

✨ All done! View your conversations at:
   http://localhost:3000
```

#### 从特定工具导入

```bash
# 只导入 Cursor 的对话
npm run import import cursor

# 只导入 ClaudeCode 的对话
npm run import import claude-code

# 只导入 OpenCode 的对话
npm run import import opencode

# 只导入 VS Code Copilot 的对话
npm run import import vscode-copilot
```

#### 支持的工具和位置

| 工具 | 配置文件位置 (macOS) | 配置文件位置 (Linux) | 配置文件位置 (Windows) |
|--------|------------------------|----------------------|--------------------------|
| **Cursor** | `~/Library/Application Support/Cursor/User/GlobalStorage/` | `~/.config/Cursor/User/GlobalStorage/` | `%APPDATA%/Cursor/User/GlobalStorage/` |
| **ClaudeCode** | `~/Library/Application Support/Claude/` | `~/.config/Claude/` | `%APPDATA%/Claude/` |
| **OpenCode** | `~/Library/Application Support/OpenCode/User/` | `~/.config/OpenCode/User/` | `%APPDATA%/OpenCode/User/` |
| **VS Code Copilot** | `~/Library/Application Support/Code/User/` | `~/.config/Code/User/` | `%APPDATA%/Code/User/` |

**注意**：
- 只导入最近 500 条对话（避免导入过多）
- 导入前请确保 Agent Log 服务正在运行：`npm run dev`
- 首次导入可能需要几分钟

---

### 方式一：Web 界面手动添加

#### 步骤 1：添加日志

1. 点击右上角的 **"Add Log"** 按钮
2. 填写基本信息：
   - **Agent**: 选择 AI 工具（Cursor、ClaudeCode、OpenCode、ChatGPT 等）
   - **Model**: 填写使用的模型（如 gpt-4、claude-3.5-sonnet）
   - **User Prompt**: 你问的问题
   - **AI Response**: AI 的回答

#### 步骤 2：添加元数据（可选）

- **Repository URL & Name**: 仓库地址和名称
- **Branch**: 分支名（如 main、feature/auth）
- **Task Type**: 任务类型
  - feature-implementation - 功能实现
  - bug-fix - Bug 修复
  - refactoring - 重构
  - code-review - 代码审查
  - documentation - 文档
  - debugging - 调试
  - setup - 配置搭建
- **File Path**: 文件路径（如 src/api/index.ts）
- **Language**: 编程语言（如 typescript、python）
- **Tags**: 标签，逗号分隔（如 api, express, rest）

#### 步骤 3：搜索和筛选

**搜索对话：**
1. 在搜索框中输入关键词
2. 点击 **"Search"** 按钮或按回车
3. 结果会显示所有匹配的对话

**使用筛选器：**
1. 点击搜索框右侧的筛选器图标（漏斗形状）
2. 选择要筛选的条件：
   - Agent（Cursor、ClaudeCode 等）
   - Repository（仓库名称）
   - Task Type（任务类型）
3. 点击 **"Search"** 应用筛选

#### 步骤 4：查看日报

1. 添加了一些对话记录后
2. 点击右侧的 **"Generate Summary"** 按钮
3. AI 会分析当天所有的对话并生成总结
4. 需要在 `.env.local` 中配置 `GEMINI_API_KEY`

### 方式二：使用插件导入历史对话

#### 查看可用插件

```bash
node examples/import-cli.ts list
```

#### 导入单个文件

**导入 JSON 格式：**
```bash
node examples/import-cli.ts file examples/sample-conversations.json
```

**导入 Markdown 格式：**
```bash
node examples/import-cli.ts file examples/sample-conversations.md
```

**导入 Cursor 历史文件：**
```bash
node examples/import-cli.ts file ~/cursor/history/session.json
```

#### 批量导入目录

```bash
node examples/import-cli.ts dir ~/Downloads/conversations
```

这会自动扫描目录下所有支持的文件（.json、.jsonl、.md）并批量导入。

#### 从文本直接导入

```bash
node examples/import-cli.ts text
```

然后粘贴你的对话内容，按 **Ctrl+D** (Mac/Linux) 或 **Ctrl+Z** (Windows) 结束。

#### 支持的格式

**JSON 格式示例：**
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

**Cursor 历史格式：**
```json
{
  "messages": [
    { "role": "user", "content": "Help me..." },
    { "role": "assistant", "content": "Here's the solution..." }
  ],
  "model": "gpt-4"
}
```

**Markdown 格式：**
```markdown
---
agent: Cursor
model: gpt-4
tags: [refactoring, react]
task_type: refactoring
---

**User:** How do I refactor this component?

**Assistant:** I'll help you refactor the component. Here's the improved version...
```

### 方式三：使用 SDK 在代码中自动记录

#### 基本使用

```typescript
import { getAgentLog } from './sdk';

const logger = getAgentLog({
  apiUrl: 'http://localhost:3000/api/logs',
});

await logger.logConversation(
  'Cursor',
  'How do I implement REST API?',
  'Here is the implementation...',
  {
    model: 'gpt-4',
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

#### 会话管理

将相关对话组织成一个会话：

```typescript
logger.startSession('feature-development-session-123');

// 所有记录都会关联到这个会话
await logger.logConversation('Cursor', 'Help with A', '...');
await logger.logConversation('Cursor', 'Help with B', '...');

logger.endSession();
```

#### Git 上下文自动获取

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
    model: 'claude-3.5-sonnet',
    task_type: 'refactoring'
  }
);
```

### 方式四：使用命令行工具记录

#### 交互式输入

```bash
node examples/cli-log.ts --agent Cursor
```

按照提示输入：

```
🤖 Logging interaction with Cursor

Enter your prompt: How do I implement auth?

Enter the AI response (Ctrl+D when done):
Here's the code...
```

#### 直接提供内容

```bash
node examples/cli-log.ts \
  --agent Cursor \
  --model "gpt-4" \
  --prompt "How to implement auth?" \
  --response "Here is the code..." \
  --type feature-implementation \
  --file src/auth/index.ts \
  --lang typescript \
  --tags authentication,jwt
```

## 🔍 API 接口

### 记录日志

```bash
curl -X POST http://localhost:3000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "Cursor",
    "model": "gpt-4",
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

# 按模型筛选
curl "http://localhost:3000/api/logs?model=gpt-4"

# 按仓库筛选
curl "http://localhost:3000/api/logs?repository=my-project"

# 组合筛选
curl "http://localhost:3000/api/logs?date=2026-03-10&agent=Cursor&model=gpt-4"
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

返回示例：
```json
{
  "totalLogs": 150,
  "byAgent": [
    {"agent": "Cursor", "count": 60},
    {"agent": "ClaudeCode", "count": 50},
    {"agent": "ChatGPT", "count": 40}
  ],
  "byModel": [
    {"model": "gpt-4", "count": 70},
    {"model": "claude-3.5-sonnet", "count": 50},
    {"model": "gpt-3.5-turbo", "count": 30}
  ],
  "byRepository": [
    {"repository_name": "my-project", "count": 80},
    {"repository_name": "api-server", "count": 70}
  ],
  "byTaskType": [
    {"task_type": "feature-implementation", "count": 60},
    {"task_type": "bug-fix", "count": 40},
    {"task_type": "refactoring", "count": 30}
  ],
  "recentActivity": [
    {"date": "2026-03-10", "count": 25},
    {"date": "2026-03-09", "count": 20}
  ]
}
```

## 💡 使用场景

### 场景 1：记录日常开发中的 AI 辅助

```typescript
// 在开发工具中集成
import { getAgentLog, AgentLog } from './sdk';

const logger = getAgentLog();
const repoContext = AgentLog.fromGitRepo(process.cwd());

// 每次使用 AI 助手后自动记录
async function useAI(prompt: string, aiClient: any) {
  const response = await aiClient.chat(prompt);
  
  await logger.logConversation(
    'Cursor',
    prompt,
    response,
    {
      ...repoContext,
      model: aiClient.getModel(),
      task_type: inferTaskType(prompt),
      file_path: getCurrentFile()
    }
  );
  
  return response;
}
```

### 场景 2：导入历史对话

如果你已经在使用 Cursor、ChatGPT 等工具，导出对话后可以直接导入：

```bash
# 导出 Cursor 对话历史到 ~/cursor-history
# 然后批量导入
node examples/import-cli.ts dir ~/cursor-history
```

### 场景 3：团队共享知识库

团队成员可以将有价值的 AI 对话记录下来，形成团队知识库：

```typescript
const logger = getAgentLog({
  apiUrl: 'http://team-logs-server:3000/api/logs'
});

// 记录有用的 AI 建议
await logger.logConversation(
  'ChatGPT',
  'Best practices for React performance optimization',
  'Here are 10 key strategies...',
  {
    repository_url: 'https://github.com/team/web-app',
    repository_name: 'web-app',
    tags: ['react', 'performance', 'best-practices'],
    task_type: 'documentation'
  }
);
```

### 场景 4：搜索历史解决方案

遇到类似问题时，快速搜索之前的解决方案：

```bash
# 搜索之前的解决方案
node examples/import-cli.ts  # 先导入所有历史
# 然后在 Web 界面或通过 API 搜索
curl "http://localhost:3000/api/search?q=authentication"
```

## 📚 更多文档

- 📖 **完整文档**: [AGENT_LOG_README.md](./AGENT_LOG_README.md) - 详细的功能说明和高级用法
- 🚀 **快速开始**: [QUICKSTART.md](./QUICKSTART.md) - 新手友好的快速入门指南
- 🔧 **SDK 文档**: [sdk/README.md](./sdk/README.md) - SDK 开发者文档
- 💻 **示例代码**: [examples/](./examples/) 目录 - 完整的使用示例

## 🎯 集成示例

项目提供了多个集成示例：

- **Cursor 集成**: `examples/cursor-integration.ts` - 如何与 Cursor 集成
- **通用包装器**: `examples/generic-wrapper.ts` - 包装任何 AI 交互
- **CLI 工具**: `examples/cli-log.ts` - 命令行记录工具
- **导入工具**: `examples/import-cli.ts` - 导入历史对话

## 🛠 技术栈

- **前端**: React + TypeScript + Tailwind CSS + Vite
- **后端**: Express + Node.js
- **数据库**: SQLite (better-sqlite3)
- **AI 集成**: Google Gemini (可选，用于生成日报)

## ❓ 常见问题

<details>
<summary><b>Q: 如何删除日志？</b></summary>

目前 UI 没有删除功能，可以通过数据库直接删除：

```bash
sqlite3 logs.db "DELETE FROM logs WHERE id = 123;"
```

</details>

<details>
<summary><b>Q: 如何备份数据？</b></summary>

直接复制 `logs.db` 文件即可：

```bash
cp logs.db logs.db.backup.$(date +%Y%m%d)
```

</details>

<details>
<summary><b>Q: 如何重置数据？</b></summary>

删除 `logs.db` 文件，重启服务会自动创建新的数据库：

```bash
rm logs.db
npm run dev
```

</details>

<details>
<summary><b>Q: 支持哪些 AI Agent？</b></summary>

支持任何 AI Agent（Cursor、ClaudeCode、OpenCode、ChatGPT 等），agent 名称可以是任意字符串。

</details>

<details>
<summary><b>Q: 可以同时记录多个会话吗？</b></summary>

可以，使用 `session_id` 字段将相关对话组织成会话。

</details>

<details>
<summary><b>Q: 数据存储在哪里？</b></summary>

日志存储在项目根目录的 `logs.db` SQLite 数据库文件中。

</details>

---

## 📄 许可证

MIT License - 详见 LICENSE 文件

---

<div align="center">
<b>如果这个项目对你有帮助，请给个 ⭐️</b>
</div>
