# XBlog 重构进度

## 当前状态（2026-04-20）

### 已完成

#### 1. 设计系统重构
- ✅ 字体替换：Space Grotesk → Playfair Display + Newsreader + Inter + Noto Sans SC
- ✅ 颜色系统：删除 aurora 渐变和 4 色霓虹（cyan/pink/mint/violet），改为纯黑白灰
- ✅ 圆角系统：统一为 24px/12px/8px/6px 层级，无直角设计
- ✅ 删除所有装饰性组件：aurora-frame.tsx, site-logo.tsx

#### 2. 功能清理
- ✅ 删除首页刊期系统（Home Issue）
- ✅ 删除封面素材库（Category Cover Assets）
- ✅ 删除编辑台（Editorial Desk）
- ✅ 删除 Logo 系统，改用文本品牌 "Alex Plum"
- ✅ 保留令牌管理（用于 OpenClaw 自动采集）
- ✅ 数据库迁移：PostgreSQL → SQLite（本地开发）
- ✅ 清理后端 API 路由和数据模型

#### 3. 前端页面重构
- ✅ **首页**（apps/web/src/app/page.tsx）
  - Frank Chimero 风格布局：左栏固定标题 + 右栏内容
  - 精选文章：6 张卡片，左图右文，300x200px 图片（3:2 比例）
  - 简介：用户指定文案（后端开发者 / 构建系统也观察系统 / 追问人的位置）
  - 关于：完整哲学文案（AI 放大能力也放大欲望 / 三个追问）
  - Section sticky headers（Writing / Working On / Toolbox / Archive / About / Contact）
  - 图片去重逻辑：确保 6 张精选文章封面各不相同
  
- ✅ **文章详情页**（apps/web/src/app/articles/[slug]/page.tsx）
  - Light theme 背景 #E6E2E0
  - 672px 内容宽度，18px Newsreader 正文
  - 图片布局：default 672px / half 336px / full 960px，圆角 8px（全宽无圆角）
  
- ✅ **分类页**（apps/web/src/app/categories/page.tsx）
- ✅ **分类详情页**（apps/web/src/app/categories/[slug]/page.tsx）
- ✅ **搜索页**（apps/web/src/app/search/page.tsx）

#### 4. Admin 页面简化
- ✅ 删除 aurora 效果（admin-shell.tsx）
- ✅ 简化导航：移除编辑台/封面素材/刊期，保留概览/文章/分类/令牌/存储
- ✅ 应用新颜色系统和圆角

#### 5. 样式系统
- ✅ apps/web/src/app/globals.css：从 3347 行精简到约 200 行
- ✅ apps/admin/src/app/globals.css：从 3158 行精简到约 300 行
- ✅ 删除所有 aurora/tone 相关 CSS
- ✅ 建立新的 typography 和 spacing 系统

#### 6. 数据与 API
- ✅ Prisma schema 清理：删除 HomeIssue/HomeIssueHeroSlot 模型
- ✅ 添加 Article.coverUrl 字段（本地图片路径）
- ✅ 种子数据：6 张精选图片（beyond-the-machine.png, easy-hard.jpg, the-webs-grain.jpg, what-screens-want.jpg, only-openings.jpg, borderlands.jpg）
- ✅ API 去重逻辑：确保 latestOriginals + latestCurated 组合后前 6 篇封面不重复

### 待完成

#### 1. 视觉细节优化
- [ ] 首页各 section 间距微调（对比 frankchimero.com）
- [ ] 卡片 hover 效果亮度调整（当前 rgba(255,255,255,0.06)）
- [ ] 字号层级最终确认（当前：section title 36px, card title 20px）

#### 2. Admin 页面视觉重做
- [ ] Dashboard 卡片样式
- [ ] 文章列表表格样式
- [ ] 文章编辑器样式
- [ ] 分类管理样式
- [ ] 令牌管理样式
- [ ] 存储管理样式

#### 3. 功能完善
- [ ] 搜索页实现（当前仅占位）
- [ ] 文章详情页图片 caption 样式
- [ ] 分类详情页文章列表样式优化
- [ ] Footer ICP 备案样式统一

#### 4. 部署准备
- [ ] 环境变量配置文档
- [ ] 生产环境数据库迁移（SQLite → PostgreSQL）
- [ ] 对象存储配置（S3/MinIO）
- [ ] Vercel/自托管部署配置

### 技术栈

- **Frontend**: Next.js 16 (App Router + Turbopack), React, TypeScript
- **Backend**: Fastify, Prisma ORM, SQLite (dev) / PostgreSQL (prod)
- **Monorepo**: pnpm workspace
- **设计工具**: Pencil (xblog-redesign.pen)
- **字体**: Playfair Display, Newsreader, Inter, Noto Sans SC
- **配色**: 纯黑白灰（#000000, #E6E2E0, #CCCCCC, #888888, #555555）

### 关键文件

#### 已修改
- `apps/web/src/app/page.tsx` - 首页（多次迭代，当前版本最接近 frankchimero.com）
- `apps/web/src/app/globals.css` - 全局样式（精简版）
- `apps/web/src/lib/public-api.ts` - API 调用 + 图片去重逻辑
- `apps/api/src/bootstrap/prisma-seed.ts` - 种子数据 + 图片分配逻辑
- `apps/api/prisma/schema.prisma` - 数据模型（删除 HomeIssue，添加 coverUrl）
- `apps/admin/src/components/admin-nav.tsx` - 简化导航

#### 已删除
- `apps/web/src/components/aurora-frame.tsx`
- `apps/web/src/components/site-logo.tsx`
- `apps/admin/src/app/editorial-desk/page.tsx`
- `apps/admin/src/app/category-cover-assets/page.tsx`
- `apps/admin/src/app/home-issue/page.tsx`

#### 设计文件
- `xblog-redesign.pen` - Pencil 设计原型（需提交）

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动 API（端口 4000）
pnpm --filter @xblog/api dev

# 启动 Web（端口 3000）
pnpm --filter @xblog/web dev

# 启动 Admin（端口 3001）
pnpm --filter @xblog/admin dev

# 重置数据库（会删除所有数据）
cd apps/api
npx prisma migrate reset --force
```

### 环境变量

`apps/api/.env`:
```
DATABASE_URL="file:./prisma/dev.db"
SESSION_SECRET="dev-secret-change-in-production"
```

### 下一步工作建议

1. **视觉验证**：对比 frankchimero.com，微调首页间距和字号
2. **Admin 重做**：应用新设计系统到所有 Admin 页面
3. **搜索功能**：实现全文搜索（Prisma fulltext 或 Algolia）
4. **部署准备**：配置生产环境数据库和对象存储

### 备注

- 当前使用 SQLite 本地开发，生产环境需切换回 PostgreSQL
- 图片路径 `/images/*` 存放在 `apps/web/public/images/`
- ICP 备案信息仅在 frontend 页面显示：皖ICP备2026007447号 皖公网安备34010402704764号
- 联系方式：943483255@qq.com, github.com/ProfilePlus
