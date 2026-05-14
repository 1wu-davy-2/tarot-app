"use client";

import { useEffect } from "react";
import {
  getNotifySettings,
  scheduleAPKNotifications,
} from "@/lib/notification-scheduler";
import {
  useAchievementChecker,
  AchievementToastContainer,
} from "@/components/AchievementToast";
import { checkAchievements } from "@/lib/achievements";

const IS_APK = process.env.NEXT_PUBLIC_BUILD_TARGET === "apk";

export function AppInit() {
  const { toasts, runCheck, dismiss } = useAchievementChecker();

  // Initialize APK notifications
  useEffect(() => {
    if (!IS_APK) return;
    const settings = getNotifySettings();
    scheduleAPKNotifications(settings);
  }, []);

  // Run achievement check on app start (catch any missed triggers)
  useEffect(() => {
    // Small delay so localStorage is ready
    const t = setTimeout(() => runCheck(), 1000);
    return () => clearTimeout(t);
  }, []);

  return <AchievementToastContainer toasts={toasts} onDismiss={dismiss} />;
}
