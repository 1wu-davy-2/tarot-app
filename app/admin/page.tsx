"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Megaphone, ArrowLeft, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { isLoggedIn, isAdmin, getToken } from "@/lib/api-client";

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
  created_at: string;
}

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
    // Also load current announcement
    try {
      const r = await fetch("/api/announcement");
      const d = await r.json();
      if (d.text) { setAnnText(d.text); setAnnExpire(d.expire_at || ""); }
    } catch {}
    setLoading(false);
  };

  const handleAnnouncement = async () => {
    setAnnMsg("");
    const token = getToken();
    try {
      const res = await fetch("/api/admin/announcement", {
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

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-2 text-mystic-rose/50 hover:text-mystic-rose text-sm mb-6"
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
                : "border border-mystic-purple/20 text-mystic-rose/50 hover:text-mystic-rose"
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
          {annMsg && <p className="text-xs text-mystic-rose/60">{annMsg}</p>}
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
                  <span className="text-xs text-mystic-rose/40 shrink-0">#{r.id}</span>
                  <span className="text-sm text-foreground/80 truncate">{r.username}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-mystic-gold/10 text-mystic-gold/60">{r.spread_type}</span>
                  <span className="text-xs text-mystic-rose/30 truncate hidden sm:inline">{r.question?.slice(0, 30)}{(r.question?.length ?? 0) > 30 ? "..." : ""}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-mystic-rose/30">{r.created_at?.slice(0, 10)}</span>
                  {expanded.has(r.id) ? <ChevronUp className="w-4 h-4 text-mystic-rose/40" /> : <ChevronDown className="w-4 h-4 text-mystic-rose/40" />}
                </div>
              </button>
              {expanded.has(r.id) && (
                <div className="px-4 pb-4 border-t border-mystic-purple/10 pt-3 space-y-3">
                  <div>
                    <span className="text-xs text-mystic-rose/50">用户：</span>
                    <span className="text-sm text-foreground/70">{r.username} ({r.email})</span>
                  </div>
                  <div>
                    <span className="text-xs text-mystic-rose/50">问题：</span>
                    <p className="text-sm text-foreground/70">{r.question || "（未填写）"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-mystic-rose/50">卡牌：</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.cards.map((c, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-mystic-purple/10 text-mystic-rose/60">
                          {c.nameCN} {c.isReversed ? "逆" : "正"} [{c.position}]
                        </span>
                      ))}
                    </div>
                  </div>
                  {r.ai_response && (
                    <div>
                      <span className="text-xs text-mystic-rose/50">AI 解读：</span>
                      <div className="text-sm text-foreground/70 mt-1 max-h-64 overflow-y-auto whitespace-pre-wrap bg-mystic-dark/40 rounded-lg p-3">
                        {r.ai_response}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
          {readings.length === 0 && (
            <p className="text-center text-mystic-rose/40 py-8">暂无记录</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3 bg-[#0f0a1a]/80 border border-mystic-purple/20 rounded-xl">
              <span className="text-xs text-mystic-rose/40 w-8">#{u.id}</span>
              <span className="text-sm text-foreground/80 flex-1">{u.username}</span>
              <span className="text-xs text-mystic-rose/50">{u.email}</span>
              {u.is_admin && <span className="text-xs px-1.5 py-0.5 rounded bg-mystic-gold/20 text-mystic-gold">管理员</span>}
              {u.is_verified ? (
                <span className="text-xs text-green-400/60">已验证</span>
              ) : (
                <span className="text-xs text-red-400/60">未验证</span>
              )}
              <span className="text-xs text-mystic-rose/30">{u.created_at?.slice(0, 10)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
