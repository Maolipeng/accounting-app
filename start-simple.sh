#!/bin/bash

echo "🚀 启动智能记账应用 (简化版)"

# 检查项目目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "📋 使用说明："
echo "1. 确保MySQL服务正在运行"
echo "2. 确保数据库 'accounting_app' 已创建"
echo "3. 检查 server/.env 配置正确"
echo ""

echo "🔧 启动后端服务..."
echo "在新终端中运行: cd server && npm run dev"
echo ""

echo "🌐 启动前端服务..."
echo "在另一个新终端中运行: npm run dev"
echo ""

echo "📱 访问地址:"
echo "- 前端: http://localhost:5173"
echo "- 后端: http://localhost:5001"
echo ""

read -p "按回车键继续自动启动，或按 Ctrl+C 取消..."

# 自动启动
echo "🚀 自动启动服务..."

# 启动后端
echo "启动后端..."
(cd server && npm run dev) &
BACKEND_PID=$!

sleep 3

# 检查后端
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "✅ 后端启动成功"
else
    echo "❌ 后端启动失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# 启动前端
echo "启动前端..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 服务启动完成！"
echo "📱 前端: http://localhost:5173"
echo "🔧 后端: http://localhost:5001"
echo ""
echo "按 Ctrl+C 停止所有服务"

trap 'echo ""; echo "停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT
wait