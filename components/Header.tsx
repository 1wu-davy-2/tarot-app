"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogIn } from "lucide-react";
import { isLoggedIn, getStoredUser, isAdmin, logout } from "@/lib/api-client";
import { LoginModal } from "@/components/LoginModal";

export function Header() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [admin, setAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      const auth = isLoggedIn();
      setLoggedIn(auth);
      if (auth) {
        const user = getStoredUser();
        setUserName(user?.username || "");
        setAdmin(isAdmin());
      }
    };
    check();
    // Re-check on focus (e.g. after login/register in another tab)
    window.addEventListener("focus", check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("focus", check);
      window.removeEventListener("storage", check);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setLoggedIn(false);
    setUserName("");
    setAdmin(false);
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-12 flex items-center justify-between px-4 bg-[#0a0612]/80 backdrop-blur-md border-b border-mystic-purple/10">
        <button
          onClick={() => router.push("/")}
          className="font-cinzel text-mystic-gold text-sm tracking-widest select-none"
        >
          命运之镜
        </button>

        <div className="flex items-center gap-3">
          {loggedIn ? (
            <div className="flex items-center gap-2">
              {admin && (
                <button
                  onClick={() => router.push("/admin")}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-mystic-gold/20 text-mystic-gold border border-mystic-gold/30 hover:bg-mystic-gold/30 transition-colors"
                >
                  管理
                </button>
              )}
              <button
                onClick={() => router.push("/profile")}
                className="flex items-center gap-1.5 text-xs text-mystic-rose/70 hover:text-mystic-rose transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span className="max-w-[100px] truncate">{userName || "个人中心"}</span>
              </button>
              <button
                onClick={handleLogout}
                className="text-[10px] text-mystic-rose/40 hover:text-mystic-rose/70 transition-colors"
              >
                退出
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="flex items-center gap-1 text-xs text-mystic-rose/60 hover:text-mystic-rose transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              登录 / 注册
            </button>
          )}
        </div>
      </header>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoggedIn(true);
          const user = getStoredUser();
          if (user) {
            setUserName(user.username);
            setAdmin(user.is_admin);
          }
        }}
      />
    </>
  );
}
