# Market Router 品牌重构 TODO

## Phase 1: 品牌基础

- [x] 移除 CLAUDE.md 中 Rule 5 对原始品牌的保护规则
- [x] 设计 Market Router Logo（SVG + PNG + ICO）
- [x] 替换 `web/public/logo.png` 和 `web/public/favicon.ico`
- [x] 替换 `web/index.html` 中的 title、meta description、favicon 引用
- [x] 替换 `web/src/helpers/utils.jsx` 中 `getSystemName()` 默认值为 "Market Router"
- [x] 替换 `web/src/index.jsx` 中控制台欢迎信息
- [x] 替换 `web/src/pages/About/index.jsx` 中仓库链接为动态品牌信息
- [x] 替换 `web/src/components/layout/Footer.jsx` 中硬编码链接为 `getServerAddress()` 动态获取
- [x] 更新 7 个 i18n JSON 文件中所有 "New API" 相关 key 的翻译
- [x] 检查并替换后端 Go 代码中 API 错误信息里的 `new_api_error` 字段
- [x] 添加 apple-touch-icon
- [x] 更新 PWA manifest（不存在，无需处理）

## Phase 2: Landing Page 初版

- [x] 重构 `web/src/pages/Home/index.jsx` 整体结构
- [x] Hero Section：品牌 slogan + 副标题 + 双 CTA
- [x] 信任背书区：AI 提供商 Logo 墙
- [x] 6 个场景卡片（Agents/Vibe Coding/工作流/Vibe Design/企业/开发者）
- [x] 核心优势区（智能路由/成本优化/高可用/安全合规）
- [x] 快速开始区（3 步流程）
- [x] Footer 重构

## Phase 3: 多语言

- [x] Landing Page 三语文案（zh-CN/en/ja）
- [x] 7 个语言文件品牌名批量替换

## Phase 4: 主题优化初版

- [x] 定义品牌色并覆盖 Semi Design CSS 变量
- [x] 更新 `web/tailwind.config.js` 扩展品牌色

## Phase 5: 细节收尾

- [x] Open Graph + Twitter Card 标签
- [x] 后端 SystemName / error type / OpenRouter 请求头品牌名替换
- [x] 全局残留品牌名清理

## Phase 6: Landing Page 视觉增强

### 6.1 Hero Section 增强
- [ ] 创建 `NetworkBackground` 组件（Canvas 网络节点连线动画）
- [ ] 替换 Hero 的 blur-ball 背景为 NetworkBackground
- [ ] 标题改用等宽字体，副标题改为代码注释风格
- [ ] 添加数据信任条（40+ 提供商 / 99.9% 可用性 / <50ms 延迟 / 节省 40-60%）

### 6.2 场景卡片增强
- [ ] 创建 `GlowCard` 组件（hover 发光边框效果）
- [ ] 每张卡片顶部添加代码片段（mono 字体伪代码）
- [ ] 卡片布局改为不等高 masonry 风格（前两张 2:1 分布）

### 6.3 快速开始区增强
- [ ] 创建 `TerminalBlock` 组件（终端窗口样式）
- [ ] 3 个步骤改为终端命令行格式展示

### 6.4 优势区增强
- [ ] 去掉 emoji，改用 SVG 线条图标
- [ ] 添加 `CountUp` 数字滚动动画组件

### 6.5 全局主题增强
- [ ] 深色模式背景改为 #0a0a12（微蓝色调）+ CSS 噪声纹理
- [ ] 亮色模式卡片添加极浅紫色边框
- [ ] Hero 背景动画在亮色模式下降低不透明度

### 6.6 Footer 简化
- [ ] 简化为单行（品牌名 + 版权 + 语言切换 + 主题切换）

### 6.7 多语言更新
- [ ] 更新三语 i18n 文件中新增/修改的文案 key
