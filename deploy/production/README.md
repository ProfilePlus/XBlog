# XBlog 单机生产部署说明

这个目录里放的是 XBlog 公网部署所需的仓库侧产物，目标拓扑是：

- 一台 Ubuntu 主机
- Caddy 暴露公网 `80/443`
- `web`、`admin`、`api`、MinIO 都只监听本机回环地址
- PostgreSQL 也放在同一台主机
- 用子域拆分公开站、管理后台、收录入口和资源域名

如果你想走 Docker 离线镜像路线，请看：

- [`deploy/docker/README.md`](/D:/AI/CodeX/XBlog/deploy/docker/README.md)

那份文档会单独说明本地 build、镜像导出、服务器导入和蓝绿切换流程。

## 目标域名

- `xblog.<domain>`：公开站
- `admin.xblog.<domain>`：管理后台，先过 Caddy `basic_auth`，再进 XBlog 自身登录
- `ingest.xblog.<domain>`：只给 OpenClaw / 机器令牌调用的收录入口
- `assets.xblog.<domain>`：MinIO 对外读资源域名

## 目录里的文件

- `Caddyfile.example`：反向代理与子域隔离配置
- `env/caddy.env.example`：Caddy 使用的环境变量模板
- `env/minio.env.example`：本地 MinIO 凭据与数据目录模板
- `env/openclaw.env.example`：`xblog-url-ingest` skill 生产环境变量模板
- `systemd/*.service`：`web`、`admin`、`api`、MinIO 的 systemd 单元
- `systemd/caddy-xblog.conf`：给 Caddy 注入 `/etc/xblog/caddy.env` 的 drop-in
- `scripts/build-release.sh`：复制构建期 env 并执行 `pnpm build`
- `scripts/migrate-api.sh`：带 `/etc/xblog/api.env` 执行 Prisma `migrate deploy`
- `scripts/hash-basic-auth.sh`：生成 Caddy `basic_auth` 用的 bcrypt hash
- `scripts/smoke-test.sh`：公网部署后的基础验收脚本
- `ubuntu-24.04-public-guide.md`：全新 Ubuntu 24.04 公网部署逐步指南

## 必备 env 文件

把这些模板复制到 Linux 主机的 `/etc/xblog`：

- `apps/web/.env.production.example` -> `/etc/xblog/web.env`
- `apps/admin/.env.production.example` -> `/etc/xblog/admin.env`
- `apps/api/.env.production.example` -> `/etc/xblog/api.env`
- `deploy/production/env/minio.env.example` -> `/etc/xblog/minio.env`
- `deploy/production/env/caddy.env.example` -> `/etc/xblog/caddy.env`

其中 `web.env` 和 `admin.env` 同时承担两件事：

1. 作为 systemd 运行时环境变量
2. 作为 `build-release.sh` 复制进 `apps/web/.env.production` 与 `apps/admin/.env.production` 的构建期真值来源

这是必须的，因为 `NEXT_PUBLIC_*` 会进前端构建产物，不只是运行时变量。

## 阶段 1：没有最终域名时的主机准备

1. 准备 Ubuntu 24.04 LTS，建议至少 `2 vCPU / 4 GB RAM / 40 GB SSD`
2. 安装系统依赖：

```bash
sudo apt update
sudo apt install -y curl git postgresql caddy
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
```

3. 安装 MinIO 二进制：

```bash
curl -fsSL https://dl.min.io/server/minio/release/linux-amd64/minio -o minio
chmod +x minio
sudo mv minio /usr/local/bin/minio
```

4. 创建部署用户与目录：

```bash
sudo useradd --system --create-home --shell /bin/bash xblog || true
sudo mkdir -p /srv/xblog/current /etc/xblog /var/lib/xblog/minio
sudo chown -R xblog:xblog /srv/xblog /var/lib/xblog
sudo chmod 700 /etc/xblog
```

5. 把仓库 clone 或 rsync 到 `/srv/xblog/current`
6. 填好 `/etc/xblog` 下的 env 模板
7. 构建：

```bash
cd /srv/xblog/current
chmod +x deploy/production/scripts/*.sh
deploy/production/scripts/build-release.sh
```

8. 执行数据库迁移：

```bash
cd /srv/xblog/current
deploy/production/scripts/migrate-api.sh
```

9. 仅在演示环境或首次临时验证时，才考虑导入静态 seed：

```bash
cd /srv/xblog/current
set -a
source /etc/xblog/api.env
set +a
pnpm seed:static
```

10. 安装 systemd 单元：

```bash
sudo cp deploy/production/systemd/xblog-api.service /etc/systemd/system/
sudo cp deploy/production/systemd/xblog-web.service /etc/systemd/system/
sudo cp deploy/production/systemd/xblog-admin.service /etc/systemd/system/
sudo cp deploy/production/systemd/xblog-minio.service /etc/systemd/system/
sudo mkdir -p /etc/systemd/system/caddy.service.d
sudo cp deploy/production/systemd/caddy-xblog.conf /etc/systemd/system/caddy.service.d/xblog.conf
sudo systemctl daemon-reload
sudo systemctl enable --now xblog-minio xblog-api xblog-web xblog-admin
```

阶段 1 完成后，回环地址应可正常访问：

- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001/login`
- `http://127.0.0.1:4000/api/health`
- MinIO API 监听 `127.0.0.1:9000`，Console 监听 `127.0.0.1:9001`

这时还不算正式公网切换完成。

## 阶段 2：域名、HTTPS 与 Caddy

1. 把以下域名指向云主机公网 IP：
   - `xblog.<domain>`
   - `admin.xblog.<domain>`
   - `ingest.xblog.<domain>`
   - `assets.xblog.<domain>`
2. 填好 `/etc/xblog/caddy.env`
3. 生成 Caddy Basic Auth 哈希：

```bash
cd /srv/xblog/current
deploy/production/scripts/hash-basic-auth.sh 'replace-with-strong-password'
```

4. 安装 Caddy 配置：

```bash
sudo cp deploy/production/Caddyfile.example /etc/caddy/Caddyfile
sudo systemctl daemon-reload
sudo systemctl restart caddy
```

5. 云防火墙或安全组只保留 `22`、`80`、`443`

## MinIO Console 访问

不要把 MinIO Console 暴露到公网。
需要时走 SSH 隧道：

```bash
ssh -L 9001:127.0.0.1:9001 user@your-server
```

然后在本地打开 `http://127.0.0.1:9001`。

## 部署后验收

DNS 和 HTTPS 生效后，执行：

```bash
cd /srv/xblog/current
PUBLIC_URL=https://xblog.example.com \
ADMIN_URL=https://admin.xblog.example.com \
INGEST_URL=https://ingest.xblog.example.com \
ADMIN_BASIC_AUTH='editorial:replace-with-strong-password' \
deploy/production/scripts/smoke-test.sh
```

如果你已经知道某个真实资源地址，可以额外传 `ASSET_URL=...` 验证 `assets` 域名。

## OpenClaw 生产环境

公网部署下，OpenClaw 应该使用：

- `XBLOG_API_BASE_URL=https://ingest.xblog.<domain>`
- `XBLOG_WEB_BASE_URL=https://xblog.<domain>`

对应模板在 `deploy/production/env/openclaw.env.example`。
