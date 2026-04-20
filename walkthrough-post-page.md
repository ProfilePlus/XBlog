# XBlog 博文详情页还原 Walkthrough

## 完成内容

根据 `alex-plum-blog/post.html` 百分百还原了博文详情页设计。

## 修改文件

### 1. `apps/web/src/app/articles/[slug]/page.tsx`

完全重写，采用与 HTML 一致的结构：

- **post-hero 区域**：顶部居中 logo，链接回首页
- **header 区域**：标题 (h1)、副标题 (h2)、发布时间 (time)
- **article-wrap**：文章内容容器，最大宽度 42rem
- **post-navigation**：底部上下篇导航

**Block 渲染逻辑**：
- `paragraph`: 普通段落
- `image`: 支持 full/half/normal 三种布局，使用 CSS class `full`/`limit`
- `heading`: h2 标题
- `quote`: blockquote 引用块
- `list`: ol/ul 列表
- `code`: pre + code 代码块
- `divider`: hr 分隔线

**关键改动**：
- 去掉所有内联样式，完全依赖 globals.css
- 最外层 div 添加 `className="post"` 和内联样式覆盖 body 的 index 背景色
- logo 使用 Next.js Image 组件，尺寸 44x44

### 2. `apps/web/src/app/globals.css`

添加 `.post-hero img` 样式规则：

```css
.post-hero img {
    width: 44px;
    height: 44px;
    opacity: 0.7;
    transition: opacity 0.2s ease;
    mix-blend-mode: multiply;
    border-radius: 50%;
    margin-bottom: 2rem;
}
.post-hero:hover img { opacity: 1; }
```

这确保 logo 有正确的圆形、透明度、混合模式和 hover 效果。

## 设计还原要点

1. **配色方案**：浅色主题 (#e6e2e0 背景，#151515 文字)
2. **字体**：标题用 Playfair Display (serif)，正文用 Newsreader (serif)，UI 用 IBM Plex Sans
3. **布局**：居中单栏，最大宽度 42rem (672px)
4. **视觉细节**：
   - logo 圆形裁剪，multiply 混合模式，hover 时不透明度变为 1
   - 标题 2.5rem，副标题灰色
   - 导航区域左右分布，灰色文字

## 测试

访问 http://127.0.0.1:3000/articles/why-rebuild-xblog 可查看效果。

## 已知限制

- body 上的 `index` class 会影响全局 CSS 变量，因此在最外层 div 用内联样式强制覆盖背景色和文字色
- 未来可考虑让 layout.tsx 根据路由动态设置 body class
