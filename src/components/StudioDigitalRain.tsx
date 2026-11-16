"use client";

import { useEffect, useRef } from "react";
import { getWordRevealFrame, scriptureWords, wordRevealDurationMs, type ScriptureWord } from "@/lib/studio-digital-rain-words";

type Stream = {
  x: number;
  y: number;
  speed: number;
  length: number;
  gold: boolean;
};

type FeaturedWord = ScriptureWord & {
  x: number;
  y: number;
  start: number;
  end: number;
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

      /* Spotlight words are infrequent to preserve the descending code.
         A light sweep actually replaces the ancient characters with English. */
      if (advance && now >= nextWord && !featured) {
        const word = scriptureWords[Math.floor(Math.random() * scriptureWords.length)];
        const side = Math.random() < 0.5 ? -1 : 1;
        const positionX = width >= 980
          ? width / 2 + side * (width * (0.31 + Math.random() * 0.10))
          : width * (0.18 + Math.random() * 0.64);
        featured = {
          ...word,
          x: positionX,
          y: height * (0.22 + Math.random() * 0.55),
          start: now,
          end: now + wordRevealDurationMs,
          gold: Math.random() < 0.48,
        };
        nextWord = featured.end + 3100 + Math.random() * 4200;
      }

      if (featured && now < featured.end) {
        const word = featured;
        const reveal = getWordRevealFrame(now - word.start);
        const fontFamily = '"Segoe UI", "Noto Sans Hebrew", "Noto Sans", sans-serif';
        let fontSize = width < 550 ? 24 : 27;
        ctx.font = "bold " + fontSize + "px " + fontFamily;
        const initialWidth = Math.max(
          ctx.measureText(word.original).width,
          ctx.measureText(word.english).width,
        );
        // Keep longer English translations inside the canvas on narrow phones.
        fontSize = Math.max(15, Math.min(fontSize, Math.floor(fontSize * Math.min(1, (width - 30) / Math.max(1, initialWidth)))));
        ctx.font = "bold " + fontSize + "px " + fontFamily;
        const textWidth = Math.max(
          ctx.measureText(word.original).width,
          ctx.measureText(word.english).width,
        );
        const halfWidth = textWidth / 2;
        const safeX = Math.min(Math.max(word.x, halfWidth + 15), Math.max(halfWidth + 15, width - halfWidth - 15));
        const left = safeX - halfWidth - 5;
        const right = safeX + halfWidth + 5;
        const hue = word.gold ? "#fff1a3" : "#e1f5ff";
        const glow = word.gold ? "#ffd151" : "#3198ff";
        const drawClippedWord = (text: string, rtl: boolean, startX: number, endX: number) => {
          if (endX <= startX) return;
          ctx.save();
          ctx.beginPath();
          ctx.rect(startX, word.y - fontSize * 1.25, endX - startX, fontSize * 2.5);
          ctx.clip();
          ctx.globalAlpha = reveal.opacity;
          ctx.font = "bold " + fontSize + "px " + fontFamily;
          ctx.direction = rtl ? "rtl" : "ltr";
          ctx.textAlign = "center";
          ctx.shadowBlur = 24;
          ctx.shadowColor = glow;
          ctx.fillStyle = hue;
          ctx.fillText(text, safeX, word.y);
          ctx.restore();
        };

        if (reveal.stage === "original") {
          drawClippedWord(word.original, Boolean(word.hebrew), left, right);
        } else if (reveal.stage === "english") {
          drawClippedWord(word.english, false, left, right);
        } else {
          const sweepX = left + (right - left) * reveal.sweepProgress;
          drawClippedWord(word.original, Boolean(word.hebrew), sweepX, right);
          drawClippedWord(word.english, false, left, sweepX);
          // A narrow luminous band and crossing rays act like light
          // passing through the letters to reveal their English meaning.
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = reveal.opacity * (0.6 + 0.35 * Math.sin(Math.PI * reveal.sweepProgress));
          const ray = ctx.createLinearGradient(sweepX - 32, word.y, sweepX + 32, word.y);
          ray.addColorStop(0, "rgba(70,155,255,0)");
          ray.addColorStop(0.45, "rgba(175,223,255,.23)");
          ray.addColorStop(0.5, "rgba(255,251,222,.8)");
          ray.addColorStop(0.55, "rgba(175,223,255,.23)");
          ray.addColorStop(1, "rgba(70,155,255,0)");
          ctx.fillStyle = ray;
          ctx.fillRect(sweepX - 32, word.y - fontSize * 1.1, 64, fontSize * 2.2);
          ctx.shadowBlur = 19;
          ctx.shadowColor = "#f4ebbe";
          ctx.strokeStyle = "rgba(255,250,221,.9)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(sweepX, word.y - fontSize * 1.14);
          ctx.lineTo(sweepX, word.y + fontSize * 1.14);
          ctx.moveTo(sweepX - 12, word.y);
          ctx.lineTo(sweepX + 12, word.y);
          ctx.stroke();
          ctx.restore();
        }
      } else if (featured && now >= featured.end) {
        featured = null;
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
