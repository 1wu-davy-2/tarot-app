// Multi-deck theme system. Premium themes require membership.
// Theme preference stored in localStorage under "tarot_deck_theme".

import { getToken, getStoredUser } from "./api-client";

export type DeckTheme = "rider-waite" | "marseille" | "modern-minimal";

export interface ThemeInfo {
  id: DeckTheme;
  name: string;
  description: string;
  icon: string;
  premiumOnly: boolean;
  isDefault: boolean;
}

const STORAGE_KEY = "tarot_deck_theme";
const CACHE_PREFIX = "tarot_theme_cache_";

export const THEMES: ThemeInfo[] = [
  { id: "rider-waite", name: "经典韦特", description: "Rider-Waite-Smith 经典牌面", icon: "🃏", premiumOnly: false, isDefault: true },
  { id: "marseille", name: "马赛风格", description: "法式经典马赛塔罗牌 · 会员专属", icon: "🎴", premiumOnly: true, isDefault: false },
  { id: "modern-minimal", name: "现代极简", description: "简约几何现代风格 · 会员专属", icon: "✨", premiumOnly: true, isDefault: false },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ── Theme access ──

export function getCurrentTheme(): DeckTheme {
  if (typeof window === "undefined") return "rider-waite";
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as DeckTheme | null;
    if (stored && THEMES.some((t) => t.id === stored)) {
      // Only allow premium themes if user has access
      const theme = THEMES.find((t) => t.id === stored)!;
      if (!theme.premiumOnly || canAccessPremiumThemes()) {
        return stored;
      }
    }
  } catch {}
  return "rider-waite";
}

export function setCurrentTheme(theme: DeckTheme) {
  if (typeof window === "undefined") return;
  const info = THEMES.find((t) => t.id === theme);
  if (!info) return;
  if (info.premiumOnly && !canAccessPremiumThemes()) return;
  localStorage.setItem(STORAGE_KEY, theme);
  // Dispatch event so components re-render
  window.dispatchEvent(new CustomEvent("theme-change", { detail: theme }));
}

export function canAccessPremiumThemes(freshUser?: { membership_tier?: string; membership_expiry?: string; is_admin?: boolean } | null): boolean {
  if (typeof window === "undefined") return false;
  const user = freshUser || getStoredUser();
  if (!user) return false;
  if (user.is_admin) return true;
  const tier = ((user as any).membership_tier || "free").toLowerCase();
  if (tier === "premium") return true;
  if (tier === "basic") {
    if ((user as any).membership_expiry) {
      const expiry = new Date((user as any).membership_expiry);
      return expiry > new Date();
    }
    return true;
  }
  return false;
}

export function syncStoredMembership(userData: { membership_tier?: string; membership_expiry?: string }) {
  if (typeof window === "undefined") return;
  const stored = getStoredUser();
  if (stored && userData.membership_tier) {
    const u = { ...stored, membership_tier: userData.membership_tier || stored.membership_tier, membership_expiry: userData.membership_expiry ?? stored.membership_expiry };
    localStorage.setItem("tarot_user", JSON.stringify(u));
  }
}

// ── Image URL construction ──

export function getCardImageUrl(imageUrl: string): string {
  const theme = getCurrentTheme();
  if (theme === "rider-waite") return imageUrl;

  // Extract filename: /cards/00-fool.webp → 00-fool.svg
  const baseName = imageUrl.split("/").pop() || "";
  const nameWithoutExt = baseName.replace(/\.(webp|jpg|png)$/i, "");
  const themeFilename = `${nameWithoutExt}.svg`;

  if (API_BASE) {
    return `${API_BASE}/api/theme-images/${theme}/${themeFilename}`;
  }
  return `/api/theme-images/${theme}/${themeFilename}`;
}

export function getThemePreviewUrl(theme: DeckTheme): string {
  if (theme === "rider-waite") return "/cards/00-fool.webp";
  if (API_BASE) return `${API_BASE}/api/theme-images/${theme}/preview`;
  return `/api/theme-images/${theme}/preview`;
}

// ── Theme download for APK ──

export function getThemeDownloadUrl(theme: DeckTheme): string {
  if (API_BASE) return `${API_BASE}/api/theme-images/${theme}/download`;
  return `/api/theme-images/${theme}/download`;
}

// ── React hook ──

import { useState, useEffect, useCallback } from "react";

export function useDeckTheme(): DeckTheme {
  const [theme, setTheme] = useState<DeckTheme>(getCurrentTheme);

  useEffect(() => {
    const handler = () => setTheme(getCurrentTheme());
    window.addEventListener("theme-change", handler);
    return () => window.removeEventListener("theme-change", handler);
  }, []);

  return theme;
}

export function useThemeImageUrl(imageUrl: string): string {
  const theme = useDeckTheme();
  if (theme === "rider-waite") return imageUrl;

  const baseName = imageUrl.split("/").pop() || "";
  const nameWithoutExt = baseName.replace(/\.(webp|jpg|png)$/i, "");
  const themeFilename = `${nameWithoutExt}.svg`;

  if (API_BASE) {
    return `${API_BASE}/api/theme-images/${theme}/${themeFilename}`;
  }
  return `/api/theme-images/${theme}/${themeFilename}`;
}
