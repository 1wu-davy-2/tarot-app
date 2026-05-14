"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil } from "lucide-react";

export type LayoutType = "linear" | "cross" | "circle" | "triangle" | "star" | "freeform";

export interface LayoutNode {
  x: number;  // 0-100 percentage
  y: number;  // 0-100 percentage
}

export interface PositionLabel {
  label: string;
  sublabel: string;
  desc: string;
}

// Preset layouts with default node positions
export const SPREAD_LAYOUTS: Record<LayoutType, LayoutNode[]> = {
  linear: [
    { x: 15, y: 50 }, { x: 50, y: 50 }, { x: 85, y: 50 },
  ],
  cross: [
    { x: 50, y: 8 }, { x: 8, y: 50 }, { x: 50, y: 50 }, { x: 92, y: 50 }, { x: 50, y: 92 },
  ],
  circle: [
    { x: 50, y: 5 }, { x: 88, y: 28 }, { x: 88, y: 72 },
    { x: 50, y: 95 }, { x: 12, y: 72 }, { x: 12, y: 28 },
  ],
  triangle: [
    { x: 50, y: 5 }, { x: 10, y: 88 }, { x: 90, y: 88 },
  ],
  star: [
    { x: 50, y: 2 }, { x: 20, y: 30 }, { x: 92, y: 35 },
    { x: 5, y: 70 }, { x: 75, y: 75 }, { x: 50, y: 98 }, { x: 25, y: 75 },
  ],
  freeform: [],
};

export const LAYOUT_LABELS: Record<LayoutType, { name: string; icon: string; cardCount: number }> = {
  linear: { name: "线性排列", icon: "→", cardCount: 3 },
  cross: { name: "十字阵", icon: "✚", cardCount: 5 },
  circle: { name: "圆环阵", icon: "○", cardCount: 6 },
  triangle: { name: "三角阵", icon: "△", cardCount: 3 },
  star: { name: "七星阵", icon: "✶", cardCount: 7 },
  freeform: { name: "自由布局", icon: "✦", cardCount: 0 },
};

interface SpreadLayoutPreviewProps {
  layoutType: LayoutType;
  nodes: LayoutNode[];
  labels: PositionLabel[];
  editingNode: number | null;
  onEditNode: (index: number) => void;
  onUpdateLabel: (index: number, label: PositionLabel) => void;
}

export function SpreadLayoutPreview({
  layoutType,
  nodes,
  labels,
  editingNode,
  onEditNode,
  onUpdateLabel,
}: SpreadLayoutPreviewProps) {
  // SVG viewBox: 100x100 coordinate system
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Aspect ratio container */}
      <div className="relative w-full" style={{ paddingBottom: "85%" }}>
        <svg
          viewBox="0 0 100 85"
          className="absolute inset-0 w-full h-full"
          style={{ background: "rgba(255,255,255,0.015)", borderRadius: "1rem" }}
        >
          {/* Decorative ring */}
          <circle cx="50" cy="42" r="48" fill="none" stroke="rgba(212,168,83,0.08)" strokeWidth="0.3" />
          <circle cx="50" cy="42" r="38" fill="none" stroke="rgba(192,132,252,0.06)" strokeWidth="0.2" strokeDasharray="1 2" />

          {/* Connecting lines */}
          {nodes.length > 1 && (
            <g>
              {nodes.slice(0, -1).map((node, i) => (
                <line
                  key={`line-${i}`}
                  x1={node.x} y1={node.y}
                  x2={nodes[i + 1].x} y2={nodes[i + 1].y}
                  stroke="rgba(212,168,83,0.25)"
                  strokeWidth="0.3"
                  strokeDasharray="1 1"
                />
              ))}
              {/* Connect last to first for circle/triangle */}
              {(layoutType === "circle" || layoutType === "triangle" || layoutType === "star") && nodes.length > 2 && (
                <line
                  x1={nodes[nodes.length - 1].x} y1={nodes[nodes.length - 1].y}
                  x2={nodes[0].x} y2={nodes[0].y}
                  stroke="rgba(212,168,83,0.25)"
                  strokeWidth="0.3"
                  strokeDasharray="1 1"
                />
              )}
            </g>
          )}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const label = labels[i];
            const isEditing = editingNode === i;
            const hasLabel = label && label.label.trim();

            return (
              <g key={`node-${i}`}>
                {/* Pulse ring */}
                <circle
                  cx={node.x} cy={node.y} r="5"
                  fill="none"
                  stroke={hasLabel ? "rgba(212,168,83,0.35)" : "rgba(192,132,252,0.2)"}
                  strokeWidth="0.3"
                />
                {/* Node circle */}
                <circle
                  cx={node.x} cy={node.y} r="3.5"
                  fill={hasLabel ? "rgba(212,168,83,0.2)" : "rgba(192,132,252,0.1)"}
                  stroke={isEditing ? "rgba(212,168,83,0.8)" : hasLabel ? "rgba(212,168,83,0.5)" : "rgba(192,132,252,0.35)"}
                  strokeWidth="0.6"
                  className="cursor-pointer transition-colors hover:stroke-[#d4a853]"
                  onClick={() => onEditNode(i)}
                />
                {/* Node number */}
                <text
                  x={node.x} y={node.y + 0.8}
                  textAnchor="middle"
                  fill={hasLabel ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)"}
                  fontSize="2.8"
                  fontWeight="bold"
                  className="pointer-events-none select-none"
                >
                  {i + 1}
                </text>
                {/* Label below node */}
                {hasLabel && !isEditing && (
                  <text
                    x={node.x} y={node.y + 7}
                    textAnchor="middle"
                    fill="rgba(212,168,83,0.8)"
                    fontSize="2.2"
                    className="pointer-events-none select-none"
                  >
                    {label.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ── Layout type selector ──

interface LayoutSelectorProps {
  selected: LayoutType;
  onSelect: (type: LayoutType) => void;
}

export function LayoutSelector({ selected, onSelect }: LayoutSelectorProps) {
  const types = Object.keys(LAYOUT_LABELS) as LayoutType[];

  return (
    <div className="grid grid-cols-3 gap-2">
      {types.map((type) => {
        const meta = LAYOUT_LABELS[type];
        const isSelected = selected === type;
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center ${
              isSelected
                ? "border-mystic-gold/40 bg-mystic-gold/10 text-mystic-gold"
                : "border-mystic-purple/20 bg-mystic-purple/5 text-mystic-rose/65 hover:border-mystic-rose/30"
            }`}
          >
            <span className="text-lg">{meta.icon}</span>
            <span className="text-[10px]">{meta.name}</span>
            <span className="text-[9px] opacity-45">{meta.cardCount}张</span>
          </button>
        );
      })}
    </div>
  );
}
