"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, LogOut, Gift, Sparkles, Loader2,
  Clock, Layers, ChevronDown, X,
} from "lucide-react";
import {
  isLoggedIn, logout, apiGetMe, apiGetQuota, apiCheckIn,
  apiGetReadings, getStoredUser, apiConsumeQuota,
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-cinzel text-mystic-gold">今日额度</h2>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-mystic-rose/40">基础 {quota.base_quota}</span>
                {quota.bonus_quota > 0 && (
                  <span className="text-mystic-gold/60">签到 +{quota.bonus_quota}</span>
                )}
                <span className="text-mystic-rose/40">已用 {quota.used_count}</span>
                <span className={`font-cinzel text-lg ${quota.remaining > 0 ? "text-mystic-gold" : "text-mystic-rose/60"}`}>
                  {quota.remaining}
                </span>
                <span className="text-mystic-rose/50">次剩余</span>
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
