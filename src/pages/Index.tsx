import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  MapPin, Search, Wind, Heart, Bookmark, Bell, ChevronRight,
  Home, Trophy, PlusCircle, User, Coffee, Utensils, ShoppingBag, Hotel,
  Film, Mic2, Dumbbell, BookOpen, CupSoda, Building2, ArrowLeft, Camera,
  Wallet, Award, Eye, LifeBuoy, LogOut, Check, Cigarette, ShieldCheck,
  Phone, Clock, Copy, Trash2, X,
} from "lucide-react";

type Category =
  | "全部" | "餐厅" | "咖啡馆" | "商场" | "酒店"
  | "电影院" | "KTV" | "健身房" | "书店" | "奶茶店" | "写字楼";

type ReviewItem = {
  id: string;
  user: string;
  avatar: string;
  time: string;
  sign: "有" | "无";        // 无烟标志
  smoker: "有" | "无";      // 实际是否有人抽烟
  smell: "有" | "无";       // 空气是否有烟味
  staff: "有" | "无" | "没看到"; // 工作人员是否劝阻
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
  cover: string; // emoji placeholder
  placeName: string;
};

type Place = {
  id: number;
  name: string;
  type: Exclude<Category, "全部">;
  address: string;
  distance: string;
  reviewCount: number;
  smokeReports: number;
  tags: string[];
  img: string;
  businessHours: string;
  phone: string;
  reviews: ReviewItem[];
  notes: NoteItem[];
};

