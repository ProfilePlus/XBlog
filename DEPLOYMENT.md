# XBlog 部署文档

## 环境要求

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+ (生产环境)
- 对象存储服务 (可选：本地文件系统/S3/R2)

## 本地开发

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `apps/api/.env`：

```env
DATABASE_URL="file:./prisma/dev.db"
ADMIN_ORIGIN="http://127.0.0.1:3001"
WEB_ORIGIN="http://127.0.0.1:3000"
```

### 3. 初始化数据库

```bash
cd apps/api
pnpm prisma migrate dev
pnpm seed
```

### 4. 启动服务

```bash
# 根目录执行
pnpm dev:api    # API 服务 (http://127.0.0.1:4000)
pnpm dev:web    # 前端 (http://127.0.0.1:3000)
pnpm dev:admin  # 管理后台 (http://127.0.0.1:3001)
```

默认管理员账号：
- 邮箱：`admin@xblog.local`
- 密码：`admin12345`

## 生产部署

### 环境变量配置

#### API 服务 (`apps/api/.env`)

```env
# 数据库
DATABASE_URL="postgresql://user:password@host:5432/xblog"

# 跨域配置
ADMIN_ORIGIN="https://admin.yourdomain.com"
WEB_ORIGIN="https://yourdomain.com"

# 对象存储 (可选)
XBLOG_STORE_DRIVER="s3"
S3_ENDPOINT="https://s3.amazonaws.com"
S3_REGION="us-east-1"
S3_BUCKET="xblog-assets"
S3_ACCESS_KEY_ID="your-key"
S3_SECRET_ACCESS_KEY="your-secret"
PUBLIC_ASSET_BASE_URL="https://cdn.yourdomain.com"

# 会话配置
SESSION_COOKIE_NAME="xblog_session"
```

#### Web 前端 (`apps/web/.env`)

```env
NEXT_PUBLIC_XBLOG_API_URL="https://api.yourdomain.com"
```

#### Admin 后台 (`apps/admin/.env`)

```env
NEXT_PUBLIC_XBLOG_API_URL="https://api.yourdomain.com"
```

### 构建

```bash
# 构建所有应用
pnpm build

# 或分别构建
cd apps/api && pnpm build
cd apps/web && pnpm build
cd apps/admin && pnpm build
```

### 运行生产服务

```bash
# API
cd apps/api && pnpm start

# Web
cd apps/web && pnpm start

# Admin
cd apps/admin && pnpm start
```

### 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start apps/api/dist/server.js --name xblog-api
pm2 start "pnpm start" --name xblog-web --cwd apps/web
pm2 start "pnpm start" --name xblog-admin --cwd apps/admin

# 保存配置
pm2 save
pm2 startup
```

## 数据库迁移

生产环境执行迁移：

```bash
cd apps/api
pnpm prisma migrate deploy
```

## 对象存储配置

### 本地文件系统

```env
XBLOG_STORE_DRIVER="local"
ASSETS_DIR=".data/assets"
PUBLIC_ASSET_BASE_URL="http://127.0.0.1:4000/assets"
```

### Cloudflare R2

```env
XBLOG_STORE_DRIVER="s3"
S3_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
S3_REGION="auto"
S3_BUCKET="xblog"
S3_ACCESS_KEY_ID="your-r2-key"
S3_SECRET_ACCESS_KEY="your-r2-secret"
PUBLIC_ASSET_BASE_URL="https://cdn.yourdomain.com"
```

## Nginx 反向代理配置

```nginx
# API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Web
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin
server {
    listen 80;
    server_name admin.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 故障排查

### CORS 错误

确保 API 的 `ADMIN_ORIGIN` 和 `WEB_ORIGIN` 与实际访问域名一致。

### 数据库连接失败

检查 `DATABASE_URL` 格式和数据库服务状态。

### 对象存储上传失败

1. 检查存储配置和凭证
2. 访问 `/api/admin/system/storage` 查看诊断信息
3. 使用管理后台的"上传探针"测试链路

## 更新日志

- 2025-04-21: 添加 Martina Plantijn 字体支持
- 2025-04-21: 修复 CORS 配置支持 localhost
- 2025-04-21: 移除管理后台多余提示文本
- 2025-04-21: 修复 schema 验证允许相对路径 URL
