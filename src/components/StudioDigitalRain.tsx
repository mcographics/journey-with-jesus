"use client";

import { useEffect, useRef } from "react";
import {
  SCRIPTURAL_WORDS,
  WORD_DURATION_MS,
  getWordRevealState,
} from "@/lib/studio-word-reveal";

type Stream = {
  x: number;
  y: number;
  speed: number;
  length: number;
  gold: boolean;
};

type FeaturedWord = (typeof SCRIPTURAL_WORDS)[number] & {
  x: number;
  y: number;
  start: number;
  gold: boolean;
};

const latin = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-*/#@%$";
const greek = "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω";
const hebrew = "אבגדהוזחטיכלמנסעפצקרשת";
const symbols = [...latin, ...greek, ...hebrew];
const glyph = () => symbols[Math.floor(Math.random() * symbols.length)];

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
    let nextWord = 0;
    let featured: FeaturedWord | null = null;

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
      featured = null;
      nextGlitch = performance.now() + 1900 + Math.random() * 2600;
      nextWord = performance.now() + 4500 + Math.random() * 3000;
    };

    const paint = (now: number, advance: boolean) => {
      const seconds = previousTime ? Math.min((now - previousTime) / 1000, 0.08) : 0;
      previousTime = now;
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#01030a";
      ctx.fillRect(0, 0, width, height);
      ctx.font = 'bold 18px "Segoe UI", "Noto Sans Hebrew", ui-monospace, monospace';
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

      /* Feature one translated biblical-language word at a time, without
         disrupting the falling code or covering the centered login card. */
      if (advance && !featured && now >= nextWord) {
        const word = SCRIPTURAL_WORDS[Math.floor(Math.random() * SCRIPTURAL_WORDS.length)];
        const side = Math.random() < 0.5 ? -1 : 1;
        const positionX = width >= 980
          ? width / 2 + side * (width * (0.31 + Math.random() * 0.10))
          : width * (0.18 + Math.random() * 0.64);
        featured = {
          ...word,
          x: positionX,
          y: height * (0.22 + Math.random() * 0.55),
          start: now,
          gold: Math.random() < 0.48,
        };
        nextWord = now + 10500 + Math.random() * 4500;
      }

      if (featured) {
        const state = getWordRevealState(now - featured.start);
        if (state.stage === "done" || now - featured.start >= WORD_DURATION_MS) {
          featured = null;
        } else {
          ctx.save();
          ctx.globalAlpha = state.alpha;
          ctx.font = `bold ${width < 480 ? 23 : 28}px "Segoe UI", "Noto Sans Hebrew", "Noto Sans", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.shadowBlur = 24;
          ctx.shadowColor = featured.gold ? "#ffd151" : "#3198ff";
          ctx.fillStyle = featured.gold ? "#fff1a3" : "#e1f5ff";
          const maxTextWidth = Math.max(1, width - 24);
          const fullTextWidth = Math.min(
            Math.max(ctx.measureText(featured.text).width, ctx.measureText(featured.english).width),
            maxTextWidth,
          );
          const halfWidth = fullTextWidth / 2;
          const safeX = Math.min(Math.max(featured.x, halfWidth + 12), width - halfWidth - 12);
          const safeY = Math.min(Math.max(featured.y, 30), Math.max(30, height - 30));
          const drawLabel = (text: string, rtl: boolean) => {
            ctx.direction = rtl ? "rtl" : "ltr";
            ctx.fillText(text, safeX, safeY, maxTextWidth);
          };

          if (state.stage === "original") {
            drawLabel(featured.text, Boolean(featured.hebrew));
          } else if (state.stage === "english") {
            drawLabel(featured.english, false);
          } else {
            // The advancing light converts each covered portion into English.
            const left = safeX - halfWidth - 8;
            const span = fullTextWidth + 16;
            const sweepX = left + span * state.sweepProgress;

            ctx.save();
            ctx.beginPath();
            ctx.rect(left, safeY - 36, Math.max(0, sweepX - left), 72);
            ctx.clip();
            drawLabel(featured.english, false);
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            ctx.rect(sweepX, safeY - 36, Math.max(0, left + span - sweepX), 72);
            ctx.clip();
            drawLabel(featured.text, Boolean(featured.hebrew));
            ctx.restore();

            // A soft traveling glint reads as illumination, not a harsh flash.
            ctx.save();
            ctx.globalAlpha = state.alpha * 0.85;
            ctx.shadowBlur = 0;
            const glow = ctx.createRadialGradient(sweepX, safeY, 0, sweepX, safeY, 42);
            glow.addColorStop(0, "rgba(255,255,238,.85)");
            glow.addColorStop(0.24, featured.gold ? "rgba(255,207,103,.45)" : "rgba(97,180,255,.45)");
            glow.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = glow;
            ctx.fillRect(sweepX - 42, safeY - 42, 84, 84);
            ctx.strokeStyle = featured.gold ? "#fff2bf" : "#d6f2ff";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(sweepX, safeY - 16);
            ctx.lineTo(sweepX, safeY + 16);
            ctx.moveTo(sweepX - 9, safeY);
            ctx.lineTo(sweepX + 9, safeY);
            ctx.stroke();
            ctx.restore();
          }
          ctx.restore();
        }
      }
      ctx.direction = "ltr";
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
