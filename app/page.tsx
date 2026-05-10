"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, LayoutGrid } from "lucide-react";

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

        {/* Entry cards */}
        <motion.div variants={item} className="flex flex-col sm:flex-row gap-6 w-full">
          <Link href="/daily" className="flex-1 group">
            <div className="glass-card p-8 text-center h-full hover:border-mystic-gold/40 transition-all duration-500 group-hover:-translate-y-1">
              <Sparkles className="w-10 h-10 text-mystic-gold mx-auto mb-4 group-hover:scale-110 transition-transform duration-500" />
              <h2 className="text-xl font-cinzel text-mystic-gold mb-2">每日卦算</h2>
              <p className="text-foreground/50 text-sm mb-3">Daily Tarot</p>
              <p className="text-mystic-rose/40 text-xs">{today}</p>
              <div className="mt-4 text-mystic-gold/0 group-hover:text-mystic-gold/60 text-xs transition-all duration-500">
                揭示今日指引 →
              </div>
            </div>
          </Link>

          <Link href="/spread" className="flex-1 group">
            <div className="glass-card p-8 text-center h-full hover:border-mystic-gold/40 transition-all duration-500 group-hover:-translate-y-1">
              <LayoutGrid className="w-10 h-10 text-mystic-gold mx-auto mb-4 group-hover:scale-110 transition-transform duration-500" />
              <h2 className="text-xl font-cinzel text-mystic-gold mb-2">牌阵占卜</h2>
              <p className="text-foreground/50 text-sm mb-3">Card Spread</p>
              <p className="text-mystic-rose/40 text-xs">三牌阵 · 凯尔特十字</p>
              <div className="mt-4 text-mystic-gold/0 group-hover:text-mystic-gold/60 text-xs transition-all duration-500">
                开启深度占卜 →
              </div>
            </div>
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
