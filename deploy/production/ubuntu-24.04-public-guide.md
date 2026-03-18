# XBlog Ubuntu 24.04 公网部署指南

这份指南从一台全新的 Ubuntu 24.04 公网云主机开始，最终落到下面四个地址：

- `https://xblog.<你的域名>`：公开站
- `https://admin.xblog.<你的域名>`：管理后台
- `https://ingest.xblog.<你的域名>`：OpenClaw 收录入口
- `https://assets.xblog.<你的域名>`：MinIO 公开资源域名

前提假设：

- 一台服务器
- PostgreSQL 与 XBlog 在同一台服务器
- MinIO 也是自部署在同一台服务器
- 对公网只开放 `22`、`80`、`443`
- XBlog 代码放在 `/srv/xblog/current`

## 1. 先准备 DNS 与防火墙

先把这四条 DNS 记录指向服务器公网 IP：

- `xblog.<你的域名>`
- `admin.xblog.<你的域名>`
- `ingest.xblog.<你的域名>`
- `assets.xblog.<你的域名>`

云防火墙或安全组只开放：

- `22/tcp`
- `80/tcp`
- `443/tcp`

不要对公网暴露：

- `3000`
- `3001`
- `4000`
- `5432`
- `9000`
- `9001`

## 2. 安装基础软件

```bash
sudo apt update
sudo apt install -y curl git unzip postgresql caddy
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
node -v
pnpm -v
```

## 3. 安装 MinIO

```bash
curl -fsSL https://dl.min.io/server/minio/release/linux-amd64/minio -o minio
chmod +x minio
sudo mv minio /usr/local/bin/minio
/usr/local/bin/minio --version
```

## 4. 创建 xblog 用户和目录

```bash
sudo useradd --system --create-home --shell /bin/bash xblog || true
sudo mkdir -p /srv/xblog/current /etc/xblog /var/lib/xblog/minio
sudo chown -R xblog:xblog /srv/xblog /var/lib/xblog
sudo chmod 700 /etc/xblog
```

推荐权限：

- 代码目录：`xblog:xblog`
- MinIO 数据目录：`xblog:xblog`
- env 文件：`root:root`，权限 `600`

## 5. 上传或拉取仓库

二选一：

```bash
sudo -u xblog git clone <你的仓库地址> /srv/xblog/current
```

或者把本地 zip 上传到服务器后解压：

```bash
sudo -u xblog mkdir -p /srv/xblog/current
sudo -u xblog unzip xblog-public-deploy-kit.zip -d /srv/xblog/current
```

最后确认根目录存在：

```bash
ls /srv/xblog/current/package.json
```

## 6. 创建 PostgreSQL 数据库和账号

把下面的密码换成强密码，并在 `/etc/xblog/api.env` 里保持一致。

```bash
sudo -u postgres psql <<'SQL'
CREATE USER xblog WITH PASSWORD 'change-me';
CREATE DATABASE xblog OWNER xblog;
\q
SQL
```

如果数据库或用户已经存在，就跳过创建，只做连通性确认。

## 7. 生成并填写 env 文件

使用仓库里的模板：

- `apps/web/.env.production.example` -> `/etc/xblog/web.env`
- `apps/admin/.env.production.example` -> `/etc/xblog/admin.env`
- `apps/api/.env.production.example` -> `/etc/xblog/api.env`
- `deploy/production/env/minio.env.example` -> `/etc/xblog/minio.env`
- `deploy/production/env/caddy.env.example` -> `/etc/xblog/caddy.env`

复制命令：

```bash
sudo cp /srv/xblog/current/apps/web/.env.production.example /etc/xblog/web.env
sudo cp /srv/xblog/current/apps/admin/.env.production.example /etc/xblog/admin.env
sudo cp /srv/xblog/current/apps/api/.env.production.example /etc/xblog/api.env
sudo cp /srv/xblog/current/deploy/production/env/minio.env.example /etc/xblog/minio.env
sudo cp /srv/xblog/current/deploy/production/env/caddy.env.example /etc/xblog/caddy.env
sudo chmod 600 /etc/xblog/*.env
```

