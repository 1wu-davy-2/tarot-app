"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, LogOut, Gift, Sparkles, Loader2, ChevronDown, Save,
} from "lucide-react";
import {
  isLoggedIn, logout, apiGetMe, apiGetQuota, apiCheckIn,
  apiGetReadings, getStoredUser, apiUpdateProfile,
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

  // Birth chart state
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthSaving, setBirthSaving] = useState(false);
  const [birthMsg, setBirthMsg] = useState("");

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
      // Init birth chart fields
      if (userData?.birth_date) setBirthDate(userData.birth_date);
      if (userData?.birth_time) setBirthTime(userData.birth_time);
      if (userData?.birth_place) setBirthPlace(userData.birth_place);
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

  const getCompletionPercent = () => {
    let pct = 0;
    if (birthDate) pct += 33;
    if (birthTime) pct += 33;
    if (birthPlace) pct += 34;
    return pct;
  };

  const handleSaveBirthChart = async () => {
    setBirthSaving(true);
    setBirthMsg("");
    try {
      const result = await apiUpdateProfile({
        birth_date: birthDate || "",
        birth_time: birthTime || "",
        birth_place: birthPlace || "",
      });
      setUser(result);
      setBirthMsg("星盘信息已保存");
    } catch (err: any) {
      setBirthMsg(err.message || "保存失败");
    } finally { setBirthSaving(false); }
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

        {/* Birth Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass-card p-6 mb-6"
        >
          <h2 className="text-sm font-cinzel text-mystic-gold mb-4">出生星盘</h2>

          {/* Progress */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-mystic-rose/40">星盘完成度</span>
              <span className="text-xs text-mystic-gold/70 font-cormorant">{getCompletionPercent()}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-mystic-purple/15 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-mystic-purple via-mystic-gold to-mystic-rose"
                animate={{ width: `${getCompletionPercent()}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Constellation SVG */}
          <div className="flex justify-center mb-5">
            <svg width="120" height="60" viewBox="0 0 120 60" className="opacity-60">
              {/* Stage 1 stars — always visible */}
              {birthDate && (
                <g>
                  <circle cx="20" cy="15" r="1.5" fill="#d4a853" className="animate-pulse-glow" />
                  <circle cx="45" cy="10" r="1" fill="#c084fc" />
                  <circle cx="35" cy="35" r="1.5" fill="#d4a853" />
                  <line x1="20" y1="15" x2="35" y2="35" stroke="#d4a853" strokeWidth="0.3" opacity="0.4" />
                  <line x1="45" y1="10" x2="35" y2="35" stroke="#c084fc" strokeWidth="0.3" opacity="0.3" />
                </g>
              )}
              {/* Stage 2 stars — show with date+time */}
              {birthDate && birthTime && (
                <g>
                  <circle cx="65" cy="20" r="1.5" fill="#d4a853" className="animate-pulse-glow" />
                  <circle cx="85" cy="15" r="1" fill="#c084fc" />
                  <circle cx="75" cy="45" r="1.5" fill="#d4a853" />
                  <line x1="35" y1="35" x2="65" y2="20" stroke="#c084fc" strokeWidth="0.3" opacity="0.3" />
                  <line x1="65" y1="20" x2="75" y2="45" stroke="#d4a853" strokeWidth="0.3" opacity="0.4" />
                  <line x1="85" y1="15" x2="75" y2="45" stroke="#c084fc" strokeWidth="0.3" opacity="0.3" />
                </g>
              )}
              {/* Stage 3 stars — full chart */}
              {birthDate && birthTime && birthPlace && (
                <g>
                  <circle cx="100" cy="28" r="2" fill="#d4a853" className="animate-pulse-glow" />
                  <circle cx="108" cy="8" r="1" fill="#c084fc" />
                  <circle cx="95" cy="50" r="1" fill="#d4a853" />
                  <line x1="75" y1="45" x2="100" y2="28" stroke="#d4a853" strokeWidth="0.3" opacity="0.4" />
                  <line x1="100" y1="28" x2="95" y2="50" stroke="#c084fc" strokeWidth="0.3" opacity="0.3" />
                  <line x1="108" y1="8" x2="100" y2="28" stroke="#d4a853" strokeWidth="0.3" opacity="0.3" />
                </g>
              )}
              {/* No data: show faint placeholder */}
              {!birthDate && (
                <g opacity="0.15">
                  <circle cx="20" cy="15" r="1.5" fill="#d4a853" />
                  <circle cx="45" cy="10" r="1" fill="#c084fc" />
                  <circle cx="35" cy="35" r="1.5" fill="#d4a853" />
                  <line x1="20" y1="15" x2="35" y2="35" stroke="#d4a853" strokeWidth="0.3" />
                  <line x1="45" y1="10" x2="35" y2="35" stroke="#c084fc" strokeWidth="0.3" />
                </g>
              )}
            </svg>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-mystic-rose/40 mb-1.5 ml-1">出生日期</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-xl px-4 py-2.5 text-sm text-foreground/80 focus:outline-none focus:border-mystic-gold/40 transition-colors"
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div>
              <label className="block text-[10px] text-mystic-rose/40 mb-1.5 ml-1">
                出生时间 <span className="text-mystic-rose/20">(可选，默认正午12:00)</span>
              </label>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-xl px-4 py-2.5 text-sm text-foreground/80 focus:outline-none focus:border-mystic-gold/40 transition-colors"
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div>
              <label className="block text-[10px] text-mystic-rose/40 mb-1.5 ml-1">
                出生地点 <span className="text-mystic-rose/20">(可选)</span>
              </label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="输入城市名称，如'北京'"
                maxLength={100}
                className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-xl px-4 py-2.5 text-sm text-foreground/80 placeholder:text-foreground/15 focus:outline-none focus:border-mystic-gold/40 transition-colors"
              />
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleSaveBirthChart}
              disabled={birthSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-mystic-gold/40 text-mystic-gold hover:bg-mystic-gold/10 transition-all text-sm disabled:opacity-50"
            >
              {birthSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              保存星盘信息
            </button>
            {birthMsg && (
              <span className={`text-xs ${birthMsg.includes("失败") ? "text-red-400/60" : "text-mystic-rose/50"}`}>
                {birthMsg}
              </span>
            )}
          </div>
        </motion.div>

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
