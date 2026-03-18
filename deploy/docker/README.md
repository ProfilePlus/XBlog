# XBlog Docker 离线镜像部署方案

这份文档描述的是 XBlog 的 Docker 离线部署路线：

- 本地构建镜像
- 导出成 `tar`
- 传到云服务器
- 服务器执行 `docker load`
- 再用 `docker compose` 启动

它和 [`deploy/production/README.md`](/D:/AI/CodeX/XBlog/deploy/production/README.md) 是并行方案，不互相覆盖。

如果你想先看“服务器目录到底该怎么收拾”，先读：

- [`deploy/docker/directory-guide.md`](/D:/AI/CodeX/XBlog/deploy/docker/directory-guide.md)

## 方案目标

- 国内环境下直接 `docker pull` 慢，甚至不稳定。
- 博客还在持续迭代，不适合一开始就把部署流程做得太重。
- 服务器上只做“导入镜像、起服务、切流量”，不要把构建压力留在生产机上。

## 部署拓扑

计划中的生产拓扑固定为 6 个容器：

- `caddy`：公网入口，负责 `80/443`、HTTPS、域名路由、基础认证
- `web`：公开站前端
- `admin`：管理后台前端
- `api`：后端业务服务
- `postgres`：数据库
- `minio`：对象存储

容器分两类：

- 无状态：`caddy / web / admin / api`
- 有状态：`postgres / minio`

## 设计原则

### 1. 运行时和构建期分开

- 运行时变量放到服务器侧 env 文件里
- `web/admin` 的 `NEXT_PUBLIC_*` 必须在构建前注入
- `api` 在运行时读取数据库、对象存储和域名配置

### 2. 数据和容器分开

- `postgres` 必须挂卷
- `minio` 必须挂卷
- `caddy` 也要保存证书和配置数据
- `web/admin/api` 尽量无状态，坏了就重建

### 3. 流量和版本分开

- 先起新版本 `green`
- 迁移数据库
- 跑 smoke test
- 通过后再切流量
- 出问题就回滚到旧版本 `blue`

## 发布流程

### 本地开发机

1. 拉取最新代码，确认锁文件。
2. 准备本次发布所需的生产 env。
3. 构建 `web / admin / api / caddy` 镜像。
4. 给镜像打统一版本号 tag。
5. 导出镜像成 `tar` 包。
6. 把镜像包传到云服务器。

### 云服务器

1. `docker load` 导入镜像。
2. 启动 `green` stack。
3. 执行数据库迁移。
4. 运行 smoke test。
5. 切换 Caddy 到 `green`。
6. 稳定后停掉旧的 `blue` stack。

## 脚本说明

### `build-images.sh`

本地构建镜像并打 tag。

### `export-images.sh`

把本地镜像导出成离线包。

### `import-images.sh`

在服务器上把离线包导回 Docker。

### `up-blue.sh` / `up-green.sh`

分别启动蓝版本和绿版本。

### `migrate.sh`

在目标版本上执行数据库迁移，失败就中止发布。

### `smoke-test.sh`

验证公开站、后台、API、上传和对象存储链路。

### `switch.sh`

把 Caddy 切到新版本。

### `rollback.sh`

把流量切回旧版本。

## 现有骨架

- `compose.yml`：Docker 运行拓扑骨架
- `Caddyfile`：Docker 运行时 Caddy 配置
- `Caddyfile.example`：Caddy 模板
- `env.example`：全局环境变量模板
- `env/runtime.api.env.example`：API 运行时模板
- `*.sh`：发布流程脚本骨架

## 暂不实现

这版先不做下面这些：

- 不引入 Kubernetes
- 不引入多机编排
- 不把数据库塞进应用镜像
- 不把前端配置改成纯运行时读取

这些都可以以后再加，但不是当前阶段最重要的事情。

## 落地顺序

如果你后面要真的上线，建议按这个顺序补：

1. 补齐 `compose.yml`、`Caddyfile` 和 env 模板
2. 补各服务 Dockerfile
3. 接上 `build / export / import` 脚本
4. 接上 `switch / rollback / smoke-test`

这样即使中途暂停，仓库里也始终有一套完整、可读、可继续推进的部署说明。
