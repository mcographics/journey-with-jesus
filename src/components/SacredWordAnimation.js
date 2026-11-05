// Particle word formation ported from Grace-Seek/src/VisualComponents.jsx.
// Original target sampling, shuffled deck, morph timings, light sweep, and release.
import { sacredStarWords } from "./sacredStarWords";
function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(items, seed) {
  const copy = [...items];
  const random = seededRandom(seed);
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}


export function createSacredWordAnimation(context, canvas) {
    let t = 0;
    const currentBibleMode = false, returning = false;
    let wordTargets = [], meaningTargets = [], wordStars = [];
    let wordStartAt = 3.5, wordTransformAt = 0, wordHoldUntil = 0, wordReleaseUntil = 0;
    let wordActive = false, wordBounds = null, currentWordIsYeshua = false;
    let wordIndex = 0, wordDeck = [], lastWordEntry = null;
    const reshuffleWordDeck = () => {
      const random = seededRandom(911 + wordIndex * 41);
      wordDeck = [...sacredStarWords];
      for (let index = wordDeck.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [wordDeck[index], wordDeck[swapIndex]] = [
          wordDeck[swapIndex],
          wordDeck[index],
        ];
      }
      if (
        lastWordEntry &&
        wordDeck[0] === lastWordEntry &&
        wordDeck.length > 1
      ) {
        [wordDeck[0], wordDeck[1]] = [wordDeck[1], wordDeck[0]];
      }
    };

    const nextWordEntry = () => {
      if (!wordDeck.length) reshuffleWordDeck();
      const entry = wordDeck.shift();
      lastWordEntry = entry;
      return entry;
    };


    const wordFontFor = (script, size) => {
      if (script === "hebrew")
        return `700 ${size}px "SBL Hebrew", "Times New Roman", serif`;
      if (script === "greek")
        return `700 ${size}px "SBL Greek", "Times New Roman", serif`;
      return `700 ${size}px "Grace Garamond", Georgia, serif`;
    };

    const boundsForTargets = (targets) => {
      if (!targets.length) return null;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const [x, y] of targets) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
      return { minX, minY, maxX, maxY };
    };

    // Keep formations in the gateway's open space above the logo.
    const safeWordPlacement = (width, height) => {
      const content = document.querySelector(".kerygma-gateway-content");
      const top = content ? content.getBoundingClientRect().top - canvas.getBoundingClientRect().top : height * 0.5;
      return { x: width / 2, y: Math.max(115, Math.min(height * 0.24, top - 90)) };
    };

    const wordPointTargets = (
      entry,
      width,
      height,
      variant = "sacred",
      placement = null,
    ) => {
      const offscreen = document.createElement("canvas");
      const text = variant === "meaning" ? entry.meaning : entry.text;
      const script = variant === "meaning" ? "english" : entry.script;
      const maxWidth = Math.min(
        width * (width < 700 ? 0.9 : variant === "meaning" ? 0.5 : 0.44),
        variant === "meaning" ? 760 : 720,
      );
      const maxHeight = Math.min(height * 0.14, 150);
      offscreen.width = Math.max(1, Math.floor(maxWidth));
      offscreen.height = Math.max(110, Math.floor(maxHeight));
      const offscreenContext = offscreen.getContext("2d", {
        willReadFrequently: true,
      });
      if (!offscreenContext) return [];
      let fontSize = Math.min(
        variant === "meaning" ? 62 : 82,
        Math.max(32, offscreen.height * (variant === "meaning" ? 0.48 : 0.62)),
      );
      offscreenContext.textAlign = "center";
      offscreenContext.textBaseline = "middle";
      offscreenContext.direction = script === "hebrew" ? "rtl" : "ltr";
      offscreenContext.fillStyle = "#fff";
      while (fontSize > 26) {
        offscreenContext.font = wordFontFor(script, fontSize);
        if (offscreenContext.measureText(text).width <= offscreen.width * 0.92)
          break;
        fontSize -= 4;
      }
      offscreenContext.clearRect(0, 0, offscreen.width, offscreen.height);
      offscreenContext.font = wordFontFor(script, fontSize);
      offscreenContext.fillText(
        text,
        offscreen.width / 2,
        offscreen.height / 2,
      );
      const data = offscreenContext.getImageData(
        0,
        0,
        offscreen.width,
        offscreen.height,
      ).data;
      const step = Math.max(2, Math.floor(fontSize / 18));
      const center = placement || { x: width / 2, y: height * 0.28 };
      const offsetX = center.x - offscreen.width / 2;
      const offsetY = center.y - offscreen.height / 2;
      const targets = [];
      for (let y = 0; y < offscreen.height; y += step) {
        for (let x = 0; x < offscreen.width; x += step) {
          const alpha = data[(y * offscreen.width + x) * 4 + 3];
          if (alpha > 64) targets.push([offsetX + x, offsetY + y]);
        }
      }
      return shuffled(targets, wordIndex + 31).slice(0, 620);
    };

    const beginWordFormation = (width, height) => {
      const entry = nextWordEntry();
      currentWordIsYeshua =
        entry.meaning.includes("Yeshua") || entry.transliteration === "Iesous";
      const placement = safeWordPlacement(width, height);
      wordTargets = wordPointTargets(entry, width, height, "sacred", placement);
      meaningTargets = wordPointTargets(
        entry,
        width,
        height,
        "meaning",
        placement,
      );
      if (!wordTargets.length) return;
      if (!meaningTargets.length) meaningTargets = wordTargets;
      wordBounds = boundsForTargets(wordTargets);
      const spawnRandom = seededRandom(701 + wordIndex * 23);
      const centerX = width / 2;
      const centerY = height / 2;
      const scale = Math.min(width, height) * 0.55;
      const radii = [0.52, 0.72, 0.94];
      const starCount = Math.max(wordTargets.length, meaningTargets.length);
      wordStars = Array.from({ length: starCount }, (_, index) => {
        const [targetX, targetY] = wordTargets[index % wordTargets.length];
        const [meaningX, meaningY] =
          meaningTargets[index % meaningTargets.length];
        const x3 = spawnRandom() * 2 - 1;
        const y3 = spawnRandom() * 2 - 1;
        const z3 = 0.18 + spawnRandom() * 0.8;
        return {
          x: centerX + (x3 / z3) * scale,
          y: centerY + (y3 / z3) * scale,
          r: radii[Math.floor(spawnRandom() * radii.length)],
          a: 0.36 + spawnRandom() * 0.64,
          phase: spawnRandom() * Math.PI * 2,
          wordX: targetX,
          wordY: targetY,
          meaningX,
          meaningY,
          disperseX: (targetX - centerX) * 0.018 + (spawnRandom() - 0.5) * 2.8,
          disperseY: (targetY - centerY) * 0.018 + (spawnRandom() - 0.5) * 2.8,
          x3,
          y3,
          z3,
        };
      });
      wordActive = true;
      wordTransformAt = t + 1.65;
      wordHoldUntil = t + 3.9;
      wordReleaseUntil = t + 5.45;
      wordIndex += 1;
    };

    const clearWordFormation = () => {
      wordStars = [];
      wordTargets = [];
      meaningTargets = [];
      wordBounds = null;
      wordActive = false;
      currentWordIsYeshua = false;
      wordStartAt = t + 3.8 + (wordIndex % 4) * 0.85;
    };

    const updateWordFormation = (width, height) => {
      if (currentBibleMode || returning) {
        if (wordActive) clearWordFormation();
        return;
      }
      if (!wordActive && t >= wordStartAt) beginWordFormation(width, height);
      if (wordActive && t >= wordReleaseUntil) clearWordFormation();
    };


    return {
      reset() {
        wordStars = []; wordTargets = []; meaningTargets = [];
        wordBounds = null; wordActive = false; wordStartAt = t + 3.5;
      },
      draw(time, width, height) {
        t = time;
        updateWordFormation(width, height);
      if (wordStars.length) {
        const release =
          t > wordHoldUntil
            ? Math.min(
                1,
                (t - wordHoldUntil) /
                  Math.max(0.1, wordReleaseUntil - wordHoldUntil),
              )
            : 0;
        const transformProgress = Math.max(
          0,
          Math.min(1, (t - wordTransformAt) / 1.05),
        );
        const transformEase =
          transformProgress * transformProgress * (3 - 2 * transformProgress);
        const sweepProgress = Math.max(
          0,
          Math.min(1, (t - wordTransformAt + 0.24) / 1.28),
        );
        const sweepX =
          wordBounds && sweepProgress > 0 && sweepProgress < 1
            ? wordBounds.minX -
              50 +
              (wordBounds.maxX - wordBounds.minX + 100) * sweepProgress
            : null;
        for (const star of wordStars) {
          const targetX =
            star.wordX + (star.meaningX - star.wordX) * transformEase;
          const targetY =
            star.wordY + (star.meaningY - star.wordY) * transformEase;
          const pull = 0.13 * (1 - release);
          star.x += (targetX - star.x) * pull;
          star.y += (targetY - star.y) * pull;
          if (release > 0) {
            const disperseEase = release * release * (3 - 2 * release);
            star.z3 -= 0.004 + 0.012 * disperseEase;
            star.x += star.disperseX * (0.55 + disperseEase * 2.4);
            star.y += star.disperseY * (0.55 + disperseEase * 2.4);
          }
          const quickSpark =
            Math.max(0, Math.sin(t * 5.4 + star.x * 0.018 + star.phase * 1.7)) *
            0.08;
          const sweepDistance =
            sweepX === null
              ? Infinity
              : Math.abs(star.x + Math.sin(star.y * 0.032) * 14 - sweepX);
          const sweepGlow = Math.max(0, 1 - sweepDistance / 42) ** 2;
          const finalFade =
            release <= 0.78 ? 1 : Math.max(0, 1 - (release - 0.78) / 0.22);
          const alpha = Math.max(
            0,
            Math.min(1, (1.18 + quickSpark + sweepGlow * 0.42) * finalFade),
          );
          const sparkle = quickSpark > 0.11;
          const sizeMultiplier =
            (1.24 +
              sparkle * 0.5 +
              transformProgress * 0.12 +
              sweepGlow * 0.72) *
            (1 + release * 0.5);
          if (currentWordIsYeshua && release < 0.82) {
            const goldenPulse =
              Math.max(0, Math.sin(t * 4.2 + star.phase)) * 0.42 +
              sweepGlow * 0.58;
            if (goldenPulse > 0.18) {
              context.beginPath();
              context.fillStyle = `rgba(255,205,72,${Math.min(0.36, goldenPulse * 0.28)})`;
              context.shadowColor = "rgba(255,202,64,0.95)";
              context.shadowBlur = 18 + goldenPulse * 16;
              context.arc(
                star.x,
                star.y,
                star.r * sizeMultiplier * (3.2 + goldenPulse * 2.4),
                0,
                Math.PI * 2,
              );
              context.fill();
              context.shadowBlur = 0;
            }
          }
          context.beginPath();
          context.fillStyle = `rgba(255,255,255,${alpha})`;
          context.shadowColor = currentWordIsYeshua
            ? "rgba(255,232,150,0.96)"
            : "rgba(255,255,255,0.96)";
          context.shadowBlur =
            (sparkle || sweepGlow > 0.25 ? 13 + sweepGlow * 11 : 6.4) +
            (currentWordIsYeshua ? 5 : 0);
          context.arc(star.x, star.y, star.r * sizeMultiplier, 0, Math.PI * 2);
          context.fill();
          context.shadowBlur = 0;
          if (sweepGlow > 0.42) {
            context.save();
            context.globalAlpha = Math.min(0.72, sweepGlow * 0.42);
            context.strokeStyle = "#ffffff";
            context.lineWidth = 0.55;
            const glintSize = star.r * sizeMultiplier * 3;
            context.beginPath();
            context.moveTo(star.x - glintSize, star.y);
            context.lineTo(star.x + glintSize, star.y);
            context.moveTo(star.x, star.y - glintSize);
            context.lineTo(star.x, star.y + glintSize);
            context.stroke();
            context.restore();
          }
        }
      }

      }
    };
}
