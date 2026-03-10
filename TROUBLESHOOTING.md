# 故障排除指南

## 黑屏/无法加载问题

### 问题描述
- 启动后浏览器黑屏
- 显示 "Unchecked runtime.lastError: The message port closed before a response was received"

### 解决方案

#### 1. 检查服务器是否正常运行

```bash
# 方法1：查看服务器输出
npm run dev

# 应该看到类似以下的输出：
# ==================================================
# 🚀 Agent Log Server Started
# ==================================================
# 
# 📍 API Endpoints:
#    GET  http://localhost:3000/api/health
#    GET  http://localhost:3000/api/logs
#    POST http://localhost:3000/api/logs
#    GET  http://localhost:3000/api/search
#    GET  http://localhost:3000/api/stats
# 
# 💻 Web UI: http://localhost:3000
# ==================================================
# 
# ✅ Database connected (3 records)
```

```bash
# 方法2：使用健康检查脚本
npm run check

# 应该看到：
# ✅ Server is healthy!
#    Status: ok
#    Database: connected
#    Total logs: 3
#
# You can access the web UI at: http://localhost:3000
```

#### 2. 检查端口是否被占用

```bash
lsof -i :3000

# 如果有输出，说明端口被占用
# 可以先停止占用端口的进程，或使用其他端口
```

#### 3. 清除缓存和重新安装

```bash
# 1. 停止服务器（Ctrl+C）

# 2. 清除缓存
rm -rf node_modules
rm -rf dist
rm logs.db

# 3. 重新安装依赖
npm install

# 4. 重新启动
npm run dev
```

#### 4. 检查数据库

```bash
# 查看数据库文件是否存在
ls -la logs.db

# 如果数据库损坏，可以删除重建
rm logs.db

# 重新启动服务器会自动创建新的数据库
npm run dev
```

#### 5. 使用不同的端口

如果端口 3000 有问题，可以使用其他端口：

```bash
# 临时使用 3001 端口
PORT=3001 npm run dev

# 然后访问 http://localhost:3001
```

#### 6. 检查浏览器控制台

1. 打开浏览器
2. 访问 http://localhost:3000
3. 按 F12 打开开发者工具
4. 查看 Console 标签的错误信息
5. 查看 Network 标签的 API 请求状态

常见错误：

**CORS 错误**
```
Access to fetch at 'http://localhost:3000/api/logs' from origin 'http://localhost:5173' has been blocked by CORS policy
```
解决方案：开发环境应该不会有这个问题，但如果出现，检查 server.ts 的配置。

**404 错误**
```
GET http://localhost:3000/api/logs 404 (Not Found)
```
解决方案：检查服务器是否正常启动，查看服务器输出的错误信息。

**连接错误**
```
Unchecked runtime.lastError: The message port closed before a response was received
```
解决方案：这通常意味着服务器没有响应。检查：
1. 服务器是否正在运行
2. 防火墙是否阻止了连接
3. 是否有多个 npm run dev 在运行

### 手动测试 API

使用 curl 测试 API 是否正常工作：

```bash
# 测试健康检查
curl http://localhost:3000/api/health

# 测试获取日志
curl http://localhost:3000/api/logs

# 测试搜索
curl "http://localhost:3000/api/search?q=test"
```

### 查看完整日志

如果问题持续，可以增加日志级别：

```bash
# 设置环境变量启用详细日志
DEBUG=* npm run dev

# 或者在浏览器中查看详细网络请求
# 1. 打开开发者工具 (F12)
# 2. 切换到 Network 标签
# 3. 找到失败的请求，查看详细的响应
```

### 常见问题和解决方案

#### 问题 1：数据库迁移失败

错误信息：
```
🔄 Migrating database: Adding model column...
Error: no such column: model
```

解决方案：
数据库已损坏，删除重建：
```bash
rm logs.db
npm run dev
```

#### 问题 2：依赖安装失败

错误信息：
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

解决方案：
清除 npm 缓存：
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 问题 3：类型错误

错误信息：
```
npm run lint
> tsc --noEmit
error TSxxxx: ...
```

解决方案：
```bash
# 重新安装依赖
npm install

# 运行类型检查
npm run lint
```

#### 问题 4：Vite 构建错误

错误信息：
```
vite v6.x.x
error when starting dev server:
Error: ...
```

解决方案：
```bash
# 清除构建缓存
npm run clean

# 重新启动
npm run dev
```

### 获取帮助

如果以上方法都无法解决问题：

1. **检查 GitHub Issues**
   - https://github.com/DanZai233/AI-Agent-Log/issues

2. **提供详细信息**
   - 操作系统版本
   - Node.js 版本：`node --version`
   - 浏览器版本
   - 完整的错误信息
   - 浏览器控制台截图

3. **最小化问题**
   - 尝试使用不同的浏览器
   - 尝试在隐私/无痕模式下打开
   - 尝试清除浏览器缓存

### 环境要求

确保你的系统满足以下要求：

- **Node.js**: v18 或更高版本
- **npm**: v8 或更高版本
- **可用磁盘空间**: 至少 500MB
- **可用内存**: 至少 1GB

检查版本：
```bash
node --version
npm --version
```