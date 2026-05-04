# Market Router 品牌重构 TODO

## Phase 1-5: 已完成（品牌基础/初版 Landing/多语言/主题/收尾）

## Phase 6: Landing Page 视觉增强（已完成）

## Phase 7: ctxdc 风格全面重设计

### 7.1 CSS 基础与字体
- [x] 引入 JetBrains Mono + Inter 字体（Google Fonts preload）
- [x] 定义 Landing Page 专属 CSS 变量（foreground/10, foreground/20, foreground/40, primary/5, primary/10）
- [x] 深色背景改为 #09090b，亮色保持 #ffffff
- [x] 添加 diagonal-pattern 对角线装饰 CSS
- [x] 添加 radial-glow 径向光晕 CSS
- [x] 添加滚动入场动画工具类（Intersection Observer + reveal class）

### 7.2 SectionHeader 组件
- [x] 创建 `SectionHeader` 组件（12 列 grid，编号标签 + 代码化标题 + 右侧操作）
- [x] 编号格式：`01 // providers`，text-[10px] tracking-[0.3em] foreground/40
- [x] 标题格式：`import { providers } from "./ecosystem"`，primary 高亮关键词

### 7.3 ScenarioCard 组件
- [x] 创建 `ScenarioCard` 组件替代 GlowCard
- [x] 黄金比例上部区域（aspect-[1.618/1]）+ 径向光晕 + 旋转方形装饰
- [x] 索引行：`use[0]`，text-[9px] tracking-widest
- [x] 标题行：text-sm font-light font-heading
- [x] 标签行：`["agent", "langchain"]`，text-[8px]，右侧显示节省信息

### 7.4 背景动画升级
- [x] 创建 GameOfLifeBackground 组件替代 NetworkBackground
- [x] 网格颜色用 primary/8，半透明网格线 foreground/3
- [x] 添加 prefers-reduced-motion 媒体查询

### 7.5 Hero 重构
- [x] 标题改为 font-light（纤细字重），去掉 shine-text
- [x] 关键词用 primary 色高亮（Smart）
- [x] 副标题改为 `const router = connect(...)` 代码格式
- [x] 统计条改为 grid 分隔样式，border-r border-foreground/10 分隔
- [x] 顶部微标签 `// market-router`

### 7.6 场景区重构
- [x] 用 SectionHeader（`02 // use-cases`）替代普通标题
- [x] 6 张 ScenarioCard，3 列网格，border 分隔
- [x] hover 时卡片高亮（bg-primary/5，索引和标题变为 primary 色）

### 7.7 优势区重构
- [x] 用 SectionHeader（`03 // advantages`）替代普通标题
- [x] 4 列 grid，用 border-r border-foreground/10 分隔
- [x] 每项带 feature[i] 索引标签

### 7.8 快速开始区调整
- [x] TerminalBlock 去掉红黄绿圆点，改为 `// terminal` 微标签
- [x] 边框改为 border-foreground/10 风格
- [x] 用 SectionHeader（`04 // quickstart`）

### 7.9 CTA + Footer
- [x] CTA 区域添加代码化标题 `router.start()`
- [x] Footer 保持简化单行

### 7.10 亮色模式适配
- [x] Landing Page CSS 变量区分 html.dark .landing 和 .landing
- [x] 背景动画在亮色模式下降低颜色透明度

### 7.11 性能优化
- [x] prefers-reduced-motion 关闭动画和隐藏 canvas
- [x] Landing Page CSS 类名 `.landing` 隔离，不影响控制台内页
