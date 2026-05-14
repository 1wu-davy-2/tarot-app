"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Loader2 } from "lucide-react";

const IS_APK = process.env.NEXT_PUBLIC_BUILD_TARGET === "apk";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Bump on each APK release
const APP_VERSION = "1.2.0";
const DISMISSED_KEY = "tarot_update_dismissed";

export function AppUpdateBanner() {
  const [visible, setVisible] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!IS_APK) return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed === APP_VERSION) return;

    const check = async () => {
      try {
        const url = API_BASE ? `${API_BASE}/api/app-version` : "/api/app-version";
        const res = await fetch(url);
        const data = await res.json();
        if (data.version && data.version !== APP_VERSION) {
          // Build absolute download URL
          let dlUrl: string = data.download_url || "";
          if (dlUrl && dlUrl.startsWith("/") && API_BASE) {
            dlUrl = API_BASE + dlUrl;
          }
          setDownloadUrl(dlUrl);
          setReleaseNotes(data.release_notes || "新版本可用，建议更新");
          setVisible(true);
        }
      } catch {}
    };

    const t = setTimeout(check, 3000);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, APP_VERSION);
  };

  const handleDownload = () => {
    if (!downloadUrl || downloading) return;
    setDownloading(true);

    // Open download URL in system browser — Android handles APK install natively
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.target = "_blank";
    a.rel = "noopener";
    a.download = "tarot-app.apk";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setDownloaded(true);
    setDownloading(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -60 }}
          className="fixed top-14 left-2 right-2 z-[55]"
        >
          <div className="max-w-lg mx-auto bg-[#1a0f2e]/95 backdrop-blur-xl border border-mystic-gold/30 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-cinzel text-mystic-gold">发现新版本</p>
              <p className="text-[10px] text-foreground/70 mt-0.5 truncate">{releaseNotes}</p>
            </div>
            {downloading ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mystic-gold/10 border border-mystic-gold/20 text-mystic-gold text-xs shrink-0">
                <Loader2 className="w-3 h-3 animate-spin" />
                下载中
              </div>
            ) : downloaded ? (
              <span className="text-[10px] text-emerald-400/80 shrink-0">已下载</span>
            ) : downloadUrl ? (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mystic-gold/15 border border-mystic-gold/30 text-mystic-gold text-xs hover:bg-mystic-gold/25 transition-colors shrink-0"
              >
                <Download className="w-3 h-3" />
                安装
              </button>
            ) : (
              <span className="text-[10px] text-mystic-rose/65 shrink-0">请联系管理员</span>
            )}
            <button onClick={handleDismiss} className="text-mystic-rose/45 hover:text-mystic-rose/75 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
