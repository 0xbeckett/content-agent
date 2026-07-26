---
name: video-editing
description: The house craft for cutting content-agent videos — pacing, hard-cut policy, dwell floors, easing defaults, and a pre-render review rubric. Read this before cutting or reviewing any composition; reach for the primitives in src/lib/edit.ts instead of hand-rolling motion.
---

# Video editing — the house craft

Our videos are cut on rules, not instinct. This is the operating doc for whoever
cuts the next one. It is opinionated on purpose: numbers, not adjectives. The
depth and citations live in `references/editing.md` and `references/remotion.md`;
the reusable code lives in `src/lib/edit.ts`. **All frame counts are @30fps**
(`brand.format.fps`), 1920×1080.

## The thesis

We cut **ads, not showreels**. The product is the footage: real captured
surfaces and verbatim asks, never mocked UI. Motion is **mechanical and
confident** — hard cuts, linear pans, minimal effects — because the claim of the
piece is *this is real*, and a bouncy transition undercuts that claim. When in
doubt, cut; don't transition.

## Pacing table (by ad length)

The arc is always **hook → build/escalation → payoff → CTA**. Change *something*
on screen every 3–5s; tighten as you go.

| length | frames | hook | build | payoff | CTA | shots | avg shot |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 15s | 450 | 0–90 (0–3s) | ~90–330 | ~330–420 | 420–450 | 8–12 | 40–55f |
| ~16s (our cut) | 488 | first ask ≤46f | 4 ask/result pairs | last pair | 70f close | 9 | ~30–46f |
| 30s | 900 | 0–90 (0–3s) | ~90–660 | ~660–840 | 840–900 | 14–22 | 40–65f |

Rules that hold across all lengths:

- **The 1-second hook.** Something legible and true must land inside the first
  **30 frames**. Our open is the first ask — on screen ≤46f, typed at 30cps.
- **Escalate.** Each beat should be as tight or tighter than the last. Our punch
  cut runs pair one's ask at 46f and pair four's at 28f (~40% quicker).
- **No shot sits still.** Every held frame has a slow linear pan or <10% push
  (`pushIn`). A dead-static shot reads as a freeze/bug.
- **Grid the cuts.** Lay durations on the beat grid (`beat(n)`, 15f/beat at
  120bpm) so the piece has a pulse even silent — and lines up if a track is added.

## Hard-cut policy

- **Hard cut is the default and carries the whole piece.** Use `Cut`/`Hold` from
  `edit.ts` — it's the hard-cut `Series` under a name.
- **A dissolve is a claim that time passed.** Only use one for a real change of
  time/place/state. Inside a continuous "now" (ask → result), never.
- **A transition is earned, not decorative.** If you reach for
  `@remotion/transitions`, justify it in a comment. Default budget: **zero**
  transitions per ad. Our one allowed flourish is a ≤6-frame accent wipe as a
  result lands — a mark on the cut, not a crossfade.

## Dwell floors (legibility is non-negotiable)

From a conservative **15 characters/second** reading floor (subtitle standard)
plus a ~9-frame recognition tax. Text must be **motionless** during its dwell.

| on-screen text | minimum hold |
| --- | --- |
| a short label (≤15 chars) | **30f (1.0s)** |
| a line (~30 chars) | **~69f (2.3s)** |
| absolute floor for anything readable | **30f (1.0s)** |

Use `readingHold(text, fps)` to size a shot: `Math.max(desiredDur, readingHold(caption, fps))`.
A typed reveal (`typeOn`) needs `text.length / cps` seconds to type **plus** the
dwell above after the last character lands — budget both.

## Easing defaults

Never `linear` for an entrance (reads robotic). From `edit.ts`:

- **Enter** → `EASE.out` (decelerate). **Exit** → `EASE.in` (accelerate).
  **Move on-screen** → `EASE.inOut`. **Constant camera / progress bars** →
  `EASE.linear` (the only place linear is correct).
- **Lands with weight** → `punchIn()` / a `SPRING` preset. `snappy` for
  labels/chips, `smooth` (overshoot clamped) for large elements/camera, `bouncy`
  for playful accents **only** — never body content.
- **Stagger** grouped entrances with `stagger(i, each)` — `each` = 2–4f
  (~65–130ms); keep the cascade short so it lands as one gesture.

## What "minimal effects" means (the effects budget)

A hard constraint, not a mood. Per ad:

- Hard cuts. Stepped opacity fades **≤6 frames**. Linear pans / **<10%** zoom
  drift. Translates **≤10px**. **≤1** accent wipe (≤6f) per result.
- **No** 3D, particles, blur stacks, long eases, or zoom-punch stacking.
- Silent unless a track is deliberately scored. If a move doesn't sell the beat,
  delete it. **When in doubt, don't animate** — motion that competes with the
  content is a bug.

## Kinetic type & safe areas

- Animate type **per word/line**, then hold it **static** for its full dwell.
  Never make someone read moving text.
- Keep all readable text (labels, refs, CTAs) inside **title-safe = 90%** (5%
  margin; ~96px at 1080p). Our `INSET` (46px) + `Label` inset clears this.
- Over moving footage: a scrim/plate (`surface.scrim*`, the `Label` plate) for
  contrast, and a **fixed anchor** — captions never drift with the footage.

## Reach for the primitive

`src/lib/edit.ts` is the toolkit; stop hand-rolling. `EASE`, `SPRING`,
`stagger`, `punchIn`, `pushIn`, `typeOn`, `readingHold`, `beat`/`snapToBeat`,
`Cut`/`Hold`. The pixel-art idiom (stepped/quantised motion) stays in
`src/lib/motion.ts`. Read tokens from `src/brand.ts` — never hardcode hex or fonts.

---

## Pre-render review rubric

Self-check the cut against this **before** rendering. Any "no" is a fix, not a note.

1. **Hook** — is something legible and true on screen by frame 30?
2. **Truth** — is every surface a real capture / verbatim ask? No mocked UI, no
   invented text, no faked badge?
3. **Dwell** — does every text block clear its `readingHold` floor while static?
   Read each one aloud once — did you have time?
4. **Cuts** — every transition a hard cut unless a time/place change earns
   otherwise? Transition budget respected (default zero)?
5. **Escalation** — does the pace tighten (or hold), never sag, toward the payoff?
6. **Motion** — no dead-static shots; no `linear` entrance; every move inside the
   effects budget (≤6f fades, <10% zoom, ≤10px translate)?
7. **Easing** — entrances decelerate, exits accelerate; springs from a preset,
   not ad-hoc numbers?
8. **Safe area** — all readable text inside title-safe (90%), anchored, on enough
   contrast?
9. **Primitives** — using `edit.ts` where it applies, not a re-hand-rolled spring
   or pan?
10. **Length & silence** — duration unchanged when it should be; silent unless a
    track was deliberately added?
11. **CTA** — does it end on the strongest true thing (a link you can open now)?

Render only once all eleven pass.
