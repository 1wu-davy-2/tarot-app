"use client";

import type { MbtiIllustration } from "@/lib/personality-tests";

interface MbtiAvatarProps {
  /** MBTI type string e.g. "INFP" */
  mbtiType: string;
  size?: "sm" | "md" | "lg";
  illustration: MbtiIllustration;
  group: string;
  accentColor: string;
}

const SIZE_MAP = { sm: 80, md: 120, lg: 180 };

export function MbtiAvatar({ mbtiType, size = "md", illustration, group, accentColor }: MbtiAvatarProps) {
  const s = SIZE_MAP[size];
  const cx = s / 2;
  const headW = s * 0.28;
  const headH = s * 0.34;

  // Eye positions
  const eyeY = cx - s * 0.04;
  const eyeSpread = s * 0.07;
  const eyeR = eyeStyleRadius(illustration.eyeStyle, s);
  const mouthY = cx + s * 0.06;

  // Head shape clip
  const headRx = headShapeRx(illustration.headShape, headW);
  const headRy = headShapeRy(illustration.headShape, headH);

  return (
    <div className="relative inline-flex flex-col items-center select-none">
      {/* Card background */}
      <div
        className="relative overflow-hidden rounded-2xl border"
        style={{
          width: s,
          height: s,
          background: illustration.bgGradient,
          borderColor: accentColor + "33",
        }}
      >
        {/* Decorative background elements */}
        <svg viewBox={`0 0 ${s} ${s}`} className="absolute inset-0">
          {decorElements(illustration.decorShape, s, illustration.decorColor)}
        </svg>

        {/* Character SVG */}
        <svg viewBox={`0 0 ${s} ${s}`} className="absolute inset-0">
          {/* Neck */}
          <line
            x1={cx} y1={cx + headH * 0.6} x2={cx} y2={s * 0.75}
            stroke={accentColor} strokeOpacity={0.3} strokeWidth={s * 0.015}
            strokeLinecap="round"
          />

          {/* Head */}
          <ellipse
            cx={cx} cy={cx - s * 0.03}
            rx={headRx} ry={headRy}
            fill={accentColor + "18"}
            stroke={accentColor} strokeOpacity={0.5} strokeWidth={s * 0.012}
          />

          {/* Eyes */}
          <ellipse cx={cx - eyeSpread} cy={eyeY} rx={eyeR} ry={eyeR * 0.9} fill={accentColor} />
          <ellipse cx={cx + eyeSpread} cy={eyeY} rx={eyeR} ry={eyeR * 0.9} fill={accentColor} />
          {/* Eye highlights */}
          <ellipse cx={cx - eyeSpread - eyeR * 0.25} cy={eyeY - eyeR * 0.3} rx={eyeR * 0.35} ry={eyeR * 0.25} fill="white" opacity={0.7} />
          <ellipse cx={cx + eyeSpread - eyeR * 0.25} cy={eyeY - eyeR * 0.3} rx={eyeR * 0.35} ry={eyeR * 0.25} fill="white" opacity={0.7} />

          {/* Eyebrows */}
          {browPath(illustration.browStyle, cx, eyeY - s * 0.06, eyeSpread, s, accentColor)}

          {/* Mouth */}
          {mouthPath(illustration.mouthStyle, cx, mouthY, s, accentColor)}

          {/* Shoulders */}
          {shoulderPath(illustration.shoulder, cx, s * 0.73, s, accentColor)}

          {/* Group icon hint */}
          <text
            x={s * 0.82} y={s * 0.2}
            textAnchor="middle"
            fill={accentColor}
            opacity={0.5}
            fontSize={s * 0.14}
          >
            {groupIcon(group)}
          </text>
        </svg>
      </div>

      {/* Type label */}
      <span
        className="mt-2 font-cinzel tracking-widest text-center"
        style={{ color: accentColor, fontSize: size === "sm" ? 10 : size === "md" ? 14 : 18 }}
      >
        {mbtiType}
      </span>
    </div>
  );
}

/* ── Helper renderers ── */

function eyeStyleRadius(style: string, s: number): number {
  switch (style) {
    case "round": return s * 0.032;
    case "almond": return s * 0.024;
    case "sharp": return s * 0.022;
    case "deep": return s * 0.026;
    default: return s * 0.028;
  }
}

function headShapeRx(shape: string, w: number): number {
  switch (shape) {
    case "round": return w * 1.0;
    case "oval": return w * 0.85;
    case "square": return w * 0.95;
    case "diamond": return w * 0.75;
    default: return w;
  }
}

function headShapeRy(shape: string, h: number): number {
  switch (shape) {
    case "diamond": return h * 0.85;
    default: return h;
  }
}

