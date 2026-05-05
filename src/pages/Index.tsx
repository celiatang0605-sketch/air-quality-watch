import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  MapPin, Search, Star, Wind, Heart, Bookmark, Bell, ChevronRight,
  Home, Trophy, PlusCircle, User, Coffee, Utensils, ShoppingBag, Hotel,
  Film, Mic2, Dumbbell, BookOpen, CupSoda, Building2, ArrowLeft, Camera,
  Wallet, Award, Eye, LifeBuoy, LogOut, Check, Cigarette, ShieldCheck,
} from "lucide-react";

type Category =
  | "全部" | "餐厅" | "咖啡馆" | "商场" | "酒店"
  | "电影院" | "KTV" | "健身房" | "书店" | "奶茶店" | "写字楼";

type Place = {
  id: number;
  name: string;
  type: Exclude<Category, "全部">;
  address: string;
  distance: string;
  score: number;
  reviews: number;
  smokefree: "无烟" | "部分无烟" | "有烟味";
  tags: string[];
  img: string; // emoji as visual placeholder
  smokeReports: number;
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

const MOCK_PLACES: Place[] = [
  { id: 1, name: "M Stand 咖啡（兴业太古汇店）", type: "咖啡馆", address: "南京西路 789 号", distance: "320m", score: 4.9, reviews: 286, smokefree: "无烟", tags: ["全店无烟", "空气清爽", "有提示牌"], img: "☕", smokeReports: 2 },
  { id: 2, name: "鼎泰丰（恒隆店）", type: "餐厅", address: "恒隆广场 6F", distance: "510m", score: 4.7, reviews: 1024, smokefree: "无烟", tags: ["室内无烟", "工作人员劝阻"], img: "🥟", smokeReports: 5 },
  { id: 3, name: "兴业太古汇", type: "商场", address: "南京西路 789 号", distance: "300m", score: 4.6, reviews: 532, smokefree: "无烟", tags: ["公共区无烟", "通风良好"], img: "🛍️", smokeReports: 8 },
  { id: 4, name: "上海静安瑞吉酒店", type: "酒店", address: "石门一路 288 号", distance: "1.2km", score: 4.8, reviews: 412, smokefree: "无烟", tags: ["无烟楼层", "大堂无烟"], img: "🏨", smokeReports: 3 },
  { id: 5, name: "万达影城（大宁店）", type: "电影院", address: "共和新路 1898 号", distance: "2.4km", score: 4.5, reviews: 766, smokefree: "部分无烟", tags: ["影厅无烟", "走廊偶有烟味"], img: "🎬", smokeReports: 12 },
  { id: 6, name: "纯K（静安店）", type: "KTV", address: "愚园路 68 号", distance: "1.8km", score: 3.6, reviews: 198, smokefree: "有烟味", tags: ["包厢有烟味", "缺少劝阻"], img: "🎤", smokeReports: 47 },
  { id: 7, name: "威尔士健身（静安店）", type: "健身房", address: "南京西路 1266 号", distance: "640m", score: 4.7, reviews: 321, smokefree: "无烟", tags: ["全场无烟", "更衣室清新"], img: "🏋️", smokeReports: 1 },
  { id: 8, name: "茑屋书店（上生·新所）", type: "书店", address: "延安西路 1262 号", distance: "3.1km", score: 4.9, reviews: 654, smokefree: "无烟", tags: ["阅读区无烟", "空气安静"], img: "📚", smokeReports: 0 },
  { id: 9, name: "喜茶 LAB（张园店）", type: "奶茶店", address: "茂名北路 张园西区", distance: "880m", score: 4.6, reviews: 410, smokefree: "无烟", tags: ["室内无烟", "有提示牌"], img: "🧋", smokeReports: 4 },
  { id: 10, name: "海底捞火锅（大悦城店）", type: "餐厅", address: "西藏北路 166 号", distance: "2.0km", score: 4.4, reviews: 1532, smokefree: "部分无烟", tags: ["大厅无烟", "包厢偶尔有烟"], img: "🍲", smokeReports: 18 },
];

type Page =
  | "login" | "home" | "list" | "detail" | "review"
  | "note" | "rank" | "me" | "wallet";

type Tab = "home" | "rank" | "publish" | "me";

export default function Index() {
  const [page, setPage] = useState<Page>("login");
  const [tab, setTab] = useState<Tab>("home");
  const [activePlace, setActivePlace] = useState<Place | null>(null);
  const [filterCat, setFilterCat] = useState<Category>("全部");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<number[]>([3, 8]);
  const [points, setPoints] = useState(120);
  const [history] = useState(12);

  const toggleFav = (id: number) => {
    setFavorites((f) => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
    toast.success(favorites.includes(id) ? "已取消收藏" : "已加入收藏");
  };

  const goPlace = (p: Place) => { setActivePlace(p); setPage("detail"); };

  const goTab = (t: Tab) => {
    setTab(t);
    if (t === "home") setPage("home");
    if (t === "rank") setPage("rank");
    if (t === "publish") setPage("note");
    if (t === "me") setPage("me");
  };

  const filtered = useMemo(() => {
    return MOCK_PLACES.filter(p =>
      (filterCat === "全部" || p.type === filterCat) &&
      (search.trim() === "" || p.name.includes(search) || p.type.includes(search))
    );
  }, [filterCat, search]);

  return (
    <div className="min-h-screen w-full bg-muted/40 flex justify-center py-0 sm:py-6">
      <div className="relative w-full sm:max-w-[390px] min-h-screen sm:min-h-[844px] sm:rounded-[2.5rem] sm:shadow-2xl bg-background overflow-hidden flex flex-col">
        {/* Status bar (decorative) */}
        <div className="hidden sm:flex h-7 items-center justify-between px-6 text-[11px] text-foreground/70 bg-background">
          <span>9:41</span>
          <span className="font-medium">空气点评</span>
          <span>100%</span>
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          {page === "login" && <Login onLogin={() => { setPage("home"); setTab("home"); toast.success("登录成功，欢迎来到空气点评"); }} />}
          {page === "home" && (
            <HomePage
              search={search} setSearch={setSearch}
              filterCat={filterCat} setFilterCat={(c) => { setFilterCat(c); setPage("list"); }}
              places={MOCK_PLACES.slice(0, 6)} onPlace={goPlace}
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
              onSubmit={() => {
                setPoints(p => p + 5);
                toast.success("评价提交成功，获得 5 积分 🎉");
                setPage("home"); setTab("home");
              }}
            />
          )}
          {page === "note" && (
            <NotePage
              place={activePlace}
              onBack={() => { setPage("home"); setTab("home"); }}
              onSubmit={() => {
                setPoints(p => p + 10);
                toast.success("笔记发布成功，获得 10 积分 ✨");
                setPage("home"); setTab("home");
              }}
            />
          )}
          {page === "rank" && (
            <RankPage onPlace={goPlace} favorites={favorites} onFav={toggleFav} />
          )}
          {page === "me" && (
            <MePage
              points={points} favCount={favorites.length} history={history}
              onWallet={() => setPage("wallet")}
              onLogout={() => { setPage("login"); toast("已退出登录"); }}
            />
          )}
          {page === "wallet" && (
            <WalletPage points={points} onBack={() => setPage("me")} />
          )}
        </div>

        {/* Bottom Tab */}
        {page !== "login" && (
          <BottomTab tab={tab} onChange={goTab} />
        )}
      </div>
    </div>
  );
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
        <button
          onClick={onLogin}
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/30 active:scale-[0.98] transition"
        >
          一键登录
        </button>
        <button
          onClick={onLogin}
          className="w-full h-12 rounded-2xl border border-border bg-card text-foreground font-medium active:scale-[0.98] transition"
        >
          手机号登录
        </button>
        <p className="text-[11px] text-center text-muted-foreground pt-2">
          登录即同意《用户协议》与《隐私政策》
        </p>
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
  const color = score >= 4.5 ? "bg-primary" : score >= 4.0 ? "bg-accent" : "bg-destructive";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] text-primary-foreground px-1.5 py-0.5 rounded-md ${color}`}>
      <Wind className="w-3 h-3" />{score.toFixed(1)}
    </span>
  );
}

function SmokeTag({ status }: { status: Place["smokefree"] }) {
  const map = {
    "无烟": "bg-primary-soft text-primary",
    "部分无烟": "bg-accent-soft text-accent",
    "有烟味": "bg-destructive/10 text-destructive",
  } as const;
  return <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${map[status]}`}>{status}</span>;
}

