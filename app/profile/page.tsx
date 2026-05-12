"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, LogOut, Gift, Sparkles, Loader2, ChevronDown,
} from "lucide-react";
import {
  isLoggedIn, logout, apiGetMe, apiGetQuota, apiCheckIn,
  apiGetReadings, getStoredUser,
} from "@/lib/api-client";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [quota, setQuota] = useState<any>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinMsg, setCheckinMsg] = useState("");
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [horoscope, setHoroscope] = useState<{ text: string; date: string } | null>(null);
  const [horoLoading, setHoroLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, quotaData, readingsData] = await Promise.all([
        apiGetMe(),
        apiGetQuota(),
        apiGetReadings(20),
      ]);
      setUser(userData);
      setQuota(quotaData);
      setReadings(readingsData);
      // Load horoscope if zodiac is set
      if (userData?.zodiac) loadHoroscope(userData.zodiac);
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.includes("令牌")) {
        logout(); router.push("/login"); return;
      }
    } finally { setLoading(false); }
  };

  const handleCheckIn = async () => {
    setCheckinLoading(true);
    setCheckinMsg("");
    try {
      const result = await apiCheckIn();
      setCheckinMsg(result.already_checked_in ? "今日已签到" : `签到成功！+${result.bonus_awarded} 次`);
      const quotaData = await apiGetQuota();
      setQuota(quotaData);
    } catch (err: any) {
      setCheckinMsg(err.message);
    } finally { setCheckinLoading(false); }
  };

  const loadHoroscope = async (sign: string) => {
    setHoroLoading(true);
    try {
      const res = await fetch(`/api/horoscope?sign=${encodeURIComponent(sign)}`);
      const data = await res.json();
      if (data.text) setHoroscope(data);
    } catch {}
    setHoroLoading(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-mystic-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-mystic-rose/50 hover:text-mystic-rose transition-colors text-sm mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        {/* User info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-cinzel text-mystic-gold">{user?.username}</h1>
              <p className="text-xs text-mystic-rose/40 mt-1">{user?.email}</p>
              {user?.phone && <p className="text-xs text-mystic-rose/30">{user?.phone}</p>}
              {user?.is_admin && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-mystic-gold/15 border border-mystic-gold/30 text-mystic-gold text-[10px]">
                  管理员
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-mystic-rose/40 hover:text-mystic-rose text-xs transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出
            </button>
          </div>
        </motion.div>

        {/* Quota + Check-in */}
        {quota && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 mb-6"
          >
            <h2 className="text-sm font-cinzel text-mystic-gold mb-4">今日额度</h2>

            {/* Quota grid — 4 cards */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              <div className="text-center p-3 rounded-xl bg-mystic-purple/10 border border-mystic-purple/15">
                <p className="text-[10px] text-mystic-rose/50 mb-1">基础</p>
                <p className="text-xl font-bold text-foreground/70">{quota.base_quota}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-mystic-gold/5 border border-mystic-gold/15">
                <p className="text-[10px] text-mystic-rose/50 mb-1">签到</p>
                <p className="text-xl font-bold text-mystic-gold">+{quota.bonus_quota}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-mystic-purple/10 border border-mystic-purple/15">
                <p className="text-[10px] text-mystic-rose/50 mb-1">已用</p>
                <p className="text-xl font-bold text-foreground/70">{quota.used_count}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-mystic-gold/10 border border-mystic-gold/20">
                <p className="text-[10px] text-mystic-rose/50 mb-1">剩余</p>
                <p className={`text-2xl font-cinzel font-bold ${quota.remaining > 0 ? "text-mystic-gold" : "text-mystic-rose/60"}`}>
                  {quota.remaining}
                </p>
              </div>
            </div>

            {/* Check-in button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCheckIn}
                disabled={checkinLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-mystic-gold/40 text-mystic-gold hover:bg-mystic-gold/10 transition-all text-sm disabled:opacity-50"
              >
                {checkinLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Gift className="w-4 h-4" />
                )}
                每日签到
              </button>
              {checkinMsg && (
                <span className="text-xs text-mystic-rose/50">{checkinMsg}</span>
              )}
            </div>
          </motion.div>
        )}

        {/* Horoscope */}
        {user?.zodiac && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-5 mb-6"
          >
            <h2 className="text-sm font-cinzel text-mystic-gold mb-3">今日{user.zodiac}运势</h2>
            {horoLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-mystic-gold animate-spin" /></div>
            ) : horoscope ? (
              <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">{horoscope.text}</p>
            ) : (
              <p className="text-xs text-mystic-rose/40">暂无法获取运势</p>
            )}
          </motion.div>
        )}

        {/* CTA — 开启塔罗世界 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-3 py-4 rounded-full bg-gradient-to-r from-mystic-purple via-mystic-gold to-mystic-rose text-white font-cinzel text-lg tracking-wider hover:opacity-90 transition-opacity shadow-lg shadow-mystic-gold/20"
          >
            <Sparkles className="w-5 h-5" />
            开启塔罗世界
            <Sparkles className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Reading history from server */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-cinzel text-mystic-gold/60 mb-4">解读记录</h2>
          {readings.length === 0 && (
            <p className="text-xs text-mystic-rose/40 text-center py-8">暂无解读记录</p>
          )}
          <div className="space-y-3">
            {readings.map((r) => (
              <div key={r.id} className="glass-card overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="w-full p-4 text-left hover:bg-mystic-purple/5 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-cinzel text-mystic-gold/90">{r.spread_type || "占卜"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-mystic-rose/40">
                        {new Date(r.created_at).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {r.question && (
                        <span className="text-[10px] text-foreground/40 italic truncate max-w-[200px]">"{r.question}"</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-mystic-rose/30 transition-transform ${expandedId === r.id ? "rotate-180" : ""}`} />
                </button>
                {expandedId === r.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-mystic-purple/10 text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">
                      {r.ai_response || r.question}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
