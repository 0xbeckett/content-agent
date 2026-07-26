# Remotion techniques reference

Runnable snippets for every technique we might reach for, each with a **use when**
and a cited doc URL. Pinned to the version in `package.json` (**4.0.499**). Core
primitives (`interpolate`, `spring`, `Easing`, `Sequence`, `Series`,
`staticFile`, `delayRender`) import from `remotion`; everything else from its
sub-package.

Most of these are wrapped, tuned, and named in `src/lib/edit.ts` — prefer the
wrapper; drop to raw Remotion when you need something the wrapper doesn't cover.

---

## 1. `spring()` — physical motion

**Use when** an element should *land* (arrive with weight and settle). The config
space, not a duration, is what you tune.
Docs: <https://www.remotion.dev/docs/spring> · <https://www.remotion.dev/docs/measure-spring>

```tsx
import { spring, useCurrentFrame, useVideoConfig, AbsoluteFill } from "remotion";

const frame = useCurrentFrame();
const { fps } = useVideoConfig();
// config defaults: mass 1, damping 10, stiffness 100, overshootClamping false
const scale = spring({ frame, fps, config: { damping: 12, stiffness: 120 }, from: 0, to: 1 });
return <AbsoluteFill style={{ transform: `scale(${scale})` }} />;
```

- **mass** (1) — weight; lower = faster. **damping** (10) — how hard it decelerates.
  **stiffness** (100) — bounciness. **overshootClamping** (false) — clamp to `to`.
- `durationInFrames` stretches the curve to a fixed length; `delay` offsets start.
- `measureSpring({ fps, config, threshold })` → how many frames it needs to settle
  (lay out a Sequence long enough for the spring to finish).

→ `edit.ts`: `SPRING.snappy/smooth/gentle/bouncy`, `punchIn()`.

---

## 2. `interpolate()` + `Easing` — mapped, eased values

**Use when** you want a value to track a frame range with a curve (opacity, pan,
zoom). Always `clamp` unless you want extrapolation.
Docs: <https://www.remotion.dev/docs/interpolate> · <https://www.remotion.dev/docs/easing>

```tsx
import { interpolate, Easing, useCurrentFrame } from "remotion";

const frame = useCurrentFrame();
const opacity = interpolate(frame, [0, 20], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic), // decelerate on entrance
});
```

- `inputRange` must be **strictly increasing** and the same length as
  `outputRange`, or it throws. Default extrapolation is `extend` (keeps going) —
  `clamp` holds the endpoints.
- `Easing.bezier(x1,y1,x2,y2)` == a CSS cubic-bezier. Wrappers: `Easing.in/out/inOut`.
  Also `linear, ease, quad, cubic, sin, circle, exp, bounce, poly(n), elastic(b), back(s)`.

→ `edit.ts`: `EASE.out/in/inOut/emphasized/linear`, `pushIn()`.

---

## 3. `Sequence` / `Series` / `TransitionSeries` — sequencing

**Use `Sequence`** to time-shift a child (its `useCurrentFrame()` starts at 0 at
`from`). **Use `Series`** for back-to-back shots — a hard-cut timeline. **Use
`TransitionSeries`** only when a cut genuinely wants a transition.
Docs: <https://www.remotion.dev/docs/sequence> · <https://www.remotion.dev/docs/series> · <https://www.remotion.dev/docs/transitions/transitionseries>

```tsx
import { Series, AbsoluteFill } from "remotion";

<Series>
  <Series.Sequence durationInFrames={46}><AbsoluteFill /></Series.Sequence>
  {/* offset: +gap, -overlap. Only the LAST sequence may be Infinity. */}
  <Series.Sequence durationInFrames={44} offset={0}><AbsoluteFill /></Series.Sequence>
</Series>;
```

→ `edit.ts`: `Cut`/`Hold` wrap exactly this hard-cut `Series` pattern.

---

## 4. `@remotion/transitions` — when a cut wants a transition

**Use when** two scenes want continuity (a real time/place change) — *not* the
house default. Total timeline is shortened by each transition's duration.
Docs: <https://www.remotion.dev/docs/transitions/transitionseries> · <https://www.remotion.dev/docs/transitions/presentations>

