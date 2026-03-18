# XBlog

XBlog 是一个内容型博客系统，不只是静态展示站，而是把“内容生产、内容分发、后台编辑、资源存储、收录入口”串成一条完整链路。

它目前的定位是：先稳定跑在单机环境里，再按需要继续演进到更成熟的生产架构。

## 核心能力

- 公开站展示首页、分类页、文章页。
- 管理后台负责文章编辑、分类管理、封面资源管理、token 管理和站点内容维护。
- 后端 API 负责登录鉴权、文章与分类数据、公开内容接口、上传、收录入口和健康检查。
- 资源文件放在对象存储里，封面图、上传资源和其他静态资产都走这条路。
- 构建期和运行期分开配置，方便上线和部署。

## 技术栈

前端主流方案通常包括 `Vue / React / Angular`，后端主流方案通常包括 `Java / Python / Node.js / Go / C#`。XBlog 选的是其中一条更适合当前项目形态的路线。

| 层 | XBlog 选型 | 作用 | 为什么选它 | 常见替代方案 |
|---|---|---|---|---|
| 前端框架 | `Next.js 16` | 公开站和管理后台 | 页面、路由、渲染和构建放在一起，适合内容站和后台 | `Vue` / `React SPA + Vite` / `Nuxt` / `SvelteKit` |
| UI 框架 | `React 19` | 组件化 UI 基础 | 组件模型成熟，适合复杂页面和长期维护 | `Vue` / `Angular` / `Svelte` |
| 样式方案 | `Tailwind CSS 4` | 布局和视觉统一 | 原子化样式方便迭代，改版时比较省事 | `Bootstrap` / `CSS Modules` / 纯手写 CSS |
| 后端框架 | `Fastify` | API 服务 | 结构清楚，性能也不错，适合独立后端 | `Express` / `NestJS` / `Koa` |
| ORM / 迁移 | `Prisma` | 数据库访问与 schema 管理 | 类型安全，迁移也直观，适合长期维护 | 手写 SQL / `knex` / `sequelize` |
| 主数据库 | `PostgreSQL` | 持久化业务数据 | 事务、JSON 和复杂查询都比较稳 | `MySQL` / `SQLite` |
| 对象存储 | `MinIO` | 图片和上传资源 | 兼容 S3，又能本地自托管 | 本地磁盘目录 / 云厂商 S3 |
| E2E 测试 | `Playwright` | 浏览器级测试 | 能直接跑真实页面和交互 | `Selenium` / 只做接口测试 |
| 单元测试 | `Vitest` | 后端逻辑和工具测试 | 启动快，和 TypeScript 配合顺手 | `Jest` / `Mocha` |
| 包管理 | `pnpm workspace` | Monorepo 依赖和构建 | 依赖去重好，适合多包仓库 | `npm workspaces` / `yarn` |
| 编程语言 | `TypeScript` | 统一前后端代码基础 | 类型检查能少掉很多低级错误 | `JavaScript` / `Go` / `Python` / `Java` |
| 反向代理 | `Caddy` | 公网入口和 HTTPS | 自动证书、配置少，单机部署省心 | `Nginx` / `Traefik` |

### 选型总结

- 前端用 `Next.js + React`，是因为它能把页面、路由和数据获取放在一套工具里。
- 后端用 `Fastify + TypeScript`，是为了把 API 服务做得清楚一点，前后端也能共用类型。
- 数据库和存储选 `PostgreSQL + MinIO`，是为了方便部署，也方便后面继续扩。

## 术语说明

如果你对上面这些名字不熟，可以先按下面这版理解：

- `Next.js`：网页项目的框架，能管页面、路由和构建。
- `React`：前端组件库，适合拆页面和复用组件。
- `Tailwind CSS`：用现成的小样式拼页面，改起来快。
- `Fastify`：后端 API 框架。
- `Prisma`：数据库访问和迁移工具。
- `PostgreSQL`：主数据库。
- `MinIO`：对象存储。
- `Playwright`：浏览器自动化测试工具。
- `Vitest`：单元测试工具。
- `pnpm workspace`：多包仓库的依赖管理方式。
- `TypeScript`：带类型的 JavaScript。
- `Caddy`：反向代理和 HTTPS 工具。

