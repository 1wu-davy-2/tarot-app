"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Check, ChevronRight, ChevronLeft } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setSent(true);
        setTimeout(() => {
          setOpen(false);
          setText("");
          setSent(false);
        }, 2000);
      } else {
        setError(data.error || "发送失败");
      }
    } catch {
      setError("网络错误，请稍后重试");
    }
    setSending(false);
  };

  return (
    <div className="fixed bottom-20 right-3 z-50">
      <AnimatePresence>
        {open && !collapsed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-14 right-0 w-72 bg-[#0f0a1a] border border-mystic-purple/30 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-mystic-purple/10">
              <span className="text-sm text-mystic-gold font-cinzel">给作者留言</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCollapsed(true)}
                  className="p-0.5 text-mystic-rose/45 hover:text-mystic-rose/75"
                  title="收起至边栏"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setOpen(false); setText(""); setSent(false); setError(""); setCollapsed(false); }}
                  className="p-0.5 text-mystic-rose/55 hover:text-mystic-rose"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {sent ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Check className="w-8 h-8 text-green-400" />
                <p className="text-sm text-green-400">已发送，感谢反馈！</p>
                <p className="text-[10px] text-mystic-rose/55">作者收到后会第一时间进行优化</p>
              </div>
            ) : (
              <>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="反馈意见或功能建议..."
                  maxLength={2000}
                  rows={4}
                  className="w-full bg-transparent px-4 py-3 text-sm text-foreground/80 placeholder:text-foreground/35 outline-none resize-none"
                />
                <p className="px-4 text-[10px] text-mystic-rose/55">作者收到消息后会第一时间进行优化处理</p>
                {error && <p className="px-4 text-xs text-red-400/80">{error}</p>}
                <div className="flex items-center justify-between px-4 py-2 border-t border-mystic-purple/10">
                  <span className="text-[10px] text-mystic-rose/55">{text.length}/2000</span>
                  <button
                    onClick={handleSubmit}
                    disabled={sending || !text.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-mystic-gold/20 border border-mystic-gold/30 text-mystic-gold text-xs hover:bg-mystic-gold/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <motion.div
                        className="w-3.5 h-3.5 rounded-full border-2 border-mystic-gold border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    <span>发送</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed edge tab */}
      {collapsed && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setCollapsed(false)}
          className="absolute bottom-14 right-0 flex items-center gap-1 px-2 py-3 rounded-l-xl bg-[#0f0a1a]/95 border border-r-0 border-mystic-purple/20 text-mystic-rose/65 hover:text-mystic-rose transition-colors shadow-lg"
          title="展开反馈"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <MessageSquare className="w-3.5 h-3.5" />
        </motion.button>
      )}

      {/* Main toggle button */}
      {!collapsed && (
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all ${
            open
              ? "bg-mystic-purple/40 text-mystic-rose"
              : "bg-[#0f0a1a]/90 border border-mystic-purple/20 text-mystic-rose/75 hover:text-mystic-rose hover:border-mystic-rose/30"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs">反馈</span>
        </button>
      )}
    </div>
  );
}
