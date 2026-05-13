"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Mail, Lock, User, Phone, ShieldCheck } from "lucide-react";
import { apiLogin, apiRegister, apiSendCode } from "@/lib/api-client";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Tab = "login" | "register";

export function LoginModal({ open, onClose, onSuccess }: LoginModalProps) {
  const [tab, setTab] = useState<Tab>("login");

  // Login fields
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regZodiac, setRegZodiac] = useState("");
  const [regCode, setRegCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) {
      setTab("login");
      setAccount("");
      setPassword("");
      setRegUsername("");
      setRegEmail("");
      setRegPhone("");
      setRegPassword("");
      setRegZodiac("");
      setRegCode("");
      setSendingCode(false);
      setCodeSent(false);
      setLoading(false);
      setError("");
      setMessage("");
    }
  }, [open]);

  const handleLogin = async () => {
    setError("");
    if (!account.trim()) { setError("请输入邮箱或用户名"); return; }
    if (!password) { setError("请输入密码"); return; }
    setLoading(true);
    try {
      await apiLogin(account.trim(), password);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || "登录失败");
    }
    setLoading(false);
  };

  const handleSendCode = async () => {
    setError("");
    if (!regEmail.trim()) { setError("请输入邮箱"); return; }
    setSendingCode(true);
    try {
      await apiSendCode(regEmail.trim(), "register");
      setCodeSent(true);
      setMessage("验证码已发送至邮箱");
    } catch (e: any) {
      setError(e.message || "发送失败");
    }
    setSendingCode(false);
  };

  const handleRegister = async () => {
    setError("");
    setMessage("");
    if (!regUsername.trim()) { setError("请输入用户名"); return; }
    if (!regEmail.trim()) { setError("请输入邮箱"); return; }
    if (!regPhone.trim()) { setError("请输入手机号"); return; }
    if (regPassword.length < 6) { setError("密码至少6位"); return; }
    if (regCode.length !== 6) { setError("请输入6位验证码"); return; }
    setLoading(true);
    try {
      await apiRegister(regUsername.trim(), regEmail.trim(), regPassword, regPhone.trim(), regCode.trim(), regZodiac || undefined);
      // Auto-login after register
      await apiLogin(regEmail.trim(), regPassword);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || "注册失败");
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-sm bg-[#0f0a1a] border border-mystic-purple/30 rounded-2xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-1 rounded-full bg-mystic-dark/80 text-mystic-rose/65 hover:text-mystic-rose transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center pt-8 pb-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-mystic-gold/10 border border-mystic-gold/30 mb-3">
                <ShieldCheck className="w-6 h-6 text-mystic-gold" />
              </div>
              <h3 className="text-lg font-cinzel text-mystic-gold tracking-wider">
                {tab === "login" ? "登录" : "注册"}
              </h3>
              <p className="text-mystic-rose/65 text-xs mt-1">
                {tab === "login"
                  ? "登录后可使用 AI 深度解读 + 每日签到"
                  : "创建账号解锁完整功能"}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex justify-center gap-1 pb-3">
              <button
                onClick={() => { setTab("login"); setError(""); setMessage(""); }}
                className={`text-xs px-4 py-1 rounded-full transition-colors ${
                  tab === "login"
                    ? "bg-mystic-gold/20 text-mystic-gold border border-mystic-gold/30"
                    : "text-mystic-rose/55 hover:text-mystic-rose/70"
                }`}
              >
                登录
              </button>
              <button
                onClick={() => { setTab("register"); setError(""); setMessage(""); }}
                className={`text-xs px-4 py-1 rounded-full transition-colors ${
                  tab === "register"
                    ? "bg-mystic-gold/20 text-mystic-gold border border-mystic-gold/30"
                    : "text-mystic-rose/55 hover:text-mystic-rose/70"
                }`}
              >
                注册
              </button>
            </div>

            {/* Form */}
            <div className="px-8 pb-8 space-y-3">
              {tab === "login" ? (
                <>
                  <div>
                    <label className="text-xs text-mystic-rose/75 mb-1 block">邮箱 / 用户名</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-rose/45" />
                      <input
                        type="text"
                        placeholder="输入邮箱或用户名"
                        value={account}
                        onChange={(e) => setAccount(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-mystic-gold/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-mystic-rose/75 mb-1 block">密码</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-rose/45" />
                      <input
                        type="password"
                        placeholder="输入密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                        className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-mystic-gold/50 transition-colors"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-mystic-rose/75 mb-1 block">用户名</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-rose/45" />
                      <input
                        type="text"
                        placeholder="2-50 个字符"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-mystic-gold/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-mystic-rose/75 mb-1 block">邮箱</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-rose/45" />
                      <input
                        type="email"
                        placeholder="用于接收验证码"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-mystic-gold/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-mystic-rose/75 mb-1 block">手机号</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-rose/45" />
                      <input
                        type="text"
                        maxLength={11}
                        placeholder="11 位手机号"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ""))}
                        className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-mystic-gold/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-mystic-rose/75 mb-1 block">密码</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-rose/45" />
                      <input
                        type="password"
                        placeholder="至少 6 位"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-mystic-gold/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-mystic-rose/75 mb-1 block">星座（选填）</label>
                    <div className="relative">
                      <select
                        value={regZodiac}
                        onChange={(e) => setRegZodiac(e.target.value)}
                        className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-mystic-gold/50 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="">不选择</option>
                        {["白羊座","金牛座","双子座","巨蟹座","狮子座","处女座","天秤座","天蝎座","射手座","摩羯座","水瓶座","双鱼座"].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="验证码"
                        value={regCode}
                        onChange={(e) => setRegCode(e.target.value.replace(/\D/g, ""))}
                        className="w-full bg-mystic-dark/60 border border-mystic-purple/20 rounded-lg px-3 py-2.5 text-sm text-center tracking-[8px] outline-none focus:border-mystic-gold/50 transition-colors"
                      />
                    </div>
                    <button
                      onClick={handleSendCode}
                      disabled={sendingCode || !regEmail.trim()}
                      className="shrink-0 text-xs px-3 py-2.5 rounded-lg bg-mystic-gold/10 border border-mystic-gold/20 text-mystic-gold hover:bg-mystic-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {sendingCode ? "发送中..." : codeSent ? "重新发送" : "获取验证码"}
                    </button>
                  </div>
                </>
              )}

              {/* Messages */}
              {error && <p className="text-red-400/80 text-sm text-center">{error}</p>}
              {message && <p className="text-green-400/80 text-sm text-center">{message}</p>}

              {/* Submit */}
              <button
                onClick={tab === "login" ? handleLogin : handleRegister}
                disabled={
                  loading ||
                  (tab === "login" ? !account.trim() || !password : !regUsername.trim() || !regEmail.trim() || !regPhone.trim() || regPassword.length < 6 || regCode.length !== 6)
                }
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-mystic-gold/80 to-mystic-rose/60 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed mt-2"
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
                    {tab === "login" ? "登录" : "注册"}
                  </>
                )}
              </button>

              {/* Benefits */}
              <p className="text-center text-mystic-rose/25 text-xs pt-1">
                登录后每日签到可获得额外 AI 解读次数
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