function PlaceCard({ p, fav, onFav, onClick }: { p: Place; fav: boolean; onFav: () => void; onClick: () => void; }) {
  return (
    <button onClick={onClick} className="w-full text-left bg-card rounded-2xl p-3 shadow-sm border border-border/60 active:scale-[0.99] transition">
      <div className="flex gap-3">
        <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center text-4xl shrink-0">
          {p.img}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm truncate">{p.name}</h3>
            <button onClick={(e) => { e.stopPropagation(); onFav(); }} className="shrink-0">
              <Heart className={`w-4 h-4 ${fav ? "fill-accent text-accent" : "text-muted-foreground"}`} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <ScoreBadge score={p.score} />
            <SmokeTag status={p.smokefree} />
            <span className="text-[11px] text-muted-foreground">{p.reviews}评价</span>
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

      {/* Categories */}
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

      {/* Banner */}
      <div className="mx-4 mb-3 rounded-2xl p-4 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-md">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          <span className="font-semibold">空气守护者计划</span>
        </div>
        <p className="text-[12px] opacity-90 mt-1">每提交一条无烟评价，可获 5 积分；发笔记可获 10 积分。</p>
      </div>

      {/* Recommended */}
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
                props.filterCat === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border"
              }`}>{c}</button>
          ))}
        </div>
      </div>
      <div className="p-4 space-y-3">
        {props.places.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12">暂无符合条件的场所</div>
        )}
        {props.places.map(p => (
          <PlaceCard key={p.id} p={p} fav={props.favorites.includes(p.id)} onFav={() => props.onFav(p.id)} onClick={() => props.onPlace(p)} />
        ))}
      </div>
    </div>
  );
}

function DetailRow({ label, ok }: { label: string; ok: boolean | "unknown" }) {
  const Icon = ok === true ? Check : ok === false ? Cigarette : Eye;
  const color = ok === true ? "text-primary bg-primary-soft" : ok === false ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-secondary";
  const text = ok === true ? "良好" : ok === false ? "需改进" : "未知";
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/60 last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md ${color}`}>
        <Icon className="w-3.5 h-3.5" />{text}
      </span>
    </div>
  );
}

