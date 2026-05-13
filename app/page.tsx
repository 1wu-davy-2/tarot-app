"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Sparkles, LayoutGrid, BookHeart, Library, User, LogIn } from "lucide-react";
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

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const u = getStoredUser();
    if (u) setUserName(u.username);
  }, []);

  const today = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
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
        className="relative z-10 flex flex-col items-center gap-12 max-w-lg mx-auto"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* App logo / title */}
        <motion.div variants={item} className="text-center">
          <motion.div
            className="text-7xl md:text-8xl mb-6 text-mystic-gold"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          >
            ✧
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-cinzel text-mystic-gold text-glow tracking-wider">
            命运之镜
          </h1>
          <p className="text-mystic-rose/50 text-sm md:text-base mt-3 tracking-widest font-cormorant">
            Mirror of Fate
          </p>
          <p className="text-foreground/40 text-xs mt-4 max-w-xs mx-auto leading-relaxed">
            融合东西方古老智慧的塔罗指引，照见你内心深处的光
          </p>
        </motion.div>

        {/* Entry cards — 2×2 grid */}
        <motion.div variants={item} className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-lg">
          <Link href="/daily" className="group">
            <div className="glass-card p-5 sm:p-7 text-center h-full hover:border-mystic-gold/40 transition-all duration-500 group-hover:-translate-y-1">
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-mystic-gold mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-500" />
              <h2 className="text-lg sm:text-xl font-cinzel text-mystic-gold mb-1.5 sm:mb-2">每日卦算</h2>
              <p className="text-foreground/50 text-xs sm:text-sm mb-2 sm:mb-3">Daily Tarot</p>
              <p className="text-mystic-rose/40 text-[10px] sm:text-xs">{today}</p>
            </div>
          </Link>

          <Link href="/spread" className="group">
            <div className="glass-card p-5 sm:p-7 text-center h-full hover:border-mystic-gold/40 transition-all duration-500 group-hover:-translate-y-1">
              <LayoutGrid className="w-8 h-8 sm:w-10 sm:h-10 text-mystic-gold mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-500" />
              <h2 className="text-lg sm:text-xl font-cinzel text-mystic-gold mb-1.5 sm:mb-2">牌阵占卜</h2>
              <p className="text-foreground/50 text-xs sm:text-sm mb-2 sm:mb-3">Card Spread</p>
              <p className="text-mystic-rose/40 text-[10px] sm:text-xs">多种牌阵 · 深度解读</p>
            </div>
          </Link>

          <Link href="/journal" className="group">
            <div className="glass-card p-5 sm:p-7 text-center h-full hover:border-mystic-gold/40 transition-all duration-500 group-hover:-translate-y-1">
              <BookHeart className="w-8 h-8 sm:w-10 sm:h-10 text-mystic-gold mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-500" />
              <h2 className="text-lg sm:text-xl font-cinzel text-mystic-gold mb-1.5 sm:mb-2">塔罗日记</h2>
              <p className="text-foreground/50 text-xs sm:text-sm mb-2 sm:mb-3">Tarot Diary</p>
              <p className="text-mystic-rose/40 text-[10px] sm:text-xs">每日记录 · 心情点滴</p>
            </div>
          </Link>

          <Link href="/library" className="group">
            <div className="glass-card p-5 sm:p-7 text-center h-full hover:border-mystic-gold/40 transition-all duration-500 group-hover:-translate-y-1">
              <Library className="w-8 h-8 sm:w-10 sm:h-10 text-mystic-gold mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-500" />
              <h2 className="text-lg sm:text-xl font-cinzel text-mystic-gold mb-1.5 sm:mb-2">塔罗图鉴</h2>
              <p className="text-foreground/50 text-xs sm:text-sm mb-2 sm:mb-3">Card Library</p>
              <p className="text-mystic-rose/40 text-[10px] sm:text-xs">78张牌 · 完整释义</p>
            </div>
          </Link>
        </motion.div>

        {/* Login / Profile link */}
        <motion.div variants={item}>
          <Link
            href={loggedIn ? "/profile" : "/login"}
            className="inline-flex items-center gap-2 text-mystic-rose/40 hover:text-mystic-rose/70 transition-colors text-xs"
          >
            {loggedIn ? (
              <>
                <User className="w-4 h-4" />
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

        {/* Footer hint */}
        <motion.p
          variants={item}
          className="text-foreground/20 text-xs text-center mt-4 tracking-wider"
        >
          &ldquo;答案不在牌中，而在你凝视牌面的眼中&rdquo;
        </motion.p>
      </motion.div>
    </div>
  );
}