```tsx
import { TransitionSeries, springTiming, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { AbsoluteFill } from "remotion";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}><AbsoluteFill style={{ background: "#0b84f3" }} /></TransitionSeries.Sequence>
  {/* prefer durationRestThreshold: 0.001 on springTiming so it doesn't cut off abruptly */}
  <TransitionSeries.Transition timing={springTiming({ config: { damping: 200 } })} presentation={fade()} />
  <TransitionSeries.Sequence durationInFrames={60}><AbsoluteFill style={{ background: "pink" }} /></TransitionSeries.Sequence>
  <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 30 })} presentation={slide({ direction: "from-right" })} />
  <TransitionSeries.Sequence durationInFrames={60}><AbsoluteFill style={{ background: "#2ecc71" }} /></TransitionSeries.Sequence>
</TransitionSeries>;
```

- Presentations (each its own import): `fade()`, `slide({direction})`, `wipe()`,
  `flip()`, `clockWipe({width,height})` (dimensions required), `cube()`, `none()`.
- Timings: `springTiming({config, durationInFrames})`, `linearTiming({durationInFrames, easing})`.
- `TransitionSeries.Overlay` renders over a cut point *without* shortening the
  timeline — mask a cut without a full transition.

**Our policy:** a transition is a claim that time passed. If it didn't, hard-cut.

---

## 5. `@remotion/media` + `OffthreadVideo` / `Audio` — footage & sound

**Use when** compositing real video or adding a track. `@remotion/media`'s
`<Video>`/`<Audio>` are the docs' recommended tags for new projects (frame-exact
via Mediabunny, falls back to OffthreadVideo). `OffthreadVideo` (from `remotion`)
stays the classic frame-accurate render component.
Docs: <https://www.remotion.dev/docs/media> · <https://www.remotion.dev/docs/using-audio>

```tsx
import { Video, Audio } from "@remotion/media";
import { interpolate, staticFile } from "remotion";

<>
  <Video src={staticFile("clip.mp4")} playbackRate={1.5} />
  <Audio
    src={staticFile("music.mp3")}
    // volume ramp: fade in over the first 30 frames
    volume={(f) => interpolate(f, [0, 30], [0, 1], { extrapolateLeft: "clamp" })}
  />
</>;
```

- `volume` takes a number or `(frame) => number`. Also `trimBefore/trimAfter`,
  `toneFrequency` (0.01–2, pitch), `playbackRate`, `loop`, `muted`.
- `staticFile()` resolves files in `public/` (that's where our `captures/` and
  `generated/` live). Our current `beckett/ad.tsx` uses `<Img src={staticFile(...)}>`.

---

## 6. `@remotion/paths` — draw-on SVG paths

**Use when** a line/route should draw itself, or you need points along a path.
Docs: <https://www.remotion.dev/docs/paths> · <https://www.remotion.dev/docs/paths/evolve-path>

```tsx
import { evolvePath } from "@remotion/paths";
import { interpolate, useCurrentFrame } from "remotion";

const d = "M 0 0 L 100 0";
const frame = useCurrentFrame();
const { strokeDasharray, strokeDashoffset } = evolvePath(
  interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" }), d,
);
// <path d={d} stroke="white" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} />
```

Also: `getLength`, `getPointAtLength`, `getTangentAtLength`, `interpolatePath(t,a,b)`
(morph), `translatePath`, `scalePath`, `reversePath`.

---

## 7. `@remotion/shapes` — parametric shapes

**Use when** you need a clean primitive (badge, marker, star) without hand-writing SVG.
Docs: <https://www.remotion.dev/docs/shapes> · <https://www.remotion.dev/docs/shapes/make-circle>

```tsx
import { Circle, makeCircle } from "@remotion/shapes";

<Circle radius={50} fill="red" />;                 // component
const { path, width, height } = makeCircle({ radius: 50 }); // path + metrics
```

Components: `Rect, Triangle, Circle, Ellipse, Star, Polygon, Pie` (all take SVG
props). `make*` return `{ path, width, height, transformOrigin, instructions }`.

---

## 8. `@remotion/noise` — organic drift

**Use when** you want non-repeating jitter/wobble (hand-held feel, particles).
Returns −1..1. Docs: <https://www.remotion.dev/docs/noise> · <https://www.remotion.dev/docs/noise/noise-2d>

```tsx
import { noise2D } from "@remotion/noise";
import { useCurrentFrame } from "remotion";

const frame = useCurrentFrame();
const dx = noise2D("seed", frame / 30, 0) * 8; // ±8px smooth wander
```

`noise2D(seed, x, y)`, `noise3D(seed, x, y, z)`, `noise4D(seed, x, y, z, w)` —
seed first. Deterministic per seed, so renders are reproducible.

---

## 9. `@remotion/layout-utils` — measure & fit text

**Use when** type must fit a box or you need its measured size (dynamic headlines,
captions). Docs: <https://www.remotion.dev/docs/layout-utils> · <https://www.remotion.dev/docs/layout-utils/fit-text>

