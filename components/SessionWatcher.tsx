"use client";

import { useEffect, useState } from "react";
import { isLoggedIn, getToken } from "@/lib/api-client";
import { LoginModal } from "@/components/LoginModal";

/**
 * Global session watcher — checks token expiry on mount and listens for
 * auth-expired events from the API client. Shows a login modal when the
 * session has expired, regardless of which page the user is on.
 */
export function SessionWatcher() {
  const [showLogin, setShowLogin] = useState(false);

  // Check token expiry on mount
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const expired = !isLoggedIn(); // isLoggedIn() now auto-clears expired tokens
    if (expired) {
      // Small delay so the page renders first
      const t = setTimeout(() => setShowLogin(true), 1200);
      return () => clearTimeout(t);
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
