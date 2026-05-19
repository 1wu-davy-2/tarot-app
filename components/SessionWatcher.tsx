"use client";

import { useEffect, useState, useRef } from "react";
import { isLoggedIn, getToken } from "@/lib/api-client";
import { LoginModal } from "@/components/LoginModal";

const IS_APK = process.env.NEXT_PUBLIC_BUILD_TARGET === "apk";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function pingActivity() {
  if (!isLoggedIn()) return;
  try {
    const token = getToken();
    await fetch(`${API_BASE}/api/auth/me/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
  } catch { /* silent */ }
}

/**
 * Global session watcher — checks token expiry on mount, pings activity,
 * and listens for auth-expired events. Shows a login modal when the
 * session has expired, regardless of which page the user is on.
 */
export function SessionWatcher() {
  const [showLogin, setShowLogin] = useState(false);
  const pinged = useRef(false);

  // Check token expiry on mount + ping activity
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const expired = !isLoggedIn(); // isLoggedIn() now auto-clears expired tokens
    if (expired) {
      const t = setTimeout(() => setShowLogin(true), 1200);
      return () => clearTimeout(t);
    }

    // Ping activity once per session
    if (!pinged.current) {
      pinged.current = true;
      pingActivity();
    }
  }, []);

  // Listen for auth-expired events (401 responses from server)
  useEffect(() => {
    const onExpired = () => setShowLogin(true);
    window.addEventListener("auth-expired", onExpired);
    return () => window.removeEventListener("auth-expired", onExpired);
  }, []);

  return (
    <LoginModal
      open={showLogin}
      onClose={() => setShowLogin(false)}
      onSuccess={() => {
        setShowLogin(false);
        window.dispatchEvent(new Event("auth-change"));
      }}
    />
  );
}
