# 开发环境配置说明

## 🔧 代理配置

为了解决开发环境下的跨域问题，已经配置了Vite代理：

### Vite配置 (vite.config.js)
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})
```

### API服务配置
- **开发环境**: 使用相对路径 `/api`，通过Vite代理转发到后端
- **生产环境**: 使用完整URL `http://localhost:5001/api`

## 🌐 端口配置

- **前端开发服务器**: http://localhost:5173
- **后端API服务器**: http://localhost:5001
- **代理转发**: 前端 `/api/*` → 后端 `http://localhost:5001/api/*`

## 🔄 请求流程

### 开发环境
```
前端页面 → /api/auth/login → Vite代理 → http://localhost:5001/api/auth/login
```

### 生产环境
```
前端页面 → http://localhost:5001/api/auth/login → 后端服务器
```

## ✅ 验证代理配置

启动前后端服务后，可以通过以下方式验证代理是否正常工作：

### 1. 浏览器开发者工具
- 打开 http://localhost:5173
- 查看Network标签
- API请求应该显示为 `/api/...` 而不是完整URL

### 2. 直接测试
```bash
# 通过代理访问健康检查
curl http://localhost:5173/api/health

# 应该返回与直接访问后端相同的结果
curl http://localhost:5001/api/health
```

## 🚨 常见问题

### 问题1: 代理不工作
**症状**: 前端显示网络错误，无法连接API
**解决**: 
1. 确保后端服务在5001端口运行
2. 重启前端开发服务器
3. 检查vite.config.js配置是否正确

### 问题2: CORS错误
**症状**: 浏览器控制台显示CORS错误
**解决**: 
1. 确保使用了代理配置
2. 检查后端CORS设置
3. 清除浏览器缓存

### 问题3: 代理超时
**症状**: 请求超时或连接被拒绝
**解决**: 
1. 确保后端服务正常运行
2. 检查防火墙设置
3. 验证端口5001未被其他程序占用

## 🔧 自定义配置

如果需要修改端口或代理设置：

### 修改前端端口
```javascript
// vite.config.js
server: {
  port: 3000,  // 修改为你想要的端口
  proxy: {
    // ...
  }
}
```

### 修改后端端口
```bash
# server/.env
PORT=5002  # 修改后端端口
```

然后更新代理配置：
```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:5002',  // 更新目标端口
    // ...
  }
}
```

## 📝 开发建议

1. **始终先启动后端服务**，再启动前端服务
2. **修改代理配置后**需要重启前端开发服务器
3. **生产部署时**记得更新环境变量中的API地址
4. **使用相对路径**进行API调用，让代理自动处理

这样配置后，开发环境下就不会有跨域问题了！ 🎉