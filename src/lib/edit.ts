/**
 * edit.ts — the house motion + sequencing toolkit.
 *
 * `motion.ts` is the *pixel-art* idiom (quantised bobs, stepped reveals). THIS
 * file is the general craft layer distilled from `skills/video-editing`: the
 * easing/spring vocabulary, the entrance/camera primitives, kinetic type, and a
 * cut/hold sequencing grammar — so compositions stop hand-rolling springs and
 * magic-number pans and instead reach for one named, reviewed primitive.
 *
 * Nothing here fights the effects budget: every default is conservative, linear
 * is available by name for the mechanical cuts, and the springs exist for the
 * next branch's needs, not to sneak bounce into a hard-cut ad.
 *
 * See `skills/video-editing/SKILL.md` for the numeric rules these encode and
 * `skills/video-editing/references/remotion.md` for the underlying APIs.
 */
import React from "react";
import { Easing, Series, interpolate, spring } from "remotion";

/** An easing function: maps a normalised `t` in [0,1] to an eased [0,1]. */
export type EasingFn = (t: number) => number;

/** A `spring()` config — the subset we ever tune. Passed straight to Remotion. */
export type SpringPreset = {
  damping: number;
  mass: number;
  stiffness: number;
  overshootClamping?: boolean;
};

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ─────────────────────────────── easing ─────────────────────────────── */

/**
 * Named easing curves that read as physical. Rule of thumb (Material motion):
 * things that ENTER decelerate (`out`), things that LEAVE accelerate (`in`),
 * things that move on-screen use `inOut`. Never animate an entrance with
 * `linear` — reserve `linear` for continuous mechanical motion only.
 *
 * Reach for these anywhere you pass `easing:` to `interpolate`.
 * @see https://m2.material.io/design/motion/speed.html#easing
 */
export const EASE = {
  /** Decelerate — the default for anything ENTERING frame. */
  out: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  /** Accelerate — the default for anything LEAVING frame. */
  in: Easing.bezier(0.4, 0.0, 1.0, 1.0),
  /** Symmetric — for a move that both starts and ends on screen (camera drift). */
  inOut: Easing.bezier(0.4, 0.0, 0.2, 1.0),
  /** Emphasized decelerate — a hero element landing with extra weight. */
  emphasized: Easing.bezier(0.05, 0.7, 0.1, 1.0),
  /** Linear — ONLY for progress bars and constant mechanical pans. Never an entrance. */
  linear: ((t: number) => t) as EasingFn,
} satisfies Record<string, EasingFn>;

/* ─────────────────────────────── springs ─────────────────────────────── */

/**
 * Named `spring()` configs. Pass as `spring({ frame, fps, config: SPRING.snappy })`.
 * Prefer these over ad-hoc numbers so bounce stays consistent and intentional.
 *
 * - `snappy`  — quick settle, barely-there overshoot. Labels, chips, buttons landing.
 * - `smooth`  — no visible bounce (overshoot clamped). Large elements, camera moves.
 * - `gentle`  — slow, soft. Ambient / background drift.
 * - `bouncy`  — visible overshoot. Playful ACCENTS only; never body content.
 * @see https://www.remotion.dev/docs/spring
 */
export const SPRING = {
  snappy: { damping: 26, mass: 0.7, stiffness: 170 },
  smooth: { damping: 200, mass: 1, stiffness: 100, overshootClamping: true },
  gentle: { damping: 40, mass: 1.4, stiffness: 60 },
  bouncy: { damping: 12, mass: 0.9, stiffness: 150 },
} satisfies Record<string, SpringPreset>;

/* ─────────────────────────── entrance primitives ─────────────────────── */

/**
 * Frame at which the `index`-th item of a staggered group should start.
 * Staggered entrances read as one motion instead of N; keep `eachFrames` small
 * (2–4 @30fps ≈ 65–130ms) so the group still lands as a unit.
 *
 * Reach for this to cascade list items, words, or cards.
 * @example const start = stagger(i, 3, 8); // item i begins 3f after the last, group opens at f8
 */
export function stagger(index: number, eachFrames: number, startFrame = 0): number {
  return startFrame + index * eachFrames;
}

/**
 * A scale-punch entrance: an element ARRIVES with weight, overshooting slightly
 * then settling (spring-driven). Returns a scale multiplier — apply as
 * `transform: scale(punchIn(frame, fps))`.
 *
 * Reach for this when one element should feel like it *lands*. For subtle work
 * pass `from: 0.96`; for a hero, keep the default and pair with `SPRING.snappy`.
 */
export function punchIn(
  frame: number,
  fps: number,
  opts: { from?: number; to?: number; delay?: number; config?: SpringPreset } = {},
): number {
  const { from = 0.92, to = 1, delay = 0, config = SPRING.snappy } = opts;
  const p = spring({ frame: frame - delay, fps, config });
  return from + (to - from) * p;
}

/**
 * A slow, continuous camera push (dolly / Ken-Burns) over a shot: interpolates a
 * zoom scale across a frame range. Default easing is `linear` because a push
 * should be *constant* — a decelerating zoom reads as a mistake, not a move.
 *
 * Reach for this to keep a held frame alive without cutting. Keep the delta
 * small (<10% over the shot) so it's felt, not seen.
 * @example const z = pushIn(frame, [0, dur], [1, 1.06]);
 */
