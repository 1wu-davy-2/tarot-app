"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, ArrowLeft, Loader2, ChevronDown, ChevronUp, Gift, Crown, X } from "lucide-react";
import { isLoggedIn, isAdmin, getToken } from "@/lib/api-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface Reading {
  id: number;
  user_id: number;
  username: string;
  email: string;
  question: string;
  ai_response: string;
  spread_type: string;
  cards: { nameCN: string; isReversed: boolean; position: string }[];
  created_at: string;
}

interface UserInfo {
  id: number;
  username: string;
  email: string;
  is_verified: boolean;
  is_admin: boolean;
  membership_tier: string;
  membership_expiry: string | null;
  created_at: string;
}

const TIER_LABELS: Record<string, string> = { free: "免费", basic: "基础会员", premium: "高级会员" };
const TIER_COLORS: Record<string, string> = {
  free: "text-foreground/45",
  basic: "text-blue-400/80",
  premium: "text-mystic-gold",
};

export default function AdminPage() {
  const router = useRouter();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"readings" | "users">("readings");
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
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

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) {
      router.replace("/login");
      return;
    }
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const url = tab === "readings" ? "/api/admin/readings?limit=100" : "/api/admin/users";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (tab === "readings") setReadings(data);
      else setUsers(data);
    } catch {
      // silent
    }
    try {
      const r = await fetch(`${API_BASE}/api/announcement`);
      const d = await r.json();
      if (d.text) { setAnnText(d.text); setAnnExpire(d.expire_at || ""); }
    } catch {}
    setLoading(false);
  };

  const handleAnnouncement = async () => {
    setAnnMsg("");
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcement`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: annText, expire_at: annExpire }),
      });
      const d = await res.json();
      setAnnMsg(d.message || (d.ok ? "已更新" : "失败"));
    } catch {
      setAnnMsg("操作失败");
    }
  };

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleGiftQuota = async () => {
    if (!giftUser || giftAmount <= 0) return;
    setGiftMsg("");
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/gift-quota`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: giftUser.id, amount: giftAmount }),
      });
      const d = await res.json();
      if (res.ok) {
        setGiftMsg(`已赠送 ${giftAmount} 次给 ${giftUser.username}`);
        setTimeout(() => { setGiftOpen(false); setGiftMsg(""); }, 1000);
      } else {
        setGiftMsg(d.detail || "操作失败");
      }
    } catch {
      setGiftMsg("操作失败");
    }
  };

  const handleSetMembership = async () => {
    if (!memberUser) return;
    setMemberMsg("");
    const token = getToken();
    try {
      const res = await fetch(`${API_BASE}/api/admin/set-membership`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          user_id: memberUser.id,
          tier: memberTier,
          expiry_date: memberExpiry || null,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        setMemberMsg(`已设置 ${memberUser.username} 为 ${TIER_LABELS[memberTier]}`);
        // Refresh user list
        setUsers((prev) =>
          prev.map((u) =>
            u.id === memberUser.id
              ? { ...u, membership_tier: memberTier, membership_expiry: memberExpiry || null }
              : u
          )
        );
        setTimeout(() => { setMemberOpen(false); setMemberMsg(""); }, 1000);
      } else {
        setMemberMsg(d.detail || "操作失败");
      }
    } catch {
      setMemberMsg("操作失败");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-2 text-mystic-rose/65 hover:text-mystic-rose text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> 返回首页
      </button>

      <h1 className="text-2xl font-cinzel text-mystic-gold mb-6">管理员面板</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["readings", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              tab === t
                ? "bg-mystic-gold/20 border border-mystic-gold/40 text-mystic-gold"
                : "border border-mystic-purple/20 text-mystic-rose/65 hover:text-mystic-rose"
            }`}
          >
            {t === "readings" ? "占卜记录" : "用户列表"}
          </button>
        ))}
      </div>

      {/* Announcement management */}
      <div className="glass-card p-4 mb-6">
        <h3 className="flex items-center gap-2 text-sm font-cinzel text-mystic-gold mb-3">
          <Megaphone className="w-4 h-4" /> 公告管理
        </h3>
        <div className="space-y-2">
          <input
            type="text"
            value={annText}
            onChange={(e) => setAnnText(e.target.value)}
            placeholder="公告内容（留空清除公告）"
            className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-mystic-gold/50"
          />
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={annExpire}
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
          {annMsg && <p className="text-xs text-mystic-rose/75">{annMsg}</p>}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-mystic-gold animate-spin" />
        </div>
      ) : tab === "readings" ? (
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
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-mystic-rose/55 shrink-0">#{r.id}</span>
                  <span className="text-sm text-foreground/80 truncate">{r.username}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-mystic-gold/10 text-mystic-gold/60">{r.spread_type}</span>
                  <span className="text-xs text-mystic-rose/45 truncate hidden sm:inline">{r.question?.slice(0, 30)}{(r.question?.length ?? 0) > 30 ? "..." : ""}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-mystic-rose/45">{r.created_at?.slice(0, 10)}</span>
                  {expanded.has(r.id) ? <ChevronUp className="w-4 h-4 text-mystic-rose/55" /> : <ChevronDown className="w-4 h-4 text-mystic-rose/55" />}
                </div>
              </button>
              {expanded.has(r.id) && (
                <div className="px-4 pb-4 border-t border-mystic-purple/10 pt-3 space-y-3">
                  <div>
                    <span className="text-xs text-mystic-rose/65">用户：</span>
                    <span className="text-sm text-foreground/85">{r.username} ({r.email})</span>
                  </div>
                  <div>
                    <span className="text-xs text-mystic-rose/65">问题：</span>
                    <p className="text-sm text-foreground/85">{r.question || "（未填写）"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-mystic-rose/65">卡牌：</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.cards.map((c, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-mystic-purple/10 text-mystic-rose/75">
                          {c.nameCN} {c.isReversed ? "逆" : "正"} [{c.position}]
                        </span>
                      ))}
                    </div>
                  </div>
                  {r.ai_response && (
                    <div>
                      <span className="text-xs text-mystic-rose/65">AI 解读：</span>
                      <div className="text-sm text-foreground/85 mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap bg-mystic-dark/40 rounded-lg p-3">
                        {r.ai_response}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
          {readings.length === 0 && (
            <p className="text-center text-mystic-rose/55 py-8">暂无记录</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-2 px-4 py-3 bg-[#0f0a1a]/80 border border-mystic-purple/20 rounded-xl flex-wrap">
              <span className="text-xs text-mystic-rose/55 w-8">#{u.id}</span>
              <span className="text-sm text-foreground/80 flex-1 min-w-[80px]">{u.username}</span>
              <span className="text-xs text-mystic-rose/65 hidden sm:inline">{u.email}</span>
              {u.is_admin && <span className="text-xs px-1.5 py-0.5 rounded bg-mystic-gold/20 text-mystic-gold">管理员</span>}
              {u.membership_tier && u.membership_tier !== "free" && (
                <span className={`text-xs px-1.5 py-0.5 rounded bg-mystic-purple/20 ${TIER_COLORS[u.membership_tier]}`}>
                  <Crown className="w-3 h-3 inline mr-0.5" />
                  {TIER_LABELS[u.membership_tier]}
                  {u.membership_expiry && ` (至${u.membership_expiry.slice(0, 10)})`}
                </span>
              )}
              {u.is_verified ? (
                <span className="text-xs text-green-400/60">已验证</span>
              ) : (
                <span className="text-xs text-red-400/60">未验证</span>
              )}
              <span className="text-xs text-mystic-rose/45">{u.created_at?.slice(0, 10)}</span>

              {/* Action buttons */}
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => { setGiftUser(u); setGiftAmount(5); setGiftMsg(""); setGiftOpen(true); }}
                  className="p-1.5 rounded-lg hover:bg-mystic-gold/10 text-mystic-gold/50 hover:text-mystic-gold transition-colors"
                  title="赠送次数"
                >
                  <Gift className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setMemberUser(u);
                    setMemberTier(u.membership_tier === "free" ? "basic" : u.membership_tier);
                    setMemberExpiry(u.membership_expiry?.slice(0, 10) || "");
                    setMemberMsg("");
                    setMemberOpen(true);
                  }}
                  className="p-1.5 rounded-lg hover:bg-mystic-purple/20 text-mystic-rose/55 hover:text-mystic-rose transition-colors"
                  title="设置会员"
                >
                  <Crown className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Gift Quota Dialog */}
      <AnimatePresence>
        {giftOpen && giftUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setGiftOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-mystic-deep border border-mystic-purple/30 rounded-2xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-cinzel text-mystic-gold">赠送次数</h3>
                  <button onClick={() => setGiftOpen(false)} className="text-mystic-rose/55 hover:text-mystic-rose">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-foreground/75 mb-4">
                  用户：<span className="text-mystic-gold">{giftUser.username}</span>
                </p>
                <label className="text-xs text-mystic-rose/65 mb-2 block">赠送次数</label>
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setGiftAmount(Math.max(1, giftAmount - 1))}
                    className="w-8 h-8 rounded-full border border-mystic-purple/20 text-mystic-rose/65 hover:text-mystic-rose"
                  >-</button>
                  <input
                    type="number"
                    value={giftAmount}
                    onChange={(e) => setGiftAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg px-3 py-2 text-foreground/80 text-lg outline-none focus:border-mystic-gold/50"
                  />
                  <button
                    onClick={() => setGiftAmount(giftAmount + 1)}
                    className="w-8 h-8 rounded-full border border-mystic-purple/20 text-mystic-rose/65 hover:text-mystic-rose"
                  >+</button>
                  <span className="text-xs text-mystic-rose/45">次</span>
                </div>
                {giftMsg && <p className="text-xs text-mystic-rose/75 mb-3">{giftMsg}</p>}
                <button
                  onClick={handleGiftQuota}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/50 text-mystic-gold hover:border-mystic-gold transition-all font-cinzel text-sm"
                >
                  确认赠送
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Membership Dialog */}
      <AnimatePresence>
        {memberOpen && memberUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMemberOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-mystic-deep border border-mystic-purple/30 rounded-2xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-cinzel text-mystic-gold">设置会员</h3>
                  <button onClick={() => setMemberOpen(false)} className="text-mystic-rose/55 hover:text-mystic-rose">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-foreground/75 mb-4">
                  用户：<span className="text-mystic-gold">{memberUser.username}</span>
                </p>

                <label className="text-xs text-mystic-rose/65 mb-2 block">会员等级</label>
                <div className="flex gap-2 mb-4">
                  {(["free", "basic", "premium"] as const).map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setMemberTier(tier)}
                      className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                        memberTier === tier
                          ? "bg-mystic-gold/20 border border-mystic-gold/40 text-mystic-gold"
                          : "border border-mystic-purple/20 text-mystic-rose/65 hover:text-mystic-rose"
                      }`}
                    >
                      {TIER_LABELS[tier]}
                    </button>
                  ))}
                </div>

                <label className="text-xs text-mystic-rose/65 mb-2 block">到期日期（留空则永久有效）</label>
                <input
                  type="date"
                  value={memberExpiry}
                  onChange={(e) => setMemberExpiry(e.target.value)}
                  className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg px-3 py-2 text-sm text-foreground/80 outline-none focus:border-mystic-gold/50 mb-4"
                />

                {memberMsg && <p className="text-xs text-mystic-rose/75 mb-3">{memberMsg}</p>}
                <button
                  onClick={handleSetMembership}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/50 text-mystic-gold hover:border-mystic-gold transition-all font-cinzel text-sm"
                >
                  确认设置
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
