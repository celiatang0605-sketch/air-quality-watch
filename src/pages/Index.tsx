import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { connectPhantom, exchangePoints, getPhantom, POINTS_PER_EXCHANGE } from "@/lib/solana/exchange";
import {
  MapPin, Search, Wind, Heart, Bookmark, Bell, ChevronRight,
  Home, Trophy, PlusCircle, User, Coffee, Utensils, ShoppingBag, Hotel,
  Film, Mic2, Dumbbell, BookOpen, CupSoda, Building2, ArrowLeft, Camera,
  Award, Eye, LogOut, Check, Cigarette, ShieldCheck,
  Phone, Clock, Copy, Trash2, X, Settings, AlertTriangle, FileEdit,
  HelpCircle, ChevronDown, Type as TypeIcon, MapPinned,
  FileText, Edit3, ArrowUpRight, Wallet, ThumbsUp,
} from "lucide-react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

type Category =
  | "全部" | "餐厅" | "咖啡馆" | "商场" | "酒店"
  | "电影院" | "KTV" | "健身房" | "书店" | "奶茶店" | "写字楼";

type ReviewItem = {
  id: string;
  user: string;
  avatar: string;
  time: string;
  sign: "有" | "无";
  smoker: "有" | "无";
  smell: "有" | "无";
  staff: "有" | "无" | "没看到";
  text: string;
  score: number;
};

type NoteItem = {
  id: string;
  user: string;
  avatar: string;
  time: string;
  text: string;
  tags: string[];
  cover: string; // image url
  placeName: string;
  placeType: Exclude<Category, "全部">;
  placeArea?: string;
  pointAward?: number;
  likes?: number;
  isLiked?: boolean;
  isCollected?: boolean;
};

type Place = {
  id: number;
  name: string;
  type: Exclude<Category, "全部">;
  city: string;
  address: string;
  distance: string;
  reviewCount: number;
  smokeReports: number;
  tags: string[];
  img: string; // real image URL
  businessHours: string;
  phone: string;
  reviews: ReviewItem[];
  notes: NoteItem[];
};

const CATEGORIES: { key: Exclude<Category, "全部">; icon: any }[] = [
  { key: "餐厅", icon: Utensils },
  { key: "咖啡馆", icon: Coffee },
  { key: "商场", icon: ShoppingBag },
  { key: "酒店", icon: Hotel },
  { key: "电影院", icon: Film },
  { key: "KTV", icon: Mic2 },
  { key: "健身房", icon: Dumbbell },
  { key: "书店", icon: BookOpen },
  { key: "奶茶店", icon: CupSoda },
  { key: "写字楼", icon: Building2 },
];

const TYPE_IMG: Record<Exclude<Category, "全部">, string> = {
  "咖啡馆": "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&q=70&auto=format&fit=crop",
  "餐厅": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=70&auto=format&fit=crop",
  "商场": "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=400&q=70&auto=format&fit=crop",
  "酒店": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=70&auto=format&fit=crop",
  "电影院": "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=70&auto=format&fit=crop",
  "KTV": "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&q=70&auto=format&fit=crop",
  "健身房": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=70&auto=format&fit=crop",
  "书店": "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&q=70&auto=format&fit=crop",
  "奶茶店": "https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=400&q=70&auto=format&fit=crop",
  "写字楼": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=70&auto=format&fit=crop",
};

const TYPE_IMG_FALLBACK: Record<Exclude<Category, "全部">, string> = {
  "咖啡馆": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=70&auto=format&fit=crop",
  "餐厅": "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=70&auto=format&fit=crop",
  "商场": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=70&auto=format&fit=crop",
  "酒店": "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&q=70&auto=format&fit=crop",
  "电影院": "https://images.unsplash.com/photo-1562440499-64c9a111f713?w=400&q=70&auto=format&fit=crop",
  "KTV": "https://images.unsplash.com/photo-1525362081669-2b476bb628c3?w=400&q=70&auto=format&fit=crop",
  "健身房": "https://images.unsplash.com/photo-1546171753-97d7676e4602?w=400&q=70&auto=format&fit=crop",
  "书店": "https://images.unsplash.com/photo-1504675099198-7023dd85f5a3?w=400&q=70&auto=format&fit=crop",
  "奶茶店": "https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&q=70&auto=format&fit=crop",
  "写字楼": "https://images.unsplash.com/photo-1581375074612-d1fd0e661aeb?w=400&q=70&auto=format&fit=crop",
};

function PlaceImg({ src, type, alt, className }: { src: string; type: Exclude<Category, "全部">; alt?: string; className?: string }) {
  return (
    <img
      src={src || TYPE_IMG[type]}
      alt={alt || type}
      loading="lazy"
      className={className}
      onError={(e) => {
        const el = e.currentTarget;
        const fb = TYPE_IMG_FALLBACK[type];
        if (el.src !== fb) el.src = fb;
      }}
    />
  );
}

/* ============== 评分规则 ============== */
function scoreFromAnswers(a: { sign: string; smoker: string; smell: string; staff: string }) {
  let s = 0;
  if (a.sign === "有") s += 1;
  if (a.smoker === "无") s += 1.5;
  if (a.smell === "无") s += 1.5;
  if (a.staff === "有" || a.staff === "是") s += 1;
  return Math.min(5, s);
}
function statusOf(score: number): { label: string; tone: "good" | "ok" | "watch" | "bad" } {
  if (score >= 4.5) return { label: "无烟友好", tone: "good" };
  if (score >= 3.5) return { label: "基本良好", tone: "ok" };
  if (score >= 2.5) return { label: "需要观察", tone: "watch" };
  return { label: "吸烟反馈较多", tone: "bad" };
}

const seedReview = (p: Partial<ReviewItem>): ReviewItem => {
  const base = {
    sign: "有", smoker: "无", smell: "无", staff: "有",
    text: "环境不错，空气清新。",
    user: "无烟达人", avatar: "🌿", time: "2 天前",
    ...p,
  } as ReviewItem;
  base.score = scoreFromAnswers(base);
  base.id = base.id || Math.random().toString(36).slice(2);
  return base;
};

