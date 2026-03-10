# Tool Setup Guide

详细说明如何配置各个 AI 工具以便自动导入对话记录。

## 支持的工具

### Cursor AI Editor

#### macOS
```
~/Library/Application Support/Cursor/User/GlobalStorage/
```

#### Linux
```
~/.config/Cursor/User/GlobalStorage/
```

#### Windows
```
%APPDATA%/Cursor/User/GlobalStorage/
```

#### 对话存储格式
- SQLite 数据库 (VSCode 格式)
- 表名：`ItemTable`
- 对话类型：`type = 'chat'`

#### 如何访问对话历史
1. 打开 Cursor
2. 按 `Cmd + Shift + P` (Mac) 或 `Ctrl + Shift + P` (Windows/Linux)
3. 输入 "Chat: Show History" 或直接点击左侧历史图标
4. 对话会自动保存到上述位置

#### 故障排查
如果扫描不到 Cursor：
```bash
# 检查目录是否存在
ls ~/Library/Application\ Support/Cursor/User/GlobalStorage/

# 检查数据库文件
ls ~/Library/Application\ Support/Cursor/User/GlobalStorage/*.db
```

---

### ClaudeCode / Claude Desktop

#### macOS
```
~/Library/Application Support/Claude/
```

#### Linux
```
~/.config/Claude/
```

#### Windows
```
%APPDATA%/Claude/
```

#### 对话存储格式
- JSON 配置文件：`claude_desktop_config.json`
- LevelDB 数据库：`Local Storage/leveldb/`

#### 如何访问对话历史
1. 打开 Claude Desktop
2. 点击左侧边栏的 "Chat History"
3. 所有对话会自动保存到上述位置
4. 可以点击导出按钮导出为 JSON 格式

#### 导出对话
在 Claude Desktop 中：
1. 打开 "Chat History"
2. 右键点击对话或选择多个对话
3. 选择 "Export" → "JSON"

---

### OpenCode

#### macOS
```
~/Library/Application Support/OpenCode/User/
```

#### Linux
```
~/.config/OpenCode/User/
```

#### Windows
```
%APPDATA%/OpenCode/User/
```

#### 对话存储格式
- JSON 文件：`settings.json` 或 `history.json`
- 包含所有对话和元数据

#### 如何访问对话历史
1. 打开 OpenCode
2. 查看 "Chat" 面板
3. 对话会自动保存

---

### VS Code with GitHub Copilot

#### macOS
```
~/Library/Application Support/Code/User/globalStorage/
```

#### Linux
```
~/.config/Code/User/globalStorage/
```

#### Windows
```
%APPDATA%/Code/User/globalStorage/
```

#### 对话存储格式
- JSON 文件：`storage.json`
- 包含遥测日志和会话数据

#### 如何查看 Copilot 对话
VS Code Copilot 不直接显示对话历史，但会记录：
- 代码建议请求
- 接受的建议
- 文件上下文

#### 启用详细日志（可选）
在 VS Code 设置中：
```json
{
  "github.copilot.enable.telemetry": true,
  "github.copilot.enable.betaFeatures": true
}
```

---

## 批量导入脚本

### 从目录导入多个工具

创建一个脚本批量导入：

```bash
#!/bin/bash

# 自动导入所有工具
cd /path/to/AI-Agent-Log

# 启动 Agent Log 服务（如果在后台）
npm run dev &
SERVER_PID=$!
sleep 5

# 导入所有工具
node examples/auto-import-cli.ts all

# 停止服务
kill $SERVER_PID
```

### 定期自动导入

使用 cron (Linux/Mac) 或任务计划程序 (Windows) 定期导入：

**Linux/Mac (crontab)**
```bash
# 每周日凌晨 2 点自动导入
0 2 * * 0 cd /path/to/AI-Agent-Log && node examples/auto-import-cli.ts all
```

**Windows (任务计划程序)**
1. 打开 "任务计划程序"
2. 创建基本任务
3. 设置触发器为"每周"
4. 操作为"启动程序"
5. 程序：`node`
6. 参数：`C:\path\to\AI-Agent-Log\examples\auto-import-cli.ts all`

---

## 数据格式说明

### 统一的对话格式

所有导入的对话都会转换为以下格式：

```json
{
  "agent": "Cursor | ClaudeCode | OpenCode | Copilot",
  "model": "gpt-4 | claude-3.5-sonnet | ...",
  "user_prompt": "用户的问题或请求",
  "ai_response": "AI 的回答或建议",
  "timestamp": "2026-03-10T10:30:00Z",
  "repository_url": "https://github.com/user/repo (可选)",
  "repository_name": "repo-name (可选)",
  "branch": "main (可选)",
  "task_type": "feature-implementation | ... (可选)",
  "file_path": "src/file.ts (可选)",
  "language": "typescript (可选)",
  "tags": ["tag1", "tag2"] (可选)
}
```

### 自动提取的元数据

导入器会自动从对话内容中提取：

- **任务类型**：通过关键词识别
  - 包含 "fix" → `bug-fix`
  - 包含 "refactor" → `refactoring`
  - 包含 "implement" → `feature-implementation`
  - 包含 "test" → `testing`

- **标签**：从内容中提取关键词
  - `api`, `database`, `frontend`, `backend`, `bug`, `feature`, `test`, `debug`, `refactor`

---

## 常见问题

<details>
<summary><b>Q: 扫描不到已安装的工具？</b></summary>

可能的原因：
1. 工具路径不同（工具更新后可能改变）
2. 权限问题（某些系统目录需要管理员权限）
3. 数据库文件格式不兼容（工具更新导致）

**解决方案**：
- 手动检查工具的数据目录位置
- 使用文件导入功能手动导出对话
- 查看工具的日志确认数据保存位置

</details>

<details>
<summary><b>Q: 导入后对话内容不完整？</b></summary>

某些工具可能不保存完整的对话历史，或者限制保存的长度。这取决于工具本身，不是 Agent Log 的问题。

</details>

<details>
<summary><b>Q: 可以只导入特定时间范围的对话吗？</b></summary>

当前版本会导入最近的 500 条对话。如果需要更多或特定范围，可以：
1. 手动导出对话（如果工具支持）
2. 使用其他导入方式（文件导入、文本导入）
3. 修改导入器代码以支持时间过滤

</details>

<details>
<summary><b>Q: 导入重复了怎么办？</b></summary>

Agent Log 会检查重复，但基于不同的去重策略：
- 相同的 Agent + Timestamp 会被去重
- 如果确实重复，可以在数据库中手动删除：

```bash
sqlite3 logs.db "DELETE FROM logs WHERE id IN (123, 456, 789);"
```

</details>

<details>
<summary><b>Q: 如何验证导入是否成功？</b></summary>

1. 查看导入输出的统计信息
2. 在 Web 界面中查看日志列表
3. 使用搜索功能搜索特定的对话内容
4. 查看统计页面确认总数增加

```bash
# 查看数据库中的记录数
sqlite3 logs.db "SELECT COUNT(*) FROM logs;"
```

</details>

---

## 下一步

导入对话后，你可以：

1. **搜索历史对话**：快速找到之前的解决方案
2. **查看统计分析**：了解你的 AI 使用习惯
3. **导出备份**：定期备份数据库
4. **分享团队**：将对话部署为团队知识库

开始使用：[README.md](./README.md)