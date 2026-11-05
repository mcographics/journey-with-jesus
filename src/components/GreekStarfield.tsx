"use client";

import { useEffect, useRef } from "react";

const GREEK_TEXT = "Ἐν ἀρχῇ ἦν ὁ λόγος";

type Particle = {
  fromX: number;
  fromY: number;
  targetX: number;
  targetY: number;
  size: number;
  phase: number;
};

type AmbientStar = {
  x: number;
  y: number;
  size: number;
  phase: number;
};

export function GreekStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let ambientStars: AmbientStar[] = [];
    let animationFrame = 0;
    let animationStart = performance.now();

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const mask = document.createElement("canvas");
      mask.width = Math.ceil(width);
      mask.height = 92;
      const maskContext = mask.getContext("2d", { willReadFrequently: true });
      if (!maskContext) return;

      let fontSize = Math.min(44, Math.max(22, width * 0.036));
      maskContext.font = "600 " + fontSize + "px Georgia, 'Times New Roman', serif";
      const maxTextWidth = Math.max(180, width - 44);
      const measured = maskContext.measureText(GREEK_TEXT).width;
      if (measured > maxTextWidth) {
        fontSize *= maxTextWidth / measured;
        maskContext.font = "600 " + fontSize + "px Georgia, 'Times New Roman', serif";
      }
      maskContext.fillStyle = "#fff";
      maskContext.textAlign = "center";
      maskContext.textBaseline = "middle";
      maskContext.fillText(GREEK_TEXT, width / 2, 46);

      const pixels = maskContext.getImageData(0, 0, mask.width, mask.height).data;
      const textCenterY = Math.max(142, Math.min(height * 0.15, 170));
      const targets: Array<{ x: number; y: number }> = [];
      const stride = 4;
      for (let y = 0; y < mask.height; y += stride) {
        for (let x = 0; x < mask.width; x += stride) {
          if (pixels[(y * mask.width + x) * 4 + 3] > 100) {
            targets.push({ x, y: textCenterY + y - 46 });
          }
        }
      }

      particles = targets.map((point) => ({
        fromX: Math.random() * width,
        fromY: Math.random() * height,
        targetX: point.x,
        targetY: point.y,
        size: 1 + Math.random() * 1.35,
        phase: Math.random() * Math.PI * 2,
      }));
      ambientStars = Array.from(
        { length: Math.round(Math.min(150, Math.max(80, (width * height) / 8500))) },
        () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 0.35 + Math.random() * 1.2,
          phase: Math.random() * Math.PI * 2,
        }),
      );
      animationStart = performance.now();
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, width, height);

      for (const star of ambientStars) {
        const twinkle = reduceMotion ? 0.5 : 0.35 + (Math.sin(now * 0.001 + star.phase) + 1) * 0.24;
        context.fillStyle = "rgba(190, 211, 245, " + twinkle.toFixed(2) + ")";
        context.beginPath();
        context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        context.fill();
      }

      const progress = reduceMotion ? 1 : Math.min(1, (now - animationStart) / 2600);
      for (let index = 0; index < particles.length; index += 1) {
        const star = particles[index];
        const stagger = reduceMotion ? 1 : Math.min(1, Math.max(0, (progress - (index % 13) * 0.006) / 0.94));
        const settle = 1 - Math.pow(1 - stagger, 3);
        const drift = progress >= 1 && !reduceMotion ? Math.sin(now * 0.0012 + star.phase) * 0.45 : 0;
        const x = star.fromX + (star.targetX - star.fromX) * settle + drift;
        const y = star.fromY + (star.targetY - star.fromY) * settle + drift;
        const alpha = 0.52 + (Math.sin(now * 0.0015 + star.phase) + 1) * 0.16;
        context.fillStyle = index % 6 === 0
          ? "rgba(117, 169, 255, " + alpha.toFixed(2) + ")"
          : "rgba(255, 229, 164, " + alpha.toFixed(2) + ")";
        context.beginPath();
        context.arc(x, y, star.size, 0, Math.PI * 2);
        context.fill();
      }

      if (!reduceMotion) animationFrame = window.requestAnimationFrame(draw);
    };

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          resize();
          if (reduceMotion) draw(performance.now());
        })
      : null;

    resize();
    if (reduceMotion) draw(performance.now());
    else animationFrame = window.requestAnimationFrame(draw);
    resizeObserver?.observe(canvas);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div aria-hidden="true" className="kerygma-starfield">
      <canvas ref={canvasRef} />
    </div>
  );
}
