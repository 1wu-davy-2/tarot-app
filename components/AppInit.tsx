"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getNotifySettings,
  scheduleAPKNotifications,
  fetchDailyCardSentence,
} from "@/lib/notification-scheduler";
import {
  useAchievementChecker,
  AchievementToastContainer,
} from "@/components/AchievementToast";
import { checkAchievements } from "@/lib/achievements";

const IS_APK = process.env.NEXT_PUBLIC_BUILD_TARGET === "apk";

export function AppInit() {
  const router = useRouter();
  const { toasts, runCheck, dismiss } = useAchievementChecker();

  // Pre-fetch daily card sentence (for notifications, both APK and web)
  useEffect(() => {
    fetchDailyCardSentence();
  }, []);

  // Initialize APK notifications
  useEffect(() => {
    if (!IS_APK) return;
    const settings = getNotifySettings();
    scheduleAPKNotifications(settings);
  }, []);

  // Handle APK notification clicks (deep link to relevant page)
  useEffect(() => {
    if (!IS_APK) return;
    let cleanup: (() => void) | undefined;
    import("@capacitor/local-notifications").then(({ LocalNotifications }) => {
      const listener = LocalNotifications.addListener(
        "localNotificationActionPerformed",
        (action) => {
          const path = (action.notification as any)?.extra?.path;
          if (path) router.push(path);
        }
      );
      cleanup = () => listener.remove();
    }).catch(() => {});
    return () => { cleanup?.(); };
  }, [router]);

  // Run achievement check on app start (catch any missed triggers)
  useEffect(() => {
    // Small delay so localStorage is ready
    const t = setTimeout(() => runCheck(), 1000);
    return () => clearTimeout(t);
  }, []);

  return <AchievementToastContainer toasts={toasts} onDismiss={dismiss} />;
}
