"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Loader2, ChevronDown, ChevronUp, Gift, Crown, X,
  Megaphone, Search, Trash2, BarChart3, Users, BookOpen, Zap, RefreshCw,
} from "lucide-react";
import { isLoggedIn, isAdmin, getToken } from "@/lib/api-client";
import { followUpCount } from "@/lib/conversation-format";
import { ConversationView } from "@/components/ConversationView";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ── Types ──

interface Reading {
  id: number; user_id: number; username: string; email: string;
  question: string; ai_response: string; spread_type: string;
  cards: { nameCN: string; isReversed: boolean; position: string }[];
  created_at: string;
}

interface UserInfo {
  id: number; username: string; email: string; phone?: string;
  is_verified: boolean; is_admin: boolean;
  membership_tier: string; membership_expiry: string | null; created_at: string;
}

interface Stats {
  total_users: number; total_readings: number;
  today_readings: number; week_readings: number;
  premium_users: number;
  top_spreads: { name: string; count: number }[];
}

type Tab = "dashboard" | "readings" | "users";

const TIER_LABELS: Record<string, string> = { free: "免费", basic: "基础会员", premium: "高级会员" };
const TIER_COLORS: Record<string, string> = {
  free: "text-text-tertiary",
  basic: "text-blue-400/80",
  premium: "text-mystic-gold",
};

const PAGE_SIZE = 20;

// ── Helpers ──

async function authFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "请求失败");
  return data;
}

// ── Sub-components ──

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number | string; color: string;
}) {
  return (
    <div className="bg-[#0f0a1a]/80 border border-mystic-purple/20 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-xl font-cinzel text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto">{children}</div>
      </motion.div>
    </>
  );
}

// ── Main Page ──