const PLACES_INIT: Place[] = [
  {
    id: 1, name: "M Stand 咖啡（兴业太古汇店）", type: "咖啡馆",
    city: "上海市", address: "南京西路 789 号", distance: "320m",
    reviewCount: 286, smokeReports: 2,
    tags: ["全店无烟", "空气清爽", "有提示牌"], img: TYPE_IMG["咖啡馆"],
    businessHours: "08:00 - 22:00", phone: "021-6288 1234",
    reviews: [
      seedReview({ user: "清新呼吸", avatar: "🍃", time: "1 小时前", text: "进门就有无烟标志，整个店没有任何烟味。" }),
      seedReview({ user: "拿铁拿铁", avatar: "☕", time: "今天", text: "工作人员会主动劝阻，体验非常好。" }),
    ], notes: [],
  },
  {
    id: 2, name: "鼎泰丰（恒隆店）", type: "餐厅",
    city: "上海市", address: "恒隆广场 6F", distance: "510m",
    reviewCount: 1024, smokeReports: 5,
    tags: ["室内无烟", "工作人员劝阻"], img: TYPE_IMG["餐厅"],
    businessHours: "10:30 - 22:00", phone: "021-6279 9999",
    reviews: [seedReview({ user: "小笼控", avatar: "🥟", text: "包间也是全程无烟，赞。" })], notes: [],
  },
  {
    id: 3, name: "兴业太古汇", type: "商场",
    city: "上海市", address: "南京西路 789 号", distance: "300m",
    reviewCount: 532, smokeReports: 8,
    tags: ["公共区无烟", "通风良好"], img: TYPE_IMG["商场"],
    businessHours: "10:00 - 22:00", phone: "021-2230 8888",
    reviews: [seedReview({ user: "周末逛街", avatar: "🛍️", text: "中庭通风很好，没有闻到烟味。" })], notes: [],
  },
  {
    id: 4, name: "上海瑞吉酒店", type: "酒店",
    city: "上海市", address: "石门一路 288 号", distance: "1.2km",
    reviewCount: 412, smokeReports: 3,
    tags: ["无烟楼层", "大堂无烟"], img: TYPE_IMG["酒店"],
    businessHours: "全天 24 小时", phone: "021-2287 3000",
    reviews: [seedReview({ user: "差旅日常", avatar: "🧳", text: "无烟楼层很到位，大堂也清爽。" })], notes: [],
  },
  {
    id: 5, name: "万达影城（大宁店）", type: "电影院",
    city: "上海市", address: "共和新路 1898 号", distance: "2.4km",
    reviewCount: 766, smokeReports: 12,
    tags: ["影厅无烟", "走廊偶有烟味"], img: TYPE_IMG["电影院"],
    businessHours: "10:00 - 次日 01:00", phone: "021-5696 5555",
    reviews: [seedReview({ user: "电影迷", avatar: "🎬", smell: "有", staff: "没看到", text: "影厅没烟，但走廊偶尔能闻到。" })], notes: [],
  },
  {
    id: 6, name: "纯K", type: "KTV",
    city: "上海市", address: "愚园路 68 号", distance: "1.8km",
    reviewCount: 198, smokeReports: 47,
    tags: ["包厢有烟味", "缺少劝阻"], img: TYPE_IMG["KTV"],
    businessHours: "12:00 - 次日 02:00", phone: "021-6248 1111",
    reviews: [seedReview({ user: "唱歌不抽烟", avatar: "🎤", sign: "无", smoker: "有", smell: "有", staff: "无", text: "包厢里烟味较重。" })], notes: [],
  },
  {
    id: 7, name: "威尔士健身", type: "健身房",
    city: "上海市", address: "南京西路 1266 号", distance: "640m",
    reviewCount: 321, smokeReports: 1,
    tags: ["全场无烟", "更衣室清新"], img: TYPE_IMG["健身房"],
    businessHours: "06:00 - 23:00", phone: "021-6133 0000",
    reviews: [seedReview({ user: "撸铁选手", avatar: "🏋️", text: "全场都禁烟，呼吸顺畅。" })], notes: [],
  },
  {
    id: 8, name: "茑屋书店（上生·新所）", type: "书店",
    city: "上海市", address: "延安西路 1262 号", distance: "3.1km",
    reviewCount: 654, smokeReports: 0,
    tags: ["阅读区无烟", "空气安静"], img: TYPE_IMG["书店"],
    businessHours: "10:00 - 22:00", phone: "021-6248 8888",
    reviews: [seedReview({ user: "书页香", avatar: "📚", text: "阅读区非常安静且空气好。" })], notes: [],
  },
  {
    id: 9, name: "喜茶 LAB（张园店）", type: "奶茶店",
    city: "上海市", address: "茂名北路 张园西区", distance: "880m",
    reviewCount: 410, smokeReports: 4,
    tags: ["室内无烟", "有提示牌"], img: TYPE_IMG["奶茶店"],
    businessHours: "10:00 - 22:30", phone: "400-021-1234",
    reviews: [seedReview({ user: "奶茶星人", avatar: "🧋", text: "室内非常干净，没有烟味。" })], notes: [],
  },
  {
    id: 10, name: "凯德 Mall 写字楼大厅", type: "写字楼",
    city: "上海市", address: "愚园路 168 号", distance: "1.0km",
    reviewCount: 156, smokeReports: 6,
    tags: ["大堂无烟", "电梯口偶有"], img: TYPE_IMG["写字楼"],
    businessHours: "07:00 - 22:00", phone: "021-3220 0000",
    reviews: [seedReview({ user: "通勤打工人", avatar: "💼", smell: "有", staff: "没看到", text: "大堂无烟，电梯口偶尔有人抽。" })], notes: [],
  },

  // 北京市
  { id: 101, name: "Seesaw 咖啡（三里屯店）", type: "咖啡馆", city: "北京市", address: "三里屯太古里南区", distance: "450m", reviewCount: 312, smokeReports: 3, tags: ["全店无烟", "环境清爽"], img: TYPE_IMG["咖啡馆"], businessHours: "08:00 - 22:00", phone: "010-6417 1234", reviews: [seedReview({ user: "京味咖啡", avatar: "☕", text: "店里禁烟标志很明显，空气很好。" })], notes: [] },
  { id: 102, name: "全聚德（前门店）", type: "餐厅", city: "北京市", address: "前门大街 30 号", distance: "1.5km", reviewCount: 1280, smokeReports: 6, tags: ["大厅无烟", "包间无烟"], img: TYPE_IMG["餐厅"], businessHours: "11:00 - 22:00", phone: "010-6701 1888", reviews: [seedReview({ user: "胡同游", avatar: "🦆", text: "大厅完全没有烟味。" })], notes: [] },
  { id: 103, name: "三里屯太古里", type: "商场", city: "北京市", address: "工体北路 19 号", distance: "300m", reviewCount: 980, smokeReports: 9, tags: ["公共区无烟", "通风良好"], img: TYPE_IMG["商场"], businessHours: "10:00 - 22:00", phone: "010-6417 6688", reviews: [seedReview({ user: "潮人逛街", avatar: "🛍️", text: "通风做得很好。" })], notes: [] },

  // 深圳市
  { id: 201, name: "% Arabica（万象天地店）", type: "咖啡馆", city: "深圳市", address: "深南大道 9668 号", distance: "520m", reviewCount: 410, smokeReports: 1, tags: ["全店无烟"], img: TYPE_IMG["咖啡馆"], businessHours: "08:00 - 22:00", phone: "0755-8888 1234", reviews: [seedReview({ user: "鹏城拿铁", avatar: "☕", text: "整个店无烟，体验非常好。" })], notes: [] },
  { id: 202, name: "海底捞（万象城店）", type: "餐厅", city: "深圳市", address: "宝安南路 1881 号", distance: "1.1km", reviewCount: 2103, smokeReports: 4, tags: ["室内无烟", "工作人员劝阻"], img: TYPE_IMG["餐厅"], businessHours: "10:00 - 次日 02:00", phone: "0755-2580 0000", reviews: [seedReview({ user: "麻辣星人", avatar: "🍲", text: "室内全程无烟，舒服。" })], notes: [] },
  { id: 203, name: "喜茶（深业上城店）", type: "奶茶店", city: "深圳市", address: "皇岗路 5001 号", distance: "780m", reviewCount: 612, smokeReports: 2, tags: ["室内无烟", "有提示牌"], img: TYPE_IMG["奶茶店"], businessHours: "10:00 - 22:30", phone: "400-021-1234", reviews: [seedReview({ user: "奶茶女孩", avatar: "🧋", text: "店里干净没有烟味。" })], notes: [] },

  // 广州市
  { id: 301, name: "陶陶居（北京路店）", type: "餐厅", city: "广州市", address: "北京路 388 号", distance: "600m", reviewCount: 1530, smokeReports: 5, tags: ["大堂无烟"], img: TYPE_IMG["餐厅"], businessHours: "07:00 - 22:00", phone: "020-8338 8888", reviews: [seedReview({ user: "早茶达人", avatar: "🥟", text: "早茶环境无烟很舒服。" })], notes: [] },
  { id: 302, name: "天环广场", type: "商场", city: "广州市", address: "天河路 218 号", distance: "1.0km", reviewCount: 880, smokeReports: 7, tags: ["公共区无烟"], img: TYPE_IMG["商场"], businessHours: "10:00 - 22:00", phone: "020-3878 8888", reviews: [seedReview({ user: "羊城逛街", avatar: "🛍️", text: "通风很好。" })], notes: [] },
  { id: 303, name: "广州瑰丽酒店", type: "酒店", city: "广州市", address: "珠江东路 222 号", distance: "2.0km", reviewCount: 360, smokeReports: 1, tags: ["无烟楼层", "大堂无烟"], img: TYPE_IMG["酒店"], businessHours: "全天 24 小时", phone: "020-8883 6688", reviews: [seedReview({ user: "差旅熟客", avatar: "🧳", text: "无烟楼层很安静。" })], notes: [] },

  // 杭州市
  { id: 401, name: "西湖国宾馆", type: "酒店", city: "杭州市", address: "杨公堤 18 号", distance: "1.8km", reviewCount: 290, smokeReports: 0, tags: ["无烟环境", "庭院清新"], img: TYPE_IMG["酒店"], businessHours: "全天 24 小时", phone: "0571-8797 9889", reviews: [seedReview({ user: "湖畔住客", avatar: "🧳", text: "环境优雅，没有烟味。" })], notes: [] },
  { id: 402, name: "外婆家（湖滨店）", type: "餐厅", city: "杭州市", address: "湖滨路 88 号", distance: "950m", reviewCount: 1820, smokeReports: 6, tags: ["大堂无烟"], img: TYPE_IMG["餐厅"], businessHours: "10:30 - 22:00", phone: "0571-8798 6666", reviews: [seedReview({ user: "杭帮菜", avatar: "🍚", text: "包厢也禁烟。" })], notes: [] },
  { id: 403, name: "晓风书屋", type: "书店", city: "杭州市", address: "体育场路 530 号", distance: "1.4km", reviewCount: 320, smokeReports: 0, tags: ["阅读区无烟"], img: TYPE_IMG["书店"], businessHours: "09:00 - 22:00", phone: "0571-8556 0000", reviews: [seedReview({ user: "西子书友", avatar: "📚", text: "安静无烟，适合看书。" })], notes: [] },

  // 成都市
  { id: 501, name: "陈麻婆豆腐", type: "餐厅", city: "成都市", address: "青华路 10 号", distance: "1.3km", reviewCount: 1450, smokeReports: 4, tags: ["大堂无烟"], img: TYPE_IMG["餐厅"], businessHours: "10:30 - 22:00", phone: "028-8754 8088", reviews: [seedReview({ user: "巴蜀食客", avatar: "🌶️", text: "大堂无烟，吃得安心。" })], notes: [] },
  { id: 502, name: "太古里", type: "商场", city: "成都市", address: "中纱帽街", distance: "700m", reviewCount: 1120, smokeReports: 8, tags: ["公共区无烟"], img: TYPE_IMG["商场"], businessHours: "10:00 - 22:00", phone: "028-8665 6688", reviews: [seedReview({ user: "蓉城逛街", avatar: "🛍️", text: "户外通风很好。" })], notes: [] },
  { id: 503, name: "方所书店", type: "书店", city: "成都市", address: "中纱帽街 8 号", distance: "750m", reviewCount: 540, smokeReports: 0, tags: ["阅读区无烟"], img: TYPE_IMG["书店"], businessHours: "10:00 - 22:00", phone: "028-8669 1525", reviews: [seedReview({ user: "成都书友", avatar: "📚", text: "空气安静干净。" })], notes: [] },

  // 武汉市
  { id: 601, name: "蔡林记（江汉路店）", type: "餐厅", city: "武汉市", address: "江汉路 55 号", distance: "880m", reviewCount: 760, smokeReports: 3, tags: ["大堂无烟"], img: TYPE_IMG["餐厅"], businessHours: "06:30 - 21:00", phone: "027-8281 2345", reviews: [seedReview({ user: "热干面爱好者", avatar: "🍜", text: "店里无烟，舒服。" })], notes: [] },
  { id: 602, name: "楚河汉街", type: "商场", city: "武汉市", address: "中北路 86 号", distance: "1.2km", reviewCount: 920, smokeReports: 7, tags: ["公共区无烟"], img: TYPE_IMG["商场"], businessHours: "10:00 - 22:00", phone: "027-8788 8888", reviews: [seedReview({ user: "江城逛街", avatar: "🛍️", text: "中庭通风好。" })], notes: [] },
  { id: 603, name: "武汉光谷凯悦酒店", type: "酒店", city: "武汉市", address: "高新大道 989 号", distance: "3.0km", reviewCount: 280, smokeReports: 1, tags: ["无烟楼层"], img: TYPE_IMG["酒店"], businessHours: "全天 24 小时", phone: "027-8773 1234", reviews: [seedReview({ user: "差旅党", avatar: "🧳", text: "无烟楼层执行到位。" })], notes: [] },

  // 南京市
  { id: 701, name: "南京大牌档（新街口店）", type: "餐厅", city: "南京市", address: "中山路 79 号", distance: "650m", reviewCount: 1320, smokeReports: 5, tags: ["大堂无烟"], img: TYPE_IMG["餐厅"], businessHours: "10:00 - 22:00", phone: "025-8470 8888", reviews: [seedReview({ user: "金陵味道", avatar: "🦆", text: "大堂禁烟，环境很好。" })], notes: [] },
  { id: 702, name: "德基广场", type: "商场", city: "南京市", address: "中山路 18 号", distance: "400m", reviewCount: 1010, smokeReports: 6, tags: ["公共区无烟"], img: TYPE_IMG["商场"], businessHours: "10:00 - 22:00", phone: "025-8470 0000", reviews: [seedReview({ user: "南京逛街", avatar: "🛍️", text: "通风很好。" })], notes: [] },
  { id: 703, name: "先锋书店（五台山店）", type: "书店", city: "南京市", address: "广州路 173 号", distance: "1.1km", reviewCount: 690, smokeReports: 0, tags: ["阅读区无烟"], img: TYPE_IMG["书店"], businessHours: "09:00 - 22:00", phone: "025-8328 0006", reviews: [seedReview({ user: "南京书友", avatar: "📚", text: "完全没有烟味。" })], notes: [] },
];

const NOTE_IMG: Record<Exclude<Category, "全部">, string> = {
  ...TYPE_IMG,
};
const SEED_NOTES: NoteItem[] = [
  { id: "n1", user: "清新呼吸", avatar: "🍃", time: "10 分钟前", placeName: "M Stand 咖啡", placeType: "咖啡馆", placeArea: "上海市", cover: TYPE_IMG["咖啡馆"], text: "店里有明显禁烟标志，整个空间都很清新，拍照也好看。", tags: ["禁烟标志", "无烟友好"], likes: 28, isLiked: false, isCollected: false, pointAward: 10 },
  { id: "n2", user: "奶茶星人", avatar: "🧋", time: "32 分钟前", placeName: "喜茶 LAB（张园店）", placeType: "奶茶店", placeArea: "上海市", cover: TYPE_IMG["奶茶店"], text: "排队区在户外，但室内完全没有烟味，店员会提醒不要吸烟。", tags: ["无烟友好", "店员劝阻"], likes: 41, isLiked: true, isCollected: false, pointAward: 10 },
  { id: "n3", user: "唱歌不抽烟", avatar: "🎤", time: "1 小时前", placeName: "纯K", placeType: "KTV", placeArea: "上海市", cover: TYPE_IMG["KTV"], text: "包厢里有残留烟味，开了通风后好一些，希望店家加强劝阻。", tags: ["有烟味反馈"], likes: 12, isLiked: false, isCollected: false, pointAward: 10 },
  { id: "n4", user: "周末逛街", avatar: "🛍️", time: "2 小时前", placeName: "兴业太古汇", placeType: "商场", placeArea: "上海市", cover: TYPE_IMG["商场"], text: "入口附近有人吸烟，但中庭通风做得很好，整体还可以接受。", tags: ["有烟味反馈", "图片笔记"], likes: 9, isLiked: false, isCollected: false, pointAward: 10 },
  { id: "n5", user: "电影迷", avatar: "🎬", time: "3 小时前", placeName: "万达影城（大宁店）", placeType: "电影院", placeArea: "上海市", cover: TYPE_IMG["电影院"], text: "大厅有禁烟提示，观影区完全无烟，体验很好。", tags: ["禁烟标志", "无烟友好"], likes: 17, isLiked: false, isCollected: false, pointAward: 10 },
  { id: "n6", user: "撸铁选手", avatar: "🏋️", time: "5 小时前", placeName: "威尔士健身", placeType: "健身房", placeArea: "上海市", cover: TYPE_IMG["健身房"], text: "门口偶尔有人抽烟，进了室内空气很好，更衣室也清新。", tags: ["无烟友好"], likes: 22, isLiked: false, isCollected: false, pointAward: 10 },
  { id: "n7", user: "书页香", avatar: "📚", time: "昨天", placeName: "茑屋书店（上生·新所）", placeType: "书店", placeArea: "上海市", cover: TYPE_IMG["书店"], text: "完全没有闻到烟味，环境安静，是看书的好地方。", tags: ["无烟友好", "禁烟标志"], likes: 35, isLiked: false, isCollected: true, pointAward: 10 },
  { id: "n8", user: "京味咖啡", avatar: "☕", time: "昨天", placeName: "Seesaw 咖啡（三里屯店）", placeType: "咖啡馆", placeArea: "北京市", cover: TYPE_IMG["咖啡馆"], text: "店员劝阻很到位，整个空间无烟。", tags: ["店员劝阻", "无烟友好"], likes: 19, isLiked: false, isCollected: false, pointAward: 10 },
  { id: "n9", user: "鹏城拿铁", avatar: "🌆", time: "2 天前", placeName: "% Arabica（万象天地店）", placeType: "咖啡馆", placeArea: "深圳市", cover: TYPE_IMG["咖啡馆"], text: "深圳的店通风好，没有烟味。", tags: ["无烟友好"], likes: 26, isLiked: false, isCollected: false, pointAward: 10 },
  { id: "n10", user: "蓉城逛街", avatar: "🐼", time: "2 天前", placeName: "太古里", placeType: "商场", placeArea: "成都市", cover: TYPE_IMG["商场"], text: "户外街区通风很好，室内空气也不错。", tags: ["无烟友好"], likes: 17, isLiked: false, isCollected: false, pointAward: 10 },
  { id: "n11", user: "西子书友", avatar: "📖", time: "3 天前", placeName: "晓风书屋", placeType: "书店", placeArea: "杭州市", cover: TYPE_IMG["书店"], text: "店里安静干净，是看书的好地方。", tags: ["禁烟标志", "无烟友好"], likes: 31, isLiked: true, isCollected: false, pointAward: 10 },
  { id: "n12", user: "夜归人", avatar: "🌙", time: "3 天前", placeName: "纯K", placeType: "KTV", placeArea: "上海市", cover: TYPE_IMG["KTV"], text: "包厢禁烟标志在墙上比较显眼，但还是有客人偷偷抽。", tags: ["禁烟标志", "有烟味反馈"], likes: 14, isLiked: false, isCollected: false, pointAward: 10 },
];

type Page =
  | "login" | "phoneLogin" | "home" | "list" | "search" | "category" | "detail"
  | "publish" | "review" | "note" | "myNotes" | "noteDetail"
  | "rank" | "me" | "favorites" | "history" | "points"
  | "addPlace" | "report" | "correction" | "help" | "settings" | "withdraw" | "citySelect";

type Tab = "home" | "rank" | "publish" | "notes" | "me";
type SortKey = "default" | "distance" | "score" | "reviews" | "smoke";
type FontSize = "standard" | "large" | "xlarge";

type PointLog = { id: string; type: string; value: number; time: string };
type WithdrawRecord = { id: string; amount: number; address: string; time: string; status: string };