function browPath(style: string, cx: number, y: number, spread: number, s: number, color: string) {
  const w = s * 0.06;
  const left = cx - spread;
  const right = cx + spread;
  const sw = s * 0.01;
  let d = "";
  switch (style) {
    case "straight": d = `M${left - w},${y} L${left + w},${y + s * 0.005} M${right - w},${y + s * 0.005} L${right + w},${y}`; break;
    case "arched": d = `M${left - w},${y + s * 0.015} Q${left},${y - s * 0.02} ${left + w},${y + s * 0.015} M${right - w},${y + s * 0.015} Q${right},${y - s * 0.02} ${right + w},${y + s * 0.015}`; break;
    case "angled": d = `M${left - w},${y + s * 0.02} L${left + w * 0.3},${y - s * 0.01} L${left + w},${y + s * 0.005} M${right - w},${y + s * 0.005} L${right - w * 0.3},${y - s * 0.01} L${right + w},${y + s * 0.02}`; break;
    case "soft": d = `M${left - w},${y + s * 0.005} Q${left},${y - s * 0.008} ${left + w},${y + s * 0.005} M${right - w},${y + s * 0.005} Q${right},${y - s * 0.008} ${right + w},${y + s * 0.005}`; break;
  }
  return <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeOpacity={0.6} strokeLinecap="round" />;
}

function mouthPath(style: string, cx: number, y: number, s: number, color: string) {
  const w = s * 0.04;
  const sw = s * 0.01;
  let d = "";
  switch (style) {
    case "smile": d = `M${cx - w},${y} Q${cx},${y + s * 0.03} ${cx + w},${y}`; break;
    case "neutral": d = `M${cx - w},${y} L${cx + w},${y}`; break;
    case "slight": d = `M${cx - w},${y} Q${cx},${y + s * 0.015} ${cx + w},${y}`; break;
    case "open": d = `M${cx - w},${y} Q${cx},${y + s * 0.05} ${cx + w},${y}`; break;
  }
  return <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeOpacity={0.6} strokeLinecap="round" />;
}

function shoulderPath(style: string, cx: number, y: number, s: number, color: string) {
  const sw = s * 0.012;
  let w = s * 0.22;
  let d = "";
  switch (style) {
    case "broad": d = `M${cx - w},${y} Q${cx},${y - s * 0.04} ${cx + w},${y}`; break;
    case "narrow": w = s * 0.14; d = `M${cx - w},${y} Q${cx},${y + s * 0.02} ${cx + w},${y}`; break;
    case "relaxed": d = `M${cx - w},${y + s * 0.02} Q${cx},${y - s * 0.01} ${cx + w},${y + s * 0.02}`; break;
    case "lifted": d = `M${cx - w},${y} Q${cx},${y - s * 0.08} ${cx + w},${y}`; break;
  }
  return <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeOpacity={0.35} strokeLinecap="round" />;
}

function decorElements(shape: string, s: number, color: string) {
  const items: any[] = [];
  const n = 6;
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2;
    const r = s * 0.38;
    const x = s / 2 + Math.cos(angle) * r;
    const y = s / 2 + Math.sin(angle) * r;
    const k = `decor-${i}`;
    const sz = s * 0.025;
    switch (shape) {
      case "stars":
        items.push(<text key={k} x={x} y={y} textAnchor="middle" fill={color} opacity={0.35} fontSize={sz * 2.5}>✦</text>);
        break;
      case "circles":
        items.push(<circle key={k} cx={x} cy={y} r={sz * 0.8} fill={color} opacity={0.3} />);
        break;
      case "triangles":
        items.push(<polygon key={k} points={polyPts(x, y, sz)} fill={color} opacity={0.25} />);
        break;
      case "waves":
        items.push(<path key={k} d={`M${x - sz},${y} Q${x - sz * 0.5},${y - sz} ${x},${y} Q${x + sz * 0.5},${y + sz} ${x + sz},${y}`} fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={s * 0.005} />);
        break;
      case "diamonds":
        items.push(<polygon key={k} points={`${x},${y - sz} ${x + sz},${y} ${x},${y + sz} ${x - sz},${y}`} fill={color} opacity={0.25} />);
        break;
      case "lines":
        items.push(<line key={k} x1={x - sz} y1={y} x2={x + sz} y2={y} stroke={color} strokeOpacity={0.3} strokeWidth={s * 0.006} />);
        break;
    }
  }
  return items;
}

function polyPts(cx: number, cy: number, sz: number): string {
  return `${cx},${cy - sz} ${cx + sz},${cy + sz} ${cx - sz},${cy + sz}`;
}

function groupIcon(group: string): string {
  switch (group) {
    case "分析师": return "◆";
    case "外交官": return "✧";
    case "守护者": return "⬡";
    case "探险家": return "✦";
    default: return "●";
  }
}
