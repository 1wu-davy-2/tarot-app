"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ShieldCheck, Smartphone } from "lucide-react";
import { login, generateVCode, getVCode, validatePhone } from "@/lib/auth-utils";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ open, onClose, onSuccess }: LoginModalProps) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [vcodeGenerated, setVcodeGenerated] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPhone("");
      setCode("");
      setError("");
      setLoading(false);
      setVcodeGenerated(false);
    }
  }, [open]);

  const handleCodeFocus = () => {
    if (!validatePhone(phone)) {
      setError("请先输入有效的手机号码");
      return;
    }
    const vcode = generateVCode();
    setCode(vcode);
    setVcodeGenerated(true);
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    // Small delay to simulate network
    await new Promise((r) => setTimeout(r, 600));

    const result = login(phone, code);
    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || "登录失败");
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-sm bg-[#0f0a1a] border border-mystic-purple/30 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-1 rounded-full bg-mystic-dark/80 text-mystic-rose/50 hover:text-mystic-rose transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center pt-8 pb-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-mystic-gold/10 border border-mystic-gold/30 mb-4">
                <ShieldCheck className="w-7 h-7 text-mystic-gold" />
              </div>
              <h3 className="text-xl font-cinzel text-mystic-gold tracking-wider">
                登录解锁 AI 解读
              </h3>
              <p className="text-mystic-rose/50 text-sm mt-2">
                登录后每天可使用 3 次 AI 深度解读
              </p>
            </div>

            {/* Form */}
            <div className="px-8 pb-8 space-y-4">
              {/* Phone */}
              <div>
                <label className="text-xs text-mystic-rose/60 mb-1.5 block">手机号码</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-rose/30" />
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="输入手机号，管理员输入 admin"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.trim())}
                    className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-foreground/20 outline-none focus:border-mystic-gold/50 transition-colors"
                  />
                </div>
              </div>

              {/* Verification Code */}
              <div>
                <label className="text-xs text-mystic-rose/60 mb-1.5 block">验证码</label>
                <div className="relative">
                  <input
                    ref={codeInputRef}
                    type="text"
                    maxLength={20}
                    placeholder="点击自动获取验证码，管理员输入 admin@123"
                    value={code}
                    onFocus={handleCodeFocus}
                    onChange={(e) => setCode(e.target.value.trim())}
                    className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 outline-none focus:border-mystic-gold/50 transition-colors tracking-[4px] text-center"
                  />
                  {vcodeGenerated && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mystic-gold/60">
                      已填充
                    </span>
                  )}
                </div>
                <p className="text-xs text-mystic-rose/30 mt-1">
                  验证码已存入浏览器，点击输入框自动获取
                </p>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-400/80 text-sm text-center">{error}</p>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || !phone.trim() || !code.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-mystic-gold/80 to-mystic-rose/60 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <motion.div
                    className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    登录
                  </>
                )}
              </button>

              {/* Admin hint */}
              <p className="text-center text-mystic-rose/25 text-xs pt-2 select-none">
                管理员：手机号输入 admin，验证码输入 admin@123
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
