"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, X } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface Announcement {
  text: string;
  expire_at: string | null;
}

export function AnnouncementBar() {
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/announcement`)
      .then((r) => r.json())
      .then((data) => {
        if (data.text) {
          if (data.expire_at && new Date(data.expire_at) < new Date()) return;
          setAnn(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleDismiss = () => setDismissed(true);

  if (!ann || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-mystic-gold/10 border-b border-mystic-gold/20 overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-2 max-w-7xl mx-auto">
          <Megaphone className="w-4 h-4 text-mystic-gold shrink-0" />
          <p className="text-xs text-mystic-gold/80 flex-1">{ann.text}</p>
          <button
            onClick={handleDismiss}
            className="p-0.5 text-mystic-gold/40 hover:text-mystic-gold shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
