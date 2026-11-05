"use client";

import { useEffect, useRef } from "react";

type AmbientStar = {
  directionX: number;
  directionY: number;
  depth: number;
  speed: number;
  size: number;
  phase: number;
  isBlue: boolean;
};

function createAmbientStar(): AmbientStar {
  const angle = Math.random() * Math.PI * 2;
  return {
    directionX: Math.cos(angle),
    directionY: Math.sin(angle),
    depth: Math.random(),
    speed: 0.004 + Math.random() * 0.009,
    size: 0.65 + Math.random() * 1.1,
    phase: Math.random() * Math.PI * 2,
    isBlue: Math.random() < 0.24,
  };
}

export function GreekStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reduceMotionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = () =>
      reduceMotionPreference.matches || document.documentElement.dataset.accessibilityReduceMotion === "true";
    let reduceMotion = prefersReducedMotion();
    let width = 0;
    let height = 0;
    let ambientStars: AmbientStar[] = [];
    let animationFrame = 0;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      ambientStars = Array.from({ length: 145 }, createAmbientStar);
    };

    const draw = (now: number) => {
      reduceMotion = prefersReducedMotion();
      context.clearRect(0, 0, width, height);
      const centerX = width / 2;
      const centerY = height / 2;
      const travelRadius = Math.hypot(width, height) * 0.58;

      for (const star of ambientStars) {
        const previousDepth = star.depth;
        if (!reduceMotion) {
          star.depth += star.speed;
          if (star.depth > 1.04) {
            star.depth = 0.01 + Math.random() * 0.09;
          }
        }

        const endX = centerX + star.directionX * star.depth * travelRadius;
        const endY = centerY + star.directionY * star.depth * travelRadius;
        const tailDepth = reduceMotion ? star.depth : Math.max(0, star.depth - star.speed * 5);
        const startX = centerX + star.directionX * tailDepth * travelRadius;
        const startY = centerY + star.directionY * tailDepth * travelRadius;
        const flicker = 0.62 + (Math.sin(now * 0.0017 + star.phase) + 1) * 0.16;
        const brightness = flicker * (0.3 + star.depth * 0.7);
        const color = star.isBlue ? "125, 175, 255" : "255, 232, 178";

        if (!reduceMotion && star.depth > 0.1) {
          context.beginPath();
          context.moveTo(startX, startY);
          context.lineTo(endX, endY);
          context.strokeStyle = "rgba(" + color + ", " + (brightness * 0.6).toFixed(2) + ")";
          context.lineWidth = 0.35 + star.depth * 1.05;
          context.stroke();
        }

        context.beginPath();
        context.arc(endX, endY, star.size * (0.55 + star.depth * 0.9), 0, Math.PI * 2);
        context.fillStyle = "rgba(" + color + ", " + brightness.toFixed(2) + ")";
        context.fill();

        if (reduceMotion) star.depth = previousDepth;
      }

      if (!reduceMotion) animationFrame = window.requestAnimationFrame(draw);
    };

    const handleMotionPreference = () => {
      reduceMotion = prefersReducedMotion();
      window.cancelAnimationFrame(animationFrame);
      if (reduceMotion) draw(performance.now());
      else animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    if (reduceMotion) draw(performance.now());
    else animationFrame = window.requestAnimationFrame(draw);

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(resize)
      : null;
    resizeObserver?.observe(canvas);
    window.addEventListener("resize", resize);
    reduceMotionPreference.addEventListener("change", handleMotionPreference);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      reduceMotionPreference.removeEventListener("change", handleMotionPreference);
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
