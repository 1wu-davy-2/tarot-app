// Data export utilities — generate HTML files with inline CSS and trigger browser download.

import { tarotCards } from "./tarot-data";
import { conversationToPlainText } from "./conversation-format";

// ── Shared styles (dark theme, inline CSS) ──

const SHARED_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #0a0612;
    color: #f2eef8;
    font-family: 'Georgia', 'Noto Serif SC', serif;
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.8;
  }
  h1 { font-family: 'Georgia', serif; color: #d4a853; text-align: center; margin-bottom: 0.5rem; font-size: 2rem; letter-spacing: 0.1em; }
  h2 { font-family: 'Georgia', serif; color: #d4a853; margin: 2rem 0 1rem; font-size: 1.3rem; border-bottom: 1px solid rgba(212,168,83,0.2); padding-bottom: 0.5rem; }
  h3 { color: #c084fc; font-size: 1rem; margin: 1.2rem 0 0.5rem; }
  .subtitle { text-align: center; color: #c084fc; opacity: 0.6; font-size: 0.85rem; margin-bottom: 2rem; }
  .watermark { text-align: center; color: rgba(212,168,83,0.3); font-size: 0.75rem; margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid rgba(212,168,83,0.1); }
  .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(212,168,83,0.15); border-radius: 0.75rem; padding: 1.2rem; margin-bottom: 1rem; }
  .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .card-name { color: #d4a853; font-weight: bold; font-size: 1.05rem; }
  .card-tag { font-size: 0.7rem; padding: 0.15rem 0.6rem; border-radius: 1rem; }
  .tag-reversed { background: rgba(192,132,252,0.15); color: #c084fc; }
  .tag-upright { background: rgba(212,168,83,0.1); color: #d4a853; }
  .mood { font-size: 1.5rem; }
  .note { color: #f2eef8; opacity: 0.7; font-style: italic; }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
  .stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(212,168,83,0.15); border-radius: 0.75rem; padding: 1rem; text-align: center; }
  .stat-value { font-size: 1.8rem; color: #d4a853; font-weight: bold; }
  .stat-label { font-size: 0.7rem; color: #c084fc; opacity: 0.6; }
  .bar-container { margin: 0.5rem 0; }
  .bar-label { display: flex; justify-content: space-between; font-size: 0.8rem; color: #f2eef8; opacity: 0.7; margin-bottom: 0.2rem; }
  .bar-track { height: 1.2rem; background: rgba(255,255,255,0.05); border-radius: 0.3rem; overflow: hidden; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #d4a853, #c084fc); border-radius: 0.3rem; }
  .reading-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(212,168,83,0.15); border-radius: 0.75rem; padding: 1.2rem; margin-bottom: 1rem; }
  .reading-meta { font-size: 0.75rem; color: #c084fc; opacity: 0.6; margin-bottom: 0.5rem; }
  .reading-body { color: #f2eef8; opacity: 0.85; white-space: pre-wrap; }
  .keyword { display: inline-block; padding: 0.15rem 0.5rem; background: rgba(212,168,83,0.1); color: #d4a853; border-radius: 0.3rem; font-size: 0.75rem; margin: 0.15rem; }
  @media print { body { background: white; color: #1a1a2e; } h1, h2, .card-name, .stat-value { color: #b8860b; } }
`;

function wrapHTML(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>${SHARED_CSS}</style>
</head>
<body>
  <h1>${title}</h1>
  <p class="subtitle">命运之镜 · Mirror of Fate</p>
  ${body}
  <p class="watermark">命运之镜 · Mirror of Fate · 由AI塔罗占卜生成</p>
</body>
</html>`;
}

// ── Diary Export ──

export function generateDiaryHTML(
  entries: Array<{ date: string; cardId: number; isReversed: boolean; mood?: number; note?: string }>,
  monthLabel: string
): string {
  const moodEmojis = ["", "😢", "😕", "😐", "🙂", "😊"];

  const rows = entries
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => {
      const card = tarotCards.find((c) => c.id === e.cardId);
      const tagClass = e.isReversed ? "tag-reversed" : "tag-upright";
      const tagText = e.isReversed ? "逆位" : "正位";
      return `
    <div class="card">
      <div class="card-header">
        <span class="card-name">${card?.nameCN || `牌 #${e.cardId}`} · ${tagText}</span>
        <span style="color:#c084fc;opacity:0.6;font-size:0.85rem">${e.date}</span>
      </div>
      ${e.mood ? `<span class="mood">${moodEmojis[e.mood] || ""}</span>` : ""}
      ${e.note ? `<p class="note">${escapeHTML(e.note)}</p>` : ""}
    </div>`;
    })
    .join("");

  const body = `
  <h2>${monthLabel} · 共 ${entries.length} 篇日记</h2>
  ${rows || '<p style="text-align:center;color:rgba(192,132,252,0.4)">本月暂无日记</p>'}
  `;

  return wrapHTML(`塔罗日记 · ${monthLabel}`, body);
}

// ── Readings Export ──

export function generateReadingsHTML(
  readings: Array<{
    id?: number | string;
    date?: string;
    created_at?: string;
    spreadType?: string;
    spread_type?: string;
    question?: string;
    aiInterpretation?: string;
    ai_response?: string;
    cards?: Array<{ nameCN?: string; isReversed?: boolean; position?: string }>;
  }>
): string {
  const rows = readings
    .map((r) => {
      const date = r.date || r.created_at?.slice(0, 10) || "";
      const spread = r.spreadType || r.spread_type || "占卜";
      const question = r.question || "";
      const response = conversationToPlainText(r.aiInterpretation || r.ai_response || "");
      const cards = r.cards || [];

      return `
    <div class="reading-item">
      <div class="reading-meta">${date} · ${spread}${question ? ` · "${escapeHTML(question)}"` : ""}</div>
      ${cards.length > 0 ? `<div>${cards.map((c) => `<span class="keyword">${c.nameCN || ""}${c.isReversed ? "逆" : "正"}</span>`).join(" ")}</div>` : ""}
      <div class="reading-body">${escapeHTML(response)}</div>
    </div>`;
    })
    .join("");

  const body = `
  <h2>共 ${readings.length} 条解读记录</h2>
  ${rows || '<p style="text-align:center;color:rgba(192,132,252,0.4)">暂无解读记录</p>'}
  `;

  return wrapHTML("塔罗解读历史", body);
}

// ── Annual Report ──

export function generateAnnualReportHTML(
  year: number,
  stats: {
    totalReadings: number;
    totalDiary: number;
    maxStreak: number;
    totalCheckins: number;
    topCards: Array<{ nameCN: string; count: number }>;
    elements: Record<string, number>;
    monthlyReadings: Record<string, number>;
    keywords: string;
  }
): string {
  const elementEmoji: Record<string, string> = { fire: "🔥", water: "💧", air: "🌬️", earth: "🪨" };

  const topCardsRows = stats.topCards
    .slice(0, 5)
    .map((c, i) => `<div class="bar-label"><span>${i + 1}. ${c.nameCN}</span><span>${c.count} 次</span></div>`)
    .join("");

  const elementRows = Object.entries(stats.elements)
    .sort((a, b) => b[1] - a[1])
    .map(([el, count]) => {
      const total = Object.values(stats.elements).reduce((s, v) => s + v, 0) || 1;
      const pct = Math.round((count / total) * 100);
      return `<div class="bar-container">
      <div class="bar-label"><span>${elementEmoji[el] || ""} ${el}</span><span>${pct}%</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
    </div>`;
    })
    .join("");

  const monthlyRows = Object.entries(stats.monthlyReadings)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => {
      const maxCount = Math.max(...Object.values(stats.monthlyReadings), 1);
      const pct = Math.round((count / maxCount) * 100);
      return `<div class="bar-container">
      <div class="bar-label"><span>${month}月</span><span>${count} 次</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
    </div>`;
    })
    .join("");

  const body = `
  <h2>📊 年度统计</h2>
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-value">${stats.totalReadings}</div><div class="stat-label">占卜次数</div></div>
    <div class="stat-card"><div class="stat-value">${stats.totalDiary}</div><div class="stat-label">塔罗日记</div></div>
    <div class="stat-card"><div class="stat-value">${stats.maxStreak}</div><div class="stat-label">最长签到（天）</div></div>
    <div class="stat-card"><div class="stat-value">${stats.totalCheckins}</div><div class="stat-label">累计签到（天）</div></div>
  </div>

  <h2>🃏 最常出现的牌</h2>
  ${topCardsRows || '<p style="color:rgba(192,132,252,0.4)">暂无数据</p>'}

  <h2>🌙 元素分布</h2>
  ${elementRows || '<p style="color:rgba(192,132,252,0.4)">暂无数据</p>'}

  <h2>📈 月度占卜趋势</h2>
  ${monthlyRows || '<p style="color:rgba(192,132,252,0.4)">暂无数据</p>'}

  <h2>💭 年度关键词</h2>
  <p style="text-align:center;font-size:1.5rem;color:#d4a853;margin:1.5rem 0">${stats.keywords}</p>
  `;

  return wrapHTML(`${year} 年度塔罗报告`, body);
}

// ── Download helper ──

export function downloadHTML(filename: string, html: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHTML(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
