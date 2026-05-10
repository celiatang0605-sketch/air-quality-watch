import { createClient } from "@supabase/supabase-js";

// 外部 Supabase 项目（publishable key 可公开放在前端）
const SUPABASE_URL = "https://oiwvaaurfgvcvqmkfaph.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_adGZFZGJ8GFKUF1W6GsxtQ_5cfuCTNr";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

const PLACEHOLDER_COVER = "/placeholder.svg";

/**
 * 读取场所首图：
 * 1) venues.cover_image_url
 * 2) 该场所最早一条带图评价的第一张图（review_images 按 review.created_at + sort_order 升序）
 * 3) 占位图
 */
export async function getVenueCoverUrl(venueId: string): Promise<string> {
  try {
    const { data: venue } = await supabase
      .from("venues")
      .select("cover_image_url")
      .eq("id", venueId)
      .maybeSingle();

    if (venue?.cover_image_url) return venue.cover_image_url;

    const { data: imgs } = await supabase
      .from("review_images")
      .select("url, sort_order, reviews!inner(created_at)")
      .eq("venue_id", venueId)
      .order("created_at", { foreignTable: "reviews", ascending: true })
      .order("sort_order", { ascending: true })
      .limit(1);

    if (imgs && imgs.length > 0) return imgs[0].url;
  } catch (e) {
    console.warn("getVenueCoverUrl failed", e);
  }
  return PLACEHOLDER_COVER;
}

/**
 * 批量读取多个场所首图，返回 Map<venueId, url>
 */
export async function getVenueCoverUrls(
  venueIds: string[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (venueIds.length === 0) return result;

  const { data: venues } = await supabase
    .from("venues")
    .select("id, cover_image_url")
    .in("id", venueIds);

  const missing: string[] = [];
  venueIds.forEach((id) => {
    const v = venues?.find((x) => x.id === id);
    if (v?.cover_image_url) result[id] = v.cover_image_url;
    else missing.push(id);
  });

  // 兜底：每个 missing 单独查最早带图评价
  await Promise.all(
    missing.map(async (id) => {
      result[id] = await getVenueCoverUrl(id);
    })
  );

  return result;
}

/**
 * 上传评价图片到 storage，返回 public URL 数组
 */
export async function uploadReviewImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
    const { error } = await supabase.storage
      .from("review-images")
      .upload(path, file, { upsert: false });
    if (error) {
      console.error("upload failed", error);
      continue;
    }
    const { data } = supabase.storage.from("review-images").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}

/**
 * 提交评价 + 图片，并在场所首图为空时自动写入。
 */
export async function submitReviewWithImages(params: {
  venueId: string;
  userId?: string | null;
  content?: string;
  imageUrls: string[];
}): Promise<{ reviewId: string | null; coverUpdated: boolean }> {
  const { venueId, userId, content, imageUrls } = params;

  const { data: review, error: reviewErr } = await supabase
    .from("reviews")
    .insert({ venue_id: venueId, user_id: userId ?? null, content: content ?? null })
    .select("id")
    .single();

  if (reviewErr || !review) {
    console.error("insert review failed", reviewErr);
    return { reviewId: null, coverUpdated: false };
  }

  if (imageUrls.length > 0) {
    const rows = imageUrls.map((url, idx) => ({
      review_id: review.id,
      venue_id: venueId,
      url,
      sort_order: idx,
    }));
    const { error: imgErr } = await supabase.from("review_images").insert(rows);
    if (imgErr) console.error("insert review_images failed", imgErr);
  }

  let coverUpdated = false;
  if (imageUrls.length > 0) {
    const { data: venue } = await supabase
      .from("venues")
      .select("cover_image_url")
      .eq("id", venueId)
      .maybeSingle();

    if (venue && !venue.cover_image_url) {
      const { error: updErr } = await supabase
        .from("venues")
        .update({ cover_image_url: imageUrls[0] })
        .eq("id", venueId);
      if (!updErr) coverUpdated = true;
    }
  }

  return { reviewId: review.id, coverUpdated };
}