## 仓库结构

- `apps/web`：公开站
- `apps/admin`：管理后台
- `apps/api`：后端服务
- `packages/contracts`：前后端共享的数据契约
- `deploy/production`：裸机 + systemd 生产部署方案
- `deploy/docker`：Docker 离线镜像部署方案
- `scripts`：辅助脚本

## 架构概览

XBlog 采用“前端 + 后端 + 数据库 + 对象存储 + 反向代理”的标准拆分方式。公开访问统一从 `Caddy` 进入，内部服务彼此通过 Docker 网络通信。

当前推荐的生产拓扑是单机 Docker compose 部署。对公网只开放 `Caddy`，其余服务全部留在 Docker 内网里。

```mermaid
flowchart TB
  Internet((Internet))
  User[浏览器 / 后台 / 收录工具]

  subgraph VM["云服务器 / 单机"]
    subgraph Pub["公网入口层"]
      Caddy["caddy 容器\n对外暴露 80/443\nHTTPS / 域名路由 / basic_auth"]
    end

    subgraph AppNet["Docker 内网"]
      Web["web 容器\nNext.js 公开站\n监听 3000"]
      Admin["admin 容器\nNext.js 后台\n监听 3001"]
      API["api 容器\nFastify + Prisma\n监听 4000"]
      PG["postgres 容器\n监听 5432"]
      MinIO["minio 容器\n监听 9000\nConsole 9001"]
    end

    subgraph Vols["持久化卷"]
      V1[postgres-data]
      V2[minio-data]
      V3[caddy-data]
      V4[caddy-config]
    end
  end

  User --> Internet --> Caddy
  Caddy --> Web
  Caddy --> Admin
  Caddy --> API
  Caddy --> MinIO

  Web --> API
  Admin --> API
  API --> PG
  API --> MinIO

  PG --- V1
  MinIO --- V2
  Caddy --- V3
  Caddy --- V4
```

## Docker 部署

### 容器职责

- `caddy`：公网入口，负责 `80/443`、HTTPS 证书、域名路由和反向代理。
- `web`：公开站前端。
- `admin`：管理后台前端。
- `api`：后端业务服务。
- `postgres`：数据库。
- `minio`：对象存储。

### 端口暴露

对公网暴露的只有 `80` 和 `443`。

容器内部常用端口：

- `web`：`3000`
- `admin`：`3001`
- `api`：`4000`
- `postgres`：`5432`
- `minio API`：`9000`
- `minio Console`：`9001`

### 数据卷

- `postgres-data`：保存 PostgreSQL 数据
- `minio-data`：保存对象存储数据
- `caddy-data`：保存证书和运行数据
- `caddy-config`：保存 Caddy 配置状态

原则很简单：

- `web / admin / api` 尽量无状态，容器坏了可以直接重建
- `postgres / minio / caddy` 需要持久化，不能把关键数据放在容器本体里

## 部署方式

如果你想先看当前的裸机生产方案：

- [deploy/production/README.md](deploy/production/README.md)

如果你准备走本地构建、离线传镜像、服务器导入的 Docker 路线：

- [deploy/docker/README.md](deploy/docker/README.md)
- [deploy/docker/directory-guide.md](deploy/docker/directory-guide.md)

## 本地开发

仓库采用 `pnpm workspace` 管理多包，多数常用命令都在根目录 `package.json` 里。

常见命令：

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
```

按需启动单个服务：

```bash
pnpm dev:web
pnpm dev:admin
pnpm dev:api
```

## 设计重点

- `web` 和 `admin` 会用到构建期环境变量，尤其是 `NEXT_PUBLIC_*`，这类配置不能只靠运行时注入。
- `api` 直接对接 PostgreSQL 和 MinIO，负责核心业务逻辑和数据读写。
- `packages/contracts` 统一前后端共享类型，减少接口漂移。
- `deploy/docker` 采用蓝绿发布思路，方便后续升级和回滚。

## 说明

这个仓库还在持续演进中，部署方式也会跟着成熟度一起调整。
当前的原则是：

- 优先清晰
- 优先可回滚
- 优先好维护