export default function Index() {
  const [page, setPage] = useState<Page>("login");
  const [tab, setTab] = useState<Tab>("home");
  const [activePlace, setActivePlace] = useState<Place | null>(null);
  const [filterCat, setFilterCat] = useState<Category>("全部");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<number[]>([3, 8]);
  const [history, setHistory] = useState<{ id: number; time: string }[]>([]);
  const [points, setPoints] = useState(120);
  const [pointLogs, setPointLogs] = useState<PointLog[]>([
    { id: "p1", type: "新用户注册", value: 100, time: "5月1日 10:00" },
    { id: "p2", type: "提交评价", value: 5, time: "5月3日 14:20" },
    { id: "p3", type: "发布笔记", value: 10, time: "昨天 19:08" },
    { id: "p4", type: "提交评价", value: 5, time: "今天 10:12" },
  ]);
  const [places, setPlaces] = useState<Place[]>(PLACES_INIT);
  const [allNotes, setAllNotes] = useState<NoteItem[]>(SEED_NOTES);
  const myNotes = useMemo(() => allNotes.filter(n => n.user === "我"), [allNotes]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [city, setCity] = useState("上海市");
  const [activeNote, setActiveNote] = useState<NoteItem | null>(null);
  const [cityReturnPage, setCityReturnPage] = useState<Page>("home");
  const [fontSize, setFontSize] = useState<FontSize>("standard");
  const [notifyOn, setNotifyOn] = useState(true);
  const [searchSort, setSearchSort] = useState<SortKey>("default");
  const [catSort, setCatSort] = useState<SortKey>("default");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [withdraws, setWithdraws] = useState<WithdrawRecord[]>([]);

  const fontClass = fontSize === "large" ? "text-[17px]" : fontSize === "xlarge" ? "text-[19px]" : "text-[15px]";

  useEffect(() => {
    if (activePlace) {
      const fresh = places.find(p => p.id === activePlace.id);
      if (fresh && fresh !== activePlace) setActivePlace(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places]);

  const toggleFav = (id: number) => {
    setFavorites((f) => {
      const has = f.includes(id);
      toast.success(has ? "已取消收藏" : "已加入收藏 ❤");
      return has ? f.filter(x => x !== id) : [...f, id];
    });
  };

  const goPlace = (p: Place) => {
    setActivePlace(p);
    setPage("detail");
    setHistory(h => [{ id: p.id, time: nowLabel() }, ...h.filter(x => x.id !== p.id)].slice(0, 30));
  };

  const goTab = (t: Tab) => {
    setTab(t);
    if (t === "home") setPage("home");
    if (t === "rank") setPage("rank");
    if (t === "publish") setPage("publish");
    if (t === "notes") setPage("myNotes");
    if (t === "me") setPage("me");
  };

  const submitReview = (data: {
    sign: "有" | "无"; smoker: "有" | "无"; smell: "有" | "无"; staff: "是" | "否";
    name: string; type: Exclude<Category, "全部">; text: string;
  }) => {
    const staffMapped: "有" | "无" = data.staff === "是" ? "有" : "无";
    const newReview = seedReview({
      user: "我", avatar: "🙂", time: "刚刚",
      sign: data.sign, smoker: data.smoker, smell: data.smell, staff: staffMapped,
      text: data.text || `${data.name}的无烟评价`,
    });

    let target = activePlace;
    if (!target || target.name !== data.name) {
      const found = places.find(p => p.name === data.name && p.type === data.type);
      target = found || null;
    }

    if (target) {
      setPlaces(prev => prev.map(p => p.id === target!.id ? {
        ...p, reviews: [newReview, ...p.reviews], reviewCount: p.reviewCount + 1,
      } : p));
      setActivePlace(target);
    } else {
      // create lightweight place entry
      const id = Math.max(...places.map(p => p.id)) + 1;
      const np: Place = {
        id, name: data.name, type: data.type, city, address: city,
        distance: `${(Math.random() * 2 + 0.2).toFixed(1)}km`,
        reviewCount: 1, smokeReports: 0,
        tags: ["待审核"], img: TYPE_IMG[data.type] || TYPE_IMG["咖啡馆"],
        businessHours: "暂无", phone: "暂无",
        reviews: [newReview], notes: [],
      };
      setPlaces(prev => [np, ...prev]);
      setActivePlace(np);
    }
    setPoints(v => v + 5);
    setPointLogs(l => [{ id: rid(), type: "提交评价", value: 5, time: nowLabel() }, ...l]);
    toast.success("评价提交成功，获得 5 积分 🎉");
    setPage("detail");
  };

  const submitNote = (data: { placeId: number; images: string[]; tags: string[]; text: string }) => {
    const place = places.find(p => p.id === data.placeId);
    if (!place) { toast.error("场所信息异常"); return; }
    const newNote: NoteItem = {
      id: rid(), user: "我", avatar: "🙂", time: "刚刚",
      text: data.text || data.tags.join("、") || "分享一次无烟体验",
      tags: data.tags,
      cover: data.images[0] || place.img,
      placeName: place.name,
      placeType: place.type,
      placeArea: city,
      pointAward: 10,
      likes: 0, isLiked: false, isCollected: false,
    };
    setPlaces(prev => prev.map(p => p.id === place.id ? { ...p, notes: [newNote, ...p.notes] } : p));
    setAllNotes(prev => [newNote, ...prev]);
    setPoints(v => v + 10);
    setPointLogs(l => [{ id: rid(), type: "发布笔记", value: 10, time: nowLabel() }, ...l]);
    toast.success("笔记发布成功，获得 10 积分 ✨");
    setTab("notes");
    setPage("myNotes");
  };

  const submitNewPlace = (data: { name: string; type: Exclude<Category, "全部">; address: string }) => {
    const id = Math.max(...places.map(p => p.id)) + 1;
    const np: Place = {
      id, name: data.name, type: data.type, city, address: data.address,
      distance: `${(Math.random() * 2 + 0.2).toFixed(1)}km`,
      reviewCount: 0, smokeReports: 0,
      tags: ["待审核"], img: TYPE_IMG[data.type] || TYPE_IMG["咖啡馆"],
      businessHours: "暂无", phone: "暂无",
      reviews: [], notes: [],
    };
    setPlaces(prev => [np, ...prev]);
    setPoints(v => v + 10);
    setPointLogs(l => [{ id: rid(), type: "添加新场所", value: 10, time: nowLabel() }, ...l]);
    toast.success("场所提交成功，获得 10 积分 🎉");
    setPage("home"); setTab("home");
  };

  const connectWallet = async (silent = false): Promise<string> => {
    try {
      const addr = await connectPhantom();
      setWalletAddress(addr);
      if (!silent) toast.success("Phantom 钱包连接成功");
      return addr;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "钱包连接失败";
      if (!silent) toast.error(msg);
      return "";
    }
  };

  const submitWithdraw = async (amount: number) => {
    let addr = walletAddress;
    if (!addr) {
      addr = await connectWallet();
      if (!addr) return;
    }
    if (!amount) { toast.error("请输入提现积分数量"); return; }
    if (amount < 50) { toast.error("最低 50 积分起兑"); return; }
    if (amount > points) { toast.error("积分余额不足"); return; }

    const phantom = getPhantom();
    if (!phantom) { toast.error("未检测到 Phantom 钱包"); return; }

    const exchanges = Math.floor(amount / 50);
    const usePoints = exchanges * 50;
    const avaxAmount = exchanges * 0.01;

    const t = toast.loading("正在调用智能合约，请在钱包中确认...");
    try {
      let lastSig = "";
      for (let i = 0; i < exchanges; i++) {
        lastSig = await exchangePoints(phantom);
      }
      setPoints(v => v - usePoints);
      setPointLogs(l => [{ id: rid(), type: `链上兑换 AVAX`, value: -usePoints, time: nowLabel() }, ...l]);
      setWithdraws(w => [{
        id: rid(), amount: usePoints, address: addr, time: nowLabel(),
        status: `已上链 (${avaxAmount.toFixed(2)} AVAX)`,
      }, ...w]);
      toast.success(`兑换成功！签名 ${lastSig.slice(0, 8)}...`, { id: t });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "兑换失败";
      toast.error(`链上交易失败：${msg}`, { id: t });
    }
  };

  const showBottomTab = ["home", "rank", "publish", "myNotes", "me"].includes(page);

  // 当前城市的场所
  const cityPlaces = useMemo(() => places.filter(p => p.city === city), [places, city]);

  const openCitySelect = (returnTo: Page = "home") => {
    setCityReturnPage(returnTo);
    setPage("citySelect");
  };
  const onCityChosen = (newCity: string) => {
    setCity(newCity);
    toast.success(`已切换到 ${newCity}`);
    setPage(cityReturnPage === "citySelect" ? "home" : cityReturnPage);
    if (cityReturnPage === "home") setTab("home");
  };

  // 标题映射
  const titleMap: Partial<Record<Page, string>> = {
    home: "空气点评", rank: "无烟榜单", publish: "发布",
    myNotes: "笔记", me: "我的", login: "空气点评", phoneLogin: "登录",
  };
  const statusTitle = titleMap[page] || "空气点评";

  return (
    <div className={`min-h-screen w-full bg-[#f3f4f6] flex justify-center items-center sm:py-4 ${fontClass}`}>
      <div className="relative w-full sm:w-[390px] h-[100vh] sm:h-[844px] sm:max-h-[100vh] sm:rounded-[2rem] sm:shadow-2xl bg-background overflow-hidden flex flex-col">
        <div className="h-11 flex items-center justify-between px-6 text-[12px] text-foreground/80 bg-background shrink-0">
          <span className="font-medium">9:41</span>
          <span className="font-medium">{statusTitle}</span>
          <span>100%</span>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden phone-scroll" style={{ paddingBottom: showBottomTab ? "5rem" : "0" }}>
          {page === "login" && (
            <Login
              onQuickLogin={() => { setPage("home"); setTab("home"); setShowOnboarding(true); toast.success("欢迎使用空气点评"); }}
              onPhoneLogin={() => setPage("phoneLogin")}
            />
          )}
          {page === "phoneLogin" && (
            <PhoneLogin
              onBack={() => setPage("login")}
              onSuccess={() => { setPage("home"); setTab("home"); setShowOnboarding(true); toast.success("登录成功，欢迎来到空气点评"); }}
            />
          )}
          {page === "home" && (
            <HomePage
              search={search} setSearch={setSearch}
              city={city}
              onCityClick={() => openCitySelect("home")}
              setFilterCat={(c) => { setFilterCat(c); setCatSort("default"); setPage("category"); }}
              places={cityPlaces.slice(0, 6)} onPlace={goPlace}
              favorites={favorites} onFav={toggleFav}
              onSeeAll={() => setPage("list")}
              onSearchSubmit={() => setPage("search")}
            />
          )}
          {page === "list" && (
            <ListPage
              filterCat={filterCat} setFilterCat={setFilterCat}
              search={search} setSearch={setSearch}
              places={cityPlaces.filter(p =>
                (filterCat === "全部" || p.type === filterCat) &&
                (search.trim() === "" || p.name.includes(search) || p.type.includes(search))
              )}
              onPlace={goPlace}
              favorites={favorites} onFav={toggleFav}
              onBack={() => setPage("home")}
            />
          )}
          {page === "search" && (
            <SearchPage
              search={search} setSearch={setSearch}
              sort={searchSort} setSort={setSearchSort}
              places={cityPlaces} onPlace={goPlace}
              favorites={favorites} onFav={toggleFav}
              onBack={() => setPage("home")}
              onAdd={() => setPage("addPlace")}
            />
          )}
          {page === "category" && (
            <CategoryPage
              cat={filterCat === "全部" ? "餐厅" : filterCat as Exclude<Category, "全部">}
              setCat={(c) => setFilterCat(c)}
              sort={catSort} setSort={setCatSort}
              places={cityPlaces} onPlace={goPlace}
              favorites={favorites} onFav={toggleFav}
              onBack={() => setPage("home")}
            />
          )}
          {page === "detail" && activePlace && (
            <DetailPage
              place={activePlace}
              fav={favorites.includes(activePlace.id)}
              onFav={() => toggleFav(activePlace.id)}
              onBack={() => setPage("home")}
              onReview={() => setPage("review")}
              onNote={() => setPage("note")}
              onReport={() => setPage("report")}
              onCorrection={() => setPage("correction")}
            />
          )}
          {page === "publish" && (
            <PublishHub
              onBack={() => { setTab("home"); setPage("home"); }}
              onReview={() => setPage("review")}
              onNote={() => setPage("note")}
            />
          )}
          {page === "review" && (
            <ReviewPage
              place={activePlace} city={city}
              onBack={() => setPage(activePlace ? "detail" : "publish")}
              onSubmit={submitReview}
            />
          )}
          {page === "note" && (
            <NotePage
              places={cityPlaces.length > 0 ? cityPlaces : places} initialPlaceId={activePlace?.id}
              onBack={() => setPage(activePlace ? "detail" : "publish")}
              onSubmit={submitNote}
            />
          )}
          {page === "myNotes" && (
            <NotesPlazaPage
              notes={allNotes}
              onGoNote={() => setPage("note")}
              onOpen={(n) => { setActiveNote(n); setPage("noteDetail"); }}
              onToggleLike={(id) => setAllNotes(prev => prev.map(n => n.id === id ? { ...n, isLiked: !n.isLiked, likes: (n.likes || 0) + (n.isLiked ? -1 : 1) } : n))}
              onToggleCollect={(id) => setAllNotes(prev => prev.map(n => n.id === id ? { ...n, isCollected: !n.isCollected } : n))}
            />
          )}
          {page === "noteDetail" && activeNote && (
            <NoteDetailPage
              note={activeNote}
              onBack={() => setPage("myNotes")}
              onToggleLike={() => setAllNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, isLiked: !n.isLiked, likes: (n.likes || 0) + (n.isLiked ? -1 : 1) } : n))}
              onToggleCollect={() => setAllNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, isCollected: !n.isCollected } : n))}
            />
          )}
          {page === "addPlace" && (
            <AddPlacePage
              city={city}
              onBack={() => setPage("home")}
              onSubmit={submitNewPlace}
            />
          )}
          {page === "report" && activePlace && (
            <ReportPage place={activePlace} onBack={() => setPage("detail")} />
          )}
          {page === "correction" && activePlace && (
            <CorrectionPage place={activePlace} onBack={() => setPage("detail")} />
          )}
          {page === "rank" && (
            <RankPage city={city} places={cityPlaces} onPlace={goPlace} favorites={favorites} onFav={toggleFav} />
          )}
          {page === "me" && (
            <MePage
              points={points} favCount={favorites.length} historyCount={history.length}
              city={city}
              onCityClick={() => openCitySelect("me")}
              onWithdraw={() => setPage("withdraw")}
              onPoints={() => setPage("points")}
              onFavorites={() => setPage("favorites")}
              onHistory={() => setPage("history")}
              onAddPlace={() => setPage("addPlace")}
              onHelp={() => setPage("help")}
              onSettings={() => setPage("settings")}
              onLogout={() => { setPage("login"); toast("已退出登录"); }}
            />
          )}
          {page === "withdraw" && (
            <WithdrawPage
              points={points} address={walletAddress}
              onConnect={() => { void connectWallet(); }}
              onSwitchWallet={() => { setWalletAddress(""); setTimeout(() => { void connectWallet(); }, 100); }}
              onSubmit={(amount) => { void submitWithdraw(amount); }}
              records={withdraws}
              onBack={() => setPage("me")}
            />
          )}
          {page === "points" && (
            <PointsPage points={points} logs={pointLogs} onBack={() => setPage("me")} />
          )}
          {page === "favorites" && (
            <FavoritesPage
              places={places.filter(p => favorites.includes(p.id))}
              onPlace={goPlace} favorites={favorites} onFav={toggleFav}
              onBack={() => setPage("me")}
            />
          )}
          {page === "history" && (
            <HistoryPage
              items={history.map(h => ({ ...h, place: places.find(p => p.id === h.id)! })).filter(x => x.place)}
              onPlace={goPlace} onClear={() => { setHistory([]); toast("已清空浏览记录"); }}
              onBack={() => setPage("me")}
            />
          )}
          {page === "help" && <HelpPage onBack={() => setPage("me")} />}
          {page === "settings" && (
            <SettingsPage
              fontSize={fontSize} setFontSize={setFontSize}
              city={city}
              onCityClick={() => openCitySelect("settings")}
              notifyOn={notifyOn} setNotifyOn={setNotifyOn}
              onBack={() => setPage("me")}
            />
          )}
          {page === "citySelect" && (
            <CitySelectPage
              city={city}
              onBack={() => setPage(cityReturnPage)}
              onPick={onCityChosen}
            />
          )}
        </div>

        {showBottomTab && <BottomTab tab={tab} onChange={goTab} />}
        {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
      </div>
    </div>
  );
}

