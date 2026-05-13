"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isLoggedIn, checkSession, updateActivity, logout } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

const PROTECTED_ROUTES = ["/profile", "/history", "/journal"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const activityTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track user activity to keep session alive
  useEffect(() => {
    const onActivity = () => updateActivity();
    window.addEventListener("click", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });
    return () => {
      window.removeEventListener("click", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
    };
  }, []);

  // Periodic session check every 60s
  useEffect(() => {
    activityTimer.current = setInterval(() => {
      if (isLoggedIn() && !checkSession()) {
        logout();
      }
    }, 60000);
    return () => {
      if (activityTimer.current) clearInterval(activityTimer.current);
    };
  }, []);

  // Auth check on pathname change
  useEffect(() => {
    // Allow static assets and API routes through
    if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
      setChecking(false);
      return;
    }

    const needsAuth = PROTECTED_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(r + "/")
    );

    if (needsAuth) {
      const loggedIn = isLoggedIn();
      const sessionValid = checkSession();

      if (!loggedIn || !sessionValid) {
        if (loggedIn) logout();
        router.replace("/login");
        return;
      }
    }

    updateActivity();
    setChecking(false);
  }, [pathname, router]);

  if (checking && pathname !== "/login") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-mystic-gold animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
