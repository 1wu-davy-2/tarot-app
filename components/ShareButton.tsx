"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Download, X, Loader2 } from "lucide-react";
import type { TarotCard } from "@/lib/tarot-data";

interface ShareButtonProps {
  cards: TarotCard[];
  isReversed: boolean[];
  spreadType: string;
  question?: string;
  interpretation?: string;
  standardInterpretation?: string;
  className?: string;
}

// All colors as hex — NO tailwind classes that might resolve to oklch()/lab()
const C = {
  bg: "#0a0612",
  purple: "#2d1b69",
  gold: "#d4a853",
  rose: "#c084fc",
  fg: "#e8e0f0",
  fgDim: "rgba(232,224,240,0.6)",
  fgFaint: "rgba(232,224,240,0.3)",
  gold80: "rgba(212,168,83,0.8)",
  gold50: "rgba(212,168,83,0.5)",
  gold30: "rgba(212,168,83,0.3)",
  purple30: "rgba(45,27,105,0.4)",
  purple20: "rgba(45,27,105,0.2)",
};

export function ShareButton({
  cards,
  isReversed,
  spreadType,
  question,
  interpretation,
  standardInterpretation,
  className = "",
}: ShareButtonProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  // Use AI interpretation if available, otherwise standard
  const displayInterpretation = interpretation || standardInterpretation || "";

  const capture = useCallback(async () => {
    if (!previewRef.current) return;
    setCapturing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: C.bg,
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const all = clonedDoc.querySelectorAll("*");
          all.forEach((el) => {
            const s = (el as HTMLElement).style;
            ["color", "backgroundColor", "borderColor", "boxShadow", "textShadow", "outlineColor"].forEach((prop) => {
              const val = s.getPropertyValue(prop);
              if (val && (val.includes("oklch(") || val.includes("lab(") || val.includes("lch(") || val.includes("color("))) {
                s.setProperty(prop, "", "");
              }
            });
          });
        },
      });
      setImageUrl(canvas.toDataURL("image/png"));
    } catch (e) {
      console.error("Screenshot failed:", e);
    } finally {
      setCapturing(false);
    }
  }, []);

  const handleShare = useCallback(() => {
    setShowPreview(true);
    setTimeout(capture, 500);
  }, [capture]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `tarot-${spreadType}-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  const dateStr = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <motion.button
        onClick={handleShare}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full border border-mystic-rose/40 text-mystic-rose/70 hover:border-mystic-rose hover:text-mystic-rose transition-all text-sm ${className}`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        <Camera className="w-4 h-4" />
        生成分享图
      </motion.button>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative max-w-md w-full max-h-[90vh] overflow-auto rounded-2xl bg-mystic-dark border border-mystic-gold/30 shadow-2xl">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-3 right-3 z-10 p-1 rounded-full bg-mystic-dark/80 text-mystic-rose/60 hover:text-mystic-rose"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ── Capture area — ALL inline styles ── */}
            <div ref={previewRef} style={{ padding: "28px 24px", backgroundColor: C.bg, fontFamily: "Georgia, serif" }}>
              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: "22px" }}>
                <p style={{ fontSize: "30px", marginBottom: "6px", color: C.gold }}>✧</p>
                <h2 style={{ fontSize: "22px", fontWeight: 700, color: C.gold, letterSpacing: "3px", margin: "4px 0" }}>命运之镜</h2>
                <p style={{ fontSize: "11px", color: "rgba(192,132,252,0.5)", letterSpacing: "4px", margin: "2px 0" }}>Mirror of Fate</p>
                <p style={{ fontSize: "11px", color: C.fgFaint, marginTop: "8px" }}>{dateStr}</p>
              </div>

              {/* Spread type + question */}
              <div style={{ textAlign: "center", marginBottom: "18px" }}>
                <span style={{ display: "inline-block", padding: "5px 16px", borderRadius: "9999px", backgroundColor: C.purple30, color: C.gold, fontSize: "12px", fontWeight: 600, letterSpacing: "2px" }}>
                  {spreadType}
                </span>
                {question && (
                  <p style={{ fontSize: "11px", color: C.fgDim, marginTop: "8px", fontStyle: "italic", padding: "0 12px" }}>
                    "{question}"
                  </p>
                )}
              </div>

              {/* Cards — with images */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginBottom: "18px" }}>
                {cards.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      width: cards.length <= 3 ? "30%" : "22%",
                      minWidth: "80px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: `2px solid ${C.gold30}`,
                      backgroundColor: C.bg,
                    }}
                  >
                    <img
                      src={c.imageUrl}
                      alt={c.nameCN}
                      style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
                    />
                    <div style={{ padding: "6px 8px", backgroundColor: "rgba(10,6,18,0.9)" }}>
                      <p style={{ fontSize: "11px", color: C.gold80, fontWeight: 600, textAlign: "center", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.nameCN}
                      </p>
                      <p style={{ fontSize: "9px", color: isReversed[i] ? "rgba(192,132,252,0.6)" : C.gold50, textAlign: "center", margin: "2px 0 0" }}>
                        {isReversed[i] ? "逆位" : "正位"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interpretation */}
              {displayInterpretation && (
                <div style={{ borderTop: `1px solid ${C.purple20}`, paddingTop: "14px" }}>
                  <p style={{ fontSize: "11px", color: C.fgFaint, textAlign: "center", marginBottom: "8px", letterSpacing: "1px" }}>
                    {interpretation ? "🔮 AI 深度解读" : "📖 标准解读"}
                  </p>
                  <p style={{ fontSize: "11px", color: C.fgDim, lineHeight: 1.7, whiteSpace: "pre-wrap", textAlign: "justify" }}>
                    {displayInterpretation}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div style={{ textAlign: "center", marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${C.purple20}` }}>
                <p style={{ fontSize: "9px", color: C.fgFaint, letterSpacing: "2px" }}>命运之镜 · Mirror of Fate</p>
              </div>
            </div>

            <div className="p-4 border-t border-mystic-purple/20 flex justify-center gap-4">
              {capturing ? (
                <div className="flex items-center gap-2 text-mystic-rose/60 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  生成中...
                </div>
              ) : imageUrl ? (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-2 rounded-full bg-mystic-gold/20 border border-mystic-gold/50 text-mystic-gold hover:bg-mystic-gold/30 transition-all text-sm"
                >
                  <Download className="w-4 h-4" />
                  保存图片
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