/* =================== Helpers =================== */
function rid() { return Math.random().toString(36).slice(2); }
function nowLabel() {
  const d = new Date();
  return `今天 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function placeAvgScore(p: Place): number {
  if (p.reviews.length === 0) return 4.5;
  const sum = p.reviews.reduce((s, r) => s + r.score, 0);
  return +(sum / p.reviews.length).toFixed(1);
}
function shortAddr(a: string) {
  if (!a) return "";
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

/* =================== Login =================== */

function Login({ onQuickLogin, onPhoneLogin }: { onQuickLogin: () => void; onPhoneLogin: () => void; }) {
  return (
    <div className="min-h-full flex flex-col items-center justify-between p-8 bg-gradient-to-b from-primary-soft via-background to-background">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 pt-16">
        <div className="w-20 h-20 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
          <Wind className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-primary">空气点评</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-[260px]">
          发现身边的无烟好去处<br />让每一次呼吸都更清新
        </p>
      </div>
      <div className="w-full space-y-3 pb-6">
        <button onClick={onQuickLogin} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/30 active:scale-[0.98] transition">
          一键登录
        </button>
        <button onClick={onPhoneLogin} className="w-full h-12 rounded-2xl border border-border bg-card text-foreground font-medium active:scale-[0.98] transition">
          手机号登录
        </button>
        <p className="text-[11px] text-center text-muted-foreground pt-2">登录即同意《用户协议》和《隐私政策》</p>
      </div>
    </div>
  );
}

function PhoneLogin({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void; }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (count <= 0) return;
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  const sendCode = () => {
    if (!phone) { toast.error("请输入手机号"); return; }
    if (!/^1[3-9]\d{9}$/.test(phone)) { toast.error("请输入正确的手机号"); return; }
    setCount(60);
    toast.success("验证码已发送");
  };

  const submit = () => {
    if (!phone) { toast.error("请输入手机号"); return; }
    if (!/^1[3-9]\d{9}$/.test(phone)) { toast.error("请输入正确的手机号"); return; }
    if (!code) { toast.error("请输入验证码"); return; }
    onSuccess();
  };

  return (
    <div className="min-h-full bg-background">
      <TopBar title="手机号登录" onBack={onBack} />
      <div className="p-6 pt-8">
        <h2 className="text-2xl font-bold text-foreground">欢迎使用空气点评</h2>
        <p className="text-sm text-muted-foreground mt-1">请使用手机号登录</p>

        <div className="mt-8 space-y-4">
          <div className="bg-card border border-border rounded-2xl px-4 h-14 flex items-center">
            <span className="text-sm text-muted-foreground mr-3">+86</span>
            <input
              type="tel" maxLength={11}
              value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="请输入手机号"
              className="flex-1 bg-transparent outline-none text-base"
            />
          </div>
          <div className="bg-card border border-border rounded-2xl px-4 h-14 flex items-center gap-3">
            <input
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} maxLength={6}
              placeholder="请输入验证码"
              className="flex-1 bg-transparent outline-none text-base"
            />
            <button
              onClick={sendCode} disabled={count > 0}
              className={`text-sm font-medium px-3 h-9 rounded-lg ${count > 0 ? "text-muted-foreground bg-secondary" : "text-primary bg-primary-soft"}`}
            >
              {count > 0 ? `重新获取 ${count}s` : "获取验证码"}
            </button>
          </div>
        </div>

        <button onClick={submit} className="mt-8 w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/30 active:scale-[0.98]">
          登录
        </button>
        <p className="text-[11px] text-center text-muted-foreground mt-6">登录即同意《用户协议》和《隐私政策》</p>
      </div>
    </div>
  );
}

/* =================== Common =================== */

function TopBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border h-12 flex items-center px-3">
      {onBack ? (
        <button onClick={onBack} className="p-1 -ml-1"><ArrowLeft className="w-5 h-5" /></button>
      ) : <span className="w-6" />}
      <div className="flex-1 text-center text-base font-semibold">{title}</div>
      <div className="w-8 flex justify-end">{right}</div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const s = statusOf(score);
  const color = s.tone === "good" ? "bg-primary" : s.tone === "ok" ? "bg-primary/70" : s.tone === "watch" ? "bg-accent" : "bg-destructive";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] text-primary-foreground px-1.5 py-0.5 rounded-md ${color}`}>
      <Wind className="w-3 h-3" />{score.toFixed(1)}
    </span>
  );
}

function StatusTag({ score }: { score: number }) {
  const s = statusOf(score);
  const map = {
    good: "bg-primary-soft text-primary",
    ok: "bg-primary-soft text-primary",
    watch: "bg-accent-soft text-accent",
    bad: "bg-destructive/10 text-destructive",
  } as const;
  return <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${map[s.tone]}`}>{s.label}</span>;
}

function PlaceCard({ p, fav, onFav, onClick }: { p: Place; fav: boolean; onFav: () => void; onClick: () => void; }) {
  const score = placeAvgScore(p);
  return (
    <button onClick={onClick} className="w-full text-left bg-card rounded-2xl p-3 shadow-sm border border-border/60 active:scale-[0.99] transition">
      <div className="flex gap-3">
        <PlaceImg src={p.img} type={p.type} alt={p.name}
          className="w-24 h-24 rounded-2xl object-cover bg-secondary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm truncate">{p.name}</h3>
            <button onClick={(e) => { e.stopPropagation(); onFav(); }} className="shrink-0 p-1 -m-1">
              <Heart className={`w-4 h-4 ${fav ? "fill-accent text-accent" : "text-muted-foreground"}`} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <ScoreBadge score={score} />
            <StatusTag score={score} />
            <span className="text-[11px] text-muted-foreground">{p.reviewCount}评价</span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
            <span className="truncate">{p.type} · {p.address}</span>
            <span className="shrink-0 ml-2">{p.distance}</span>
          </div>
          <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-accent bg-accent-soft px-1.5 py-0.5 rounded">
            <Award className="w-3 h-3" /> 评价 +5 积分
          </div>
        </div>
      </div>
    </button>
  );
}

function HomePage(props: {
  search: string; setSearch: (v: string) => void;
  city?: string;
  onCityClick?: () => void;
  setFilterCat: (c: Category) => void;
  places: Place[]; onPlace: (p: Place) => void;
  favorites: number[]; onFav: (id: number) => void;
  onSeeAll: () => void;
  onSearchSubmit?: () => void;
}) {
  return (
    <div>
      <div className="bg-gradient-to-b from-primary-soft to-background px-4 pt-4 pb-3">
        <div className="flex items-center justify-between text-sm">
          <button onClick={props.onCityClick} className="flex items-center gap-1 text-foreground font-medium active:opacity-70">
            <MapPin className="w-4 h-4 text-primary" /> {props.city || "上海市"} <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
          <Bell className="w-5 h-5 text-muted-foreground" />
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); props.onSearchSubmit?.(); }}
          className="mt-3 flex items-center gap-2 bg-card rounded-2xl px-3 h-10 border border-border/60 shadow-sm"
        >
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={props.search}
            onChange={(e) => props.setSearch(e.target.value)}
            placeholder="搜索餐厅、咖啡馆、商场"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {props.search && (
            <button type="submit" className="text-xs text-primary font-medium">搜索</button>
          )}
        </form>
      </div>

      {/* 分类网格：5 列固定 */}
      <div className="px-3 py-3">
        <div className="grid grid-cols-5 gap-y-3">
          {CATEGORIES.map(({ key, icon: Icon }) => (
            <button key={key} onClick={() => props.setFilterCat(key)}
              className="flex flex-col items-center gap-1 py-1 active:opacity-70">
              <span className="w-11 h-11 rounded-2xl bg-primary-soft text-primary flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </span>
              <span className="text-[11px] text-foreground">{key}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mx-4 mb-3 rounded-2xl p-4 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-md">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          <span className="font-semibold">空气守护者计划</span>
        </div>
        <p className="text-[12px] opacity-90 mt-1">每提交一条无烟评价，可获 5 积分；发笔记可获 10 积分。</p>
      </div>

      <div className="px-4 flex items-center justify-between mb-2">
        <h2 className="font-semibold text-base">为你推荐</h2>
        <button onClick={props.onSeeAll} className="text-xs text-primary flex items-center">查看全部 <ChevronRight className="w-3 h-3" /></button>
      </div>
      <div className="px-4 space-y-3">
        {props.places.map(p => (
          <PlaceCard key={p.id} p={p} fav={props.favorites.includes(p.id)} onFav={() => props.onFav(p.id)} onClick={() => props.onPlace(p)} />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Icon className="w-10 h-10 mb-3 opacity-50" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function ListPage(props: {
  filterCat: Category; setFilterCat: (c: Category) => void;
  search: string; setSearch: (v: string) => void;
  places: Place[]; onPlace: (p: Place) => void;
  favorites: number[]; onFav: (id: number) => void;
  onBack: () => void;
}) {
  const cats: Category[] = ["全部", ...CATEGORIES.map(c => c.key)];
  return (
    <div>
      <TopBar title="附近场所" onBack={props.onBack} />
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 h-10">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={props.search}
            onChange={(e) => props.setSearch(e.target.value)}
            placeholder="搜索场所"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>
      <div className="px-2 mt-3 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 px-2 min-w-max">
          {cats.map(c => (
            <button key={c} onClick={() => props.setFilterCat(c)}
              className={`px-3 h-8 rounded-full text-xs font-medium border transition ${
                props.filterCat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
              }`}>{c}</button>
          ))}
        </div>
      </div>
      <div className="p-4 space-y-3">
        {props.places.length === 0 ? (
          <EmptyState icon={Search} text="暂时找不到相关场所，换个关键词试试" />
        ) : props.places.map(p => (
          <PlaceCard key={p.id} p={p} fav={props.favorites.includes(p.id)} onFav={() => props.onFav(p.id)} onClick={() => props.onPlace(p)} />
        ))}
      </div>
    </div>
  );
}

function YesNoChip({ value }: { value: "有" | "无" | "没看到" }) {
  const map = {
    "有": { Icon: Check, cls: "text-primary bg-primary-soft" },
    "无": { Icon: Cigarette, cls: "text-destructive bg-destructive/10" },
    "没看到": { Icon: Eye, cls: "text-muted-foreground bg-secondary" },
  } as const;
  const { Icon, cls } = map[value];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md ${cls}`}>
      <Icon className="w-3 h-3" />{value}
    </span>
  );
}