const CATEGORIES: { key: Category; icon: any }[] = [
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

/* ============== 评分规则 ============== */
function scoreFromAnswers(a: { sign: string; smoker: string; smell: string; staff: string }) {
  let s = 0;
  if (a.sign === "有") s += 1;
  if (a.smoker === "无") s += 1.5;
  if (a.smell === "无") s += 1.5;
  if (a.staff === "有") s += 1;
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

const MOCK_PLACES: Place[] = [
  {
    id: 1, name: "M Stand 咖啡（兴业太古汇店）", type: "咖啡馆",
    address: "南京西路 789 号", distance: "320m",
    reviewCount: 286, smokeReports: 2,
    tags: ["全店无烟", "空气清爽", "有提示牌"], img: "☕",
    businessHours: "08:00 - 22:00", phone: "021-6288 1234",
    reviews: [
      seedReview({ user: "清新呼吸", avatar: "🍃", time: "1 小时前", text: "进门就有无烟标志，整个店没有任何烟味。" }),
      seedReview({ user: "拿铁拿铁", avatar: "☕", time: "今天", text: "工作人员会主动劝阻，体验非常好。" }),
    ], notes: [],
  },
  {
    id: 2, name: "鼎泰丰（恒隆店）", type: "餐厅",
    address: "恒隆广场 6F", distance: "510m",
    reviewCount: 1024, smokeReports: 5,
    tags: ["室内无烟", "工作人员劝阻"], img: "🥟",
    businessHours: "10:30 - 22:00", phone: "021-6279 9999",
    reviews: [seedReview({ user: "小笼控", avatar: "🥟", text: "包间也是全程无烟，赞。" })], notes: [],
  },
  {
    id: 3, name: "兴业太古汇", type: "商场",
    address: "南京西路 789 号", distance: "300m",
    reviewCount: 532, smokeReports: 8,
    tags: ["公共区无烟", "通风良好"], img: "🛍️",
    businessHours: "10:00 - 22:00", phone: "021-2230 8888",
    reviews: [seedReview({ user: "周末逛街", avatar: "🛍️", text: "中庭通风很好，没有闻到烟味。" })], notes: [],
  },
  {
    id: 4, name: "上海静安瑞吉酒店", type: "酒店",
    address: "石门一路 288 号", distance: "1.2km",
    reviewCount: 412, smokeReports: 3,
    tags: ["无烟楼层", "大堂无烟"], img: "🏨",
    businessHours: "全天 24 小时", phone: "021-2287 3000",
    reviews: [seedReview({ user: "差旅日常", avatar: "🧳", text: "无烟楼层很到位，大堂也清爽。" })], notes: [],
  },
  {
    id: 5, name: "万达影城（大宁店）", type: "电影院",
    address: "共和新路 1898 号", distance: "2.4km",
    reviewCount: 766, smokeReports: 12,
    tags: ["影厅无烟", "走廊偶有烟味"], img: "🎬",
    businessHours: "10:00 - 次日 01:00", phone: "021-5696 5555",
    reviews: [seedReview({ user: "电影迷", avatar: "🎬", smell: "有", staff: "没看到", text: "影厅没烟，但走廊偶尔能闻到。" })], notes: [],
  },
  {
    id: 6, name: "纯K（静安店）", type: "KTV",
    address: "愚园路 68 号", distance: "1.8km",
    reviewCount: 198, smokeReports: 47,
    tags: ["包厢有烟味", "缺少劝阻"], img: "🎤",
    businessHours: "12:00 - 次日 02:00", phone: "021-6248 1111",
    reviews: [seedReview({ user: "唱歌不抽烟", avatar: "🎤", sign: "无", smoker: "有", smell: "有", staff: "无", text: "包厢里烟味较重。" })], notes: [],
  },
  {
    id: 7, name: "威尔士健身（静安店）", type: "健身房",
    address: "南京西路 1266 号", distance: "640m",
    reviewCount: 321, smokeReports: 1,
    tags: ["全场无烟", "更衣室清新"], img: "🏋️",
    businessHours: "06:00 - 23:00", phone: "021-6133 0000",
    reviews: [seedReview({ user: "撸铁选手", avatar: "🏋️", text: "全场都禁烟，呼吸顺畅。" })], notes: [],
  },
  {
    id: 8, name: "茑屋书店（上生·新所）", type: "书店",
    address: "延安西路 1262 号", distance: "3.1km",
    reviewCount: 654, smokeReports: 0,
    tags: ["阅读区无烟", "空气安静"], img: "📚",
    businessHours: "10:00 - 22:00", phone: "021-6248 8888",
    reviews: [seedReview({ user: "书页香", avatar: "📚", text: "阅读区非常安静且空气好。" })], notes: [],
  },
  {
    id: 9, name: "喜茶 LAB（张园店）", type: "奶茶店",
    address: "茂名北路 张园西区", distance: "880m",
    reviewCount: 410, smokeReports: 4,
    tags: ["室内无烟", "有提示牌"], img: "🧋",
    businessHours: "10:00 - 22:30", phone: "400-021-1234",
    reviews: [seedReview({ user: "奶茶星人", avatar: "🧋", text: "室内非常干净，没有烟味。" })], notes: [],
  },
  {
    id: 10, name: "凯德 Mall（静安寺店）写字楼大厅", type: "写字楼",
    address: "愚园路 168 号", distance: "1.0km",
    reviewCount: 156, smokeReports: 6,
    tags: ["大堂无烟", "电梯口偶有"], img: "🏢",
    businessHours: "07:00 - 22:00", phone: "021-3220 0000",
    reviews: [seedReview({ user: "通勤打工人", avatar: "💼", smell: "有", staff: "没看到", text: "大堂无烟，电梯口偶尔有人抽。" })], notes: [],
  },
];

type Page =
  | "login" | "home" | "list" | "detail" | "review" | "note"
  | "rank" | "me" | "wallet" | "favorites" | "history" | "points";

type Tab = "home" | "rank" | "publish" | "me";

type PointLog = { id: string; type: string; value: number; time: string };

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
  const [places, setPlaces] = useState<Place[]>(MOCK_PLACES);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // sync activePlace when places list updates
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
    if (t === "publish") setPage("note");
    if (t === "me") setPage("me");
  };

  const filtered = useMemo(() => {
    return places.filter(p =>
      (filterCat === "全部" || p.type === filterCat) &&
      (search.trim() === "" || p.name.includes(search) || p.type.includes(search))
    );
  }, [filterCat, search, places]);

  const submitReview = (answers: { sign: "有" | "无"; smoker: "有" | "无"; smell: "有" | "无"; staff: "有" | "无" | "没看到"; text: string }) => {
    if (!activePlace) return;
    const newReview = seedReview({
      user: "我", avatar: "🙂", time: "刚刚",
      sign: answers.sign, smoker: answers.smoker, smell: answers.smell, staff: answers.staff,
      text: answers.text || "刚刚提交了一条无烟评价。",
    });
    setPlaces(prev => prev.map(p => p.id === activePlace.id ? {
      ...p,
      reviews: [newReview, ...p.reviews],
      reviewCount: p.reviewCount + 1,
    } : p));
    setPoints(v => v + 5);
    setPointLogs(l => [{ id: Math.random().toString(36).slice(2), type: "提交评价", value: 5, time: nowLabel() }, ...l]);
    toast.success("评价提交成功，获得 5 积分 🎉");
    setPage("detail");
  };

  const submitNote = (data: { text: string; tags: string[] }) => {
    if (!activePlace) return;
    const newNote: NoteItem = {
      id: Math.random().toString(36).slice(2),
      user: "我", avatar: "🙂", time: "刚刚",
      text: data.text, tags: data.tags, cover: activePlace.img, placeName: activePlace.name,
    };
    setPlaces(prev => prev.map(p => p.id === activePlace.id ? {
      ...p, notes: [newNote, ...p.notes],
    } : p));
    setPoints(v => v + 10);
    setPointLogs(l => [{ id: Math.random().toString(36).slice(2), type: "发布笔记", value: 10, time: nowLabel() }, ...l]);
    toast.success("笔记发布成功，获得 10 积分 ✨");
    setPage("detail");
  };

  return (
    <div className="min-h-screen w-full bg-muted/40 flex justify-center py-0 sm:py-6">
      <div className="relative w-full sm:max-w-[390px] min-h-screen sm:min-h-[844px] sm:rounded-[2.5rem] sm:shadow-2xl bg-background overflow-hidden flex flex-col">
        <div className="hidden sm:flex h-7 items-center justify-between px-6 text-[11px] text-foreground/70 bg-background">
          <span>9:41</span>
          <span className="font-medium">空气点评</span>
          <span>100%</span>
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          {page === "login" && <Login onLogin={() => { setPage("home"); setTab("home"); setShowOnboarding(true); toast.success("登录成功，欢迎来到空气点评"); }} />}
          {page === "home" && (
            <HomePage
              search={search} setSearch={setSearch}
              filterCat={filterCat} setFilterCat={(c) => { setFilterCat(c); setPage("list"); }}
              places={places.slice(0, 6)} onPlace={goPlace}
              favorites={favorites} onFav={toggleFav}
              onSeeAll={() => setPage("list")}
            />
          )}
          {page === "list" && (
            <ListPage
              filterCat={filterCat} setFilterCat={setFilterCat}
              search={search} setSearch={setSearch}
              places={filtered} onPlace={goPlace}
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
            />
          )}
          {page === "review" && (
            <ReviewPage
              place={activePlace}
              onBack={() => setPage(activePlace ? "detail" : "home")}
              onSubmit={submitReview}
            />
          )}
          {page === "note" && (
            <NotePage
              place={activePlace}
              onBack={() => { activePlace ? setPage("detail") : setPage("home"); }}
              onSubmit={submitNote}
            />
          )}
          {page === "rank" && (
            <RankPage places={places} onPlace={goPlace} favorites={favorites} onFav={toggleFav} />
          )}
          {page === "me" && (
            <MePage
              points={points} favCount={favorites.length} historyCount={history.length}
              onWallet={() => setPage("wallet")}
              onPoints={() => setPage("points")}
              onFavorites={() => setPage("favorites")}
              onHistory={() => setPage("history")}
              onLogout={() => { setPage("login"); toast("已退出登录"); }}
            />
          )}
          {page === "wallet" && (
            <WalletPage points={points} onBack={() => setPage("me")} />
          )}
          {page === "points" && (
            <PointsPage points={points} logs={pointLogs} onBack={() => setPage("me")} onWallet={() => setPage("wallet")} />
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
        </div>

        {page !== "login" && <BottomTab tab={tab} onChange={goTab} />}
        {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
      </div>
    </div>
  );
}

/* =================== Helpers =================== */

function nowLabel() {
  const d = new Date();
  return `今天 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function placeAvgScore(p: Place): number {
  if (p.reviews.length === 0) return 4.5;
  const sum = p.reviews.reduce((s, r) => s + r.score, 0);
  return +(sum / p.reviews.length).toFixed(1);
}

/* =================== Components =================== */

function Login({ onLogin }: { onLogin: () => void }) {
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
        <button onClick={onLogin} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/30 active:scale-[0.98] transition">
          一键登录
        </button>
        <button onClick={onLogin} className="w-full h-12 rounded-2xl border border-border bg-card text-foreground font-medium active:scale-[0.98] transition">
          手机号登录
        </button>
        <p className="text-[11px] text-center text-muted-foreground pt-2">登录即同意《用户协议》与《隐私政策》</p>
      </div>
    </div>
  );
}

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
        <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center text-4xl shrink-0">{p.img}</div>
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
  filterCat: Category; setFilterCat: (c: Category) => void;
  places: Place[]; onPlace: (p: Place) => void;
  favorites: number[]; onFav: (id: number) => void;
  onSeeAll: () => void;
}) {
  return (
    <div>
      <div className="bg-gradient-to-b from-primary-soft to-background px-4 pt-4 pb-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-foreground font-medium">
            <MapPin className="w-4 h-4 text-primary" /> 上海市 静安区 <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <Bell className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="mt-3 flex items-center gap-2 bg-card rounded-2xl px-3 h-10 border border-border/60 shadow-sm">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={props.search}
            onChange={(e) => props.setSearch(e.target.value)}
            placeholder="搜索餐厅、咖啡馆、商场"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="px-2 py-3 overflow-x-auto">
        <div className="flex gap-1 min-w-max px-2">
          {CATEGORIES.map(({ key, icon: Icon }) => (
            <button key={key} onClick={() => props.setFilterCat(key)}
              className="flex flex-col items-center gap-1 w-16 py-2 rounded-xl active:bg-secondary">
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
      <div className="px-2 mt-3 overflow-x-auto">
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

function NoteCard({ n }: { n: NoteItem }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-sm">{n.avatar}</div>
        <div className="flex-1 text-sm font-medium">{n.user}</div>
        <div className="text-[11px] text-muted-foreground">{n.time}</div>
      </div>
      <div className="aspect-[16/10] rounded-xl bg-gradient-to-br from-primary-soft to-secondary flex items-center justify-center text-5xl mb-2">
        {n.cover}
      </div>
      <p className="text-sm leading-relaxed">{n.text}</p>
      <div className="mt-1 flex flex-wrap gap-1">
        {n.tags.map(t => <span key={t} className="text-[10px] text-primary bg-primary-soft px-1.5 py-0.5 rounded"># {t}</span>)}
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
        <MapPin className="w-3 h-3" />{n.placeName}
      </div>
    </div>
  );
}

function DetailPage({ place, fav, onFav, onBack, onReview, onNote }: {
  place: Place; fav: boolean; onFav: () => void; onBack: () => void; onReview: () => void; onNote: () => void;
}) {
  const score = placeAvgScore(place);
  return (
    <div className="pb-32">
      <TopBar title="场所详情" onBack={onBack} />
      <div className="h-44 bg-gradient-to-br from-primary-soft to-secondary flex items-center justify-center text-7xl">
        {place.img}
      </div>
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

        {/* 用户评价 */}
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

        {/* 用户笔记 */}
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

function Choice<T extends string>({ label, options, value, onChange }: {
  label: string; options: T[]; value: T | ""; onChange: (v: T) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="text-sm font-medium mb-3">{label}</div>
      <div className="flex gap-2 flex-wrap">
        {options.map(o => (
          <button key={o} onClick={() => onChange(o)}
            className={`px-4 h-9 rounded-full text-sm border transition ${
              value === o ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"
            }`}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function ReviewPage({ place, onBack, onSubmit }: {
  place: Place | null; onBack: () => void;
  onSubmit: (a: { sign: "有" | "无"; smoker: "有" | "无"; smell: "有" | "无"; staff: "有" | "无" | "没看到"; text: string }) => void;
}) {
  const [sign, setSign] = useState<"" | "有" | "无">("");
  const [smoker, setSmoker] = useState<"" | "有" | "无">("");
  const [smell, setSmell] = useState<"" | "有" | "无">("");
  const [staff, setStaff] = useState<"" | "有" | "无" | "没看到">("");
  const [text, setText] = useState("");
  const ready = sign && smoker && smell && staff;

  const previewScore = ready ? scoreFromAnswers({ sign, smoker, smell, staff }) : 0;

  const handleSubmit = () => {
    if (!ready) {
      toast.error("请完成必填项后提交");
      return;
    }
    onSubmit({ sign: sign as any, smoker: smoker as any, smell: smell as any, staff: staff as any, text });
  };

  return (
    <div>
      <TopBar title="提交无烟评价" onBack={onBack} />
      <div className="p-4 space-y-3">
        <div className="bg-primary-soft text-primary rounded-2xl p-3 text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4" />{place ? place.name : "请选择场所"}
        </div>
        <Choice label="① 无烟标志" options={["有", "无"] as const} value={sign} onChange={(v) => setSign(v)} />
        <Choice label="② 实际是否有人抽烟" options={["有", "无"] as const} value={smoker} onChange={(v) => setSmoker(v)} />
        <Choice label="③ 空气是否有烟味" options={["有", "无"] as const} value={smell} onChange={(v) => setSmell(v)} />
        <Choice label="④ 工作人员是否劝阻" options={["有", "无", "没看到"] as const} value={staff} onChange={(v) => setStaff(v)} />

        <textarea
          value={text} onChange={e => setText(e.target.value)}
          placeholder="补充一句你的真实感受（可选）"
          className="w-full min-h-[80px] rounded-2xl bg-card border border-border p-3 text-sm outline-none focus:border-primary"
        />

        {ready && (
          <div className="bg-card border border-border rounded-2xl p-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">本次评分预览</span>
            <div className="flex items-center gap-2">
              <ScoreBadge score={previewScore} />
              <StatusTag score={previewScore} />
            </div>
          </div>
        )}

        <div className="text-[11px] text-muted-foreground text-center pt-2">你的每一次评价，都在让城市更清新 🌿</div>

        <button onClick={handleSubmit}
          className={`w-full h-12 rounded-2xl font-semibold text-primary-foreground transition ${
            ready ? "bg-primary shadow-md shadow-primary/30 active:scale-[0.98]" : "bg-primary/40"
          }`}>
          提交评价（+5 积分）
        </button>
      </div>
    </div>
  );
}

const QUICK_TAGS = ["无烟标志明显", "无人吸烟", "空气清爽", "有轻微烟味", "工作人员有提醒"];

function NotePage({ place, onBack, onSubmit }: {
  place: Place | null; onBack: () => void;
  onSubmit: (d: { text: string; tags: string[] }) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");
  const togglePick = (t: string) => setPicked(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);
  const handleUpload = () => {
    if (Math.random() < 0.15) toast.error("图片上传失败，请重新选择");
    else toast.success("图片已添加（Demo 模拟）");
  };
  const handleSubmit = () => {
    if (!place) { toast.error("请先选择场所"); return; }
    if (!text.trim() && picked.length === 0) { toast.error("请完成必填项后提交"); return; }
    onSubmit({ text: text.trim() || picked.join("、"), tags: picked });
  };

  return (
    <div>
      <TopBar title="发布笔记" onBack={onBack} />
      <div className="p-4 space-y-3">
        <button className="w-full bg-card border border-border rounded-2xl p-3 text-left flex items-center justify-between">
          <span className="text-sm text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            {place ? place.name : "请先在场所详情页打开"}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map(i => (
            <button key={i} onClick={handleUpload} className="aspect-square rounded-xl bg-secondary border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground active:scale-95 transition">
              <Camera className="w-5 h-5" />
              <span className="text-[10px] mt-1">添加图片</span>
            </button>
          ))}
        </div>

        <textarea
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="说说这里的空气体验..."
          className="w-full min-h-[120px] rounded-2xl bg-card border border-border p-3 text-sm outline-none focus:border-primary"
        />

        <div>
          <div className="text-sm font-medium mb-2">快速评价</div>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map(t => (
              <button key={t} onClick={() => togglePick(t)}
                className={`px-3 h-8 rounded-full text-xs border transition ${
                  picked.includes(t) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"
                }`}># {t}</button>
            ))}
          </div>
        </div>

        <button onClick={handleSubmit}
          className="w-full h-12 rounded-2xl bg-accent text-accent-foreground font-semibold shadow-md shadow-accent/30 active:scale-[0.98]">
          发布笔记（+10 积分）
        </button>
      </div>
    </div>
  );
}

function RankPage({ places, onPlace, favorites, onFav }: { places: Place[]; onPlace: (p: Place) => void; favorites: number[]; onFav: (id: number) => void; }) {
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
        <h1 className="text-xl font-bold flex items-center gap-2"><Trophy className="w-5 h-5" /> 无烟榜单</h1>
        <p className="text-xs opacity-90 mt-1">来自空气守护者们的真实评价</p>
      </div>
      <div className="-mt-8 mx-4 bg-card rounded-2xl shadow-sm border border-border p-1 flex">
        <button onClick={() => setTab("clean")}
          className={`flex-1 h-10 rounded-xl text-sm font-medium ${tab === "clean" ? "bg-primary text-primary-foreground" : "text-foreground"}`}>无烟排行榜</button>
        <button onClick={() => setTab("improve")}
          className={`flex-1 h-10 rounded-xl text-sm font-medium ${tab === "improve" ? "bg-accent text-accent-foreground" : "text-foreground"}`}>改进建议榜</button>
      </div>

      <div className="p-4 space-y-2">
        {list.length === 0 ? (
          <EmptyState icon={Trophy} text="当前区域榜单正在生成中" />
        ) : list.map(({ p, score }, i) => (
          <button key={p.id} onClick={() => onPlace(p)}
            className="w-full bg-card border border-border rounded-2xl p-3 flex items-center gap-3 active:scale-[0.99] transition text-left">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
              i === 0 ? "bg-accent text-accent-foreground" :
              i === 1 ? "bg-primary text-primary-foreground" :
              i === 2 ? "bg-primary-soft text-primary" :
              "bg-secondary text-foreground"
            }`}>{i + 1}</div>
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">{p.img}</div>
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

function MePage({ points, favCount, historyCount, onWallet, onPoints, onFavorites, onHistory, onLogout }: {
  points: number; favCount: number; historyCount: number;
  onWallet: () => void; onPoints: () => void; onFavorites: () => void; onHistory: () => void; onLogout: () => void;
}) {
  return (
    <div>
      <div className="bg-gradient-to-b from-primary to-primary-glow text-primary-foreground px-4 pt-6 pb-16">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-card text-primary flex items-center justify-center text-2xl shadow-md">🌿</div>
          <div>
            <div className="font-bold text-lg">空气守护者</div>
            <div className="text-xs opacity-90 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> 上海市 · 静安区
            </div>
          </div>
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
        <MeRow icon={Wallet} label="我的钱包" value={`${points} 余额`} onClick={onWallet} accent />
        <MeRow icon={Heart} label="我的收藏" value={`${favCount} 个`} onClick={onFavorites} />
        <MeRow icon={Eye} label="最近浏览" value={`${historyCount} 个`} onClick={onHistory} />
        <MeRow icon={LifeBuoy} label="帮助中心" onClick={() => toast("Demo：帮助中心")} />
        <MeRow icon={LogOut} label="退出登录" onClick={onLogout} />
      </div>
      <div className="text-center text-[11px] text-muted-foreground mt-4 pb-4">空气点评 · v1.0 Demo</div>
    </div>
  );
}

function PointsPage({ points, logs, onBack, onWallet }: { points: number; logs: PointLog[]; onBack: () => void; onWallet: () => void; }) {
  return (
    <div>
      <TopBar title="账户积分" onBack={onBack} />
      <div className="p-4">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg shadow-primary/30">
          <div className="text-xs opacity-90">当前积分</div>
          <div className="text-4xl font-bold mt-1">{points}</div>
          <button onClick={onWallet} className="mt-3 text-xs bg-primary-foreground/15 px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
            前往钱包 <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="mt-4 bg-card border border-border rounded-2xl p-4">
          <h3 className="font-semibold text-sm mb-2">积分规则</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>· 新用户注册：+100</li>
            <li>· 提交一条无烟评价：+5</li>
            <li>· 发布一条空气笔记：+10</li>
          </ul>
        </div>

        <h3 className="mt-5 mb-2 font-semibold text-sm">积分明细</h3>
        <div className="bg-card border border-border rounded-2xl divide-y divide-border/60">
          {logs.map((r) => (
            <div key={r.id} className="flex items-center px-4 h-14">
              <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center mr-3">
                <Award className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm">{r.type}</div>
                <div className="text-[11px] text-muted-foreground">{r.time}</div>
              </div>
              <div className="text-accent font-semibold">+{r.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WalletPage({ points, onBack }: { points: number; onBack: () => void; }) {
  const addr = "0x8a3f...92c1";
  const fullAddr = "0x8a3f1c4d9b2e7f0a6c5d8e4b1f3a9c7d92c1";
  const copy = async () => {
    try { await navigator.clipboard.writeText(fullAddr); } catch {}
    toast.success("钱包地址已复制");
  };
  return (
    <div>
      <TopBar title="我的钱包" onBack={onBack} />
      <div className="p-4">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg shadow-primary/30">
          <div className="flex items-center justify-between text-xs opacity-90">
            <span>钱包余额</span>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-4xl font-bold mt-1">{points}</div>
          <div className="text-xs opacity-80 mt-0.5">≈ {points} 积分</div>

          <div className="mt-4 text-[11px] opacity-90">模拟钱包地址</div>
          <div className="mt-1 flex items-center gap-2 bg-primary-foreground/15 rounded-lg px-3 py-2">
            <span className="text-sm flex-1 truncate">{addr}</span>
            <button onClick={copy} className="inline-flex items-center gap-1 text-xs bg-primary-foreground/20 px-2 py-1 rounded">
              <Copy className="w-3 h-3" />复制
            </button>
          </div>
        </div>

        <div className="mt-4 bg-accent-soft text-accent rounded-2xl p-3 text-xs flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Demo 阶段钱包为模拟展示，后续可接入链上钱包。</span>
        </div>
      </div>
    </div>
  );
}

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
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl">{place.img}</div>
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

function BottomTab({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void; }) {
  const items: { key: Tab; label: string; icon: any }[] = [
    { key: "home", label: "推荐", icon: Home },
    { key: "rank", label: "排行榜", icon: Trophy },
    { key: "publish", label: "发布", icon: PlusCircle },
    { key: "me", label: "我的", icon: User },
  ];
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border h-16 flex items-stretch">
      {items.map(({ key, label, icon: Icon }) => {
        const active = tab === key;
        const isPub = key === "publish";
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
