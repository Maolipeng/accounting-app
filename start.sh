#!/bin/bash

# 智能记账应用启动脚本

echo "🚀 启动智能记账应用..."

# 检查是否在正确的项目目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误：未找到 package.json 文件"
    echo "请确保在项目根目录 (accounting-app) 中运行此脚本"
    echo "当前目录: $(pwd)"
    echo ""
    echo "正确的使用方法："
    echo "cd /path/to/accounting-app"
    echo "./start.sh"
    exit 1
fi

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查MySQL
if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL 客户端未找到，请确保MySQL服务器正在运行"
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 安装后端依赖..."
    (cd server && npm install)
fi

# 检查环境变量
if [ ! -f ".env" ]; then
    echo "⚠️  前端环境变量文件 .env 不存在"
    echo "创建默认配置..."
    echo "VITE_API_URL=http://localhost:5001/api" > .env
fi

if [ ! -f "server/.env" ]; then
    echo "❌ 后端环境变量文件 server/.env 不存在"
    echo "请创建 server/.env 文件并配置数据库连接"
    exit 1
fi

# 测试数据库连接
echo "🔍 测试数据库连接..."
if (cd server && node scripts/test-db.js); then
    echo "✅ 数据库连接成功"
else
    echo "❌ 数据库连接失败，请检查配置"
    exit 1
fi

# 初始化数据库
echo "🗄️  初始化数据库..."
(cd server && npx prisma generate > /dev/null 2>&1)
(cd server && npx prisma db push > /dev/null 2>&1)

# 启动后端服务
echo "🌟 启动后端服务..."
(cd server && npm run dev) &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo "✅ 后端服务启动成功 (PID: $BACKEND_PID)"
else
    echo "❌ 后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 启动前端服务
echo "🌟 启动前端服务..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 应用启动成功！"
echo ""
echo "📱 前端地址: http://localhost:5173"
echo "🔄 API代理: /api/* → http://localhost:5001/api/*"
echo "🔧 后端地址: http://localhost:5001"
echo "🏥 健康检查: http://localhost:5001/api/health"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ 所有服务已停止"; exit 0' INT

wait