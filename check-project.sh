#!/bin/bash

echo "🔍 检查项目结构..."
echo "当前目录: $(pwd)"
echo ""

# 检查必要文件
files=("package.json" "src/App.jsx" "server/package.json" "server/server.js")
missing_files=()

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (缺失)"
        missing_files+=("$file")
    fi
done

echo ""

# 检查目录结构
dirs=("src" "server" "server/routes" "server/prisma")
missing_dirs=()

for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/"
    else
        echo "❌ $dir/ (缺失)"
        missing_dirs+=("$dir")
    fi
done

echo ""

if [ ${#missing_files[@]} -eq 0 ] && [ ${#missing_dirs[@]} -eq 0 ]; then
    echo "🎉 项目结构完整！"
    echo ""
    echo "可以运行以下命令启动项目："
    echo "./start.sh"
else
    echo "⚠️  项目结构不完整"
    echo ""
    echo "请确保你在正确的项目目录中："
    echo "cd /Users/maolipeng/Documents/selfProject/accounting-app"
    echo ""
    echo "如果文件确实缺失，请重新克隆或创建项目。"
fi