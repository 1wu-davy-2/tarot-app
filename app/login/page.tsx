"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Mail, Lock, User, Phone, Loader2 } from "lucide-react";
import {
  apiLogin, apiRegister, apiSendCode,
  apiForgotPassword, apiResetPassword,
} from "@/lib/api-client";

type Tab = "login" | "register" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Login form
  const [loginAccount, setLoginAccount] = useState("");
  const [loginPwd, setLoginPwd] = useState("");

  // Register form
  const [regUser, setRegUser] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPwd, setRegPwd] = useState("");
  const [regCode, setRegCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);

  // Reset form
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPwd, setResetPwd] = useState("");
  const [resetStep, setResetStep] = useState<"email" | "code" | "done">("email");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage("");
    setLoading(true);
    try {
      await apiLogin(loginAccount, loginPwd);
      router.push("/profile");
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUser || !regEmail || !regPhone || !regPwd || !regCode) {
      setError("请填写所有必填项（用户名、邮箱、手机号、密码、验证码）"); return;
    }
    setError(""); setMessage("");
    setLoading(true);
    try {
      await apiRegister(regUser, regEmail, regPwd, regPhone, regCode);
      setMessage("注册成功！请登录");
      setTab("login");
      setRegUser(""); setRegEmail(""); setRegPhone(""); setRegPwd(""); setRegCode("");
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleSendRegCode = async () => {
    if (!regEmail) { setError("请先输入邮箱"); return; }
    setError(""); setMessage("");
    setSendingCode(true);
    try {
      await apiSendCode(regEmail, "register");
      setMessage("验证码已发送至邮箱，请查收");
    } catch (err: any) {
      setError(err.message);
    } finally { setSendingCode(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setMessage("");
    setLoading(true);
    try {
      await apiForgotPassword(resetEmail);
      setResetStep("code");
      setMessage("重置验证码已发送");
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!resetCode || !resetPwd) { setError("请填写验证码和新密码"); return; }
    setError(""); setMessage("");
    setLoading(true);
    try {
      await apiResetPassword(resetEmail, resetCode, resetPwd);
      setResetStep("done");
      setMessage("密码重置成功！请返回登录");
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "login", label: "登录" },
    { key: "register", label: "注册" },
    { key: "reset", label: "找回密码" },
  ];

  return (
    <div className="min-h-screen py-8 px-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-mystic-rose/60 hover:text-mystic-gold transition-colors text-sm mb-6 px-3 py-1.5 -ml-3 rounded-lg hover:bg-mystic-purple/10"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-cinzel text-mystic-gold text-glow">命运之镜</h1>
          <p className="text-mystic-rose/50 text-sm mt-2">登录以解锁更多解读</p>
        </motion.div>

        {/* Tab switcher */}
        <div className="flex border-b border-mystic-purple/20 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setError(""); setMessage(""); }}
              className={`flex-1 py-3 text-sm transition-colors border-b-2 -mb-[1px] ${
                tab === t.key
                  ? "border-mystic-gold text-mystic-gold"
                  : "border-transparent text-foreground/40 hover:text-foreground/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 p-3 rounded-lg bg-mystic-gold/10 border border-mystic-gold/20 text-mystic-gold/90 text-xs text-center">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400/90 text-xs text-center">
            {error}
          </div>
        )}

        {/* ── Login Form ── */}
        {tab === "login" && (
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleLogin}
            className="glass-card p-6 space-y-4"
          >
            <div>
              <label className="text-xs text-mystic-rose/50 mb-2 block">邮箱 / 用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-rose/30" />
                <input
                  value={loginAccount}
                  onChange={(e) => setLoginAccount(e.target.value)}
                  placeholder="输入邮箱或用户名"
                  className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg pl-10 pr-4 py-3 text-foreground/80 placeholder:text-mystic-rose/30 text-sm focus:outline-none focus:border-mystic-gold/50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-mystic-rose/50 mb-2 block">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-rose/30" />
                <input
                  type="password"
                  value={loginPwd}
                  onChange={(e) => setLoginPwd(e.target.value)}
                  placeholder="输入密码"
                  className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg pl-10 pr-4 py-3 text-foreground/80 placeholder:text-mystic-rose/30 text-sm focus:outline-none focus:border-mystic-gold/50 transition-colors"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/50 text-mystic-gold hover:border-mystic-gold transition-all font-cinzel text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              登录
            </button>
          </motion.form>
        )}

        {/* ── Register Form ── */}
        {tab === "register" && (
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleRegister}
            className="glass-card p-6 space-y-4"
          >
            <div>
              <label className="text-xs text-mystic-rose/50 mb-2 block">用户名 *</label>
              <input
                value={regUser}
                onChange={(e) => setRegUser(e.target.value)}
                placeholder="2-50位字符"
                className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg px-4 py-3 text-foreground/80 placeholder:text-mystic-rose/30 text-sm focus:outline-none focus:border-mystic-gold/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-mystic-rose/50 mb-2 block">邮箱 *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-rose/30" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="用于验证和找回密码"
                  className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg pl-10 pr-4 py-3 text-foreground/80 placeholder:text-mystic-rose/30 text-sm focus:outline-none focus:border-mystic-gold/50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-mystic-rose/50 mb-2 block">手机号 *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-rose/30" />
                <input
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="11位中国大陆手机号"
                  maxLength={11}
                  className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg pl-10 pr-4 py-3 text-foreground/80 placeholder:text-mystic-rose/30 text-sm focus:outline-none focus:border-mystic-gold/50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-mystic-rose/50 mb-2 block">密码 *</label>
              <input
                type="password"
                value={regPwd}
                onChange={(e) => setRegPwd(e.target.value)}
                placeholder="至少6位"
                className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg px-4 py-3 text-foreground/80 placeholder:text-mystic-rose/30 text-sm focus:outline-none focus:border-mystic-gold/50 transition-colors"
              />
            </div>

            {/* Verification code */}
            <div>
              <label className="text-xs text-mystic-rose/50 mb-2 block">验证码 *</label>
              <div className="flex gap-3">
                <input
                  value={regCode}
                  onChange={(e) => setRegCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6位数字验证码"
                  maxLength={6}
                  className="flex-1 bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg px-4 py-3 text-foreground/80 placeholder:text-mystic-rose/30 text-sm text-center tracking-widest focus:outline-none focus:border-mystic-gold/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleSendRegCode}
                  disabled={sendingCode || !regEmail}
                  className="flex-shrink-0 px-4 py-3 rounded-lg border border-mystic-gold/40 text-mystic-gold text-xs hover:bg-mystic-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sendingCode ? "发送中..." : "获取验证码"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/50 text-mystic-gold hover:border-mystic-gold transition-all font-cinzel text-sm disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              注册
            </button>
          </motion.form>
        )}

        {/* ── Reset Password ── */}
        {tab === "reset" && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 space-y-4"
          >
            {resetStep === "email" && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="text-xs text-mystic-rose/50 mb-2 block">注册邮箱</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mystic-rose/30" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="输入注册时使用的邮箱"
                      className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg pl-10 pr-4 py-3 text-foreground/80 placeholder:text-mystic-rose/30 text-sm focus:outline-none focus:border-mystic-gold/50 transition-colors"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/50 text-mystic-gold hover:border-mystic-gold transition-all font-cinzel text-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  发送重置验证码
                </button>
              </form>
            )}

            {resetStep === "code" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-mystic-rose/50 mb-2 block">验证码</label>
                  <input
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="6位数字验证码"
                    maxLength={6}
                    className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg px-4 py-3 text-foreground/80 placeholder:text-mystic-rose/30 text-sm text-center tracking-widest focus:outline-none focus:border-mystic-gold/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-mystic-rose/50 mb-2 block">新密码</label>
                  <input
                    type="password"
                    value={resetPwd}
                    onChange={(e) => setResetPwd(e.target.value)}
                    placeholder="至少6位"
                    className="w-full bg-mystic-dark/50 border border-mystic-purple/30 rounded-lg px-4 py-3 text-foreground/80 placeholder:text-mystic-rose/30 text-sm focus:outline-none focus:border-mystic-gold/50 transition-colors"
                  />
                </div>
                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-mystic-purple to-mystic-dark border border-mystic-gold/50 text-mystic-gold hover:border-mystic-gold transition-all font-cinzel text-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  重置密码
                </button>
              </div>
            )}

            {resetStep === "done" && (
              <div className="text-center">
                <p className="text-mystic-gold text-sm">密码重置成功！</p>
                <button
                  onClick={() => setTab("login")}
                  className="mt-4 text-mystic-rose/50 hover:text-mystic-rose text-sm underline transition-colors"
                >
                  返回登录
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
