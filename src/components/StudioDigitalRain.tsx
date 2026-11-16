"use client";

import { useEffect, useRef } from "react";

type Stream = {
  x: number;
  y: number;
  speed: number;
  length: number;
  gold: boolean;
};

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-*/#@%$";
const glyph = () => alphabet[Math.floor(Math.random() * alphabet.length)];

export function StudioDigitalRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const ctx = context;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const spacing = 24;
    let width = 0;
    let height = 0;
    let streams: Stream[] = [];
    let frame = 0;
    let previousTime = 0;
    let lastPaint = 0;
    let nextGlitch = 0;
    let glitchUntil = 0;
    let glitchColumn = -1;
    let glitchOffset = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      streams = Array.from({ length: Math.max(1, Math.floor(width / spacing)) }, (_, index) => ({
        x: (index + 0.5) * spacing,
        y: Math.random() * (height + 380) - 190,
        speed: 68 + Math.random() * 145,
        length: 9 + Math.floor(Math.random() * 15),
        gold: Math.random() < 0.24,
      }));
      previousTime = 0;
      nextGlitch = performance.now() + 1900 + Math.random() * 2600;
    };

    const paint = (now: number, advance: boolean) => {
      const seconds = previousTime ? Math.min((now - previousTime) / 1000, 0.08) : 0;
      previousTime = now;
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#01030a";
      ctx.fillRect(0, 0, width, height);
      ctx.font = 'bold 18px ui-monospace, SFMono-Regular, Consolas, monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (advance && now >= nextGlitch) {
        glitchColumn = Math.floor(Math.random() * streams.length);
        glitchOffset = 1 + Math.floor(Math.random() * 4);
        glitchUntil = now + 360 + Math.random() * 240;
        nextGlitch = now + 2900 + Math.random() * 4600;
      }
      for (let column = 0; column < streams.length; column++) {
        const stream = streams[column];
        if (advance) stream.y += stream.speed * seconds;
        if (stream.y - stream.length * spacing > height) {
          stream.y = -Math.random() * 500;
          stream.gold = Math.random() < 0.24;
        }
        for (let offset = stream.length - 1; offset >= 0; offset--) {
          const y = stream.y - offset * spacing;
          if (y < -spacing || y > height + spacing) continue;
          const strength = Math.max(0.18, 1 - offset / stream.length);
          const glitch = advance && now < glitchUntil && column === glitchColumn && offset === glitchOffset;
          ctx.globalAlpha = glitch ? 1 : strength;
          ctx.shadowBlur = glitch ? 28 : offset === 0 ? 25 : 12;
          ctx.shadowColor = glitch ? "#ff243d" : stream.gold ? "#ffca49" : "#398cff";
          ctx.fillStyle = glitch
            ? "#ff4151"
            : offset === 0
              ? stream.gold ? "#fff3b9" : "#daf5ff"
              : stream.gold ? "#ffd151" : "#368dff";
          ctx.fillText(glyph(), stream.x + (glitch ? 3 : 0), y);
        }
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };

    const animate = (now: number) => {
      frame = window.requestAnimationFrame(animate);
      if (now - lastPaint < 32) return;
      lastPaint = now;
      paint(now, true);
    };
    const restart = () => {
      window.cancelAnimationFrame(frame);
      resize();
      paint(performance.now(), false);
      if (!prefersReducedMotion.matches) frame = window.requestAnimationFrame(animate);
    };

    window.addEventListener("resize", restart);
    prefersReducedMotion.addEventListener("change", restart);
    restart();
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", restart);
      prefersReducedMotion.removeEventListener("change", restart);
    };
  }, []);

  return <canvas className="studio-digital-rain" ref={canvasRef} aria-hidden="true" />;
}