function DetailPage({ place, fav, onFav, onBack, onReview, onNote }: {
  place: Place; fav: boolean; onFav: () => void; onBack: () => void; onReview: () => void; onNote: () => void;
}) {
  const goodAir = place.smokefree === "无烟";
  return (
    <div className="pb-20">
      <TopBar title="场所详情" onBack={onBack} />
      <div className="h-44 bg-gradient-to-br from-primary-soft to-secondary flex items-center justify-center text-7xl">
        {place.img}
      </div>
      <div className="p-4">
        <h1 className="text-lg font-bold">{place.name}</h1>
        <div className="flex items-center gap-2 mt-1.5">
          <ScoreBadge score={place.score} />
          <SmokeTag status={place.smokefree} />
          <span className="text-xs text-muted-foreground">{place.reviews} 条评价</span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />{place.type} · {place.address} · {place.distance}
        </div>

        <div className="mt-4 bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Wind className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">空气评价指标</h3>
          </div>
          <DetailRow label="无烟标志" ok={true} />
          <DetailRow label="实际是否有人抽烟" ok={!goodAir ? false : true} />
          <DetailRow label="空气是否有烟味" ok={goodAir ? true : false} />
          <DetailRow label="工作人员是否劝阻" ok={place.smokefree === "有烟味" ? "unknown" : true} />
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
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed sm:absolute bottom-16 left-0 right-0 sm:bottom-16 sm:left-auto sm:right-auto sm:w-[390px]">
        <div className="mx-3 bg-card border border-border rounded-2xl shadow-lg p-2 flex items-center gap-2">
          <button onClick={onFav} className="flex-1 h-11 rounded-xl bg-secondary text-foreground text-sm font-medium flex items-center justify-center gap-1">
            <Bookmark className={`w-4 h-4 ${fav ? "fill-primary text-primary" : ""}`} />收藏
          </button>
          <button onClick={onNote} className="flex-1 h-11 rounded-xl bg-accent text-accent-foreground text-sm font-medium">发笔记</button>
          <button onClick={onReview} className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium">写评价</button>
        </div>
      </div>
    </div>
  );
}

