"use client";

import { useEffect, useRef } from "react";

// Ported from Grace-Seek/ui/main_menu.py: Star and Starfield.
// Preserve the source projection, density, speed, white dots, and twinkle.
type Star = { x3: number; y3: number; z3: number; r: number; a: number; s: number; phase: number };
function createStar(): Star {
  return { x3: Math.random() * 2 - 1, y3: Math.random() * 2 - 1,
    z3: 0.15 + Math.random() * 0.85, r: [0.45, 0.6, 0.8][Math.floor(Math.random() * 3)],
    a: 0.15 + Math.random() * 0.7, s: 0.01 + Math.random() * 0.04, phase: Math.random() * Math.PI * 2 };
}

export function GreekStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced = () => preference.matches || document.documentElement.dataset.accessibilityReduceMotion === "true";
    let width = 1, height = 1, time = 0, last = 0, frame = 0;
    let stars: Star[] = [];
    const paint = () => {
      context.fillStyle = "#000";
      context.fillRect(0, 0, width, height);
      const scale = Math.min(width, height) * 0.55;
      for (const star of stars) {
        const x = width / 2 + star.x3 / star.z3 * scale;
        const y = height / 2 + star.y3 / star.z3 * scale;
        const twinkle = Math.sin(time * 1.3 + y * 0.01 + star.phase) * 0.12;
        const alpha = Math.floor(Math.max(0.05, Math.min(1, star.a + twinkle)) * 255) / 255;
        const radius = star.r * Math.max(0.6, Math.min(2.5, 1 / star.z3));
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(255,255,255,${alpha})`;
        context.fill();
      }
    };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      stars = Array.from({ length: Math.min(1400, Math.max(500, Math.floor(width * height / 2600))) }, createStar);
      paint();
    };
    const draw = (now: number) => {
      // Source updates every 16 ms; elapsed time keeps that speed on any refresh rate.
      const steps = last ? Math.min((now - last) / 16, 4) : 1;
      last = now;
      if (!reduced()) {
        time += steps * 0.016;
        const scale = Math.min(width, height) * 0.55;
        for (const star of stars) {
          star.z3 -= (0.0015 + star.s * 0.003) * steps;
          const x = width / 2 + star.x3 / star.z3 * scale;
          const y = height / 2 + star.y3 / star.z3 * scale;
          if (star.z3 <= 0.08 || x < -20 || x > width + 20 || y < -20 || y > height + 20) {
            star.z3 = 1; star.x3 = Math.random() * 2 - 1; star.y3 = Math.random() * 2 - 1;
          }
        }
      }
      paint();
      if (!reduced()) frame = requestAnimationFrame(draw);
    };
    const restart = () => {
      cancelAnimationFrame(frame); last = 0;
      if (reduced()) paint(); else frame = requestAnimationFrame(draw);
    };
    const observer = new ResizeObserver(resize);
    const motionObserver = new MutationObserver(restart);
    resize(); restart();
    observer.observe(canvas);
    motionObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-accessibility-reduce-motion"] });
    preference.addEventListener("change", restart);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); motionObserver.disconnect();
      preference.removeEventListener("change", restart);
    };
  }, []);

  return (
    <div aria-hidden="true" className="kerygma-starfield">
      <canvas ref={canvasRef} />
      <svg
        className="kerygma-starfield-scripture"
        preserveAspectRatio="xMidYMid meet"
        viewBox="0 0 1000 100"
      >
        <defs>
          <pattern height="22" id="kerygma-scripture-stars" patternUnits="userSpaceOnUse" width="24">
            <circle cx="3" cy="4" fill="#fff0bf" r="2.3" />
            <circle cx="14" cy="8" fill="#8eb8ff" r="1.6" />
            <circle cx="8" cy="18" fill="#fff" r="1.35" />
            <circle cx="21" cy="17" fill="#e5c66f" r="1.9" />
          </pattern>
          <filter height="160%" id="kerygma-scripture-glow" width="120%" x="-10%" y="-30%">
            <feGaussianBlur result="softGlow" stdDeviation="2.1" />
            <feMerge>
              <feMergeNode in="softGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <text
          fill="url(#kerygma-scripture-stars)"
          filter="url(#kerygma-scripture-glow)"
          stroke="#f2d890"
          strokeOpacity="0.72"
          strokeWidth="0.8"
          paintOrder="stroke fill"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="68"
          fontWeight="600"
          textAnchor="middle"
          x="500"
          y="66"
        >
          Ἐν ἀρχῇ ἦν ὁ λόγος
        </text>
      </svg>
    </div>
  );
}
