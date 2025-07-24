# 项目启动指南

## 前置要求

1. **Node.js** (版本 16 或更高)
2. **MySQL** 服务器正在运行
3. **Git** (用于克隆项目)

## 快速启动步骤

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
cd ..
```

### 2. 配置MySQL数据库

确保MySQL服务正在运行，然后创建数据库：

```sql
-- 连接到MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE accounting_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 退出MySQL
EXIT;
```

### 3. 配置环境变量

根目录创建 `.env` 文件：
```env
VITE_API_URL=http://localhost:5001/api
```

在 `server/` 目录创建 `.env` 文件：
```env
DATABASE_URL="mysql://root:your_password@localhost:3306/accounting_app"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=5001
NODE_ENV=development
```

**重要**: 请将 `your_password` 替换为你的MySQL root密码。

### 4. 初始化数据库

```bash
cd server

# 测试数据库连接
node scripts/test-db.js

# 生成Prisma客户端
npx prisma generate

# 推送数据库结构
npx prisma db push
```

### 5. 启动服务

**方法一：分别启动（推荐用于开发）**

终端1 - 启动后端：
```bash
cd server
npm run dev
```

终端2 - 启动前端：
```bash
npm run dev
```

**方法二：使用启动脚本**

```bash
# 创建启动脚本
chmod +x start.sh
./start.sh
```

### 6. 访问应用

- 前端应用: http://localhost:5173
- 后端API: http://localhost:5001
- API健康检查: http://localhost:5001/api/health

## 验证安装

### 检查后端服务
```bash
curl http://localhost:5001/api/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

### 检查数据库连接
```bash
cd server
node scripts/test-db.js
```

应该显示：
```
🔍 测试数据库连接...
✅ 数据库连接成功!
✅ 数据库查询测试成功
✅ 数据库连接已关闭
```

## 常见问题

### 1. 数据库连接失败

**错误**: `ECONNREFUSED`
**解决**: 
- 检查MySQL服务是否运行: `brew services start mysql` (macOS) 或 `sudo systemctl start mysql` (Linux)
- 检查端口3306是否被占用

**错误**: `ER_ACCESS_DENIED_ERROR`
**解决**: 
- 检查用户名和密码是否正确
- 确保用户有访问数据库的权限

**错误**: `ER_BAD_DB_ERROR`
**解决**: 
- 确保数据库 `accounting_app` 已创建
- 运行: `CREATE DATABASE accounting_app;`

### 2. 端口被占用

**错误**: `EADDRINUSE`
**解决**: 
- 更改端口号在 `server/.env` 中
- 或停止占用端口的进程: `lsof -ti:5001 | xargs kill -9`

### 3. Prisma相关错误

**错误**: `Schema parsing error`
**解决**: 
- 检查 `server/prisma/schema.prisma` 语法
- 运行: `npx prisma format`

**错误**: `Client generation failed`
**解决**: 
- 删除 `node_modules/.prisma` 目录
- 重新运行: `npx prisma generate`

## 开发工具

### 数据库管理
```bash
cd server
npx prisma studio
```
访问: http://localhost:5555

### 查看数据库结构
```bash
cd server
npx prisma db pull
```

### 重置数据库
```bash
cd server
npx prisma migrate reset
```

## 生产部署

### 1. 构建前端
```bash
npm run build
```

### 2. 配置生产环境变量
```env
NODE_ENV=production
DATABASE_URL="mysql://user:password@production-host:3306/accounting_app"
JWT_SECRET="your-production-secret-key"
```

### 3. 启动生产服务
```bash
cd server
npm start
```

## 技术支持

如果遇到问题，请检查：
1. Node.js版本是否符合要求
2. MySQL服务是否正常运行
3. 环境变量是否正确配置
4. 防火墙设置是否阻止了端口访问

更多详细信息请参考 `README.md` 文件。