function Choice({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="text-sm font-medium mb-3">{label}</div>
      <div className="flex gap-2 flex-wrap">
        {options.map(o => (
          <button key={o} onClick={() => onChange(o)}
            className={`px-4 h-9 rounded-full text-sm border transition ${
              value === o
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-foreground border-border"
            }`}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function ReviewPage({ place, onBack, onSubmit }: { place: Place | null; onBack: () => void; onSubmit: () => void; }) {
  const [v1, setV1] = useState(""); const [v2, setV2] = useState("");
  const [v3, setV3] = useState(""); const [v4, setV4] = useState("");
  const ready = v1 && v2 && v3 && v4;
  return (
    <div>
      <TopBar title="提交无烟评价" onBack={onBack} />
      <div className="p-4 space-y-3">
        <div className="bg-primary-soft text-primary rounded-2xl p-3 text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4" />{place ? place.name : "请选择场所"}
        </div>
        <Choice label="① 无烟标志" options={["有", "无"]} value={v1} onChange={setV1} />
        <Choice label="② 实际是否有人抽烟" options={["有", "无"]} value={v2} onChange={setV2} />
        <Choice label="③ 空气是否有烟味" options={["有", "无"]} value={v3} onChange={setV3} />
        <Choice label="④ 工作人员是否劝阻" options={["有", "无", "没看到"]} value={v4} onChange={setV4} />

        <div className="text-[11px] text-muted-foreground text-center pt-2">
          你的每一次评价，都在让城市更清新 🌿
        </div>

        <button
          disabled={!ready}
          onClick={onSubmit}
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

function NotePage({ place, onBack, onSubmit }: { place: Place | null; onBack: () => void; onSubmit: () => void; }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [target, setTarget] = useState<Place | null>(place);
  const togglePick = (t: string) => setPicked(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  return (
    <div>
      <TopBar title="发布笔记" onBack={onBack} />
      <div className="p-4 space-y-3">
        <button className="w-full bg-card border border-border rounded-2xl p-3 text-left flex items-center justify-between">
          <span className="text-sm text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            {target ? target.name : "选择场所"}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map(i => (
            <button key={i} className="aspect-square rounded-xl bg-secondary border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
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
                  picked.includes(t)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border"
                }`}># {t}</button>
            ))}
          </div>
        </div>

        <button
          onClick={() => { if (!target) setTarget(MOCK_PLACES[0]); onSubmit(); }}
          className="w-full h-12 rounded-2xl bg-accent text-accent-foreground font-semibold shadow-md shadow-accent/30 active:scale-[0.98]">
          发布笔记（+10 积分）
        </button>
      </div>
    </div>
  );
}

function RankPage({ onPlace, favorites, onFav }: { onPlace: (p: Place) => void; favorites: number[]; onFav: (id: number) => void; }) {
  const [tab, setTab] = useState<"clean" | "improve">("clean");
  const list = useMemo(() => {
    const sorted = [...MOCK_PLACES];
    if (tab === "clean") sorted.sort((a, b) => b.score - a.score);
    else sorted.sort((a, b) => b.smokeReports - a.smokeReports);
    return sorted.slice(0, 10);
  }, [tab]);

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
        {list.map((p, i) => (
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
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">{p.name}</h3>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <ScoreBadge score={p.score} />
                <SmokeTag status={p.smokefree} />
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

function MePage({ points, favCount, history, onWallet, onLogout }: {
  points: number; favCount: number; history: number; onWallet: () => void; onLogout: () => void;
}) {
  return (
    <div>
      <div className="bg-gradient-to-b from-primary to-primary-glow text-primary-foreground px-4 pt-6 pb-16">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-card text-primary flex items-center justify-center text-2xl shadow-md">
            🌿
          </div>
          <div>
            <div className="font-bold text-lg">空气守护者</div>
            <div className="text-xs opacity-90 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> 上海市 · 静安区
            </div>
          </div>
        </div>
      </div>

      <div className="-mt-10 mx-4 bg-card border border-border rounded-2xl shadow-sm grid grid-cols-3 divide-x divide-border">
        <div className="py-3 text-center">
          <div className="text-lg font-bold text-accent">{points}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">账户积分</div>
        </div>
        <div className="py-3 text-center">
          <div className="text-lg font-bold text-foreground">{favCount}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">我的收藏</div>
        </div>
        <div className="py-3 text-center">
          <div className="text-lg font-bold text-foreground">{history}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">最近浏览</div>
        </div>
      </div>

      <div className="mt-4 mx-4 rounded-2xl overflow-hidden border border-border">
        <MeRow icon={Wallet} label="我的钱包" value={`${points} 积分余额`} onClick={onWallet} accent />
        <MeRow icon={Heart} label="我的收藏" value={`${favCount} 个`} onClick={() => toast("Demo：收藏列表")} />
        <MeRow icon={Eye} label="最近浏览" value={`${history} 个`} onClick={() => toast("Demo：浏览历史")} />
        <MeRow icon={LifeBuoy} label="帮助中心" onClick={() => toast("Demo：帮助中心")} />
        <MeRow icon={LogOut} label="退出登录" onClick={onLogout} />
      </div>
      <div className="text-center text-[11px] text-muted-foreground mt-4 pb-4">空气点评 · v1.0 Demo</div>
    </div>
  );
}

function WalletPage({ points, onBack }: { points: number; onBack: () => void; }) {
  const records = [
    { t: "提交评价", v: 5, d: "今天 14:20" },
    { t: "发布笔记", v: 10, d: "昨天 19:08" },
    { t: "提交评价", v: 5, d: "5月3日" },
    { t: "新用户注册", v: 100, d: "5月1日" },
  ];
  return (
    <div>
      <TopBar title="积分与钱包" onBack={onBack} />
      <div className="p-4">
        <div className="rounded-2xl p-5 bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-lg shadow-primary/30">
          <div className="flex items-center justify-between text-xs opacity-90">
            <span>当前积分</span>
            <Wallet className="w-4 h-4" />
          </div>
          <div className="text-4xl font-bold mt-1">{points}</div>
          <div className="mt-4 text-xs opacity-90">钱包余额</div>
          <div className="text-lg font-semibold">{points} <span className="text-xs opacity-80">积分</span></div>
          <div className="mt-3 text-[11px] opacity-80 break-all bg-primary-foreground/10 rounded-lg px-2 py-1.5">
            模拟钱包地址：0x8a3f...92c1
          </div>
        </div>

        <div className="mt-4 bg-accent-soft text-accent rounded-2xl p-3 text-xs flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Demo 阶段钱包为模拟展示，积分可作为后续链上钱包联动入口。</span>
        </div>

        <h3 className="mt-5 mb-2 font-semibold text-sm">积分明细</h3>
        <div className="bg-card border border-border rounded-2xl divide-y divide-border/60">
          {records.map((r, i) => (
            <div key={i} className="flex items-center px-4 h-14">
              <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center mr-3">
                <Award className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm">{r.t}</div>
                <div className="text-[11px] text-muted-foreground">{r.d}</div>
              </div>
              <div className="text-accent font-semibold">+{r.v}</div>
            </div>
          ))}
        </div>
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