export default function AdminPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);

  // Data
  const [stats, setStats] = useState<Stats | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Search & pagination
  const [readingSearch, setReadingSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [readingPage, setReadingPage] = useState(0);

  // Announcement
  const [annText, setAnnText] = useState("");
  const [annExpire, setAnnExpire] = useState("");
  const [annMsg, setAnnMsg] = useState("");

  // Gift quota dialog
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftUser, setGiftUser] = useState<UserInfo | null>(null);
  const [giftAmount, setGiftAmount] = useState(5);
  const [giftMsg, setGiftMsg] = useState("");

  // Membership dialog
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberUser, setMemberUser] = useState<UserInfo | null>(null);
  const [memberTier, setMemberTier] = useState("basic");
  const [memberExpiry, setMemberExpiry] = useState("");
  const [memberMsg, setMemberMsg] = useState("");

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) { router.replace("/login"); return; }
    loadDashboard();
  }, []);

  // Reload on tab switch
  useEffect(() => {
    if (tab === "dashboard") loadDashboard();
    else if (tab === "readings") loadReadings();
    else if (tab === "users") loadUsers();
  }, [tab, readingSearch, userSearch, readingPage]);

  // ── Data loaders ──

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const s = await authFetch("/api/admin/stats");
      setStats(s);
    } catch {}
    try {
      const r = await fetch(`${API_BASE}/api/announcement`);
      const d = await r.json();
      if (d.text) { setAnnText(d.text); setAnnExpire(d.expire_at || ""); }
    } catch {}
    setLoading(false);
  };

  const loadReadings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(readingPage * PAGE_SIZE) });
      if (readingSearch) params.set("search", readingSearch);
      const data = await authFetch(`/api/admin/readings?${params}`);
      setReadings(data);
    } catch {}
    setLoading(false);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set("search", userSearch);
      const data = await authFetch(`/api/admin/users?${params}`);
      setUsers(data);
    } catch {}
    setLoading(false);
  };

  // ── Actions ──

  const handleDeleteReading = async (id: number) => {
    try {
      await authFetch(`/api/admin/readings/${id}`, { method: "DELETE" });
      setReadings((prev) => prev.filter((r) => r.id !== id));
      setDeleteId(null);
    } catch {}
  };

  const handleAnnouncement = async () => {
    setAnnMsg("");
    try {
      const d = await authFetch("/api/admin/announcement", {
        method: "POST",
        body: JSON.stringify({ text: annText, expire_at: annExpire }),
      });
      setAnnMsg(d.message || (d.ok ? "已更新" : "失败"));
    } catch { setAnnMsg("操作失败"); }
  };

  const handleGiftQuota = async () => {
    if (!giftUser || giftAmount <= 0) return;
    setGiftMsg("");
    try {
      const d = await authFetch("/api/admin/gift-quota", {
        method: "POST",
        body: JSON.stringify({ user_id: giftUser.id, amount: giftAmount }),
      });
      setGiftMsg(`已赠送 ${giftAmount} 次给 ${giftUser.username}`);
      setTimeout(() => { setGiftOpen(false); setGiftMsg(""); }, 1000);
    } catch (e: any) { setGiftMsg(e.message || "操作失败"); }
  };

  const handleSetMembership = async () => {
    if (!memberUser) return;
    setMemberMsg("");
    try {
      await authFetch("/api/admin/set-membership", {
        method: "POST",
        body: JSON.stringify({ user_id: memberUser.id, tier: memberTier, expiry_date: memberExpiry || null }),
      });
      setMemberMsg(`已设置 ${memberUser.username} 为 ${TIER_LABELS[memberTier]}`);
      setUsers((prev) =>
        prev.map((u) => u.id === memberUser.id
          ? { ...u, membership_tier: memberTier, membership_expiry: memberExpiry || null }
          : u
        )
      );
      setTimeout(() => { setMemberOpen(false); setMemberMsg(""); }, 1000);
    } catch (e: any) { setMemberMsg(e.message || "操作失败"); }
  };

  const toggleExpand = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const expandAll = () => setExpanded(new Set(readings.map((r) => r.id)));
  const collapseAll = () => setExpanded(new Set());

  // ── Render ──

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "dashboard", label: "概览", icon: BarChart3 },
    { key: "readings", label: "占卜记录", icon: BookOpen },
    { key: "users", label: "用户列表", icon: Users },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-text-secondary hover:text-mystic-rose text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> 返回首页
        </button>
        <h1 className="text-2xl font-cinzel text-mystic-gold">管理员面板</h1>
        <button onClick={loadDashboard} className="p-2 rounded-lg hover:bg-mystic-purple/10 text-text-secondary hover:text-mystic-gold transition-colors" title="刷新">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              tab === key
                ? "bg-mystic-gold/20 border border-mystic-gold/40 text-mystic-gold"
                : "border border-mystic-purple/20 text-text-secondary hover:text-mystic-rose"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-mystic-gold animate-spin" />
        </div>
      ) : (
        <>
          {/* ═══ Dashboard ═══ */}
          {tab === "dashboard" && stats && (
            <div className="space-y-6">
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={Users} label="总用户" value={stats.total_users} color="bg-blue-500/10 text-blue-400" />
                <StatCard icon={BookOpen} label="总占卜" value={stats.total_readings} color="bg-purple-500/10 text-purple-400" />
                <StatCard icon={Zap} label="今日占卜" value={stats.today_readings} color="bg-amber-500/10 text-amber-400" />
                <StatCard icon={Crown} label="付费会员" value={stats.premium_users} color="bg-mystic-gold/10 text-mystic-gold" />
              </div>

              {/* Second row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Weekly stats */}
                <div className="bg-[#0f0a1a]/80 border border-mystic-purple/20 rounded-xl p-5">
                  <h3 className="text-sm font-cinzel text-mystic-gold mb-4">本周活动</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">本周占卜</span>
                      <span className="text-text-primary font-semibold">{stats.week_readings}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">今日占卜</span>
                      <span className="text-text-primary font-semibold">{stats.today_readings}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">日均 (本周)</span>
                      <span className="text-text-primary font-semibold">
                        {stats.week_readings > 0 ? (stats.week_readings / 7).toFixed(1) : "0"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top spreads */}
                <div className="bg-[#0f0a1a]/80 border border-mystic-purple/20 rounded-xl p-5">
                  <h3 className="text-sm font-cinzel text-mystic-gold mb-4">热门牌阵</h3>
                  {stats.top_spreads.length === 0 ? (
                    <p className="text-xs text-text-secondary py-4 text-center">暂无数据</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.top_spreads.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="text-text-secondary w-5">#{i + 1}</span>
                          <span className="text-text-primary flex-1 truncate">{s.name || "未知"}</span>
                          <span className="text-mystic-gold/60 text-xs">{s.count}次</span>
                          <div className="w-20 h-1.5 bg-mystic-dark/60 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-mystic-gold/40 rounded-full"
                              style={{ width: `${stats.total_readings > 0 ? (s.count / stats.total_readings) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Announcement */}
              <div className="bg-[#0f0a1a]/80 border border-mystic-purple/20 rounded-xl p-5">
                <h3 className="flex items-center gap-2 text-sm font-cinzel text-mystic-gold mb-3">
                  <Megaphone className="w-4 h-4" /> 公告管理
                </h3>
                <div className="space-y-2">
                  <input
                    type="text" value={annText} onChange={(e) => setAnnText(e.target.value)}
                    placeholder="公告内容（留空清除公告）"
                    className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-mystic-gold/50"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local" value={annExpire}
                      onChange={(e) => setAnnExpire(e.target.value)}
                      className="flex-1 bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg px-3 py-2 text-xs outline-none focus:border-mystic-gold/50"
                    />
                    <button
                      onClick={handleAnnouncement}
                      className="px-4 py-2 rounded-lg bg-mystic-gold/20 border border-mystic-gold/30 text-mystic-gold text-xs hover:bg-mystic-gold/30 transition-colors whitespace-nowrap"
                    >
                      发布
                    </button>
                  </div>
                  {annMsg && <p className="text-xs text-text-secondary">{annMsg}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ═══ Readings ═══ */}
          {tab === "readings" && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                  <input
                    type="text" value={readingSearch} onChange={(e) => { setReadingSearch(e.target.value); setReadingPage(0); }}
                    placeholder="搜索用户名、问题、牌阵..."
                    className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-mystic-gold/50"
                  />
                </div>
                <button onClick={expandAll} className="text-xs px-3 py-2 rounded-lg border border-mystic-purple/20 text-text-secondary hover:text-mystic-rose transition-colors">
                  全部展开
                </button>
                <button onClick={collapseAll} className="text-xs px-3 py-2 rounded-lg border border-mystic-purple/20 text-text-secondary hover:text-mystic-rose transition-colors">
                  全部收起
                </button>
              </div>

              {/* List */}
              {readings.length === 0 ? (
                <p className="text-center text-text-secondary py-8">暂无记录</p>
              ) : (
                <div className="space-y-3">
                  {readings.map((r) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#0f0a1a]/80 border border-mystic-purple/20 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleExpand(r.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-mystic-purple/5 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-xs text-text-secondary shrink-0">#{r.id}</span>
                          <span className="text-sm text-text-primary truncate">{r.username}</span>
                          <span className="text-xs px-2 py-0.5 rounded bg-mystic-gold/10 text-mystic-gold/60 hidden sm:inline">{r.spread_type}</span>
                          {r.question && (
                            <span className="text-xs text-text-tertiary truncate hidden md:inline max-w-[200px]">{r.question}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-text-tertiary">{r.created_at?.slice(0, 16).replace("T", " ")}</span>
                          {expanded.has(r.id) ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
                        </div>
                      </button>
                      {expanded.has(r.id) && (
                        <div className="px-4 pb-4 border-t border-mystic-purple/10 pt-3 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="text-sm"><span className="text-text-secondary">用户：</span><span className="text-text-primary">{r.username} ({r.email})</span></p>
                              <p className="text-sm"><span className="text-text-secondary">问题：</span><span className="text-text-primary">{r.question || "（未填写）"}</span></p>
                            </div>
                            <button
                              onClick={() => setDeleteId(r.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition-colors shrink-0"
                              title="删除记录"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div>
                            <span className="text-xs text-text-secondary">卡牌：</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {r.cards.map((c, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 rounded bg-mystic-purple/10 text-text-secondary">
                                  {c.nameCN} {c.isReversed ? "逆" : "正"} [{c.position}]
                                </span>
                              ))}
                            </div>
                          </div>
                          {r.ai_response && (
                            <div>
                              <span className="text-xs text-text-secondary">
                                AI 解读
                                {followUpCount(r.ai_response) > 0 && (
                                  <span className="ml-1.5 text-mystic-gold/70">
                                    · {followUpCount(r.ai_response)} 轮追问
                                  </span>
                                )}
                                ：
                              </span>
                              <div className="mt-1 max-h-64 overflow-y-auto bg-mystic-dark/40 rounded-lg p-3">
                                <ConversationView
                                  raw={r.ai_response}
                                  textClassName="text-sm text-text-primary leading-relaxed"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Pagination */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setReadingPage(Math.max(0, readingPage - 1))}
                      disabled={readingPage === 0}
                      className="px-3 py-1.5 rounded-lg border border-mystic-purple/20 text-xs text-text-secondary hover:text-mystic-rose disabled:opacity-30 transition-colors"
                    >
                      上一页
                    </button>
                    <span className="text-xs text-text-secondary">第 {readingPage + 1} 页</span>
                    <button
                      onClick={() => setReadingPage(readingPage + 1)}
                      disabled={readings.length < PAGE_SIZE}
                      className="px-3 py-1.5 rounded-lg border border-mystic-purple/20 text-xs text-text-secondary hover:text-mystic-rose disabled:opacity-30 transition-colors"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ Users ═══ */}
          {tab === "users" && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
                <input
                  type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="搜索用户名或邮箱..."
                  className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-mystic-gold/50"
                />
              </div>

              {/* Table header (desktop) */}
              <div className="hidden md:grid grid-cols-[2rem_1fr_1.5fr_6rem_6rem_8rem_6rem] gap-2 px-4 py-2 text-xs text-text-secondary border-b border-mystic-purple/10">
                <span>#</span><span>用户名</span><span>邮箱</span><span>角色</span><span>会员</span><span>注册时间</span><span>操作</span>
              </div>

              {/* User rows */}
              <div className="space-y-2">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col md:grid md:grid-cols-[2rem_1fr_1.5fr_6rem_6rem_8rem_6rem] gap-2 items-start md:items-center px-4 py-3 bg-[#0f0a1a]/80 border border-mystic-purple/20 rounded-xl"
                  >
                    {/* Mobile: compact row */}
                    <div className="flex md:hidden items-center gap-2 w-full flex-wrap">
                      <span className="text-xs text-text-secondary">#{u.id}</span>
                      <span className="text-sm text-text-primary font-semibold">{u.username}</span>
                      <span className="text-xs text-text-secondary">{u.email}</span>
                      {u.is_admin && <span className="text-xs px-1.5 py-0.5 rounded bg-mystic-gold/20 text-mystic-gold">管理员</span>}
                      {u.membership_tier && u.membership_tier !== "free" && (
                        <span className={`text-xs px-1.5 py-0.5 rounded bg-mystic-purple/20 ${TIER_COLORS[u.membership_tier]}`}>
                          <Crown className="w-3 h-3 inline mr-0.5" />{TIER_LABELS[u.membership_tier]}
                        </span>
                      )}
                      <span className={`text-xs ${u.is_verified ? "text-green-400/60" : "text-red-400/60"}`}>
                        {u.is_verified ? "已验证" : "未验证"}
                      </span>
                      <span className="text-xs text-text-tertiary ml-auto">{u.created_at?.slice(0, 10)}</span>
                      <button onClick={() => { setGiftUser(u); setGiftAmount(5); setGiftMsg(""); setGiftOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-mystic-gold/10 text-mystic-gold/50 hover:text-mystic-gold transition-colors" title="赠送次数">
                        <Gift className="w-4 h-4" />
                      </button>
                      <button onClick={() => {
                        setMemberUser(u); setMemberTier(u.membership_tier === "free" ? "basic" : u.membership_tier);
                        setMemberExpiry(u.membership_expiry?.slice(0, 10) || ""); setMemberMsg(""); setMemberOpen(true);
                      }} className="p-1.5 rounded-lg hover:bg-mystic-purple/20 text-text-secondary hover:text-mystic-rose transition-colors" title="设置会员">
                        <Crown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Desktop columns */}
                    <span className="hidden md:inline text-xs text-text-secondary">#{u.id}</span>
                    <span className="hidden md:inline text-sm text-text-primary truncate">{u.username}</span>
                    <span className="hidden md:inline text-xs text-text-secondary truncate">{u.email}</span>
                    <span className="hidden md:flex items-center gap-1 flex-wrap">
                      {u.is_admin && <span className="text-xs px-1.5 py-0.5 rounded bg-mystic-gold/20 text-mystic-gold">管理员</span>}
                      <span className={`text-xs ${u.is_verified ? "text-green-400/60" : "text-red-400/60"}`}>
                        {u.is_verified ? "已验证" : "未验证"}
                      </span>
                    </span>
                    <span className="hidden md:inline">
                      {u.membership_tier && u.membership_tier !== "free" ? (
                        <span className={`text-xs px-1.5 py-0.5 rounded bg-mystic-purple/20 ${TIER_COLORS[u.membership_tier]}`}>
                          <Crown className="w-3 h-3 inline mr-0.5" />{TIER_LABELS[u.membership_tier]}
                        </span>
                      ) : <span className="text-xs text-text-tertiary">免费</span>}
                    </span>
                    <span className="hidden md:inline text-xs text-text-tertiary">{u.created_at?.slice(0, 10)}</span>
                    <span className="hidden md:flex items-center gap-1">
                      <button onClick={() => { setGiftUser(u); setGiftAmount(5); setGiftMsg(""); setGiftOpen(true); }}
                        className="p-1.5 rounded-lg hover:bg-mystic-gold/10 text-mystic-gold/50 hover:text-mystic-gold transition-colors" title="赠送次数">
                        <Gift className="w-4 h-4" />
                      </button>
                      <button onClick={() => {
                        setMemberUser(u); setMemberTier(u.membership_tier === "free" ? "basic" : u.membership_tier);
                        setMemberExpiry(u.membership_expiry?.slice(0, 10) || ""); setMemberMsg(""); setMemberOpen(true);
                      }} className="p-1.5 rounded-lg hover:bg-mystic-purple/20 text-text-secondary hover:text-mystic-rose transition-colors" title="设置会员">
                        <Crown className="w-4 h-4" />
                      </button>
                    </span>
                  </div>
                ))}
              </div>

              {users.length === 0 && (
                <p className="text-center text-text-secondary py-8">暂无用户</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Gift Quota Modal ── */}
      <AnimatePresence>
        {giftOpen && giftUser && (
          <ModalOverlay onClose={() => setGiftOpen(false)}>
            <div className="bg-mystic-deep border border-mystic-purple/30 rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-cinzel text-mystic-gold">赠送次数</h3>
                <button onClick={() => setGiftOpen(false)} className="text-text-secondary hover:text-mystic-rose"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-text-secondary mb-4">用户：<span className="text-mystic-gold">{giftUser.username}</span></p>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setGiftAmount(Math.max(1, giftAmount - 1))} className="w-8 h-8 rounded-full border border-mystic-purple/20 text-text-secondary hover:text-mystic-rose">-</button>
                <input type="number" value={giftAmount} onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 text-center bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg px-3 py-2 text-text-primary text-lg outline-none focus:border-mystic-gold/50" />
                <button onClick={() => setGiftAmount(giftAmount + 1)} className="w-8 h-8 rounded-full border border-mystic-purple/20 text-text-secondary hover:text-mystic-rose">+</button>
                <span className="text-xs text-text-tertiary">次</span>
              </div>
              {giftMsg && <p className="text-xs text-text-secondary mb-3">{giftMsg}</p>}
              <button onClick={handleGiftQuota} className="w-full py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/50 text-mystic-gold hover:border-mystic-gold transition-all font-cinzel text-sm">
                确认赠送
              </button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ── Membership Modal ── */}
      <AnimatePresence>
        {memberOpen && memberUser && (
          <ModalOverlay onClose={() => setMemberOpen(false)}>
            <div className="bg-mystic-deep border border-mystic-purple/30 rounded-2xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-cinzel text-mystic-gold">设置会员</h3>
                <button onClick={() => setMemberOpen(false)} className="text-text-secondary hover:text-mystic-rose"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-text-secondary mb-4">用户：<span className="text-mystic-gold">{memberUser.username}</span></p>
              <label className="text-xs text-text-secondary mb-2 block">会员等级</label>
              <div className="flex gap-2 mb-4">
                {(["free", "basic", "premium"] as const).map((tier) => (
                  <button key={tier} onClick={() => setMemberTier(tier)}
                    className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                      memberTier === tier
                        ? "bg-mystic-gold/20 border border-mystic-gold/40 text-mystic-gold"
                        : "border border-mystic-purple/20 text-text-secondary hover:text-mystic-rose"
                    }`}
                  >{TIER_LABELS[tier]}</button>
                ))}
              </div>
              <label className="text-xs text-text-secondary mb-2 block">到期日期（留空则永久有效）</label>
              <input type="date" value={memberExpiry} onChange={(e) => setMemberExpiry(e.target.value)}
                className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-mystic-gold/50 mb-4" />
              {memberMsg && <p className="text-xs text-text-secondary mb-3">{memberMsg}</p>}
              <button onClick={handleSetMembership} className="w-full py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/50 text-mystic-gold hover:border-mystic-gold transition-all font-cinzel text-sm">
                确认设置
              </button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ── */}
      <AnimatePresence>
        {deleteId !== null && (
          <ModalOverlay onClose={() => setDeleteId(null)}>
            <div className="bg-mystic-deep border border-mystic-purple/30 rounded-2xl p-6 w-full max-w-sm text-center">
              <Trash2 className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-cinzel text-mystic-gold mb-2">确认删除</h3>
              <p className="text-sm text-text-secondary mb-4">删除占卜记录 #{deleteId}？此操作不可撤销。</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-full border border-mystic-purple/20 text-text-secondary hover:text-mystic-rose text-sm transition-colors">取消</button>
                <button onClick={() => handleDeleteReading(deleteId)} className="flex-1 py-2.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm transition-colors">删除</button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}
