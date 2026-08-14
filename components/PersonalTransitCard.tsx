"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { apiGetPersonalTransits, isLoggedIn } from "@/lib/api-client";

export function PersonalTransitCard() {
  const [transits, setTransits] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn()) { setLoading(false); return; }
    apiGetPersonalTransits()
      .then((data) => { if (data?.transits) setTransits(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !transits || !transits.transits) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 space-y-2"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-mystic-gold" />
          <span className="text-xs font-cinzel text-mystic-gold">当前个人星象</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-mystic-rose/55" /> : <ChevronDown className="w-4 h-4 text-mystic-rose/55" />}
      </button>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="overflow-hidden"
        >
          <div className="pt-2 text-xs text-foreground/70 space-y-1 leading-relaxed whitespace-pre-wrap">
            {transits.transits}
          </div>
          {transits.critical_months && (
            <div className="pt-2 mt-2 border-t border-mystic-purple/10 text-xs text-foreground/70 space-y-1 leading-relaxed whitespace-pre-wrap">
              {transits.critical_months}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
