## 目标

使用您提供的外部 Supabase 凭证接入项目，并在此基础上实现「场所首图绑定」功能。

- Supabase URL: `https://oiwvaaurfgvcvqmkfaph.supabase.co`
- Publishable Key: `sb_publishable_adGZFZGJ8GFKUF1W6GsxtQ_5cfuCTNr`（新版 anon 等价 key，可放入前端代码）

## 重要前置说明

您并未通过 Lovable 的 Supabase OAuth 集成连接，而是直接给了凭证。这意味着：

1. 我**无法在您的 Supabase 项目里自动建表 / 改 RLS / 创建 Storage bucket**。需要您在 Supabase Dashboard 自己执行一次 SQL（我会提供完整脚本）。
2. 我只能在前端使用 publishable key 进行受 RLS 控制的读写。
3. 后续如需更深度的服务端能力（边缘函数、密钥），建议改用 Lovable Cloud 或走 Lovable 的 Supabase OAuth 集成。

## 实施步骤

### 1. 前端接入 Supabase
- `bun add @supabase/supabase-js`
- 新建 `src/lib/supabase.ts`，使用上述 URL + publishable key 初始化 client（直接硬编码，publishable key 可公开）
- 不引入 `.env`，与现有 Lovable 项目约定一致

### 2. 数据库 schema（您需要在 Supabase SQL Editor 执行）

```sql
-- 场所
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cover_image_url text,
  created_at timestamptz default now()
);

-- 评价
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references public.venues(id) on delete cascade,
  user_id uuid,
  content text,
  created_at timestamptz default now()
);

-- 评价图片（顺序由 sort_order 决定，第一张即 sort_order=0）
create table public.review_images (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references public.reviews(id) on delete cascade,
  venue_id uuid references public.venues(id) on delete cascade,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz default now()
);

-- 开放读 + 允许匿名写（演示用；生产请换成 auth.uid() 限制）
alter table venues enable row level security;
alter table reviews enable row level security;
alter table review_images enable row level security;

create policy "read venues" on venues for select using (true);
create policy "update venue cover" on venues for update using (true) with check (true);
create policy "read reviews" on reviews for select using (true);
create policy "insert reviews" on reviews for insert with check (true);
create policy "read review_images" on review_images for select using (true);
create policy "insert review_images" on review_images for insert with check (true);

-- Storage bucket
insert into storage.buckets (id, name, public) values ('review-images','review-images', true)
on conflict do nothing;

create policy "public upload" on storage.objects for insert
  to anon, authenticated with check (bucket_id = 'review-images');
create policy "public read" on storage.objects for select
  using (bucket_id = 'review-images');
```

### 3. 首图绑定业务逻辑（前端）

封装 `getVenueCoverUrl(venueId)`：

```text
1) 查 venues.cover_image_url，非空 → 返回
2) 否则查该 venue 最早一条带图评价的第一张图：
   select ri.url
   from review_images ri
   join reviews r on r.id = ri.review_id
   where ri.venue_id = $1
   order by r.created_at asc, ri.sort_order asc
   limit 1
3) 仍无 → 返回默认占位图
```

提交评价的流程：
1. 上传图片到 `review-images` bucket，得到 public URL 数组
2. 插入 `reviews` 记录
3. 批量插入 `review_images`（带 `sort_order`，第一张为 0）
4. 读取 `venues.cover_image_url`：
   - 为空 → `update venues set cover_image_url = <第一张图 url> where id = venue_id`
   - 非空 → 不动

### 4. 页面接入

- 场所详情页顶部首图：调用 `getVenueCoverUrl`
- 场所列表页 / 榜单页 / 搜索结果页：同样调用，保持一致
- 当前 `src/pages/Index.tsx` 内是 mock 数据；将"场所图片"字段替换为调用 `getVenueCoverUrl`，并在加载时批量预取（一次性 `select id, cover_image_url from venues where id in (...)` + 兜底查询）

### 5. 保留事项

评价、笔记、收藏、举报、纠错、积分逻辑、Phantom 兑换页、排行榜样式全部不动，只新增首图相关读写。

## 需要您做的事

1. 打开 Supabase SQL Editor，粘贴并执行上面的 schema
2. 确认无烟数据是否要保留现有 mock，还是要把 mock 场所迁入数据库（迁入才能真正写 cover_image_url）
3. 回复我确认，我会进入 build 模式实施第 1、3、4 步