# 快速启动指南

## 🚨 重要提示

请确保你在正确的项目目录中运行命令！

## 📍 正确的目录位置

```bash
cd /Users/maolipeng/Documents/selfProject/accounting-app
```

## 🔍 验证项目结构

运行检查脚本确认项目完整：
```bash
./check-project.sh
```

## 🚀 启动步骤

### 1. 确认位置
```bash
pwd
# 应该显示: /Users/maolipeng/Documents/selfProject/accounting-app
```

### 2. 检查文件
```bash
ls -la
# 应该看到: package.json, src/, server/, start.sh 等文件
```

### 3. 安装依赖
```bash
# 前端依赖
npm install

# 后端依赖
cd server
npm install
cd ..
```

### 4. 配置数据库

确保MySQL正在运行，然后创建数据库：
```sql
mysql -u root -p
CREATE DATABASE accounting_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 5. 配置环境变量

检查 `server/.env` 文件：
```env
DATABASE_URL="mysql://root:your_password@localhost:3306/accounting_app"
JWT_SECRET="peakol"
PORT=5001
NODE_ENV=development
```

### 6. 初始化数据库
```bash
cd server
node scripts/test-db.js  # 测试连接
npx prisma generate      # 生成客户端
npx prisma db push       # 创建表结构
cd ..
```

### 7. 启动服务

**方法1: 使用启动脚本**
```bash
./start.sh
```

**方法2: 手动启动**

终端1 - 后端:
```bash
cd server
npm run dev
```

终端2 - 前端:
```bash
npm run dev
```

## 🌐 访问地址

- 前端: http://localhost:5173
- 后端: http://localhost:5001
- 健康检查: http://localhost:5001/api/health

## ❌ 常见错误解决

### 错误1: `Could not read package.json`
**原因**: 不在正确的项目目录
**解决**: 
```bash
cd /Users/maolipeng/Documents/selfProject/accounting-app
```

### 错误2: `ECONNREFUSED`
**原因**: MySQL未启动
**解决**: 
```bash
# macOS
brew services start mysql

# 或者
sudo mysql.server start
```

### 错误3: `ER_BAD_DB_ERROR`
**原因**: 数据库不存在
**解决**: 
```sql
CREATE DATABASE accounting_app;
```

### 错误4: 端口被占用
**原因**: 端口5001或5173被占用
**解决**: 
```bash
# 查看占用进程
lsof -ti:5001
lsof -ti:5173

# 杀死进程
kill -9 <PID>
```

## 🆘 获取帮助

如果遇到问题：

1. 运行项目检查: `./check-project.sh`
2. 检查数据库连接: `cd server && node scripts/test-db.js`
3. 查看详细文档: `README.md` 和 `SETUP.md`

## 📱 功能测试

启动成功后，你可以：

1. 访问 http://localhost:5173
2. 注册新用户账户
3. 登录系统
4. 添加交易记录
5. 查看统计数据
6. 设置预算

享受你的智能记账应用！ 🎉