"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, BookHeart, LayoutGrid, Home, User } from "lucide-react";
import { isLoggedIn } from "@/lib/api-client";

const IS_APK = process.env.NEXT_PUBLIC_BUILD_TARGET === "apk";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Home;
  requiresAuth?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "首页", icon: Home },
  { path: "/daily", label: "每日", icon: Sparkles },
  { path: "/journal", label: "日记", icon: BookHeart },
  { path: "/spread", label: "牌阵", icon: LayoutGrid },
  { path: "/profile", label: "我的", icon: User, requiresAuth: true },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // Always show in APK mode; in web mode, show on mobile screens
    const check = () => {
      if (IS_APK) {
        setVisible(true);
        return;
      }
      setVisible(window.innerWidth < 768);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, [pathname]);

  // Don't show on login page
  if (pathname === "/login") return null;

  return (
    <motion.nav
      initial={{ y: "100%" }}
      animate={{ y: visible ? 0 : "100%" }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0612]/95 backdrop-blur-xl border-t border-mystic-purple/20 safe-area-bottom"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path + "/"));
          const Icon = item.icon;

          // Auth check for profile tab
          if (item.requiresAuth && !loggedIn) return null;

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-0 flex-1 relative"
            >
              {/* Active indicator line */}
              {isActive && (
                <motion.div
                  layoutId="bottomNav"
                  className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full bg-gradient-to-r from-mystic-purple via-mystic-gold to-mystic-rose"
                />
              )}
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? "text-mystic-gold" : "text-mystic-rose/45"
                }`}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span
                className={`text-[10px] transition-colors ${
                  isActive ? "text-mystic-gold" : "text-mystic-rose/25"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
