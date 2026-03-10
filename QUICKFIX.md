# 🚀 快速启动指南

## 遇到黑屏或连接问题？

### 第一步：诊断问题

```bash
# 检查服务器健康状态
npm run check
```

期望输出：
```
✅ Server is healthy!
   Status: ok
   Database: connected
   Total logs: X
```

如果健康检查失败，继续下面的步骤。

### 第二步：清理并重启

```bash
# 1. 停止服务器（Ctrl+C）

# 2. 清理缓存和数据库
rm -rf node_modules dist logs.db

# 3. 重新安装
npm install

# 4. 启动服务器
npm run dev
```

### 第三步：查看启动日志

启动后应该看到：

```
==================================================
🚀 Agent Log Server Started
==================================================

📍 API Endpoints:
   GET  http://localhost:3000/api/health
   GET  http://localhost:3000/api/logs
   POST http://localhost:3000/api/logs
   GET  http://localhost:3000/api/search
   GET  http://localhost:3000/api/stats

💻 Web UI: http://localhost:3000
==================================================

✅ Database connected (X records)
```

**重要提示**：
- 看到 "✅ Database connected" 才能正常工作
- 如果看到错误，参考 TROUBLESHOOTING.md

### 第四步：手动测试

```bash
# 测试 API
curl http://localhost:3000/api/health

# 应该返回 JSON：
# {"status":"ok","database":"connected","totalLogs":X}
```

### 第五步：检查浏览器

1. 访问 http://localhost:3000
2. 按 F12 打开开发者工具
3. 查看 Console 标签的错误
4. 查看 Network 标签，找到失败的 API 请求

### 常见问题快速修复

#### 问题：端口被占用

```bash
# 检查端口
lsof -i :3000

# 如果被占用，使用其他端口
PORT=3001 npm run dev
```

#### 问题：数据库损坏

```bash
# 删除数据库（会自动重建）
rm logs.db
npm run dev
```

#### 问题：依赖问题

```bash
# 清除缓存
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 新增功能

#### 健康检查端点

```bash
npm run check
```

检查服务器状态，无需打开浏览器。

#### 详细的启动日志

现在启动时会显示：
- 所有 API 端点
- 数据库状态
- Web UI 地址

#### 改进的错误处理

- API 健康检查
- 数据库连接测试
- 启动时的状态显示

### 获取更多帮助

- 📖 **完整故障排除**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- 📚 **使用文档**: [README.md](./README.md)
- 🚀 **快速开始**: [QUICKSTART.md](./QUICKSTART.md)

### 导入对话

```bash
# 扫描已安装的工具
npm run import:scan

# 导入所有工具的对话
npm run import:all

# 导入特定工具
npm run import:cursor
npm run import:claude
npm run import:opencode
```

### 开发模式 vs 生产模式

```bash
# 开发模式（默认）
npm run dev

# 生产模式
npm run build
npm run start
```

---

准备好了吗？运行以下命令开始：

```bash
# 1. 启动服务器
npm run dev

# 2. 在另一个终端检查健康状态
npm run check

# 3. 访问 Web UI
# 浏览器打开 http://localhost:3000
```

如果仍有问题，查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 获取详细的故障排除步骤。