"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Sparkles, LayoutGrid, BookHeart, Library, User, LogIn, Crown, Compass, Brain, BookOpen } from "lucide-react";
import { isLoggedIn, getStoredUser } from "@/lib/api-client";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
} as const;

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const u = getStoredUser();
    if (u) { setUserName(u.username); setIsMember(!!(u.membership_tier && u.membership_tier !== "free")); }
    const onAuthChange = () => {
      setLoggedIn(isLoggedIn());
      const u2 = getStoredUser();
      if (u2) { setUserName(u2.username); setIsMember(!!(u2.membership_tier && u2.membership_tier !== "free")); }
    };
    window.addEventListener("auth-change", onAuthChange);
    window.addEventListener("auth-expired", onAuthChange);
    return () => {
      window.removeEventListener("auth-change", onAuthChange);
      window.removeEventListener("auth-expired", onAuthChange);
    };
  }, []);

  const today = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-12 sm:justify-center sm:py-16 px-4 relative overflow-hidden">
      {/* Nebula background blobs */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(45,27,105,0.6) 0%, transparent 70%)",
          top: "10%",
          left: "-10%",
          animation: "nebula-1 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(192,132,252,0.5) 0%, transparent 70%)",
          bottom: "5%",
          right: "-8%",
          animation: "nebula-2 25s ease-in-out infinite",
        }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-4 sm:gap-10 max-w-lg mx-auto"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* App logo / title */}
        <motion.div variants={item} className="text-center">
          <motion.div
            className="text-5xl sm:text-7xl md:text-8xl mb-4 sm:mb-6 text-mystic-gold"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          >
            ✧
          </motion.div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-cinzel text-mystic-gold text-glow tracking-wider">
            命运之镜
          </h1>
          <p className="text-text-secondary text-sm md:text-base mt-2 sm:mt-3 tracking-widest font-cormorant">
            Mirror of Fate
          </p>
          <p className="text-text-secondary text-xs mt-3 sm:mt-4 max-w-xs mx-auto leading-relaxed">
            融合东西方古老智慧的塔罗指引，照见你内心深处的光
          </p>
        </motion.div>

        {/* Entry cards grid */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3 sm:gap-6 w-full max-w-lg">
          <EntryCard href="/daily" icon={Sparkles} title="每日卦算" enTitle="Daily Tarot" desc={today} />
          <EntryCard href="/spread" icon={LayoutGrid} title="牌阵占卜" enTitle="Card Spread" desc="多种牌阵 · 深度解读" />
          <EntryCard href="/journal" icon={BookHeart} title="塔罗日记" enTitle="Tarot Diary" desc="每日记录 · 心情点滴" />
          <EntryCard href="/library" icon={Library} title="塔罗图鉴" enTitle="Card Library" desc="78张牌 · 完整释义" />
          <EntryCard href="/fortune" icon={Compass} title="每日运势" enTitle="Daily Fortune" desc="星座运势 · 幸运指引" />
          <EntryCard href="/personality" icon={Brain} title="性格测试" enTitle="Personality Test" desc="MBTI · BDSM倾向" />
          <EntryCard href="/answer-book" icon={BookOpen} title="答案之书" enTitle="Book of Answers" desc="640页 · 宇宙的回答" />
        </motion.div>

        {/* Login / Profile link */}
        <motion.div variants={item}>
          <Link
            href={loggedIn ? "/profile" : "/login"}
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-xs"
          >
            {loggedIn ? (
              <>
                {isMember ? <Crown className="w-4 h-4 text-mystic-gold" /> : <User className="w-4 h-4" />}
                <span>{userName || "个人中心"}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>登录 / 注册</span>
              </>
            )}
          </Link>
        </motion.div>

        {/* Footer hint — desktop only */}
        <motion.p
          variants={item}
          className="hidden sm:block text-text-tertiary text-xs text-center mt-4 tracking-wider"
        >
          &ldquo;答案不在牌中，而在你凝视牌面的眼中&rdquo;
        </motion.p>
      </motion.div>
    </div>
  );
}

function EntryCard({
  href, icon: Icon, title, enTitle, desc,
}: {
  href: string; icon: any; title: string; enTitle: string; desc: string;
}) {
  return (
    <Link href={href} className="group">
      <div className="glass-card p-3 sm:p-7 text-center h-full hover:border-mystic-gold/40 transition-all duration-500 group-hover:-translate-y-1">
        <Icon className="w-6 h-6 sm:w-10 sm:h-10 text-mystic-gold mx-auto mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-500" />
        <h2 className="text-sm sm:text-xl font-cinzel text-mystic-gold mb-1 sm:mb-2">{title}</h2>
        <p className="text-text-secondary text-[10px] sm:text-sm mb-1.5 sm:mb-3">{enTitle}</p>
        <p className="text-text-secondary text-[10px] sm:text-xs leading-tight">{desc}</p>
      </div>
    </Link>
  );
}
