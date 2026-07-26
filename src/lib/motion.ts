/**
 * Pixel-art-native motion helpers.
 *
 * The site moves in hard, quantised steps (`steps(6,end)` reveals, `translateY`
 * snaps, no smooth 600ms springs). These helpers keep the video's motion in the
 * same idiom: eased-in-steps ramps, quantised bobs, hard reveals. No corporate
 * slide-and-fade, no easing that reads as "generic tech".
 */
import { Easing, interpolate } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Quantise a 0..1 value into `n` hard steps. */
export function quantize(v: number, n: number): number {
  return Math.round(v * n) / n;
}

/**
 * Interpolate `frame` over `[f0,f1]` to `[v0,v1]`, eased-out then snapped to `n`
 * steps — the ramp accelerates then lands in visible increments, the pixel-art read.
 */
export function easeInSteps(
  frame: number,
  range: [number, number],
  out: [number, number],
  n = 6,
): number {
  const t = interpolate(frame, range, [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return interpolate(quantize(t, n), [0, 1], out, clamp);
}

/** Plain clamped linear interpolate — for continuous camera moves. */
export function lin(frame: number, range: [number, number], out: [number, number]): number {
  return interpolate(frame, range, out, clamp);
}

/** A hard, stepped fade 0→1 across a window (for reveals that must not smear). */
export function stepFade(frame: number, start: number, len: number, n = 5): number {
  return quantize(interpolate(frame, [start, start + len], [0, 1], clamp), n);
}

/** A gentle quantised bob — the world breathing, in discrete pixels. */
export function bob(frame: number, fps: number, ampPx: number, periodS = 4, n = 8): number {
  const phase = (frame / (fps * periodS)) % 1;
  return quantize(Math.sin(phase * Math.PI * 2) * 0.5 + 0.5, n) * ampPx * 2 - ampPx;
}

/** Blink on an integer cadence (cursor / caret). */
export function blink(frame: number, onFrames = 15): boolean {
  return Math.floor(frame / onFrames) % 2 === 0;
}

/** How many characters of a string are revealed by `frame`, at `cps` chars/sec. */
export function typed(frame: number, startFrame: number, fps: number, len: number, cps = 42): number {
  const n = Math.floor(((frame - startFrame) / fps) * cps);
  return Math.max(0, Math.min(len, n));
}