export function pushIn(
  frame: number,
  range: [number, number],
  zoom: [number, number],
  easing: EasingFn = EASE.linear,
): number {
  return interpolate(frame, range, zoom, { ...CLAMP, easing });
}

/* ─────────────────────────────── kinetic type ────────────────────────── */

export type TypeOnState = {
  /** The substring visible at this frame. */
  shown: string;
  /** How many characters are revealed. */
  count: number;
  /** True once the whole string is on screen. */
  done: boolean;
};

/**
 * Typewriter / kinetic-type reveal: how much of `text` is visible at `frame`,
 * typed at `cps` characters per second from `startFrame`. Legibility floor: the
 * viewer still needs dwell time AFTER the last character lands — budget the
 * shot for `text.length / cps` seconds of typing PLUS a hold (see `readingHold`).
 *
 * Reach for this for a caption or ask that should type on rather than pop.
 * @example const { shown, done } = typeOn(frame, ask, { fps, startFrame: 8, cps: 30 });
 */
export function typeOn(
  frame: number,
  text: string,
  opts: { fps: number; startFrame?: number; cps?: number },
): TypeOnState {
  const { fps, startFrame = 0, cps = 42 } = opts;
  const count = Math.max(
    0,
    Math.min(text.length, Math.floor(((frame - startFrame) / fps) * cps)),
  );
  return { shown: text.slice(0, count), count, done: count >= text.length };
}

/**
 * Minimum frames a block of `text` must stay legible on screen, from a reading
 * floor of ~15 characters/second (subtitle-standard reading speed) with a fixed
 * recognition tax on top. Use it to SIZE a shot, not to animate:
 * `Math.max(desiredDur, readingHold(caption, fps))`.
 *
 * @see references/editing.md — caption dwell / reading-speed floors.
 */
export function readingHold(text: string, fps: number, cps = 15): number {
  const readFrames = (text.trim().length / cps) * fps;
  const recognitionTax = 0.3 * fps; // ~0.3s to notice + fixate before reading
  return Math.ceil(readFrames + recognitionTax);
}

/* ─────────────────────────────── beat grid ───────────────────────────── */

const BEAT_DEFAULTS = { fps: 30, bpm: 120 } as const;

/**
 * The frame index of the `n`-th beat on a rhythmic grid. At our defaults
 * (30fps, 120bpm) one beat is exactly 15 frames (0.5s), so `beat(1)=15`,
 * `beat(4)=60`. Snapping every cut onto `beat(n)` gives the whole piece one
 * pulse even with no audio track — and lines the cuts up if a track is added.
 *
 * Reach for this to lay out shot durations on a grid instead of eyeballed frames.
 * @example const shots = [beat(3), beat(3), beat(2)]; // 45,45,30 — tightening
 */
export function beat(n: number, opts: { fps?: number; bpm?: number } = {}): number {
  const { fps, bpm } = { ...BEAT_DEFAULTS, ...opts };
  return Math.round(n * (60 / bpm) * fps);
}

/**
 * Round an arbitrary frame count to the nearest beat on the grid — pull an
 * eyeballed duration onto the rhythm without re-deriving it by hand.
 */
export function snapToBeat(frame: number, opts: { fps?: number; bpm?: number } = {}): number {
  const { fps, bpm } = { ...BEAT_DEFAULTS, ...opts };
  const per = (60 / bpm) * fps;
  return Math.round(frame / per) * per;
}

/* ────────────────────────── cut / hold sequencing ────────────────────── */

/**
 * A held shot inside a `<Cut>`: on screen for `durationInFrames`, hard-cut in and
 * out (no transition — the cut *is* the edit). `children` may be a node or a
 * `(durationInFrames) => node` render function when the shot needs its own length
 * for internal timing (e.g. a camera push across exactly this many frames).
 *
 * `Hold` renders nothing itself — `<Cut>` reads its props (the same marker
 * pattern Remotion's `<Series.Sequence>` uses), so it MUST be a direct child of
 * `<Cut>`.
 */
export type HoldProps = {
  durationInFrames: number;
  /** Optional label for readability / future review tooling. */
  name?: string;
  children: React.ReactNode | ((durationInFrames: number) => React.ReactNode);
};

export const Hold: React.FC<HoldProps> = () => null;

/**
 * A hard-cut sequence of `<Hold>` shots — the house sequencing grammar. It is a
 * thin, behaviour-identical shell over Remotion's `<Series>`/`<Series.Sequence>`
 * (back-to-back, no gaps, no transitions) that names the intent: this is a cut,
 * not a dissolve. If you want a transition between two shots, that is a
 * deliberate exception — use `@remotion/transitions` directly, not `<Cut>`.
 *
 * (Authored with `React.createElement` rather than JSX so this stays a `.ts`
 * file alongside the rest of the toolkit.)
 *
 * @example
 * // <Cut>
 * //   {shots.map((s, i) => (
 * //     <Hold key={i} durationInFrames={s.d}>{(d) => s.el(d)}</Hold>
 * //   ))}
 * // </Cut>
 */
export const Cut: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  React.createElement(
    Series,
    null,
    React.Children.map(children, (child) => {
      if (!React.isValidElement<HoldProps>(child)) return null;
      const { durationInFrames, children: inner } = child.props;
      const node = typeof inner === "function" ? inner(durationInFrames) : inner;
      return React.createElement(Series.Sequence, { durationInFrames }, node);
    }),
  );