```tsx
import { fitText, measureText } from "@remotion/layout-utils";

const { fontSize } = fitText({ text: "Hello", withinWidth: 500, fontFamily: "Inter", fontWeight: "bold" });
const finalSize = Math.min(80, fontSize); // cap the max
const { width, height } = measureText({ text: "Hello", fontFamily: "Inter", fontSize: finalSize });
```

**Gotcha:** the font must be loaded first or measurements are wrong. We already
load brand fonts in `src/fonts.ts`; pass `validateFontIsLoaded: true` to throw if
it isn't ready. `fillTextBox({maxBoxWidth, maxLines})` returns an `add(text)` API
for multi-line fitting.

---

## 10. `delayRender()` / `continueRender()` — async before a frame

**Use when** a frame needs data/fonts/an image decoded before it can draw.
Docs: <https://www.remotion.dev/docs/delay-render>

```tsx
import { delayRender, continueRender, cancelRender } from "remotion";
import { useEffect, useState } from "react";

const [handle] = useState(() => delayRender("Fetching data"));
useEffect(() => {
  fetch("https://api.example.com/data")
    .then((r) => r.json())
    .then(() => continueRender(handle))
    .catch((e) => cancelRender(e));
}, [handle]);
```

- Must `continueRender()` (or `cancelRender()`) within the timeout (**default
  30000ms**) or the render fails. No effect in Studio/Player preview.
- `cancelRender(err)` fails the render immediately and cancels all pending delays.

---

## 11. Render performance

**Use when** tuning render speed/quality. Our `scripts/render.ts` already wires
`renderMedia` with `concurrency`, `scale`, `crf`, `x264Preset`.
Docs: <https://www.remotion.dev/docs/renderer/render-media> · <https://www.remotion.dev/docs/cli/render>

```ts
import { renderMedia, selectComposition } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";

const serveUrl = await bundle({ entryPoint: "./src/index.ts" });
const composition = await selectComposition({ serveUrl, id: "BeckettAdPunch" });
await renderMedia({
  serveUrl, composition, codec: "h264", outputLocation: "out/video.mp4",
  concurrency: "50%",   // number | "50%" | null (auto from CPU)
  scale: 1,             // multiply dimensions
  imageFormat: "jpeg",  // jpeg (fast, default) | png (transparency) | none (audio only)
  jpegQuality: 80,
  crf: 18,              // lower = higher quality; NOT available with hardware accel
});
// CLI: npx remotion render BeckettAdPunch out/v.mp4 --concurrency=50% --crf=18 --image-format=jpeg
```

Levers: `concurrency` (parallelism), `scale` (resolution), `imageFormat`
(jpeg vs png — jpeg is faster, png only for transparency), `crf`/`videoBitrate`,
`x264Preset`, `everyNthFrame`, `offthreadVideoCacheSizeInBytes`.

---

## 12. Audio-synced cuts

**Use when** cuts should land on the beat (once we add a track).
Docs: <https://www.remotion.dev/docs/visualize-audio> · <https://www.remotion.dev/docs/media-utils/use-audio-data>

Beat-sync the simple way: set each `Series.Sequence`'s `durationInFrames` to the
frames between beats (`beatSeconds * fps`). Our `beat()` helper snaps durations to
a 120bpm/30fps grid (15 frames/beat) for exactly this. For reactive visuals:

```tsx
import { Audio } from "@remotion/media";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const frame = useCurrentFrame();
const { fps } = useVideoConfig();
const src = staticFile("music.mp3");
const audioData = useAudioData(src);           // null until loaded (wraps delayRender)
if (!audioData) return null;
const bars = visualizeAudio({ audioData, frame, fps, numberOfSamples: 64 }); // 0..1 per band
// <Audio src={src} /> + render bars
```

→ `edit.ts`: `beat()`, `snapToBeat()`.

---

### Package / import cheatsheet

- From **`remotion`**: `interpolate`, `spring`, `Easing`, `Sequence`, `Series`,
  `AbsoluteFill`, `Img`, `OffthreadVideo`, `staticFile`, `useCurrentFrame`,
  `useVideoConfig`, `delayRender`/`continueRender`/`cancelRender`.
- Sub-packages: `@remotion/transitions`, `@remotion/media`, `@remotion/media-utils`,
  `@remotion/paths`, `@remotion/shapes`, `@remotion/noise`, `@remotion/layout-utils`,
  `@remotion/bundler`, `@remotion/renderer`.
- `visualize-audio` doc lives at `/docs/visualize-audio` (not under `/media-utils`).
