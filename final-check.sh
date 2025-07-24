#!/bin/bash

echo "🔍 最终项目状态检查"
echo "===================="
echo ""

# 检查项目目录
echo "📁 项目目录检查:"
echo "当前目录: $(pwd)"
if [ -f "package.json" ]; then
    echo "✅ 在正确的项目目录中"
else
    echo "❌ 不在项目根目录，请cd到accounting-app目录"
    exit 1
fi
echo ""

# 检查文件结构
echo "📋 文件结构检查:"
files=(
    "package.json"
    "src/App.jsx"
    "server/package.json"
    "server/server.js"
    "server/.env"
    ".env"
    "start.sh"
    "MANUAL_START.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (缺失)"
    fi
done
echo ""

# 检查依赖安装
echo "📦 依赖检查:"
if [ -d "node_modules" ]; then
    echo "✅ 前端依赖已安装"
else
    echo "⚠️  前端依赖未安装，运行: npm install"
fi

if [ -d "server/node_modules" ]; then
    echo "✅ 后端依赖已安装"
else
    echo "⚠️  后端依赖未安装，运行: cd server && npm install"
fi
echo ""

# 检查MySQL连接
echo "🗄️  数据库检查:"
if [ -f "server/scripts/test-db.js" ]; then
    echo "测试数据库连接..."
    if (cd server && node scripts/test-db.js > /dev/null 2>&1); then
        echo "✅ 数据库连接正常"
    else
        echo "❌ 数据库连接失败"
        echo "   请检查:"
        echo "   1. MySQL服务是否运行"
        echo "   2. 数据库 'accounting_app' 是否存在"
        echo "   3. server/.env 中的连接配置是否正确"
    fi
else
    echo "⚠️  数据库测试脚本不存在"
fi
echo ""

# 检查端口占用
echo "🌐 端口检查:"
if lsof -ti:5001 > /dev/null 2>&1; then
    echo "⚠️  端口5001已被占用"
    echo "   运行以下命令释放: lsof -ti:5001 | xargs kill -9"
else
    echo "✅ 端口5001可用"
fi

if lsof -ti:5173 > /dev/null 2>&1; then
    echo "⚠️  端口5173已被占用"
    echo "   运行以下命令释放: lsof -ti:5173 | xargs kill -9"
else
    echo "✅ 端口5173可用"
fi
echo ""

# 启动建议
echo "🚀 启动建议:"
echo "方法1 - 自动启动:"
echo "   ./start.sh"
echo ""
echo "方法2 - 手动启动:"
echo "   终端1: cd server && npm run dev"
echo "   终端2: npm run dev"
echo ""
echo "方法3 - 查看详细指南:"
echo "   cat MANUAL_START.md"
echo ""

echo "🎯 访问地址:"
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:5001"
echo "   健康检查: http://localhost:5001/api/health"
echo "   代理测试: http://localhost:5173/api/health"
echo ""

echo "✨ 项目检查完成！"