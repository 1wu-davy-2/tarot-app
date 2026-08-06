"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import {
  ArrowLeft, LogOut, Gift, Sparkles, Loader2, ChevronDown, Save, Crown, ChevronUp, Bell, Download, FileText, ScrollText, BarChart3, Brain,
} from "lucide-react";
import {
  isLoggedIn, logout, apiGetMe, apiGetQuota, apiCheckIn,
  apiGetReadings, getStoredUser, apiUpdateProfile, apiGetMonthJournal,
} from "@/lib/api-client";
import {
  getMbtiResult, getSmResult, hasMbtiResult, hasSmResult,
} from "@/lib/personality-tests";
import { ConversationView } from "@/components/ConversationView";
import {
  getNotifySettings, saveNotifySettings,
  type NotifySettings,
} from "@/lib/notification-scheduler";
import {
  getAllAchievementProgress, checkAchievements, trackCheckin,
  TIER_COLORS as ACH_TIER_COLORS, TIER_LABELS,
} from "@/lib/achievements";
import type { AchievementTier } from "@/lib/achievements";
import {
  generateDiaryHTML, generateReadingsHTML, generateAnnualReportHTML,
  downloadHTML,
} from "@/lib/export-utils";
import {
  getCurrentTheme, setCurrentTheme, canAccessPremiumThemes, syncStoredMembership,
  getThemePreviewUrl,
  THEMES, type DeckTheme,
} from "@/lib/deck-themes";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [quota, setQuota] = useState<any>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinMsg, setCheckinMsg] = useState("");
  const [aiModelCollapsed, setAiModelCollapsed] = useState(true);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [horoscope, setHoroscope] = useState<{ text: string; date: string } | null>(null);
  const [horoLoading, setHoroLoading] = useState(false);

  // Birth chart state
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [zodiacSign, setZodiacSign] = useState("");
  const [birthSaving, setBirthSaving] = useState(false);
  const [birthMsg, setBirthMsg] = useState("");
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [birthExpanded, setBirthExpanded] = useState(false);
  const [notifyExpanded, setNotifyExpanded] = useState(false);

  // Tab system: "info" | "achievements"
  const [activeTab, setActiveTab] = useState<"info" | "achievements">("info");
  const [achievements, setAchievements] = useState<ReturnType<typeof getAllAchievementProgress>>([]);

  // Notification settings
  const [notifySettings, setNotifySettings] = useState<NotifySettings>(getNotifySettings());

  // Export states
  const [exportingDiary, setExportingDiary] = useState(false);
  const [exportingReadings, setExportingReadings] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);

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
      // Sync membership to localStorage so theme access checks pass
      syncStoredMembership(userData);
      // Init birth chart fields
      if (userData?.birth_date) setBirthDate(userData.birth_date);
      if (userData?.birth_time) setBirthTime(userData.birth_time);
      if (userData?.birth_place) setBirthPlace(userData.birth_place);
      if (userData?.zodiac) setZodiacSign(userData.zodiac);
      // Load horoscope if zodiac is set
      if (userData?.zodiac) loadHoroscope(userData.zodiac);
    } catch (err: any) {
      if (err.message?.includes("401") || err.message?.includes("令牌")) {
        logout(); router.push("/login"); return;
      }
    } finally { setLoading(false); }
    // Load achievements after data
    setAchievements(getAllAchievementProgress());
  };

  const handleCheckIn = async () => {
    setCheckinLoading(true);
    setCheckinMsg("");
    try {
      const result = await apiCheckIn();
      setCheckinMsg(result.already_checked_in ? "今日已签到" : `签到成功！+${result.bonus_awarded} 次`);
      const quotaData = await apiGetQuota();
      setQuota(quotaData);

      // Track check-in for achievements
      trackCheckin();
      const newUnlocks = checkAchievements();
      if (newUnlocks.length > 0) setAchievements(getAllAchievementProgress());

      // Mark today as checked in for notification reminder
      if (typeof window !== "undefined") {
        localStorage.setItem("tarot_checked_in_today", new Date().toISOString().slice(0, 10));
      }
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
        zodiac: zodiacSign || "",
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

  // Notification toggle
  const toggleNotify = (key: keyof NotifySettings) => {
    const updated = { ...notifySettings };
    if (key === "moonPhase" || key === "membershipExpiry") {
      (updated[key] as { enabled: boolean }).enabled = !(updated[key] as { enabled: boolean }).enabled;
    } else {
      const item = updated[key] as { enabled: boolean; time: string };
      item.enabled = !item.enabled;
    }
    setNotifySettings(updated);
    saveNotifySettings(updated);
  };

  const updateNotifyTime = (key: "dailyCard" | "checkIn", time: string) => {
    const updated = { ...notifySettings };
    (updated[key] as { enabled: boolean; time: string }).time = time;
    setNotifySettings(updated);
    saveNotifySettings(updated);
  };

  // Export handlers
  const handleExportDiary = async () => {
    setExportingDiary(true);
    try {
      const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
      const data = await apiGetMonthJournal(month);
      const entries = data?.entries?.map((e: any) => ({
        date: e.date,
        cardId: e.card_id,
        isReversed: e.is_reversed,
        mood: e.mood,
        note: e.note,
      })) || [];
      const html = generateDiaryHTML(entries, month);
      downloadHTML(`tarot-journal-${month}.html`, html);
    } catch { /* silent */ }
    setExportingDiary(false);
  };

  const handleExportReadings = async () => {
    setExportingReadings(true);
    try {
      const readings = await apiGetReadings(200);
      const html = generateReadingsHTML(readings || []);
      const today = new Date().toISOString().slice(0, 10);
      downloadHTML(`tarot-readings-${today}.html`, html);
    } catch { /* silent */ }
    setExportingReadings(false);
  };

  const handleExportReport = async () => {
    setExportingReport(true);
    try {
      const year = new Date().getFullYear();
      const readings = await apiGetReadings(500);
      // Aggregate stats
      const monthlyCounts: Record<string, number> = {};
      const cardCounts: Record<string, number> = {};
      let totalReadings = 0;
      for (const r of (readings || [])) {
        totalReadings++;
        const m = r.created_at?.slice(0, 7) || "";
        if (m) monthlyCounts[m] = (monthlyCounts[m] || 0) + 1;
        try {
          const cards = typeof r.cards_json === "string" ? JSON.parse(r.cards_json) : (r.cards || []);
          for (const c of cards) {
            const name = c.nameCN || c.name || "";
            if (name) cardCounts[name] = (cardCounts[name] || 0) + 1;
          }
        } catch {}
      }

      const topCards = Object.entries(cardCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([nameCN, count]) => ({ nameCN, count }));

      // Monthly readings for current year
      const monthlyReadings: Record<string, number> = {};
      for (let i = 1; i <= 12; i++) {
        const key = `${year}-${String(i).padStart(2, "0")}`;
        monthlyReadings[String(i)] = monthlyCounts[key] || 0;
      }

      const html = generateAnnualReportHTML(year, {
        totalReadings,
        totalDiary: 0, // Will be populated from journal API
        maxStreak: 0,
        totalCheckins: 0,
        topCards,
        elements: { fire: 25, water: 25, air: 25, earth: 25 },
        monthlyReadings,
        keywords: "探索、成长、内省",
      });
      downloadHTML(`tarot-annual-report-${year}.html`, html);
    } catch { /* silent */ }
    setExportingReport(false);
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
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-text-secondary hover:text-mystic-gold transition-colors text-sm px-3 py-1.5 -ml-3 rounded-lg hover:bg-mystic-purple/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回首页</span>
          </Link>
          <div className="flex border-b border-mystic-purple/20">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm sm:text-base font-cinzel transition-colors border-b-2 -mb-[1px] ${activeTab==="info"?"border-mystic-gold text-mystic-gold":"border-transparent text-text-secondary hover:text-text-primary"}`}
            >
              资料
            </button>
            <button
              onClick={() => { setActiveTab("achievements"); setAchievements(getAllAchievementProgress()); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm sm:text-base font-cinzel transition-colors border-b-2 -mb-[1px] ${activeTab==="achievements"?"border-mystic-gold text-mystic-gold":"border-transparent text-text-secondary hover:text-text-primary"}`}
            >
              成就
            </button>
          </div>
          <div className="w-[60px]" />
        </div>

        {/* ═══════ INFO TAB ═══════ */}
        {activeTab === "info" ? (<>

        {/* User info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-cinzel text-mystic-gold">{user?.username}</h1>
              <p className="text-xs text-text-secondary mt-1">{user?.email}</p>
              {user?.phone && <p className="text-xs text-text-tertiary">{user?.phone}</p>}
              {user?.is_admin && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-mystic-gold/15 border border-mystic-gold/30 text-mystic-gold text-[10px]">
                  管理员
                </span>
              )}
              {user?.membership_tier && user.membership_tier !== "free" ? (
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400 text-[10px]">
                  {user.membership_tier === "premium" ? "高级会员" : "基础会员"}
                  {user.membership_expiry && ` · 至${user.membership_expiry.slice(0, 10)}`}
                </span>
              ) : (
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-mystic-purple/10 border border-mystic-purple/20 text-text-secondary text-[10px]">
                  未订阅
                </span>
              )}
              <button
                onClick={() => setShowMemberModal(true)}
                className="inline-block mt-2 ml-2 text-[10px] text-mystic-gold/60 hover:text-mystic-gold underline transition-colors"
              >
                会员详情
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-text-secondary hover:text-mystic-rose text-xs transition-colors"
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

            {/* Quota grid — 4 cards in one row */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
              <div className="text-center p-2 sm:p-3 rounded-xl bg-mystic-purple/10 border border-mystic-purple/15">
                <p className="text-[10px] text-text-secondary mb-1">基础</p>
                <p className="text-lg sm:text-xl font-bold text-text-primary">{quota.base_quota}</p>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-xl bg-mystic-gold/5 border border-mystic-gold/15">
                <p className="text-[10px] text-text-secondary mb-1">签到</p>
                <p className="text-lg sm:text-xl font-bold text-mystic-gold">+{quota.bonus_quota}</p>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-xl bg-mystic-purple/10 border border-mystic-purple/15">
                <p className="text-[10px] text-text-secondary mb-1">已用</p>
                <p className="text-lg sm:text-xl font-bold text-text-primary">{quota.used_count}</p>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-xl bg-mystic-gold/10 border border-mystic-gold/20">
                <p className="text-[10px] text-text-secondary mb-1">剩余</p>
                <p className={`text-lg sm:text-2xl font-cinzel font-bold ${quota.remaining > 0 ? "text-mystic-gold" : "text-text-secondary"}`}>
                  {quota.remaining}
                </p>
              </div>
            </div>

            {/* Gifted quota badge — shown separately */}
            {(quota.gifted_quota ?? 0) > 0 && (
              <div className="text-center mb-3">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400/80 text-xs">
                  系统赠送 +{quota.gifted_quota} 次
                </span>
              </div>
            )}

            {/* Check-in button — centered */}
            <div className="flex justify-center">
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
                <span className="text-xs text-text-secondary ml-3">{checkinMsg}</span>
              )}
            </div>
          </motion.div>
        )}

        {/* Membership Detail Modal */}
        <MembershipModal
          open={showMemberModal}
          onClose={() => setShowMemberModal(false)}
          userMembership={user?.membership_tier}
        />

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
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{horoscope.text}</p>
            ) : (
              <p className="text-xs text-text-secondary">暂无法获取运势</p>
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
          <button onClick={() => setBirthExpanded(!birthExpanded)} className="w-full flex items-center justify-between mb-3">
            <h2 className="text-sm font-cinzel text-mystic-gold">出生星盘</h2>
            {birthDate && (
              <span className="text-[11px] text-text-secondary truncate max-w-[60%]">
                {zodiacSign} · {birthDate}{birthTime ? ` · ${birthTime}` : ""}{birthPlace ? ` · ${birthPlace}` : ""}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${birthExpanded ? "rotate-180" : ""}`} />
          </button>
          {(birthExpanded || !birthDate) && (<>

          {/* Progress */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-text-secondary">星盘完成度</span>
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
              <label className="block text-[10px] text-text-secondary mb-1.5 ml-1">出生日期</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-mystic-gold/40 transition-colors"
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-secondary mb-1.5 ml-1">
                出生时间 <span className="text-text-tertiary">(可选，默认正午12:00)</span>
              </label>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-mystic-gold/40 transition-colors"
                style={{ colorScheme: "dark" }}
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-secondary mb-1.5 ml-1">
                出生地点 <span className="text-text-tertiary">(可选)</span>
              </label>
              <input
                type="text"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
                placeholder="输入城市名称，如'北京'"
                maxLength={100}
                className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-mystic-gold/40 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] text-text-secondary mb-1.5 ml-1">
                星座 <span className="text-text-tertiary">(选取对应的星座)</span>
              </label>
              <select
                value={zodiacSign}
                onChange={(e) => setZodiacSign(e.target.value)}
                className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-mystic-gold/40 transition-colors"
                style={{ colorScheme: "dark" }}
              >
                <option value="">选择星座（可选）</option>
                <option value="白羊座">♈ 白羊座 3.21-4.19</option>
                <option value="金牛座">♉ 金牛座 4.20-5.20</option>
                <option value="双子座">♊ 双子座 5.21-6.21</option>
                <option value="巨蟹座">♋ 巨蟹座 6.22-7.22</option>
                <option value="狮子座">♌ 狮子座 7.23-8.22</option>
                <option value="处女座">♍ 处女座 8.23-9.22</option>
                <option value="天秤座">♎ 天秤座 9.23-10.23</option>
                <option value="天蝎座">♏ 天蝎座 10.24-11.22</option>
                <option value="射手座">♐ 射手座 11.23-12.21</option>
                <option value="摩羯座">♑ 摩羯座 12.22-1.19</option>
                <option value="水瓶座">♒ 水瓶座 1.20-2.18</option>
                <option value="双鱼座">♓ 双鱼座 2.19-3.20</option>
              </select>
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
              <span className={`text-xs ${birthMsg.includes("失败") ? "text-red-400/60" : "text-text-secondary"}`}>
                {birthMsg}
              </span>
            )}
          </div>
          </>)}
        </motion.div>

        {/* Personality Archive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-6"
        >
          <Link href="/personality" className="flex items-center justify-between mb-3 group">
            <span className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-mystic-gold/70" />
              <h2 className="text-sm font-cinzel text-mystic-gold group-hover:text-mystic-gold/80 transition-colors">性格档案</h2>
            </span>
            <span className="text-[10px] text-text-tertiary group-hover:text-text-secondary transition-colors">
              查看详情 →
            </span>
          </Link>
          <PersonalityArchive />
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.11 }}
          className="glass-card p-6 mb-6"
        >
          <button onClick={() => setNotifyExpanded(!notifyExpanded)} className="w-full flex items-center justify-between mb-3">
            <span className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-mystic-gold/70" />
              <h2 className="text-sm font-cinzel text-mystic-gold">通知设置</h2>
            </span>
            <span className="text-[11px] text-text-secondary">
              {notifySettings.dailyCard.enabled ? "每日塔罗" : ""}
              {notifySettings.checkIn.enabled ? (notifySettings.dailyCard.enabled ? " + 签到" : "签到") : ""}
              {!notifySettings.dailyCard.enabled && !notifySettings.checkIn.enabled ? "已关闭" : ""}
            </span>
            <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${notifyExpanded ? "rotate-180" : ""}`} />
          </button>
          {notifyExpanded && (
          <div className="space-y-4">
            {/* Daily card */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <span className="text-sm text-text-primary">每日塔罗提醒</span>
                <p className="text-[10px] text-text-secondary">每天准时推送今日运势牌</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={notifySettings.dailyCard.time}
                  onChange={(e) => updateNotifyTime("dailyCard", e.target.value)}
                  className="w-24 sm:w-28 bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg px-2 py-1 text-xs text-text-secondary focus:outline-none focus:border-mystic-gold/40 transition-colors"
                  style={{ colorScheme: "dark" }}
                />
                <Toggle checked={notifySettings.dailyCard.enabled} onChange={() => toggleNotify("dailyCard")} />
              </div>
            </div>

            {/* Moon phase */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-text-primary">新月/满月提醒</span>
                <p className="text-[10px] text-text-secondary">月相能量节点提醒冥想与占卜</p>
              </div>
              <Toggle checked={notifySettings.moonPhase.enabled} onChange={() => toggleNotify("moonPhase")} />
            </div>

            {/* Check-in */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <span className="text-sm text-text-primary">签到提醒</span>
                <p className="text-[10px] text-text-secondary">每日提醒签到获取 AI 解读次数</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={notifySettings.checkIn.time}
                  onChange={(e) => updateNotifyTime("checkIn", e.target.value)}
                  className="w-24 sm:w-28 bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg px-2 py-1 text-xs text-text-secondary focus:outline-none focus:border-mystic-gold/40 transition-colors"
                  style={{ colorScheme: "dark" }}
                />
                <Toggle checked={notifySettings.checkIn.enabled} onChange={() => toggleNotify("checkIn")} />
              </div>
            </div>

            {/* Membership expiry */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-text-primary">会员到期提醒</span>
                <p className="text-[10px] text-text-secondary">到期前 3 天提醒续费</p>
              </div>
              <Toggle checked={notifySettings.membershipExpiry.enabled} onChange={() => toggleNotify("membershipExpiry")} />
            </div>
          </div>
        )}
        </motion.div>

        {/* AI Model Selector (collapsible) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09 }}
          className="glass-card p-6 mb-6"
        >
          {(() => {
            const MODELS = [
              { id: "deepseek", name: "DeepSeek", icon: "🔮", model: "V4-Pro" },
              { id: "openai", name: "OpenAI", icon: "🧠", model: "GPT-5" },
              { id: "claude", name: "Claude", icon: "✨", model: "Opus 4.7" },
              { id: "gemini", name: "Gemini", icon: "💎", model: "2.0 Pro" },
            ];
            const currentId = (user as any)?.ai_model || "deepseek";
            const currentModel = MODELS.find(m => m.id === currentId) || MODELS[0];
            return (
              <>
                {/* Collapsed header */}
                <button
                  onClick={() => setAiModelCollapsed(!aiModelCollapsed)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currentModel.icon}</span>
                    <div>
                      <span className="text-sm font-cinzel text-mystic-gold">AI 模型</span>
                      <p className="text-[10px] text-text-tertiary mt-0.5">
                        当前接入 {currentModel.name} {currentModel.model}
                      </p>
                    </div>
                  </div>
                  <span className="text-text-tertiary text-xs flex items-center gap-1">
                    {aiModelCollapsed ? "展开切换" : "收起"}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${aiModelCollapsed ? "" : "rotate-180"}`} />
                  </span>
                </button>

                {/* Expanded grid */}
                {!aiModelCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 pt-4 border-t border-white/8"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {MODELS.map((m) => {
                        const isCurrent = m.id === currentId;
                        return (
                          <button
                            key={m.id}
                            onClick={async () => {
                              if (isCurrent) return;
                              const token = localStorage.getItem("tarot_token");
                              if (!token) return;
                              try {
                                const base = process.env.NEXT_PUBLIC_API_URL || "";
                                await fetch(`${base}/api/auth/me/ai-model`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ ai_model: m.id }),
                                });
                                const meRes = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
                                if (meRes.ok) {
                                  const updated = await meRes.json();
                                  localStorage.setItem("tarot_user", JSON.stringify(updated));
                                  setUser(updated);
                                  window.dispatchEvent(new Event("auth-change"));
                                }
                              } catch {}
                            }}
                            className={`p-3 rounded-xl border transition-all text-left ${
                              isCurrent
                                ? "bg-mystic-gold/10 border-mystic-gold/40 cursor-default"
                                : "bg-mystic-dark/30 border-mystic-purple/10 hover:border-mystic-gold/30 hover:bg-mystic-purple/10 cursor-pointer"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{m.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-text-primary font-medium">{m.name}</p>
                                <p className="text-[10px] text-text-tertiary">{m.model}</p>
                              </div>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-mystic-gold/20 border border-mystic-gold/40 text-mystic-gold">当前</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </>
            );
          })()}
        </motion.div>

        {/* Deck Theme Switcher (premium gated) */}
        <DeckThemeSection user={user} />

        {/* Data Export */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="glass-card p-6 mb-6"
        >
          <h2 className="text-sm font-cinzel text-mystic-gold mb-4 flex items-center gap-2">
            <Download className="w-4 h-4" />
            数据导出
          </h2>
          <div className="space-y-3">
            <button
              onClick={handleExportDiary}
              disabled={exportingDiary}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-mystic-purple/20 hover:border-mystic-gold/30 bg-mystic-purple/5 hover:bg-mystic-gold/5 transition-all text-left disabled:opacity-50"
            >
              {exportingDiary ? (
                <Loader2 className="w-4 h-4 text-mystic-gold animate-spin shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-mystic-gold/70 shrink-0" />
              )}
              <div>
                <span className="text-sm text-text-primary">导出塔罗日记</span>
                <p className="text-[10px] text-text-secondary">生成当月日记 HTML 文件，浏览器直接打开查看</p>
              </div>
            </button>

            <button
              onClick={handleExportReadings}
              disabled={exportingReadings}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-mystic-purple/20 hover:border-mystic-gold/30 bg-mystic-purple/5 hover:bg-mystic-gold/5 transition-all text-left disabled:opacity-50"
            >
              {exportingReadings ? (
                <Loader2 className="w-4 h-4 text-mystic-gold animate-spin shrink-0" />
              ) : (
                <ScrollText className="w-4 h-4 text-mystic-gold/70 shrink-0" />
              )}
              <div>
                <span className="text-sm text-text-primary">导出解读历史</span>
                <p className="text-[10px] text-text-secondary">生成解读记录 HTML 文件，浏览器直接打开查看</p>
              </div>
            </button>

            <button
              onClick={handleExportReport}
              disabled={exportingReport}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-mystic-gold/20 hover:border-mystic-gold/40 bg-mystic-gold/5 hover:bg-mystic-gold/10 transition-all text-left disabled:opacity-50"
            >
              {exportingReport ? (
                <Loader2 className="w-4 h-4 text-mystic-gold animate-spin shrink-0" />
              ) : (
                <BarChart3 className="w-4 h-4 text-mystic-gold shrink-0" />
              )}
              <div>
                <span className="text-sm text-mystic-gold/90">生成年度报告</span>
                <p className="text-[10px] text-text-secondary">统计分析 + 图表，精美排版年度总结</p>
              </div>
            </button>
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
            <p className="text-xs text-text-secondary text-center py-8">暂无解读记录</p>
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
                      <span className="text-[10px] text-text-secondary">
                        {new Date(r.created_at).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {r.question && (
                        <span className="text-[10px] text-text-secondary italic truncate max-w-[200px]">"{r.question}"</span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${expandedId === r.id ? "rotate-180" : ""}`} />
                </button>
                {expandedId === r.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-mystic-purple/10">
                      {r.ai_response
                        ? <ConversationView raw={r.ai_response} />
                        : <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">{r.question}</p>}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        </>) : null}

        {/* ═══════ ACHIEVEMENTS TAB ═══════ */}
        {activeTab === "achievements" && (
          <AchievementGrid achievements={achievements} />
        )}

        <FeedbackWidget />
      </div>
    </div>
  );
}

// ── Toggle Switch ──

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
        checked ? "bg-mystic-gold/60" : "bg-mystic-purple/20"
      }`}
    >
      <motion.div
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow"
        animate={{ x: checked ? 18 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// ── Achievement Grid ──

function AchievementGrid({ achievements }: { achievements: ReturnType<typeof getAllAchievementProgress> }) {
  const unlocked = achievements.filter((a) => a.unlocked);
  const visible = achievements.filter((a) => !a.secret || a.unlocked);
  const totalUnlocked = unlocked.length;
  const totalVisible = visible.length;

  return (
    <>
      {/* Total progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 mb-6"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-cinzel text-mystic-gold">成就进度</span>
          <span className="text-xs text-mystic-gold/70 font-cormorant">
            {totalUnlocked}/{totalVisible}
          </span>
        </div>
        <div className="h-2 rounded-full bg-mystic-purple/15 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-mystic-purple via-mystic-gold to-mystic-rose"
            initial={{ width: 0 }}
            animate={{ width: `${totalVisible > 0 ? (totalUnlocked / totalVisible) * 100 : 0}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {visible.map((a, i) => {
          const isUnlocked = a.unlocked;
          const pct = a.target > 0 ? Math.round((a.current / a.target) * 100) : 0;

          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl p-4 border text-center ${
                isUnlocked
                  ? `${ACH_TIER_COLORS[a.tier]} border`
                  : "border-mystic-purple/15 bg-mystic-purple/5 opacity-60"
              }`}
            >
              <div className="text-2xl mb-1.5">
                {isUnlocked ? a.icon : (a.secret ? "🔒" : a.icon)}
              </div>
              <h3 className={`text-xs font-cinzel mb-0.5 ${isUnlocked ? "text-mystic-gold" : "text-text-tertiary"}`}>
                {isUnlocked ? a.title : (a.secret ? "???" : a.title)}
              </h3>
              <p className="text-[10px] text-text-tertiary mb-2">
                {isUnlocked ? a.description : (a.secret ? "隐藏成就" : a.description)}
              </p>
              {/* Progress bar */}
              <div className="h-1 rounded-full bg-mystic-purple/15 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${isUnlocked ? "bg-mystic-gold" : "bg-mystic-purple/30"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, pct)}%` }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.03 }}
                />
              </div>
              <p className="text-[10px] text-text-tertiary mt-1">
                {a.current}/{a.target}
              </p>
              {isUnlocked && (
                <span className="inline-block mt-2 text-[10px] text-mystic-gold/60">✓ 已解锁</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="text-center text-xs text-text-secondary py-12">暂无成就数据</p>
      )}
    </>
  );
}

const PLANS = [
  {
    tier: "free",
    name: "普通用户",
    icon: "✨",
    price: "免费",
    quota: "2次/天",
    features: ["每日单牌抽取", "标准解读（本地）", "3种基础牌阵", "本地历史记录"],
    color: "border-mystic-purple/30",
    bg: "bg-mystic-purple/5",
    textColor: "text-text-secondary",
  },
  {
    tier: "basic",
    name: "基础会员",
    icon: "⭐",
    price: "¥19/月",
    quota: "30次/天 + 签到叠加",
    features: ["全部牌阵", "塔罗日记", "星盘联动", "AI 周报/月报"],
    color: "border-blue-400/30",
    bg: "bg-blue-500/5",
    textColor: "text-blue-400/80",
  },
  {
    tier: "premium",
    name: "高级会员",
    icon: "👑",
    price: "¥49/月",
    quota: "50次/天 + 签到叠加",
    features: ["无限 AI 解读", "AI 长期记忆", "月度深度报告", "语音解读"],
    color: "border-mystic-gold/40",
    bg: "bg-mystic-gold/5",
    textColor: "text-mystic-gold",
  },
];

function DeckThemeSection({ user }: { user: any }) {
  const [theme, setTheme] = useState<DeckTheme>(getCurrentTheme());
  const hasAccess = canAccessPremiumThemes(user) || user?.is_admin;

  const handleSelect = (t: DeckTheme) => {
    if (THEMES.find((th) => th.id === t)?.premiumOnly && !hasAccess) return;
    setCurrentTheme(t);
    setTheme(t);
    // Force re-render of card images
    window.dispatchEvent(new Event("theme-change"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.11 }}
      className="glass-card p-6 mb-6"
    >
      <h2 className="text-sm font-cinzel text-mystic-gold mb-4 flex items-center gap-2">
        🎨 牌面主题
        {!hasAccess && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-mystic-gold/10 border border-mystic-gold/20 text-mystic-gold/70">
            会员专享
          </span>
        )}
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map((t) => {
          const isActive = theme === t.id;
          const locked = t.premiumOnly && !hasAccess;
          return (
            <button
              key={t.id}
              onClick={() => handleSelect(t.id)}
              disabled={locked}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${
                isActive
                  ? "border-mystic-gold/40 bg-mystic-gold/10"
                  : locked
                  ? "border-mystic-purple/10 bg-mystic-dark/20 opacity-40 cursor-not-allowed"
                  : "border-mystic-purple/20 bg-mystic-dark/30 hover:border-mystic-rose/30"
              }`}
            >
              <div className="w-full aspect-[3/4] rounded-lg overflow-hidden flex items-center justify-center relative" style={{
                background: t.id === "rider-waite" ? "linear-gradient(135deg, #1a0f2e, #2d1b69, #1a1040)" :
                           t.id === "marseille" ? "linear-gradient(135deg, #faf3e0, #e8d5b0, #f0e6c8)" :
                           "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)"
              }}>
                {/* Decorative border */}
                <div className="absolute inset-2 rounded-md border opacity-30" style={{
                  borderColor: t.id === "marseille" ? "#8b4513" : t.id === "modern-minimal" ? "#e94560" : "rgba(212,168,83,0.4)"
                }} />
                {/* Inner pattern */}
                <div className="absolute inset-4 rounded-sm border border-dashed opacity-20" style={{
                  borderColor: t.id === "marseille" ? "#c41e3a" : t.id === "modern-minimal" ? "#0f3460" : "rgba(212,168,83,0.3)"
                }} />
                {/* Center symbol */}
                <span className="relative z-10 text-3xl sm:text-4xl drop-shadow-lg" style={{
                  filter: t.id === "marseille" ? "none" : "drop-shadow(0 0 8px rgba(212,168,83,0.4))"
                }}>
                  {t.id === "rider-waite" ? "✧" : t.id === "marseille" ? "🜂" : "◇"}
                </span>
                {/* Rider-Waite: show actual mini card image */}
                {t.id === "rider-waite" && (
                  <img src="/cards/00-fool.webp" alt="" className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-60" />
                )}
              </div>
              <div>
                <p className={`text-xs ${isActive ? "text-mystic-gold" : "text-text-secondary"}`}>
                  {t.icon} {t.name}
                </p>
                {locked && <p className="text-[10px] text-text-tertiary mt-0.5">🔒 需升级</p>}
                {isActive && <p className="text-[10px] text-mystic-gold/60 mt-0.5">使用中</p>}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function MembershipModal({ open, onClose, userMembership }: { open: boolean; onClose: () => void; userMembership?: string }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#0f0a1a] border border-mystic-purple/30 rounded-2xl shadow-2xl p-6"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-mystic-rose">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>

        <h3 className="text-lg font-cinzel text-mystic-gold text-center mb-1">会员方案对比</h3>
        <p className="text-xs text-text-secondary text-center mb-5">选择适合你的方案</p>

        <div className="grid grid-cols-3 gap-3">
          {PLANS.map((plan) => {
            const isCurrent = (userMembership || "free") === plan.tier || (!userMembership && plan.tier === "free");
            return (
              <div
                key={plan.tier}
                className={`rounded-xl p-3 border ${plan.color} ${plan.bg} ${isCurrent ? "ring-1 ring-mystic-gold/30" : ""}`}
              >
                <div className="text-center mb-2">
                  <span className="text-xl">{plan.icon}</span>
                  <h4 className={`text-xs font-cinzel mt-1 ${plan.textColor}`}>{plan.name}</h4>
                  <p className="text-[10px] text-text-secondary">{plan.price}</p>
                </div>
                <div className="text-center mb-2">
                  <span className={`text-[10px] font-cinzel ${plan.textColor}`}>{plan.quota}</span>
                </div>
                <ul className="space-y-0.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-[10px] text-text-secondary flex items-start gap-1">
                      <span className="text-mystic-gold/60 shrink-0 mt-0.5">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent && (
                  <p className="text-center text-[10px] text-mystic-gold mt-2">当前方案</p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* ── Personality Archive ── */

function PersonalityArchive() {
  const mbti = hasMbtiResult() ? getMbtiResult() : null;
  const sm = hasSmResult() ? getSmResult() : null;
  const hasAny = mbti || sm;

  if (!hasAny) {
    return (
      <Link
        href="/personality"
        className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-mystic-rose/20 bg-mystic-purple/5 hover:border-mystic-rose/40 transition-all group"
      >
        <span className="text-2xl">🧠</span>
        <div>
          <p className="text-xs text-text-primary">完成性格测试</p>
          <p className="text-[10px] text-text-tertiary mt-0.5">
            发现你的 MBTI 类型和 S/M 倾向，解锁星座配对建议
          </p>
        </div>
        <span className="text-text-tertiary group-hover:text-text-primary transition-colors ml-auto">→</span>
      </Link>
    );
  }

  return (
    <div className="flex gap-3">
      {mbti && (
        <Link
          href="/personality"
          className="flex-1 p-3 rounded-xl border text-center hover:border-mystic-gold/30 transition-all"
          style={{ borderColor: mbti.color + "44", background: mbti.color + "10" }}
        >
          <p className="text-2xl font-cinzel" style={{ color: mbti.color }}>{mbti.type}</p>
          <p className="text-[10px] text-text-secondary mt-0.5">{mbti.typeName}</p>
          <p className="text-[10px] text-text-tertiary">{mbti.group}</p>
        </Link>
      )}
      {sm && (
        <Link
          href="/personality"
          className="flex-1 p-3 rounded-xl border text-center hover:border-mystic-gold/30 transition-all"
          style={{ borderColor: sm.primaryType.color + "44", background: sm.primaryType.color + "10" }}
        >
          <p className="text-xl">{sm.primaryType.icon}</p>
          <p className="text-xs font-cinzel" style={{ color: sm.primaryType.color }}>
            {sm.primaryType.type}
          </p>
          <p className="text-[10px] text-text-tertiary">{sm.primaryType.score}%</p>
        </Link>
      )}
    </div>
  );
}
