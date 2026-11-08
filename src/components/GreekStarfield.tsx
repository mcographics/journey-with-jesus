"use client";

import { useEffect, useRef } from "react";
import { createSacredWordAnimation } from "./SacredWordAnimation";
import { chooseStarTint, starGlint, type StarTint } from "./starfieldPalette";

// Ported from Grace-Seek/ui/main_menu.py: Star and Starfield.
// Preserve projection, density, motion and twinkle, adding rare coloured glints.
type Star = { x3: number; y3: number; z3: number; r: number; a: number; s: number; phase: number; tint: StarTint };
function createStar(): Star {
  return { x3: Math.random() * 2 - 1, y3: Math.random() * 2 - 1,
    z3: 0.15 + Math.random() * 0.85, r: [0.45, 0.6, 0.8][Math.floor(Math.random() * 3)],
    a: 0.15 + Math.random() * 0.7, s: 0.01 + Math.random() * 0.04,
    phase: Math.random() * Math.PI * 2, tint: chooseStarTint(Math.random()) };
}

export function GreekStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const words = createSacredWordAnimation(context, canvas);
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
        // Most stars stay white. A few briefly flash sapphire or gold as
        // they move outwards; their glints trail toward the perspective centre.
        const glow = star.tint === "white" ? 0 : starGlint(time, star.phase);
        const glowing = !reduced() && star.z3 < 0.82 && glow > 0.32;
        const rgb = star.tint === "blue" ? "125,198,255" : "255,207,108";
        if (glowing) {
          const distance = Math.hypot(x - width / 2, y - height / 2) || 1;
          const trailLength = (3 + (1 - star.z3) * 13) * glow;
          context.save();
          context.strokeStyle = `rgba(${rgb},${(alpha * glow * 0.62).toFixed(3)})`;
          context.shadowColor = star.tint === "blue" ? "#4bafff" : "#ffd26e";
          context.shadowBlur = 6 + glow * 12;
          context.lineWidth = Math.max(0.7, radius * 0.75);
          context.lineCap = "round";
          context.beginPath();
          context.moveTo(
            x - (x - width / 2) / distance * trailLength,
            y - (y - height / 2) / distance * trailLength,
          );
          context.lineTo(x, y);
          context.stroke();
          context.restore();
        }
        context.beginPath();
        context.arc(x, y, radius * (glowing ? 1 + glow * 0.38 : 1), 0, Math.PI * 2);
        context.fillStyle = glowing
          ? `rgba(${rgb},${alpha})`
          : `rgba(255,255,255,${alpha})`;
        context.fill();
      }
    };
    const paintScene = () => {
      paint();
      if (!reduced()) words.draw(time, width, height);
    };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      stars = Array.from({ length: Math.min(1400, Math.max(500, Math.floor(width * height / 2600))) }, createStar);
      words.reset();
      paintScene();
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
            star.tint = chooseStarTint(Math.random());
          }
        }
      }
      paintScene();
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
    </div>
  );
}