编辑这些文件：

```bash
sudo nano /etc/xblog/web.env
sudo nano /etc/xblog/admin.env
sudo nano /etc/xblog/api.env
sudo nano /etc/xblog/minio.env
sudo nano /etc/xblog/caddy.env
```

重点需要改的值：

- `/etc/xblog/web.env`
  - `NEXT_PUBLIC_ADMIN_APP_URL=https://admin.xblog.<你的域名>`
- `/etc/xblog/admin.env`
  - `NEXT_PUBLIC_XBLOG_API_URL=https://admin.xblog.<你的域名>/api`
- `/etc/xblog/api.env`
  - `DATABASE_URL`
  - `ADMIN_ORIGIN=https://admin.xblog.<你的域名>`
  - `WEB_ORIGIN=https://xblog.<你的域名>`
  - `API_BASE_URL=https://admin.xblog.<你的域名>/api`
  - `OBJECT_STORAGE_PUBLIC_BASE_URL=https://assets.xblog.<你的域名>/xblog-assets`
  - `OBJECT_STORAGE_S3_ACCESS_KEY_ID`
  - `OBJECT_STORAGE_S3_SECRET_ACCESS_KEY`
  - `UPLOAD_SIGNING_SECRET`
- `/etc/xblog/minio.env`
  - `MINIO_ROOT_USER`
  - `MINIO_ROOT_PASSWORD`
- `/etc/xblog/caddy.env`
  - `XBLOG_BASE_DOMAIN`
  - `XBLOG_ACME_EMAIL`
  - `XBLOG_ADMIN_BASIC_AUTH_USER`
  - `XBLOG_ADMIN_BASIC_AUTH_HASH`

## 8. 生成 Caddy Basic Auth 哈希

```bash
cd /srv/xblog/current
chmod +x deploy/production/scripts/*.sh
deploy/production/scripts/hash-basic-auth.sh '换成一个强密码'
```

把生成出来的哈希写进 `/etc/xblog/caddy.env`。

## 9. 构建 XBlog

```bash
cd /srv/xblog/current
deploy/production/scripts/build-release.sh
```

这个脚本会做三件事：

- 把 `/etc/xblog/web.env` 复制到 `apps/web/.env.production`
- 把 `/etc/xblog/admin.env` 复制到 `apps/admin/.env.production`
- 执行 `pnpm install --frozen-lockfile` 和 `pnpm build`

因为 `NEXT_PUBLIC_*` 会被编进前端产物，所以最终域名确定之后必须重新 build 一次。

## 10. 执行 Prisma migration

```bash
cd /srv/xblog/current
deploy/production/scripts/migrate-api.sh
```

如果只是演示环境，可选导入静态 seed：

```bash
cd /srv/xblog/current
set -a
source /etc/xblog/api.env
set +a
pnpm seed:static
```

如果服务器上已经有真实内容，不要再跑 `seed:static`。

## 11. 安装 systemd 单元

```bash
sudo cp /srv/xblog/current/deploy/production/systemd/xblog-api.service /etc/systemd/system/
sudo cp /srv/xblog/current/deploy/production/systemd/xblog-web.service /etc/systemd/system/
sudo cp /srv/xblog/current/deploy/production/systemd/xblog-admin.service /etc/systemd/system/
sudo cp /srv/xblog/current/deploy/production/systemd/xblog-minio.service /etc/systemd/system/
sudo mkdir -p /etc/systemd/system/caddy.service.d
sudo cp /srv/xblog/current/deploy/production/systemd/caddy-xblog.conf /etc/systemd/system/caddy.service.d/xblog.conf
sudo systemctl daemon-reload
sudo systemctl enable --now xblog-minio xblog-api xblog-web xblog-admin
```

检查状态：