function ReviewCard({ r }: { r: ReviewItem }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-base">{r.avatar}</div>
        <div className="flex-1">
          <div className="text-sm font-medium">{r.user}</div>
          <div className="text-[11px] text-muted-foreground">{r.time}</div>
        </div>
        <ScoreBadge score={r.score} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px]">
        <div className="flex items-center justify-between"><span className="text-muted-foreground">无烟标志</span><YesNoChip value={r.sign} /></div>
        <div className="flex items-center justify-between"><span className="text-muted-foreground">有人抽烟</span><YesNoChip value={r.smoker} /></div>
        <div className="flex items-center justify-between"><span className="text-muted-foreground">有烟味</span><YesNoChip value={r.smell} /></div>
        <div className="flex items-center justify-between"><span className="text-muted-foreground">工作人员劝阻</span><YesNoChip value={r.staff} /></div>
      </div>
      <p className="mt-2 text-sm text-foreground leading-relaxed">{r.text}</p>
    </div>
  );
}

function NoteCard({ n, onLike, onCollect }: { n: NoteItem; onLike?: () => void; onCollect?: () => void }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm">{n.avatar}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{n.user}</div>
          <div className="text-[11px] text-muted-foreground">{n.time}</div>
        </div>
        {n.pointAward && <span className="text-[10px] text-accent bg-accent-soft px-1.5 py-0.5 rounded">+{n.pointAward} 积分</span>}
      </div>
      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2">
        <MapPin className="w-3 h-3 shrink-0" />
        <span className="truncate">{n.placeName} · {n.placeType}{n.placeArea ? ` · ${n.placeArea}` : ""}</span>
      </div>
      <PlaceImg src={n.cover} type={n.placeType} alt={n.placeName} className="w-full aspect-[16/10] rounded-xl object-cover mb-2 bg-secondary" />
      <p className="text-sm leading-relaxed">{n.text}</p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {n.tags.map(t => <span key={t} className="text-[10px] text-primary bg-primary-soft px-2 py-0.5 rounded-full">#{t}</span>)}
      </div>
      <div className="mt-2 flex items-center justify-end gap-3 text-[12px] text-muted-foreground">
        <button onClick={(e) => { e.stopPropagation(); onLike?.(); }} className="flex items-center gap-1 active:scale-95 transition">
          <ThumbsUp className={`w-4 h-4 ${n.isLiked ? "fill-primary text-primary" : ""}`} />
          <span className={n.isLiked ? "text-primary" : ""}>{n.likes ?? 0}</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onCollect?.(); }} className="flex items-center gap-1 active:scale-95 transition">
          <Bookmark className={`w-4 h-4 ${n.isCollected ? "fill-accent text-accent" : ""}`} />
          <span className={n.isCollected ? "text-accent" : ""}>收藏</span>
        </button>
      </div>
    </div>
  );
}

/* =================== Detail =================== */

function DetailPage({ place, fav, onFav, onBack, onReview, onNote, onReport, onCorrection }: {
  place: Place; fav: boolean; onFav: () => void; onBack: () => void;
  onReview: () => void; onNote: () => void;
  onReport?: () => void; onCorrection?: () => void;
}) {
  const score = placeAvgScore(place);
  return (
    <div className="pb-32">
      <TopBar title="场所详情" onBack={onBack} />
      <PlaceImg src={place.img} type={place.type} alt={place.name} className="w-full h-44 object-cover bg-secondary" />
      <div className="p-4">
        <h1 className="text-lg font-bold">{place.name}</h1>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <ScoreBadge score={score} />
          <StatusTag score={score} />
          <span className="text-xs text-muted-foreground">{place.reviewCount} 条评价</span>
        </div>
        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{place.type} · {place.address} · {place.distance}</div>
          <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />营业时间：{place.businessHours}</div>
          <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{place.phone}</div>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold text-sm mb-2">用户标签</h3>
          <div className="flex flex-wrap gap-2">
            {place.tags.map(t => (
              <span key={t} className="text-xs bg-secondary text-foreground px-2.5 py-1 rounded-full">#{t}</span>
            ))}
          </div>
        </div>

        <div className="mt-4 bg-accent-soft text-accent rounded-2xl p-3 text-xs flex items-center gap-2">
          <Award className="w-4 h-4" /> 完成评价可获得 5 积分，发笔记 +10 积分
        </div>

        {(onReport || onCorrection) && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {onReport && (
              <button onClick={onReport} className="h-11 rounded-xl bg-card border border-border flex items-center justify-center gap-1.5 text-xs text-destructive active:scale-[0.99] transition">
                <AlertTriangle className="w-4 h-4" />举报吸烟问题
              </button>
            )}
            {onCorrection && (
              <button onClick={onCorrection} className="h-11 rounded-xl bg-card border border-border flex items-center justify-center gap-1.5 text-xs text-foreground active:scale-[0.99] transition">
                <FileEdit className="w-4 h-4" />纠错信息
              </button>
            )}
          </div>
        )}

        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">用户评价 ({place.reviews.length})</h3>
          </div>
          <div className="space-y-3">
            {place.reviews.length === 0
              ? <EmptyState icon={Wind} text="还没有评价，做第一个评价人" />
              : place.reviews.map(r => <ReviewCard key={r.id} r={r} />)}
          </div>
        </div>

        <div className="mt-5">
          <h3 className="font-semibold text-sm mb-2">用户笔记 ({place.notes.length})</h3>
          <div className="space-y-3">
            {place.notes.length === 0
              ? <div className="text-center text-xs text-muted-foreground py-6">还没有笔记，发布第一条吧</div>
              : place.notes.map(n => <NoteCard key={n.id} n={n} />)}
          </div>
        </div>
      </div>

      <div className="fixed sm:absolute bottom-16 left-0 right-0 sm:left-auto sm:right-auto sm:w-[390px]">
        <div className="mx-3 bg-card border border-border rounded-2xl shadow-lg p-2 flex items-center gap-2">
          <button onClick={onFav} className={`flex-1 h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-1 ${fav ? "bg-primary-soft text-primary" : "bg-secondary text-foreground"}`}>
            <Bookmark className={`w-4 h-4 ${fav ? "fill-primary text-primary" : ""}`} />{fav ? "已收藏" : "收藏"}
          </button>
          <button onClick={onNote} className="flex-1 h-11 rounded-xl bg-accent text-accent-foreground text-sm font-medium">发笔记</button>
          <button onClick={onReview} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium">写评价</button>
        </div>
      </div>
    </div>
  );
}

/* =================== Publish Hub =================== */

function PublishHub({ onBack, onReview, onNote }: { onBack: () => void; onReview: () => void; onNote: () => void; }) {
  return (
    <div>
      <TopBar title="发布" onBack={onBack} />
      <div className="px-5 pt-4">
        <h2 className="text-2xl font-bold">发布</h2>
        <p className="text-sm text-muted-foreground mt-1">分享场所空气情况，获得积分奖励</p>
      </div>

      <div className="p-5 space-y-4">
        <button onClick={onReview} className="w-full bg-card border border-border rounded-2xl p-5 flex items-center gap-4 active:scale-[0.99] transition shadow-sm text-left">
          <span className="w-14 h-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center">
            <Edit3 className="w-7 h-7" />
          </span>
          <div className="flex-1">
            <div className="text-lg font-semibold">写评价</div>
            <div className="text-xs text-muted-foreground mt-1">4 个简单问题，获得 5 积分</div>
          </div>
          <span className="text-accent font-bold text-lg">+5</span>
        </button>

        <button onClick={onNote} className="w-full bg-card border border-border rounded-2xl p-5 flex items-center gap-4 active:scale-[0.99] transition shadow-sm text-left">
          <span className="w-14 h-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center">
            <Camera className="w-7 h-7" />
          </span>
          <div className="flex-1">
            <div className="text-lg font-semibold">发笔记</div>
            <div className="text-xs text-muted-foreground mt-1">上传图片+评价，最多获 15 积分</div>
          </div>
          <span className="text-accent font-bold text-lg">+10</span>
        </button>
      </div>
    </div>
  );
}

/* =================== Review Page =================== */

function ChoiceRow<T extends string>({ label, options, value, onChange }: {
  label: string; options: readonly T[]; value: T | ""; onChange: (v: T) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="text-sm font-medium mb-3">{label}</div>
      <div className="flex gap-2 flex-wrap">
        {options.map(o => (
          <button key={o} onClick={() => onChange(o)}
            className={`px-5 h-9 rounded-full text-sm border transition ${
              value === o ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"
            }`}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function ReviewPage({ place, city, onBack, onSubmit }: {
  place: Place | null; city: string; onBack: () => void;
  onSubmit: (a: {
    sign: "有" | "无"; smoker: "有" | "无"; smell: "有" | "无"; staff: "是" | "否";
    name: string; type: Exclude<Category, "全部">; text: string;
  }) => void;
}) {
  const [name, setName] = useState(place?.name || "");
  const [type, setType] = useState<Exclude<Category, "全部"> | "">(place?.type || "");
  const [sign, setSign] = useState<"" | "有" | "无">("");
  const [smoker, setSmoker] = useState<"" | "有" | "无">("");
  const [smell, setSmell] = useState<"" | "有" | "无">("");
  const [staff, setStaff] = useState<"" | "是" | "否">("");
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { images.forEach(u => URL.revokeObjectURL(u)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith("image/"));
    if (!files.length) { e.target.value = ""; return; }
    const remain = 3 - images.length;
    const accepted = files.slice(0, Math.max(0, remain));
    if (files.length > remain) toast.error("最多上传 3 张图片");
    setImages(prev => [...prev, ...accepted.map(f => URL.createObjectURL(f))]);
    e.target.value = "";
  };
  const removeImage = (i: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[i]);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const ready = name.trim() && type && sign && smoker && smell && staff;

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("请输入场所名称"); return; }
    if (!type) { toast.error("请选择场所类型"); return; }
    if (!sign) { toast.error("请选择是否看到无烟标志"); return; }
    if (!smoker) { toast.error("请选择是否有人吸烟"); return; }
    if (!smell) { toast.error("请选择是否有烟味"); return; }
    if (!staff) { toast.error("请选择是否有人劝阻吸烟"); return; }
    onSubmit({
      sign: sign as any, smoker: smoker as any, smell: smell as any, staff: staff as any,
      name: name.trim(), type: type as Exclude<Category, "全部">, text,
    });
  };

  return (
    <div className="pb-28">
      <TopBar title="写评价" onBack={onBack} />
      <div className="p-4 space-y-3">
        {/* 基础信息卡 */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <Field label="场所名称" required>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="例如：星巴克 静安寺店"
              className="w-full h-11 bg-secondary rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          </Field>
          <Field label="场所类型" required>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c.key} onClick={() => setType(c.key)}
                  className={`px-3 h-8 rounded-full text-xs border transition ${type === c.key ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"}`}>
                  {c.key}
                </button>
              ))}
            </div>
          </Field>
          <Field label="当前城市">
            <div className="h-11 bg-secondary rounded-xl px-3 text-sm flex items-center text-muted-foreground">{city}</div>
          </Field>
        </div>

        <ChoiceRow label="是否看到无烟标志" options={["有", "无"] as const} value={sign} onChange={(v) => setSign(v)} />
        <ChoiceRow label="是否有人吸烟" options={["有", "无"] as const} value={smoker} onChange={(v) => setSmoker(v)} />
        <ChoiceRow label="是否有烟味" options={["有", "无"] as const} value={smell} onChange={(v) => setSmell(v)} />
        <ChoiceRow label="是否有人劝阻吸烟" options={["是", "否"] as const} value={staff} onChange={(v) => setStaff(v)} />

        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="text-sm font-medium mb-1">上传场所图片（可选，最多 3 张）</div>
          <p className="text-[11px] text-muted-foreground mb-3">可上传禁烟标志或场所环境图片</p>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />
          {images.length === 0 ? (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] rounded-xl border border-dashed border-primary/40 bg-primary-soft flex flex-col items-center justify-center text-primary transition active:scale-[0.99]">
              <Camera className="w-7 h-7" />
              <span className="text-xs mt-1">添加图片</span>
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {images.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <button onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-primary/40 bg-primary-soft flex flex-col items-center justify-center text-primary active:scale-95 transition">
                  <Camera className="w-6 h-6" />
                  <span className="text-[11px] mt-1">添加</span>
                </button>
              )}
            </div>
          )}
        </div>

        <textarea
          value={text} onChange={e => setText(e.target.value)}
          placeholder="补充一句你的真实感受（可选）"
          className="w-full min-h-[80px] rounded-2xl bg-card border border-border p-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="fixed sm:absolute bottom-16 left-0 right-0 sm:left-auto sm:right-auto sm:w-[390px] px-3">
        <button onClick={handleSubmit}
          className={`w-full h-12 rounded-2xl font-semibold text-primary-foreground transition shadow-md ${
            ready ? "bg-primary shadow-primary/30 active:scale-[0.98]" : "bg-primary/40"
          }`}>
          提交评价（+5 积分）
        </button>
      </div>
    </div>
  );
}

/* =================== Note Page =================== */

const NOTE_QUICK_TAGS = [
  "环境无烟，呼吸顺畅",
  "禁烟标志醒目",
  "有人偷偷吸烟",
  "有明显烟味",
  "店员及时劝阻",
];

