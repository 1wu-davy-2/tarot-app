"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Loader2 } from "lucide-react";

const IS_APK = process.env.NEXT_PUBLIC_BUILD_TARGET === "apk";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const APP_VERSION = "1.2.2";
const DISMISSED_KEY = "tarot_update_dismissed";

export function AppUpdateBanner() {
  const [visible, setVisible] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [releaseNotes, setReleaseNotes] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [status, setStatus] = useState<"checking" | "connected" | "error" | "update-available">("checking");
  const [serverVersion, setServerVersion] = useState("?");

  useEffect(() => {
    if (!IS_APK) return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);

    const check = async () => {
      setStatus("checking");
      try {
        const url = API_BASE ? `${API_BASE}/api/app-version` : "/api/app-version";
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) {
          setStatus("error");
          return;
        }
        const data = await res.json();
        setServerVersion(data.version || "?");
        setStatus("connected");

        if (data.version && data.version !== APP_VERSION && dismissed !== data.version) {
          let dlUrl: string = data.download_url || "";
          if (dlUrl && dlUrl.startsWith("/") && API_BASE) {
            dlUrl = API_BASE + dlUrl;
          }
          setDownloadUrl(dlUrl);
          setReleaseNotes(data.release_notes || "新版本可用");
          setStatus("update-available");
          setVisible(true);
        }
      } catch {
        setStatus("error");
      }
    };

    // Check immediately, then every 5 minutes
    check();
    const interval = setInterval(check, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    if (serverVersion !== "?") {
      localStorage.setItem(DISMISSED_KEY, serverVersion);
    }
  };

  const handleDownload = () => {
    if (!downloadUrl || downloading) return;
    setDownloading(true);
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
    <>
      {/* Update banner */}
      <AnimatePresence>
        {visible && status === "update-available" && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-8 right-2 left-2 z-[55]"
          >
            <div className="max-w-lg mx-auto bg-[#1a0f2e]/95 backdrop-blur-xl border border-mystic-gold/30 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-cinzel text-mystic-gold">
                  发现新版本 v{serverVersion}
                </p>
                <p className="text-[10px] text-foreground/70 mt-0.5">{releaseNotes}</p>
              </div>
              {downloading ? (
                <span className="text-[10px] text-mystic-gold/70 shrink-0">
                  <Loader2 className="w-3 h-3 animate-spin inline" /> 下载中
                </span>
              ) : downloaded ? (
                <span className="text-[10px] text-emerald-400/80 shrink-0">已下载</span>
              ) : (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mystic-gold/15 border border-mystic-gold/30 text-mystic-gold text-xs hover:bg-mystic-gold/25 transition-colors shrink-0"
                >
                  <Download className="w-3 h-3" />
                  安装
                </button>
              )}
              <button onClick={handleDismiss} className="text-mystic-rose/45 hover:text-mystic-rose/75 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
