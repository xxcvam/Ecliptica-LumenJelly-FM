# 🌐 项目部署指南 - 让朋友远程访问

## 方案对比

| 方案 | 速度 | 持久性 | 难度 | 推荐场景 |
|------|------|--------|------|----------|
| **localtunnel** | ⚡ 最快 | 临时（重启失效） | ⭐ 最简单 | 快速测试 |
| **ngrok** | ⚡ 快 | 临时 | ⭐⭐ 简单 | 稳定测试 |
| **Vercel** | ⚡⚡ 快 | 永久 | ⭐⭐ 简单 | 正式部署 |
| **Netlify** | ⚡⚡ 快 | 永久 | ⭐⭐ 简单 | 正式部署 |
| **Cloudflare Pages** | ⚡⚡ 快 | 永久 | ⭐⭐ 简单 | 正式部署 |

---

## 🚀 方案 1: localtunnel（当前已启动，最快）

### 查看当前链接
如果已经启动，检查终端输出，你会看到类似这样的链接：
```
your url is: https://xxx.loca.lt
```

或者重新启动查看：
```bash
cd fm-web
npx localtunnel --port 5173
```

### 使用方法
1. 确保开发服务器正在运行（`npm run dev`）
2. 启动 localtunnel：`npx localtunnel --port 5173`
3. 复制显示的 URL（如 `https://xxx.loca.lt`）
4. 发送给朋友即可访问

**优点**：无需安装，立即可用  
**缺点**：每次重启会变化，免费版偶尔不稳定

---

## 🚀 方案 2: ngrok（更稳定）

### 安装
```bash
# macOS
brew install ngrok

# 或从官网下载：https://ngrok.com
```

### 使用
```bash
# 1. 注册账号获取 authtoken（只需一次）
ngrok config add-authtoken YOUR_TOKEN

# 2. 启动隧道
ngrok http 5173
```

### 固定域名（可选，需要付费）
```bash
ngrok http 5173 --domain=your-custom-name.ngrok.io
```

**优点**：稳定可靠，支持固定域名  
**缺点**：需要注册账号（免费）

---

## 🚀 方案 3: 部署到 Vercel（永久部署，推荐）

### 安装 Vercel CLI
```bash
npm i -g vercel
```

### 部署
```bash
cd fm-web
npm run build  # 已构建完成
vercel --prod
```

### 或使用网页界面
1. 访问 https://vercel.com
2. 导入项目（连接 GitHub 或直接上传 `dist/` 目录）
3. 自动部署完成，获得永久链接

**优点**：永久免费，自动 HTTPS，全球 CDN  
**缺点**：需要几分钟部署时间

---

## 🚀 方案 4: 部署到 Netlify

### 使用 Netlify CLI
```bash
# 安装
npm i -g netlify-cli

# 部署
cd fm-web
npm run build
netlify deploy --prod --dir=dist
```

### 或使用拖拽部署
1. 访问 https://app.netlify.com/drop
2. 直接拖拽 `fm-web/dist/` 文件夹
3. 立即获得部署链接

**优点**：拖拽即部署，非常简单  
**缺点**：需要手动更新

---

## 🚀 方案 5: 部署到 Cloudflare Pages

### 使用 CLI
```bash
# 安装
npm i -g wrangler

# 部署
cd fm-web
npm run build
npx wrangler pages deploy dist --project-name=webfm
```

### 或使用网页界面
1. 访问 https://dash.cloudflare.com
2. 选择 Pages → Create a project
3. 上传 `dist/` 文件夹或连接 Git 仓库

**优点**：免费，性能优秀  
**缺点**：需要 Cloudflare 账号

---

## 📋 快速决策树

- **需要立即测试？** → 使用 **localtunnel**（当前已启动）
- **需要稳定测试几天？** → 使用 **ngrok**
- **需要永久链接分享？** → 部署到 **Vercel**（推荐）
- **没有账号想最快？** → 使用 **Netlify 拖拽部署**

---

## 💡 当前状态

✅ 项目已构建完成（`fm-web/dist/`）  
✅ 开发服务器配置已支持局域网访问（`0.0.0.0:5173`）  
✅ localtunnel 已启动（等待 URL）

**下一步**：选择一个方案开始部署！

