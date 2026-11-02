"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

type MastheadEasterEggProps = {
  children: ReactNode;
  imageSrc: string;
};

type TrailBubble = {
  x: number;
  y: number;
  time: number;
};

const TRAIL_LIFETIME = 680;

export default function MastheadEasterEgg({ children, imageSrc }: MastheadEasterEggProps) {
  const mastheadRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const masthead = mastheadRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!masthead || !canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const mask = document.createElement("canvas");
    const maskContext = mask.getContext("2d");
    if (!maskContext) return;

    const revealImage = new window.Image();
    let imageLoaded = false;
    let pointer: { x: number; y: number } | null = null;
    let trail: TrailBubble[] = [];
    let frame = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let lastTrailAt = 0;
    let disposed = false;

    const resize = () => {
      const bounds = masthead.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      mask.width = canvas.width;
      mask.height = canvas.height;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      maskContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      queueFrame();
    };

    const clear = () => {
      pointer = null;
      trail = [];
      lastTrailAt = 0;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      context.clearRect(0, 0, width, height);
      maskContext.clearRect(0, 0, width, height);
    };

    const drawSoftBubble = (x: number, y: number, radius: number, strength: number) => {
      const gradient = maskContext.createRadialGradient(x, y, radius * 0.12, x, y, radius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${strength})`);
      gradient.addColorStop(0.72, `rgba(255, 255, 255, ${strength * 0.94})`);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      maskContext.fillStyle = gradient;
      maskContext.beginPath();
      maskContext.arc(x, y, radius, 0, Math.PI * 2);
      maskContext.fill();
    };

    const render = (now: number) => {
      frame = 0;
      if (disposed || !pointer || !imageLoaded || width <= 0 || height <= 0) return;

      context.clearRect(0, 0, width, height);
      maskContext.clearRect(0, 0, width, height);
      maskContext.globalCompositeOperation = "source-over";

      const bubbleRadius = Math.max(84, Math.min(138, width * 0.055));
      for (const bubble of trail) {
        const age = now - bubble.time;
        if (age < 0 || age >= TRAIL_LIFETIME) continue;
        const remaining = 1 - age / TRAIL_LIFETIME;
        drawSoftBubble(bubble.x, bubble.y, 22 + remaining * 34, 0.3 * remaining);
      }
      drawSoftBubble(pointer.x, pointer.y, bubbleRadius, 0.96);

      context.drawImage(revealImage, 0, 0, width, height);
      context.globalCompositeOperation = "destination-in";
      context.drawImage(mask, 0, 0, width, height);
      context.globalCompositeOperation = "source-over";

      const halo = context.createRadialGradient(
        pointer.x,
        pointer.y,
        bubbleRadius * 0.86,
        pointer.x,
        pointer.y,
        bubbleRadius * 1.1,
      );
      halo.addColorStop(0, "rgba(255, 237, 190, 0.2)");
      halo.addColorStop(0.45, "rgba(255, 229, 167, 0.38)");
      halo.addColorStop(1, "rgba(255, 229, 167, 0)");
      context.strokeStyle = halo;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(pointer.x, pointer.y, bubbleRadius * 0.99, 0, Math.PI * 2);
      context.stroke();

      trail = trail.filter((bubble) => now - bubble.time < TRAIL_LIFETIME);
      if (trail.length > 0) queueFrame();
    };

    function queueFrame() {
      if (!frame && !disposed) frame = requestAnimationFrame(render);
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;

      const bounds = masthead.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) {
        if (pointer) clear();
        return;
      }

      const now = performance.now();
      if (pointer) {
        const distance = Math.hypot(x - pointer.x, y - pointer.y);
        if (distance >= 13 || now - lastTrailAt >= 42) {
          trail.push({ x: pointer.x, y: pointer.y, time: now });
          if (trail.length > 24) trail.shift();
          lastTrailAt = now;
        }
      } else if (!imageLoaded) {
        revealImage.onload = () => {
          imageLoaded = true;
          queueFrame();
        };
        revealImage.src = imageSrc;
      }

      pointer = { x, y };
      queueFrame();
    };

    const onWindowBlur = () => clear();
    revealImage.decoding = "async";
    const observer = new ResizeObserver(resize);
    observer.observe(masthead);
    resize();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", onWindowBlur);

    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onWindowBlur);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [imageSrc]);

  return (
    <div className="home-masthead" ref={mastheadRef}>
      {children}
      <canvas aria-hidden="true" className="masthead-easter-egg-canvas" ref={canvasRef} />
    </div>
  );
}
