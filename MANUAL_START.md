# 手动启动指南

如果自动启动脚本有问题，请按照以下步骤手动启动应用：

## 🔧 准备工作

### 1. 确认项目目录
```bash
cd /Users/maolipeng/Documents/selfProject/accounting-app
pwd  # 应该显示正确的项目路径
```

### 2. 检查MySQL服务
```bash
# 启动MySQL服务 (macOS)
brew services start mysql

# 或者
sudo mysql.server start
```

### 3. 创建数据库
```sql
mysql -u root -p
CREATE DATABASE accounting_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

## 🚀 启动步骤

### 步骤1: 启动后端服务

打开第一个终端：
```bash
cd /Users/maolipeng/Documents/selfProject/accounting-app
cd server
npm run dev
```

你应该看到：
```
🚀 服务器运行在端口 5001
📊 健康检查: http://localhost:5001/api/health
🔧 环境: development
```

### 步骤2: 启动前端服务

打开第二个终端：
```bash
cd /Users/maolipeng/Documents/selfProject/accounting-app
npm run dev
```

你应该看到：
```
  VITE v4.5.14  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## 🌐 访问应用

- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:5001
- **健康检查**: http://localhost:5001/api/health

## ✅ 验证启动成功

### 检查后端
在浏览器访问: http://localhost:5001/api/health

应该看到：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### 检查前端
在浏览器访问: http://localhost:5173

应该看到登录/注册页面。

## 🎯 功能测试

1. **注册新用户**
   - 填写邮箱、用户名、密码
   - 点击注册按钮

2. **登录系统**
   - 使用注册的邮箱和密码登录

3. **添加交易记录**
   - 点击"添加交易"
   - 选择收入或支出
   - 填写金额和描述

4. **查看统计**
   - 访问统计页面查看图表

## ❌ 常见问题解决

### 问题1: 后端启动失败
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**解决**: MySQL服务未启动
```bash
brew services start mysql
```

### 问题2: 数据库连接失败
```
ER_BAD_DB_ERROR: Unknown database 'accounting_app'
```
**解决**: 创建数据库
```sql
CREATE DATABASE accounting_app;
```

### 问题3: 端口被占用
```
Error: listen EADDRINUSE: address already in use :::5001
```
**解决**: 杀死占用进程
```bash
lsof -ti:5001 | xargs kill -9
```

### 问题4: 前端无法连接后端
**检查**: 
1. 后端是否在5001端口运行
2. `.env` 文件中的API地址是否正确
3. 防火墙是否阻止连接

## 🛑 停止服务

在每个终端中按 `Ctrl+C` 停止对应的服务。

## 📝 开发提示

- 修改后端代码后，nodemon会自动重启服务
- 修改前端代码后，Vite会自动热重载
- 数据库更改需要运行 `npx prisma db push`
- 查看数据库内容可以运行 `npx prisma studio`

祝你使用愉快！ 🎉