function NotePage({ places, initialPlaceId, onBack, onSubmit }: {
  places: Place[]; initialPlaceId?: number;
  onBack: () => void;
  onSubmit: (d: { placeId: number; images: string[]; tags: string[]; text: string }) => void;
}) {
  const [placeId, setPlaceId] = useState<number | "">(initialPlaceId || "");
  const [showPicker, setShowPicker] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");

  const selected = places.find(p => p.id === placeId);

  const addImage = () => {
    if (images.length >= 3) return;
    const next = selected?.img || TYPE_IMG["咖啡馆"];
    setImages([...images, next]);
  };
  const removeImage = (i: number) => setImages(images.filter((_, idx) => idx !== i));
  const toggleTag = (t: string) => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  const ready = placeId && images.length > 0;

  const submit = () => {
    if (!placeId) { toast.error("请选择要发笔记的场所"); return; }
    if (images.length === 0) { toast.error("请至少上传 1 张图片"); return; }
    onSubmit({ placeId: placeId as number, images, tags, text });
  };

  return (
    <div className="pb-28">
      <TopBar title="发笔记" onBack={onBack} />
      <div className="p-4 space-y-4">
        <div>
          <div className="text-sm font-medium mb-2">选择场所</div>
          <button onClick={() => setShowPicker(true)} className="w-full bg-card border border-border rounded-2xl p-4 flex items-center justify-between text-left active:scale-[0.99]">
            <span className={`text-sm ${selected ? "text-foreground" : "text-muted-foreground"}`}>
              {selected ? `${selected.name} · ${selected.type}` : "请选择要发笔记的场所"}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div>
          <div className="text-sm font-medium">上传图片（1-3 张，必填）</div>
          <p className="text-[11px] text-muted-foreground mt-1 mb-2">建议拍摄禁烟标识或场所环境</p>
          <div className="grid grid-cols-3 gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {images.length < 3 && (
              <button onClick={addImage}
                className="aspect-square rounded-xl border-2 border-dashed border-border bg-secondary/40 flex flex-col items-center justify-center text-primary active:scale-95 transition">
                <Camera className="w-7 h-7" />
                <span className="text-xs mt-1 text-foreground">添加</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">快速选择评价（可选）</div>
          <div className="flex flex-wrap gap-2">
            {NOTE_QUICK_TAGS.map(t => (
              <button key={t} onClick={() => toggleTag(t)}
                className={`px-3 h-9 rounded-full text-xs border transition ${
                  tags.includes(t) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"
                }`}>{t}</button>
            ))}
          </div>
        </div>

        <textarea
          value={text} onChange={e => setText(e.target.value)}
          placeholder="也可以写几句话分享你的体验..."
          className="w-full min-h-[100px] rounded-2xl bg-card border border-border p-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="fixed sm:absolute bottom-16 left-0 right-0 sm:left-auto sm:right-auto sm:w-[390px] px-3">
        <button onClick={submit}
          className={`w-full h-12 rounded-2xl font-semibold text-primary-foreground transition shadow-md ${
            ready ? "bg-primary shadow-primary/30 active:scale-[0.98]" : "bg-primary/40"
          }`}>
          提交笔记（+10 积分）
        </button>
      </div>

      {showPicker && (
        <div className="absolute inset-0 z-50 bg-black/40 flex items-end" onClick={() => setShowPicker(false)}>
          <div onClick={e => e.stopPropagation()} className="w-full bg-card rounded-t-3xl p-4 max-h-[70%] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">选择场所</span>
              <button onClick={() => setShowPicker(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-2">
              {places.map(p => (
                <button key={p.id} onClick={() => { setPlaceId(p.id); setShowPicker(false); }}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 text-left ${placeId === p.id ? "bg-primary-soft" : "active:bg-secondary"}`}>
                  <PlaceImg src={p.img} type={p.type} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground">{p.type} · {p.address}</div>
                  </div>
                  {placeId === p.id && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =================== Notes Plaza =================== */

const NOTE_FILTERS = ["全部", "无烟友好", "有烟味反馈", "禁烟标志", "店员劝阻", "图片笔记"] as const;
type NoteFilter = typeof NOTE_FILTERS[number];

function NoteGridCard({ n, onLike, onCollect, onClick }: { n: NoteItem; onLike?: () => void; onCollect?: () => void; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition flex flex-col">
      <div className="relative">
        <PlaceImg src={n.cover} type={n.placeType} alt={n.placeName} className="w-full h-[120px] object-cover bg-secondary" />
        {n.pointAward && (
          <span className="absolute top-1.5 right-1.5 text-[10px] text-accent bg-card/95 px-1.5 py-0.5 rounded-full shadow-sm">+{n.pointAward}</span>
        )}
      </div>
      <div className="p-2 flex-1 flex flex-col gap-1">
        <p className="text-[12px] leading-snug line-clamp-2 text-foreground">{n.text}</p>
        <div className="text-[10px] text-muted-foreground flex items-center gap-0.5 line-clamp-1">
          <MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{n.placeName}</span>
        </div>
        {n.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {n.tags.slice(0, 2).map(t => <span key={t} className="text-[9px] text-primary bg-primary-soft px-1.5 py-0.5 rounded-full truncate max-w-full">#{t}</span>)}
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-1 min-w-0">
            <span className="text-sm">{n.avatar}</span>
            <span className="text-[10px] text-muted-foreground truncate">{n.user}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onLike?.(); }} className="flex items-center gap-0.5 active:scale-95">
              <ThumbsUp className={`w-3.5 h-3.5 ${n.isLiked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] ${n.isLiked ? "text-primary" : "text-muted-foreground"}`}>{n.likes ?? 0}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onCollect?.(); }} className="active:scale-95">
              <Bookmark className={`w-3.5 h-3.5 ${n.isCollected ? "fill-accent text-accent" : "text-muted-foreground"}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteDetailPage({ note, onBack, onToggleLike, onToggleCollect }: {
  note: NoteItem;
  onBack: () => void;
  onToggleLike: () => void;
  onToggleCollect: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border shrink-0">
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center active:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{note.avatar}</span>
          <span className="text-sm text-foreground truncate">{note.user}</span>
        </div>
        <div className="w-9" />
      </div>
      <div className="flex-1 overflow-y-auto phone-scroll">
        <PlaceImg src={note.cover} type={note.placeType} alt={note.placeName} className="w-full aspect-square object-cover bg-secondary" />
        <div className="p-4 space-y-3">
          <p className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap">{note.text}</p>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map(t => (
                <span key={t} className="text-xs text-primary bg-primary-soft px-2 py-1 rounded-full">#{t}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{note.placeName}</span>
            {note.placeArea && <span className="text-muted-foreground/70">· {note.placeArea}</span>}
          </div>
          <div className="text-xs text-muted-foreground">{note.time}</div>
          {note.pointAward && (
            <div className="text-xs text-accent">发布奖励 +{note.pointAward} 积分</div>
          )}
        </div>
      </div>
      <div className="shrink-0 border-t border-border bg-card px-4 py-2 flex items-center justify-around">
        <button onClick={onToggleLike} className="flex items-center gap-1.5 active:scale-95">
          <ThumbsUp className={`w-5 h-5 ${note.isLiked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          <span className={`text-sm ${note.isLiked ? "text-primary" : "text-muted-foreground"}`}>{note.likes ?? 0}</span>
        </button>
        <button onClick={onToggleCollect} className="flex items-center gap-1.5 active:scale-95">
          <Bookmark className={`w-5 h-5 ${note.isCollected ? "fill-accent text-accent" : "text-muted-foreground"}`} />
          <span className={`text-sm ${note.isCollected ? "text-accent" : "text-muted-foreground"}`}>{note.isCollected ? "已收藏" : "收藏"}</span>
        </button>
      </div>
    </div>
  );
}

function NotesPlazaPage({ notes, onGoNote, onOpen, onToggleLike, onToggleCollect }: {
  notes: NoteItem[]; onGoNote: () => void;
  onOpen?: (n: NoteItem) => void;
  onToggleLike: (id: string) => void; onToggleCollect: (id: string) => void;
}) {
  const [kw, setKw] = useState("");
  const [filter, setFilter] = useState<NoteFilter>("全部");

  const list = useMemo(() => {
    let arr = notes;
    if (filter === "图片笔记") arr = arr.filter(n => !!n.cover);
    else if (filter !== "全部") arr = arr.filter(n => n.tags.includes(filter));
    if (kw.trim()) {
      const k = kw.trim().toLowerCase();
      arr = arr.filter(n =>
        n.placeName.toLowerCase().includes(k) ||
        n.text.toLowerCase().includes(k) ||
        n.tags.some(t => t.toLowerCase().includes(k)) ||
        n.user.toLowerCase().includes(k)
      );
    }
    return arr;
  }, [notes, filter, kw]);

  return (
    <div>
      <div className="px-4 pt-4 pb-3 bg-gradient-to-b from-primary-soft to-background">
        <h1 className="text-xl font-bold">笔记</h1>
        <p className="text-xs text-muted-foreground mt-0.5">看看大家分享的场所空气体验</p>
        <div className="mt-3 flex items-center gap-2 bg-card rounded-2xl border border-border px-3 h-10">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            placeholder="搜索场所、关键词、空气体验"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          {kw && <button onClick={() => setKw("")}><X className="w-4 h-4 text-muted-foreground" /></button>}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {NOTE_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`shrink-0 px-3 h-8 rounded-full text-xs border transition ${
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border"
              }`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="p-3">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="w-12 h-12 text-muted-foreground opacity-40 mb-3" />
            <p className="text-sm text-muted-foreground max-w-[280px]">
              {notes.length === 0
                ? "还没有人发布笔记，快来分享第一条场所空气体验吧"
                : "没有匹配的笔记，换个关键词或筛选试试"}
            </p>
            <button onClick={onGoNote} className="mt-5 h-11 px-6 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/30">
              去发笔记
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {list.map(n => (
              <NoteGridCard key={n.id} n={n}
                onClick={() => onOpen?.(n)}
                onLike={() => onToggleLike(n.id)}
                onCollect={() => onToggleCollect(n.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =================== Rank =================== */

function RankPage({ city, places, onPlace, favorites, onFav }: { city?: string; places: Place[]; onPlace: (p: Place) => void; favorites: number[]; onFav: (id: number) => void; }) {
  const [tab, setTab] = useState<"clean" | "improve">("clean");
  const list = useMemo(() => {
    const arr = places.map(p => ({ p, score: placeAvgScore(p) }));
    if (tab === "clean") arr.sort((a, b) => b.score - a.score);
    else arr.sort((a, b) => b.p.smokeReports - a.p.smokeReports);
    return arr.slice(0, 10);
  }, [tab, places]);

  return (
    <div>
      <div className="bg-gradient-to-b from-primary to-primary-glow text-primary-foreground px-4 pt-5 pb-12">
        <h1 className="text-xl font-bold flex items-center gap-2"><Trophy className="w-5 h-5" /> {city || "上海市"}无烟榜单</h1>
        <p className="text-xs opacity-90 mt-1">来自空气守护者们的真实评价</p>
      </div>
      <div className="-mt-8 mx-4 bg-card rounded-2xl shadow-sm border border-border p-1 flex">
        <button onClick={() => setTab("clean")}
          className={`flex-1 h-10 rounded-xl text-sm font-medium ${tab === "clean" ? "bg-primary text-primary-foreground" : "text-foreground"}`}>无烟排行榜</button>
        <button onClick={() => setTab("improve")}
          className={`flex-1 h-10 rounded-xl text-sm font-medium ${tab === "improve" ? "bg-accent text-accent-foreground" : "text-foreground"}`}>改进建议榜</button>
      </div>

      <div className="p-4 space-y-2">
        {list.map(({ p, score }, i) => (
          <button key={p.id} onClick={() => onPlace(p)}
            className="w-full bg-card border border-border rounded-2xl p-3 flex items-center gap-3 active:scale-[0.99] transition text-left">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
              i === 0 ? "bg-accent text-accent-foreground" :
              i === 1 ? "bg-primary text-primary-foreground" :
              i === 2 ? "bg-primary-soft text-primary" :
              "bg-secondary text-foreground"
            }`}>{i + 1}</div>
            <PlaceImg src={p.img} type={p.type} className="w-12 h-12 rounded-xl object-cover bg-secondary shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{p.name}</h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <ScoreBadge score={score} />
                <StatusTag score={score} />
                {tab === "improve" && (
                  <span className="text-[10px] text-destructive bg-destructive/10 px-1.5 rounded">{p.smokeReports} 反馈</span>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{p.tags[0]} · {p.distance}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onFav(p.id); }} className="p-2">
              <Bookmark className={`w-4 h-4 ${favorites.includes(p.id) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}

/* =================== Me =================== */

function MeRow({ icon: Icon, label, value, onClick, accent }: { icon: any; label: string; value?: string; onClick?: () => void; accent?: boolean; }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 h-14 bg-card active:bg-secondary border-b border-border/60 last:border-0">
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ? "bg-accent-soft text-accent" : "bg-primary-soft text-primary"}`}>
        <Icon className="w-4 h-4" />
      </span>
      <span className="flex-1 text-left text-sm">{label}</span>
      {value && <span className="text-xs text-muted-foreground">{value}</span>}
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}

function MePage({ points, favCount, historyCount, city, onCityClick, onWithdraw, onPoints, onFavorites, onHistory, onAddPlace, onHelp, onSettings, onLogout }: {
  points: number; favCount: number; historyCount: number; city?: string;
  onCityClick?: () => void;
  onWithdraw: () => void; onPoints: () => void; onFavorites: () => void; onHistory: () => void;
  onAddPlace?: () => void; onHelp?: () => void; onSettings?: () => void; onLogout: () => void;
}) {
  return (
    <div>
      <div className="bg-gradient-to-b from-primary to-primary-glow text-primary-foreground px-4 pt-6 pb-16">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-card text-primary flex items-center justify-center text-2xl shadow-md">🌿</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg">空气守护者</div>
            <button onClick={onCityClick} className="text-xs opacity-90 flex items-center gap-1 mt-0.5 active:opacity-70">
              <MapPin className="w-3 h-3" /> {city || "上海市"} <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <button onClick={onWithdraw}
            className="px-4 h-9 rounded-full bg-card/20 backdrop-blur text-primary-foreground text-sm font-medium border border-card/30 inline-flex items-center gap-1 active:scale-95">
            <ArrowUpRight className="w-4 h-4" />提现
          </button>
        </div>
      </div>

      <div className="-mt-10 mx-4 bg-card border border-border rounded-2xl shadow-sm grid grid-cols-3 divide-x divide-border">
        <button onClick={onPoints} className="py-3 text-center active:bg-secondary">
          <div className="text-lg font-bold text-accent">{points}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">账户积分</div>
        </button>
        <button onClick={onFavorites} className="py-3 text-center active:bg-secondary">
          <div className="text-lg font-bold text-foreground">{favCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">我的收藏</div>
        </button>
        <button onClick={onHistory} className="py-3 text-center active:bg-secondary">
          <div className="text-lg font-bold text-foreground">{historyCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">最近浏览</div>
        </button>
      </div>

      <div className="mt-4 mx-4 rounded-2xl overflow-hidden border border-border">
        <MeRow icon={Award} label="账户积分" value={`${points} 分`} onClick={onPoints} accent />
        <MeRow icon={Heart} label="我的收藏" value={`${favCount} 个`} onClick={onFavorites} />
        <MeRow icon={Eye} label="最近浏览" value={`${historyCount} 个`} onClick={onHistory} />
        <MeRow icon={PlusCircle} label="添加新场所" onClick={onAddPlace} />
        <MeRow icon={HelpCircle} label="帮助中心" onClick={onHelp} />
        <MeRow icon={Settings} label="设置" onClick={onSettings} />
        <MeRow icon={LogOut} label="退出登录" onClick={onLogout} />
      </div>
      <div className="h-6" />
    </div>
  );
}

/* =================== Points =================== */

function PointsPage({ points, logs, onBack }: { points: number; logs: PointLog[]; onBack: () => void; }) {
  return (
    <div>
      <TopBar title="账户积分" onBack={onBack} />
      <div className="p-4">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg shadow-primary/30">
          <div className="text-xs opacity-90">当前积分</div>
          <div className="text-4xl font-bold mt-1">{points}</div>
          <div className="mt-2 text-xs opacity-90">积分可用于提现和更多权益</div>
        </div>

        <div className="mt-4 bg-card border border-border rounded-2xl p-4">
          <h3 className="font-semibold text-sm mb-2">积分规则</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>· 提交有效评价可获得 5 积分</li>
            <li>· 发布带图片的笔记可获得 10 积分</li>
            <li>· 添加新场所可获得 10 积分</li>
            <li>· 积分可用于提现和更多权益</li>
          </ul>
        </div>

        <h3 className="mt-5 mb-2 font-semibold text-sm">积分明细</h3>
        <div className="bg-card border border-border rounded-2xl divide-y divide-border/60">
          {logs.map((r) => (
            <div key={r.id} className="flex items-center px-4 h-14">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${r.value < 0 ? "bg-accent-soft text-accent" : "bg-primary-soft text-primary"}`}>
                {r.value < 0 ? <ArrowUpRight className="w-4 h-4" /> : <Award className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <div className="text-sm">{r.type}</div>
                <div className="text-[11px] text-muted-foreground">{r.time}</div>
              </div>
              <div className={`font-semibold ${r.value < 0 ? "text-destructive" : "text-accent"}`}>
                {r.value > 0 ? "+" : ""}{r.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =================== Withdraw =================== */

function WithdrawPage({ points, address, onConnect, onSwitchWallet, onSubmit, records, onBack }: {
  points: number; address: string;
  onConnect: () => void; onSwitchWallet: () => void;
  onSubmit: (amount: number) => void;
  records: WithdrawRecord[]; onBack: () => void;
}) {
  const [amount, setAmount] = useState("");

  const copy = async () => {
    try { await navigator.clipboard.writeText(address); } catch {}
    toast.success("钱包地址已复制");
  };

  const submit = () => {
    const n = parseInt(amount || "0", 10);
    if (!n) { toast.error("请输入提现积分数量"); return; }
    if (n < 50) { toast.error("最低 50 积分起兑"); return; }
    if (n > points) { toast.error("积分余额不足"); return; }
    const usable = Math.floor(n / 50) * 50;
    onSubmit(usable);
    setAmount("");
  };

  return (
    <div className="pb-10">
      <TopBar title="提现兑换 AVAX" onBack={onBack} />
      <div className="p-4 space-y-4">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg shadow-primary/30">
          <div className="text-xs opacity-90">当前可提现积分</div>
          <div className="text-4xl font-bold mt-1">{points}</div>
          <div className="text-xs opacity-90 mt-2">兑换比率：50 积分 = 0.01 AVAX</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1 text-foreground font-medium mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" /> 已接入 Solana 智能合约（Devnet）
          </div>
          <div className="font-mono break-all">Program: Hs768q1NX1...AakqX1</div>
        </div>

        {/* 钱包连接 */}
        {!address ? (
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary-soft text-primary flex items-center justify-center mb-2">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="text-sm font-medium">未连接钱包</div>
            <p className="text-xs text-muted-foreground mt-1 mb-3">连接 Phantom 钱包后可发起链上兑换</p>
            <button onClick={onConnect} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold active:scale-[0.98]">
              连接 Phantom 钱包
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <ShieldCheck className="w-4 h-4 text-primary" />已连接钱包
            </div>
            <div className="bg-secondary rounded-xl px-3 py-2.5 text-sm font-mono break-all">{shortAddr(address)}</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={copy} className="h-10 rounded-xl bg-primary-soft text-primary text-sm font-medium inline-flex items-center justify-center gap-1">
                <Copy className="w-4 h-4" />复制地址
              </button>
              <button onClick={onSwitchWallet} className="h-10 rounded-xl bg-secondary text-foreground text-sm font-medium">切换钱包</button>
            </div>
          </div>
        )}

        {/* 提现金额 */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="text-sm font-medium mb-2">提现积分（最少 50 起兑）</div>
          <div className="flex items-center gap-2">
            <input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ""))}
              placeholder="请输入提现积分数量"
              className="flex-1 h-11 bg-secondary rounded-xl px-3 text-sm outline-none" />
            <button onClick={() => setAmount(String(Math.floor(points / 50) * 50))} className="h-11 px-3 rounded-xl bg-primary-soft text-primary text-xs font-medium shrink-0">
              全部兑换
            </button>
          </div>
          {amount && parseInt(amount, 10) >= 50 && (
            <div className="text-[11px] text-muted-foreground mt-2">
              预计获得 {(Math.floor(parseInt(amount, 10) / 50) * 0.01).toFixed(2)} AVAX
            </div>
          )}
        </div>

        <button onClick={submit} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/30 active:scale-[0.98]">
          {address ? "确认兑换" : "连接钱包并兑换"}
        </button>

        {records.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mt-2 mb-2">兑换记录</h3>
            <div className="bg-card border border-border rounded-2xl divide-y divide-border/60">
              {records.map(r => (
                <div key={r.id} className="px-4 py-3 flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium">兑换 {r.amount} 积分</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{shortAddr(r.address)} · {r.time}</div>
                  </div>
                  <span className="text-xs text-accent bg-accent-soft px-2 py-0.5 rounded">{r.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =================== Favorites/History =================== */

function FavoritesPage({ places, onPlace, favorites, onFav, onBack }: {
  places: Place[]; onPlace: (p: Place) => void; favorites: number[]; onFav: (id: number) => void; onBack: () => void;
}) {
  return (
    <div>
      <TopBar title="我的收藏" onBack={onBack} />
      <div className="p-4 space-y-3">
        {places.length === 0 ? (
          <EmptyState icon={Heart} text="你还没有收藏场所" />
        ) : places.map(p => (
          <PlaceCard key={p.id} p={p} fav={favorites.includes(p.id)} onFav={() => onFav(p.id)} onClick={() => onPlace(p)} />
        ))}
      </div>
    </div>
  );
}

function HistoryPage({ items, onPlace, onClear, onBack }: {
  items: { place: Place; time: string }[]; onPlace: (p: Place) => void; onClear: () => void; onBack: () => void;
}) {
  return (
    <div>
      <TopBar title="最近浏览" onBack={onBack} right={items.length > 0 ? (
        <button onClick={onClear} className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Trash2 className="w-3.5 h-3.5" />清空
        </button>
      ) : undefined} />
      <div className="p-4 space-y-3">
        {items.length === 0 ? (
          <EmptyState icon={Eye} text="你还没有浏览记录" />
        ) : items.map(({ place, time }) => (
          <button key={place.id + time} onClick={() => onPlace(place)} className="w-full bg-card border border-border rounded-2xl p-3 flex items-center gap-3 text-left active:scale-[0.99] transition">
            <PlaceImg src={place.img} type={place.type} className="w-12 h-12 rounded-xl object-cover bg-secondary" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{place.name}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{place.type} · 浏览于 {time}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* =================== Onboarding =================== */

function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const slides = [
    { icon: MapPin, title: "查看附近无烟场所", desc: "一键发现身边空气清新的好去处。" },
    { icon: Award, title: "提交评价获得积分", desc: "每条无烟评价 +5，发笔记 +10。" },
    { icon: Trophy, title: "查看无烟排行榜", desc: "为城市的清新空气投出你的一票。" },
  ];
  const S = slides[step];
  const Icon = S.icon;
  return (
    <div className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
      <div className="w-full bg-card rounded-3xl p-6 relative">
        <button onClick={onDone} className="absolute top-3 right-3 p-1 text-muted-foreground"><X className="w-4 h-4" /></button>
        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-16 h-16 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mb-3">
            <Icon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold">{S.title}</h3>
          <p className="text-sm text-muted-foreground mt-2">{S.desc}</p>
        </div>
        <div className="flex justify-center gap-1.5 mt-5">
          {slides.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-primary" : "w-1.5 bg-border"}`} />
          ))}
        </div>
        <button
          onClick={() => step === slides.length - 1 ? onDone() : setStep(step + 1)}
          className="mt-5 w-full h-11 rounded-2xl bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition"
        >
          {step === slides.length - 1 ? "开始使用" : "下一步"}
        </button>
      </div>
    </div>
  );
}

/* =================== Bottom Tab =================== */

function BottomTab({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void; }) {
  const items: { key: Tab; label: string; icon: any; isPub?: boolean }[] = [
    { key: "home", label: "推荐", icon: Home },
    { key: "rank", label: "排行榜", icon: Trophy },
    { key: "publish", label: "发布", icon: PlusCircle, isPub: true },
    { key: "notes", label: "笔记", icon: FileText },
    { key: "me", label: "我的", icon: User },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border h-16 flex items-stretch">
      {items.map(({ key, label, icon: Icon, isPub }) => {
        const active = tab === key;
        return (
          <button key={key} onClick={() => onChange(key)} className="flex-1 flex flex-col items-center justify-center gap-0.5">
            {isPub ? (
              <span className="-mt-6 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/40">
                <PlusCircle className="w-6 h-6" />
              </span>
            ) : (
              <Icon className={`w-5 h-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
            )}
            <span className={`text-[11px] ${active ? "text-primary font-medium" : "text-muted-foreground"}`}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* =================== Search Page =================== */

const SORT_LABELS: Record<SortKey, string> = {
  default: "综合推荐",
  distance: "距离最近",
  score: "评分最高",
  reviews: "评价最多",
  smoke: "无烟友好",
};

function sortPlaces(places: Place[], key: SortKey): Place[] {
  const arr = [...places];
  const num = (s: string) => parseFloat(s.replace("km", "").replace("m", "")) * (s.includes("km") ? 1000 : 1);
  if (key === "distance") arr.sort((a, b) => num(a.distance) - num(b.distance));
  if (key === "score") arr.sort((a, b) => placeAvgScore(b) - placeAvgScore(a));
  if (key === "reviews") arr.sort((a, b) => b.reviewCount - a.reviewCount);
  if (key === "smoke") arr.sort((a, b) => a.smokeReports - b.smokeReports || placeAvgScore(b) - placeAvgScore(a));
  return arr;
}

function SortBar({ value, onChange, options }: {
  value: SortKey; onChange: (v: SortKey) => void;
  options: SortKey[];
}) {
  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none">
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className={`shrink-0 px-3 h-8 rounded-full text-xs font-medium border transition ${
            value === o ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
          }`}>{SORT_LABELS[o]}</button>
      ))}
    </div>
  );
}

function SearchPage({ search, setSearch, sort, setSort, places, onPlace, favorites, onFav, onBack, onAdd }: {
  search: string; setSearch: (v: string) => void;
  sort: SortKey; setSort: (s: SortKey) => void;
  places: Place[]; onPlace: (p: Place) => void;
  favorites: number[]; onFav: (id: number) => void;
  onBack: () => void; onAdd: () => void;
}) {
  const filtered = useMemo(() => {
    const s = search.trim();
    const list = s ? places.filter(p => p.name.includes(s) || p.type.includes(s) || p.tags.some(t => t.includes(s))) : places;
    return sortPlaces(list, sort);
  }, [search, places, sort]);

  return (
    <div>
      <div className="sticky top-0 z-20 bg-background border-b border-border">
        <div className="h-12 flex items-center px-3 gap-2">
          <button onClick={onBack} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1 flex items-center gap-2 bg-secondary rounded-xl px-3 h-9">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索场所"
              className="flex-1 bg-transparent text-sm outline-none"
            />
            {search && <button onClick={() => setSearch("")}><X className="w-4 h-4 text-muted-foreground" /></button>}
          </div>
        </div>
        <SortBar value={sort} onChange={setSort} options={["distance", "score", "reviews", "smoke"]} />
      </div>
      <div className="p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-10 h-10 text-muted-foreground opacity-50 mb-3" />
            <p className="text-sm text-muted-foreground max-w-[260px]">暂时找不到相关场所，你可以换个关键词，或者添加这个场所</p>
            <div className="mt-5 flex gap-2 w-full max-w-[280px]">
              <button onClick={onBack} className="flex-1 h-11 rounded-xl bg-secondary text-foreground text-sm font-medium">返回首页</button>
              <button onClick={onAdd} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium">添加新场所</button>
            </div>
          </div>
        ) : filtered.map(p => (
          <PlaceCard key={p.id} p={p} fav={favorites.includes(p.id)} onFav={() => onFav(p.id)} onClick={() => onPlace(p)} />
        ))}
      </div>
    </div>
  );
}

/* =================== Category Page =================== */

function CategoryPage({ cat, setCat, sort, setSort, places, onPlace, favorites, onFav, onBack }: {
  cat: Exclude<Category, "全部">;
  setCat: (c: Exclude<Category, "全部">) => void;
  sort: SortKey; setSort: (s: SortKey) => void;
  places: Place[]; onPlace: (p: Place) => void;
  favorites: number[]; onFav: (id: number) => void;
  onBack: () => void;
}) {
  const list = useMemo(() => sortPlaces(places.filter(p => p.type === cat), sort), [cat, sort, places]);
  const cats = CATEGORIES.map(c => c.key);
  return (
    <div>
      <TopBar title={cat} onBack={onBack} />
      <div className="px-2 pt-2 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 px-2 min-w-max">
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 h-8 rounded-full text-xs font-medium border transition ${
                cat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
              }`}>{c}</button>
          ))}
        </div>
      </div>
      <SortBar value={sort} onChange={setSort} options={["default", "distance", "score", "reviews"]} />
      <div className="px-4 pb-4 space-y-3">
        {list.length === 0 ? (
          <EmptyState icon={MapPin} text={`暂无「${cat}」场所，去添加一个吧`} />
        ) : list.map(p => (
          <PlaceCard key={p.id} p={p} fav={favorites.includes(p.id)} onFav={() => onFav(p.id)} onClick={() => onPlace(p)} />
        ))}
      </div>
    </div>
  );
}

/* =================== Add Place =================== */

function AddPlacePage({ city, onBack, onSubmit }: {
  city: string; onBack: () => void;
  onSubmit: (d: { name: string; type: Exclude<Category, "全部">; address: string }) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<Exclude<Category, "全部"> | "">("");
  const [address, setAddress] = useState("");
  const [hasImg, setHasImg] = useState(false);

  const submit = () => {
    if (!name.trim() || !type || !address.trim()) {
      toast.error("请完成必填项后提交");
      return;
    }
    onSubmit({ name: name.trim(), type: type as Exclude<Category, "全部">, address: address.trim() });
  };

  return (
    <div>
      <TopBar title="添加新场所" onBack={onBack} />
      <div className="p-4 space-y-3">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <Field label="场所名称" required>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="例如：星巴克 静安寺店"
              className="w-full h-11 bg-secondary rounded-xl px-3 text-sm outline-none" />
          </Field>
          <Field label="场所类型" required>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c.key} onClick={() => setType(c.key)}
                  className={`px-2.5 h-8 rounded-full text-xs border ${type === c.key ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"}`}>{c.key}</button>
              ))}
            </div>
          </Field>
          <Field label="场所地址" required>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="例如：南京西路 123 号"
              className="w-full h-11 bg-secondary rounded-xl px-3 text-sm outline-none" />
          </Field>
          <Field label="当前城市">
            <div className="h-11 bg-secondary rounded-xl px-3 text-sm flex items-center text-muted-foreground">{city}</div>
          </Field>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="text-sm font-medium mb-2">上传场所图片</div>
          <button onClick={() => { setHasImg(true); toast.success("图片已添加"); }}
            className={`w-full aspect-[4/3] rounded-xl border border-dashed flex flex-col items-center justify-center text-muted-foreground active:scale-[0.99] transition ${hasImg ? "bg-primary-soft border-primary text-primary" : "bg-secondary border-border"}`}>
            {hasImg ? <><Check className="w-6 h-6" /><span className="text-xs mt-1">已上传</span></> : <><Camera className="w-6 h-6" /><span className="text-xs mt-1">点击上传</span></>}
          </button>
        </div>

        <button onClick={submit} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/30 active:scale-[0.98]">
          提交（+10 积分）
        </button>
        <p className="text-[11px] text-center text-muted-foreground">提交成功后，审核通过会展示在首页</p>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1.5">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </div>
      {children}
    </div>
  );
}

/* =================== Report =================== */

const REPORT_REASONS = ["有人在室内吸烟", "有明显烟味", "没有无烟标志", "工作人员未劝阻", "其他问题"];

function ReportPage({ place, onBack }: { place: Place; onBack: () => void; }) {
  const [reason, setReason] = useState("");
  const [text, setText] = useState("");
  const [hasImg, setHasImg] = useState(false);
  const submit = () => {
    if (!reason) { toast.error("请选择举报原因"); return; }
    toast.success("举报提交成功，感谢你帮助改善无烟环境 🌿");
    onBack();
  };
  return (
    <div>
      <TopBar title="举报吸烟问题" onBack={onBack} />
      <div className="p-4 space-y-3">
        <div className="bg-primary-soft text-primary rounded-2xl p-3 text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4" />{place.name}
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="text-sm font-medium mb-3">举报原因</div>
          <div className="space-y-2">
            {REPORT_REASONS.map(r => (
              <button key={r} onClick={() => setReason(r)}
                className={`w-full h-11 rounded-xl text-sm flex items-center justify-between px-3 border transition ${
                  reason === r ? "bg-primary-soft border-primary text-primary" : "bg-background border-border"
                }`}>
                <span>{r}</span>
                {reason === r && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="补充描述（可选）"
          className="w-full min-h-[100px] rounded-2xl bg-card border border-border p-3 text-sm outline-none focus:border-primary" />
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="text-sm font-medium mb-2">图片证据（可选）</div>
          <button onClick={() => { setHasImg(true); toast.success("图片已添加"); }}
            className={`w-full aspect-[4/3] rounded-xl border border-dashed flex flex-col items-center justify-center text-muted-foreground ${hasImg ? "bg-primary-soft border-primary text-primary" : "bg-secondary border-border"}`}>
            {hasImg ? <Check className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
            <span className="text-xs mt-1">{hasImg ? "已上传" : "点击上传"}</span>
          </button>
        </div>
        <button onClick={submit} className="w-full h-12 rounded-2xl bg-destructive text-destructive-foreground font-semibold active:scale-[0.98]">提交举报</button>
      </div>
    </div>
  );
}

/* =================== Correction =================== */

const CORRECTION_REASONS = ["地址错误", "电话错误", "营业时间错误", "场所类型错误", "其他信息错误"];

function CorrectionPage({ place, onBack }: { place: Place; onBack: () => void; }) {
  const [reason, setReason] = useState("");
  const [text, setText] = useState("");
  const submit = () => {
    if (!reason) { toast.error("请选择纠错类型"); return; }
    toast.success("纠错提交成功，我们会尽快核实");
    onBack();
  };
  return (
    <div>
      <TopBar title="纠错场所信息" onBack={onBack} />
      <div className="p-4 space-y-3">
        <div className="bg-primary-soft text-primary rounded-2xl p-3 text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4" />{place.name}
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="text-sm font-medium mb-3">纠错类型</div>
          <div className="space-y-2">
            {CORRECTION_REASONS.map(r => (
              <button key={r} onClick={() => setReason(r)}
                className={`w-full h-11 rounded-xl text-sm flex items-center justify-between px-3 border ${
                  reason === r ? "bg-primary-soft border-primary text-primary" : "bg-background border-border"
                }`}>
                <span>{r}</span>
                {reason === r && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="补充正确信息（可选）"
          className="w-full min-h-[100px] rounded-2xl bg-card border border-border p-3 text-sm outline-none focus:border-primary" />
        <button onClick={submit} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold active:scale-[0.98]">提交纠错</button>
      </div>
    </div>
  );
}

/* =================== Help =================== */

const FAQ = [
  { q: "空气评分怎么算？", a: "空气评分根据无烟标志、是否有人吸烟、空气是否有烟味、工作人员是否劝阻综合计算，满分 5 分。" },
  { q: "写评价可以获得多少积分？", a: "提交一条有效评价可获得 5 积分。" },
  { q: "发笔记可以获得多少积分？", a: "发布一条带图片的笔记可获得 10 积分。" },
  { q: "添加新场所可以获得多少积分？", a: "提交一个新场所可获得 10 积分，审核通过后展示在首页。" },
  { q: "积分可以做什么？", a: "积分可在「我的 - 提现」中提现到已连接的钱包地址，也可用于后续更多权益。" },
  { q: "发现有人吸烟怎么办？", a: "可以在场所详情页点击「举报吸烟问题」提交反馈。" },
];

function HelpPage({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div>
      <TopBar title="帮助中心" onBack={onBack} />
      <div className="p-4 space-y-2">
        <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground rounded-2xl p-4 mb-2">
          <div className="font-semibold flex items-center gap-2"><HelpCircle className="w-4 h-4" />常见问题</div>
          <p className="text-xs opacity-90 mt-1">关于空气点评的使用与积分玩法</p>
        </div>
        {FAQ.map((f, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left">
              <span className="text-sm font-medium pr-3">{f.q}</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed">{f.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =================== Settings =================== */

const HOT_CITIES = ["上海市", "北京市", "深圳市", "广州市", "杭州市", "成都市", "武汉市", "南京市"];

function SettingsPage({ fontSize, setFontSize, city, onCityClick, notifyOn, setNotifyOn, onBack }: {
  fontSize: FontSize; setFontSize: (f: FontSize) => void;
  city: string; onCityClick: () => void;
  notifyOn: boolean; setNotifyOn: (v: boolean) => void;
  onBack: () => void;
}) {
  return (
    <div>
      <TopBar title="设置" onBack={onBack} />
      <div className="p-4 space-y-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="text-sm font-medium mb-3 flex items-center gap-1.5"><TypeIcon className="w-4 h-4 text-primary" />字体大小</div>
          <div className="flex gap-2">
            {([["standard", "标准"], ["large", "大号"], ["xlarge", "超大"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => setFontSize(k)}
                className={`flex-1 h-10 rounded-xl text-sm border ${fontSize === k ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"}`}>{l}</button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-2">效果会立即应用到全 App</div>
        </div>

        <button onClick={onCityClick} className="w-full bg-card border border-border rounded-2xl p-4 flex items-center justify-between active:bg-secondary">
          <span className="text-sm font-medium flex items-center gap-1.5"><MapPinned className="w-4 h-4 text-primary" />城市切换</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">{city}<ChevronRight className="w-4 h-4" /></span>
        </button>

        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-1.5"><Bell className="w-4 h-4 text-primary" />消息提醒</span>
          <button onClick={() => setNotifyOn(!notifyOn)}
            className={`relative w-11 h-6 rounded-full transition ${notifyOn ? "bg-primary" : "bg-border"}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-all ${notifyOn ? "left-5" : "left-0.5"}`} />
          </button>
        </div>

        <button onClick={() => toast.success("缓存已清除")} className="w-full bg-card border border-border rounded-2xl p-4 flex items-center justify-between active:bg-secondary">
          <span className="text-sm font-medium flex items-center gap-1.5"><Trash2 className="w-4 h-4 text-primary" />清除缓存</span>
          <span className="text-xs text-muted-foreground">2.4 MB</span>
        </button>

        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="text-sm font-medium mb-2 flex items-center gap-1.5"><Wind className="w-4 h-4 text-primary" />关于空气点评</div>
          <p className="text-xs text-muted-foreground leading-relaxed">空气点评是一个聚焦城市公共场所无烟环境的轻量级公益评价产品，让每一次呼吸都更清新。</p>
        </div>
      </div>
    </div>
  );
}

function CitySelectPage({ city, onBack, onPick }: { city: string; onBack: () => void; onPick: (c: string) => void }) {
  const [kw, setKw] = useState("");
  const list = HOT_CITIES.filter(c => !kw || c.includes(kw));
  return (
    <div>
      <TopBar title="选择城市" onBack={onBack} />
      <div className="p-4 space-y-4">
        <div className="bg-card border border-border rounded-2xl px-3 h-10 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input value={kw} onChange={e => setKw(e.target.value)} placeholder="搜索城市"
            className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="text-xs text-muted-foreground mb-2">当前城市</div>
          <div className="flex items-center gap-2 text-sm text-primary"><MapPin className="w-4 h-4" />{city}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-2">热门城市</div>
          <div className="grid grid-cols-3 gap-2">
            {list.map(c => (
              <button key={c} onClick={() => onPick(c)}
                className={`h-10 rounded-xl text-sm border ${c === city ? "bg-primary-soft text-primary border-primary" : "bg-card border-border active:bg-secondary"}`}>
                {c}
              </button>
            ))}
          </div>
          {list.length === 0 && <div className="text-xs text-muted-foreground text-center py-6">未找到匹配城市</div>}
        </div>
      </div>
    </div>
  );
}
