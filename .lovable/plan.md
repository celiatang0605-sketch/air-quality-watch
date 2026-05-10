## 目标
对当前「空气点评」做一次定点收口：标准手机容器 + 滚动修复 + 笔记瀑布流 + 城市级联动。**不重构现有业务逻辑**，只调整容器/样式/城市数据与笔记列表渲染。

## 一、手机容器与滚动（App.tsx + Index.tsx 顶层）

在 `App.tsx`（或 Index.tsx 顶层）加一层 `<PhoneShell>` 包裹整个 App：

```text
body (#f3f4f6, min-h-screen, flex center)
└── 390×844 容器 (rounded-[2rem] overflow-hidden bg-background relative)
    ├── 顶部 StatusBar (44px, 9:41 / 标题 / 100%)
    ├── 主滚动区 (flex-1 overflow-y-auto overflow-x-hidden, -webkit-overflow-scrolling: touch, pb-24)
    └── 底部 BottomNav (absolute bottom-0, 仅在主 Tab 页显示)
```

- 桌面预览居中，移动端 `max-w-screen max-h-screen` 自动铺满。
- Toast/Dialog 容器用 portal target = 手机容器，确保不超出。
- 表单页（写评价/发笔记/添加场所/提现）隐藏 BottomNav，提交按钮 sticky bottom。
- 全站隐藏横向滚动条：`overflow-x: hidden` + 现有横滑分类改成 grid。

## 二、城市统一为城市级

- 全局 `currentCity` 改为纯城市名，默认 `"上海市"`。
- `CITIES` 常量替换为新的热门 + 全国列表（按拼音首字母分组）。
- `places` 数据每条增加 `city` 字段；移除名称/地址中的"（静安店）"等区级展示（数据保留，UI 只读 `city`）。
- `notes` 的 `placeArea` 改为 `city`（如 "上海市"），渲染处用 `city` 替代。
- 涉及城市展示的位置统一用 `currentCity` 渲染：
  - 首页 836 行 MapPin
  - 我的页面用户信息区 1542 行
  - 写评价、发笔记、添加场所"当前城市"
  - 排行榜标题：`${currentCity}无烟榜单`
  - 设置页城市项

## 三、跨城市数据补充

补充 8 城市 ×3 场所（上海/北京/深圳/广州/杭州/成都/武汉/南京），每条带 `city` 与匹配类型的真实图片 URL。

## 四、城市联动过滤

新增 helper：`placesByCity = places.filter(p => p.city === currentCity)`。
- 首页推荐、搜索、分类、排行榜均基于 `placesByCity` 渲染。
- 写评价 / 添加新场所提交时写入 `city: currentCity`。
- 切换城市后跳回首页 + Toast `已切换到 X市`。

## 五、新增「选择城市」全屏页

替换当前设置页内的 city 弹层为独立页面 `CitySelectPage`：
- 顶部返回 + 标题"选择城市"
- 搜索框（支持中文 + 拼音首字母 sh/sz/hz/bj/gz/cd/wh/nj…）
- 当前城市卡片
- 热门城市 16 个 chip
- A–Z 分组列表
- 入口：首页左上角 city、我的页面 city、设置页城市切换项

## 六、笔记页改双列瀑布流（NotesPlazaPage）

- 顶部搜索 + 筛选标签横向行（隐藏滚动条 `scrollbar-hide`）
- 列表容器：`grid grid-cols-2 gap-3`
- `NoteCard` 重写为竖向卡片：
  ```text
  [封面 110–140px object-cover]
  正文 line-clamp-2
  场所名 line-clamp-1
  [头像+昵称 | 👍数 🔖]
  右上角 +10 积分小标签
  ```
- 单卡 ≤230px，首屏可见 4 条。
- 点击卡片进入笔记详情页（已有则复用，未有则新增简版 `NoteDetailPage`）。
- 发笔记成功后跳转 `notes` Tab，新笔记置顶（已有逻辑保留）。

## 七、保留功能清单（验收）
登录、手机号登录、搜索、分类、详情、收藏、最近浏览、写评价 +5 分、发笔记 +10 分、笔记进详情、排行榜进详情、提现入口、Phantom 连接、积分记录、帮助、设置、退出登录。控制台无 Runtime error。

## 技术细节
- 文件改动集中在 `src/pages/Index.tsx`（容器、StatusBar、城市状态、CITIES、places city 字段、过滤、NotesPlazaPage、CitySelectPage、NoteDetailPage）+ `src/index.css`（`scrollbar-hide` util、phone shell 样式）+ `src/App.tsx`（可选包裹 PhoneShell）。
- 不动 `src/lib/solana/*`、不改 IDL、不改 package.json。
- `placeArea` 字段保留兼容（旧数据不报错），UI 优先 `city`。
- 所有新场所图片用稳定 Unsplash URL，`onError` fallback 走现有 `PlaceImg` 类型表。