```bash
systemctl status xblog-minio --no-pager
systemctl status xblog-api --no-pager
systemctl status xblog-web --no-pager
systemctl status xblog-admin --no-pager
```

先用回环地址做健康检查：

```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:3001/login
curl http://127.0.0.1:4000/api/health
```

## 12. 安装 Caddy 配置

```bash
sudo cp /srv/xblog/current/deploy/production/Caddyfile.example /etc/caddy/Caddyfile
sudo systemctl daemon-reload
sudo systemctl restart caddy
sudo systemctl status caddy --no-pager
```

Caddy 会做这些事：

- `xblog.<domain>` -> `127.0.0.1:3000`
- `admin.xblog.<domain>` -> Basic Auth -> `127.0.0.1:3001`，且 `/api/*` 反代到 `127.0.0.1:4000`
- `ingest.xblog.<domain>` 只允许 `/api/health` 和 `POST /v1/ingest/articles`
- `assets.xblog.<domain>` -> `127.0.0.1:9000`

## 13. 初始化 MinIO bucket 公网读取

应用服务起来之后，执行：

```bash
cd /srv/xblog/current
set -a
source /etc/xblog/api.env
set +a
pnpm --filter @xblog/api object-storage:bootstrap
pnpm --filter @xblog/api object-storage:verify
```

这样会把 `xblog-assets` bucket 调整到可以通过 `assets` 域名公开读取。

## 14. 运行公网验收脚本

```bash
cd /srv/xblog/current
PUBLIC_URL=https://xblog.<你的域名> \
ADMIN_URL=https://admin.xblog.<你的域名> \
INGEST_URL=https://ingest.xblog.<你的域名> \
ADMIN_BASIC_AUTH='editorial:这里填明文密码' \
deploy/production/scripts/smoke-test.sh
```

如果你已经知道某个资源地址，还可以附带：

```bash
ASSET_URL=https://assets.xblog.<你的域名>/xblog-assets/<object-key>
```

## 15. 接 OpenClaw

OpenClaw 侧使用：

```bash
XBLOG_API_BASE_URL=https://ingest.xblog.<你的域名>
XBLOG_WEB_BASE_URL=https://xblog.<你的域名>
```

对应模板文件：

- `deploy/production/env/openclaw.env.example`

## 16. 保持 MinIO Console 只内网可达

不要把 `9001` 暴露到公网。
需要时走 SSH 隧道：

```bash
ssh -L 9001:127.0.0.1:9001 user@your-server
```

然后本地打开：

```text
http://127.0.0.1:9001
```

## 17. 常见问题

如果部署前在 Windows 本地执行 `pnpm build` 失败：

- 先停掉占用 Prisma `query_engine-windows.dll.node` 的本地 XBlog API 进程
- 再重新执行 `pnpm build`

如果后台上传后返回了本地地址，不是公网后台域名：

- 检查 `/etc/xblog/api.env`
- 确认 `API_BASE_URL=https://admin.xblog.<你的域名>/api`

如果站点能打开但图片不显示：

- 检查 `/etc/xblog/api.env`
- 确认 `OBJECT_STORAGE_PUBLIC_BASE_URL=https://assets.xblog.<你的域名>/xblog-assets`
- 重跑：

```bash
pnpm --filter @xblog/api object-storage:bootstrap
pnpm --filter @xblog/api object-storage:verify
```

如果 `admin.xblog.<domain>` 打开后没有先弹 Basic Auth：

- 检查 `/etc/xblog/caddy.env`
- 确认 `XBLOG_ADMIN_BASIC_AUTH_USER` 和 `XBLOG_ADMIN_BASIC_AUTH_HASH`
- 重启 Caddy

如果 OpenClaw 能访问 ingest health，但不能发布：

- 检查 `XBLOG_API_TOKEN`
- 检查 `https://ingest.xblog.<你的域名>/v1/ingest/articles` 是否可达
- 检查 token scope 是否正确
