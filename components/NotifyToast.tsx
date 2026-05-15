"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { X, Bell } from "lucide-react";
import {
  getNotifySettings,
  checkWebReminders,
  type ReminderPayload,
} from "@/lib/notification-scheduler";

const IS_APK = process.env.NEXT_PUBLIC_BUILD_TARGET === "apk";

export function NotifyToast() {
  const router = useRouter();
  const [reminders, setReminders] = useState<ReminderPayload[]>([]);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Request web notification permission on mount
  useEffect(() => {
    if (IS_APK) return;
    if ("Notification" in window && Notification.permission === "default") {
      // Don't auto-request; user will enable via settings toggle
    }
  }, []);

  const handleReminder = useCallback((payload: ReminderPayload) => {
    setReminders((prev) => {
      // Deduplicate by id
      if (prev.some((r) => r.id === payload.id)) return prev;
      return [...prev, payload];
    });

    // Also try native web notification
    if (!IS_APK && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(payload.title, { body: payload.body });
      } catch {}
    }
  }, []);

  // Start the reminder checker
  useEffect(() => {
    if (IS_APK) return; // APK uses Capacitor local notifications

    const settings = getNotifySettings();
    const interval = setInterval(() => {
      checkWebReminders(settings, handleReminder);
    }, 60000); // check every 60 seconds

    // Also check immediately
    checkWebReminders(settings, handleReminder);

    return () => clearInterval(interval);
  }, [handleReminder]);

  const dismiss = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAction = (payload: ReminderPayload) => {
    dismiss(payload.id);
    if (payload.action?.path) {
      router.push(payload.action.path);
    }
    // Mark check-in reminder as handled
    if (payload.id === "check-in" && typeof window !== "undefined") {
      localStorage.setItem("tarot_checked_in_today", new Date().toISOString().slice(0, 10));
    }
  };

  // Don't render anything in APK mode (notifications handled natively)
  if (IS_APK) return null;

  return (
    <div className="fixed top-20 right-4 z-[60] flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {reminders.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-[#0f0a1a]/95 backdrop-blur-xl border border-mystic-gold/30 rounded-xl p-4 shadow-2xl cursor-pointer group"
            onClick={() => handleAction(r)}
          >
            <div className="flex items-start gap-3">
              <Bell className="w-4 h-4 text-mystic-gold shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-cinzel text-mystic-gold">{r.title}</p>
                <p className="text-xs text-text-secondary mt-1">{r.body}</p>
                {r.action && (
                  <span className="inline-block mt-2 text-[10px] text-mystic-gold/70 group-hover:text-mystic-gold transition-colors">
                    {r.action.label} →
                  </span>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); dismiss(r.id); }}
                className="p-0.5 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Auto-dismiss progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-mystic-gold/50 to-mystic-rose/50 rounded-full"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              onAnimationComplete={() => dismiss(r.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
