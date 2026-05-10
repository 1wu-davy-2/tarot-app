"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  twinklePhase: number;
  hue: number;
}

export function MysticBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stars: Star[] = [];
    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createStars = () => {
      const count = Math.floor((canvas.width * canvas.height) / 3000);
      stars = Array.from({ length: count }, (): Star => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.8 + 0.3,
        opacity: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.3 + 0.05,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.08 ? 42 + Math.random() * 10 : 260 + Math.random() * 40,
      }));
    };

    const drawNebula = () => {
      const cx = canvas.width * 0.25;
      const cy = canvas.height * 0.3;
      const r = Math.min(canvas.width, canvas.height) * 0.4;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, "rgba(45, 27, 105, 0.15)");
      grad.addColorStop(0.4, "rgba(45, 27, 105, 0.06)");
      grad.addColorStop(0.7, "rgba(26, 15, 46, 0.04)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx2 = canvas.width * 0.75;
      const cy2 = canvas.height * 0.6;
      const grad2 = ctx.createRadialGradient(cx2, cy2, 0, cx2, cy2, r * 0.8);
      grad2.addColorStop(0, "rgba(192, 132, 252, 0.08)");
      grad2.addColorStop(0.5, "rgba(192, 132, 252, 0.03)");
      grad2.addColorStop(1, "transparent");
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawStars = () => {
      for (const star of stars) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.4 + 0.6;
        const alpha = star.opacity * twinkle;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${star.hue}, 70%, 80%, ${alpha})`;
        ctx.fill();

        if (star.size > 1.2 && twinkle > 0.8) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${star.hue}, 70%, 80%, ${alpha * 0.15})`;
          ctx.fill();
        }
      }
    };

    const animate = () => {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawNebula();
      drawStars();
      animationId = requestAnimationFrame(animate);
    };

    resize();
    createStars();
    animate();

    window.addEventListener("resize", () => {
      resize();
      createStars();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
