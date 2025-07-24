# 智能记账应用

一个功能完整的记账应用，包含前端界面和后端API服务，支持用户系统、交易记录管理、分类管理和预算功能。

## 功能特性

### 用户系统
- 用户注册和登录
- JWT令牌认证
- 用户资料管理
- 密码修改
- 账户删除

### 交易记录管理
- 添加收入/支出记录
- 编辑和删除交易记录
- 按分类、日期、类型筛选
- 搜索功能
- 分页显示

### 分类管理
- 自定义收支分类
- 分类图标和颜色
- 分类使用统计
- 默认分类自动创建

### 预算功能
- 设置月度/年度预算
- 预算使用情况监控
- 预算超支提醒
- 预算概览统计

### 统计分析
- 收支统计图表
- 分类占比分析
- 时间趋势分析
- 数据导出功能

## 技术栈

### 前端
- React 18
- React Router DOM
- Tailwind CSS
- Lucide React (图标)
- Recharts (图表)
- Vite (构建工具)

### 后端
- Node.js + Express
- Prisma ORM
- MySQL 数据库
- JWT 认证
- bcryptjs 密码加密
- express-validator 数据验证

## 项目结构

```
accounting-app/
├── src/                    # 前端源码
│   ├── components/         # React组件
│   │   ├── auth/          # 认证相关组件
│   │   └── ...
│   ├── context/           # React Context
│   ├── pages/             # 页面组件
│   ├── services/          # API服务
│   └── ...
├── server/                # 后端源码
│   ├── lib/               # 数据库连接
│   ├── middleware/        # 中间件
│   ├── routes/            # API路由
│   ├── prisma/            # 数据库模型
│   └── server.js          # 服务器入口
└── ...
```

## 安装和运行

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：
```
VITE_API_URL=http://localhost:5001/api
```

创建 `server/.env` 文件：
```
DATABASE_URL="mysql://root:password@localhost:3306/accounting_app"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=5001
NODE_ENV=development
```

**注意**: 请根据你的MySQL配置修改数据库连接字符串：
- `root`: MySQL用户名
- `password`: MySQL密码
- `localhost:3306`: MySQL服务器地址和端口
- `accounting_app`: 数据库名称

### 3. 设置MySQL数据库

#### 3.1 启动MySQL服务

确保MySQL服务器正在运行：

```bash
# macOS (使用Homebrew)
brew services start mysql

# Ubuntu/Debian
sudo systemctl start mysql

# Windows
# 通过服务管理器启动MySQL服务
```

#### 3.2 创建数据库

使用MySQL命令行或图形化工具创建数据库：

```bash
# 登录MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE accounting_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 退出MySQL
exit;
```

或者使用提供的脚本：

```bash
cd server
mysql -u root -p < scripts/init-db.sql
```

#### 3.3 配置数据库连接

修改 `server/.env` 文件中的数据库连接字符串：

```
DATABASE_URL="mysql://用户名:密码@localhost:3306/accounting_app"
```

例如：
```
DATABASE_URL="mysql://root:123456@localhost:3306/accounting_app"
```

### 4. 初始化数据库

```bash
cd server
npm install mysql2  # 安装MySQL驱动
npx prisma generate  # 生成Prisma客户端
npx prisma db push   # 推送数据库结构
```

#### 4.1 测试数据库连接

```bash
cd server
node scripts/test-db.js
```

如果看到 "✅ 数据库连接成功！" 说明配置正确。

### 5. 启动服务

```bash
# 启动后端服务器 (端口 5001)
cd server
npm run dev

# 启动前端开发服务器 (端口 3002)
npm run dev
```

### 6. 访问应用

打开浏览器访问: http://localhost:3002

## API 接口文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新用户资料
- `PUT /api/auth/password` - 修改密码

### 交易记录接口
- `GET /api/transactions` - 获取交易记录列表
- `POST /api/transactions` - 创建交易记录
- `GET /api/transactions/:id` - 获取单个交易记录
- `PUT /api/transactions/:id` - 更新交易记录
- `DELETE /api/transactions/:id` - 删除交易记录
- `GET /api/transactions/stats/summary` - 获取统计数据

### 分类管理接口
- `GET /api/categories` - 获取分类列表
- `POST /api/categories` - 创建分类
- `GET /api/categories/:id` - 获取单个分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类
- `GET /api/categories/:id/stats` - 获取分类统计

### 预算管理接口
- `GET /api/budgets` - 获取预算列表
- `POST /api/budgets` - 创建预算
- `GET /api/budgets/:id` - 获取单个预算
- `PUT /api/budgets/:id` - 更新预算
- `DELETE /api/budgets/:id` - 删除预算
- `GET /api/budgets/overview/summary` - 获取预算概览

### 用户数据接口
- `GET /api/users/stats` - 获取用户统计
- `GET /api/users/export` - 导出用户数据
- `DELETE /api/users/account` - 删除账户
- `GET /api/users/activity` - 获取活动日志

## 数据库模型

### User (用户)
- id: 用户ID
- email: 邮箱地址
- username: 用户名
- password: 密码(加密)
- avatar: 头像URL
- createdAt: 创建时间
- updatedAt: 更新时间

### Category (分类)
- id: 分类ID
- name: 分类名称
- icon: 图标
- color: 颜色
- userId: 所属用户ID

### Transaction (交易记录)
- id: 交易ID
- amount: 金额
- type: 类型(income/expense)
- description: 描述
- date: 交易日期
- categoryId: 分类ID
- userId: 所属用户ID
- createdAt: 创建时间
- updatedAt: 更新时间

### Budget (预算)
- id: 预算ID
- categoryId: 分类ID
- amount: 预算金额
- period: 周期(monthly/yearly)
- startDate: 开始日期
- endDate: 结束日期
- userId: 所属用户ID
- createdAt: 创建时间
- updatedAt: 更新时间

## 开发说明

### 添加新功能
1. 在 `server/routes/` 中添加新的API路由
2. 在 `src/services/api.js` 中添加对应的API调用方法
3. 创建相应的React组件和页面
4. 更新路由配置

### 数据库变更
1. 修改 `server/prisma/schema.prisma`
2. 运行 `npx prisma db push` 应用变更
3. 运行 `npx prisma generate` 更新客户端

### 部署
1. 构建前端: `npm run build`
2. 配置生产环境变量
3. 使用 PM2 或类似工具管理后端进程
4. 配置反向代理(Nginx)

## 许可证

MIT License