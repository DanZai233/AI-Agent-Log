<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Agent Log - 对话自动收集与检索系统

自动收集和检索各种 AI Agent 的对话记录，支持丰富的元数据和强大的搜索功能。

## 功能特性

- ✅ **自动收集**: 通过 SDK 自动记录各种 AI Agent 的交互
- ✅ **丰富元数据**: 支持仓库信息、分支、文件路径、任务类型、标签等
- ✅ **全文搜索**: 快速搜索历史对话内容
- ✅ **多维度筛选**: 按时间、Agent、仓库、任务类型等筛选
- ✅ **会话管理**: 将相关对话组织成会话
- ✅ **统计分析**: 查看使用趋势和分布统计
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

查看完整文档: [AGENT_LOG_README.md](./AGENT_LOG_README.md)

### 基本使用

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

### 命令行工具

```bash
# 交互式输入
node examples/cli-log.js --agent Cursor

# 直接提供内容
node examples/cli-log.js --agent Cursor \
  --prompt "How to implement auth?" \
  --response "Here is the code..." \
  --type feature-implementation
```

## 集成示例

- **Cursor 集成**: `examples/cursor-integration.ts`
- **通用包装器**: `examples/generic-wrapper.ts`
- **CLI 工具**: `examples/cli-log.ts`

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS + Vite
- **后端**: Express + Node.js
- **数据库**: SQLite (better-sqlite3)
- **AI 集成**: Google Gemini (可选，用于生成日报)

## 原始 AI Studio 应用

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4520a76c-4041-446d-b3b9-e539e9a693d4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
