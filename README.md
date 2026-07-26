# content-agent

The lane that produces Beckett video content **programmatically** — no browser,
no editor UI, no clicking around a timeline.

- **Remotion** owns anything where a frame is *computed*: motion, text,
  transitions, timing. TSX compositions, headless CLI render.
- **FFmpeg** does the mechanical passes around it: trim, concat, loudness
  normalise, transcode, thumbnails. Rule of thumb: if a frame has to be *drawn*,
  it's Remotion; if bytes just *move*, it's ffmpeg.
- **fal.ai** produces generated shots (stills now; video in a later branch).
  Results are cached by content hash so re-rendering never re-spends.

Output format is **1920×1080 @ 30fps**, TypeScript throughout.

## Setup

```bash
npm install          # deps
```

`FAL_KEY` must be in the environment for fal generation (it already is in the
worker env). It is never printed, committed, or written to disk.

The first render downloads a headless Chrome for Remotion automatically.

## The demo — `BeckettDemo`

The flagship piece: a ~51s Beckett product demo that opens **inside** the
0xbeckett.me pixel world, pushes past the page chrome until the home island fills
frame, turns the world into the product by walking Beckett's real pipeline
end-to-end (a request in Discord → filed to a worker's worktree → a real diff → a
signed PR a second model red-teams → the reply landing back in the channel),
punctuates with one live-action **fal seedance 2.0** beat (a webcam that flips to
the machine side), and closes on the wordmark and `lets beckett`. Thesis: *this is
what AI should be like.*

Build the whole deliverable — full-quality **and** a Discord-safe copy — from one
command:

```bash
npm run demo
```

That runs, streaming progress the whole way (never silent under the watchdog):

1. **prep** (`scripts/prep-assets.ts`) — ensures the one fal seedance clip via the
   `src/lib/fal.ts` `generateVideo` wrapper (content-addressed; a re-run is a cache
   HIT and spends nothing), normalises it to 4.9s @ 30fps, and writes
   `public/generated/seedance.mp4` (committed, so a clean checkout re-renders with
   no `FAL_KEY` and no re-spend).
2. **render** — `BeckettDemo` at `final` (1920×1080 h264, `-preset veryfast`).
3. **compress** — a two-pass Discord-safe copy under 9MB.

Outputs:

- `out/BeckettDemo-final.mp4` — full-quality delivery master.
- `out/BeckettDemo-discord.mp4` — under 9MB, for the 10MB Discord cap.

The isometric voxel world is a deterministic 2D port of the site's `world.js`
(`src/lib/iso.ts`) — same seeded geometry, same palette — so it reads as the island
on 0xbeckett.me without any WebGL or browser automation. Every colour and font in
the piece comes from `src/brand.ts`.

## Render a composition

One command renders a named composition at a quality tier:

```bash
npm run render -- <CompositionId> <preview|final>

# examples
npm run render -- Smoke preview     # 960x540, -preset veryfast, high crf (fast iteration)
npm run render -- Smoke final       # 1920x1080 h264, crf 18 (delivery master)
npm run smoke                       # shortcut for `render -- Smoke preview`
```

Each render:

1. bundles the project,
2. renders frames with Remotion into an intermediate mp4,
3. transcodes to delivery H.264 with the ffmpeg helper,
4. writes a poster frame.

Outputs land in `out/<Id>-<tier>.mp4` (+ `.jpg` poster). Progress is logged
continuously with a heartbeat, so a long render never goes silent.

Add `--keep-intermediate` to retain the pre-transcode Remotion output.

### Tiers

| tier    | resolution | encode                      | use            |
| ------- | ---------- | --------------------------- | -------------- |
| preview | 960×540    | `-preset veryfast`, crf 30  | fast iteration |
| final   | 1920×1080  | h264, `-preset veryfast`, crf 18 | delivery  |

## Add a new composition

1. Create `src/compositions/MyThing.tsx`. Read design tokens from `src/brand.ts`
   — never hardcode hex or font names. Import `"../fonts"` at the top so the
   bundled brand webfonts are loaded before frames draw.
2. Register it in `src/Root.tsx`:

   ```tsx
   import { MyThing } from "./compositions/MyThing";

   <Composition
     id="MyThing"
     component={MyThing}
     durationInFrames={5 * format.fps}
     fps={format.fps}
     width={format.width}
     height={format.height}
   />
   ```
3. Render it: `npm run render -- MyThing preview`.

That's the whole loop — no other wiring.

Iterate visually with the Remotion studio if you like: `npm run studio`.

## Brand tokens — `src/brand.ts`

Typed exports mirroring `web/public/page.css` on 0xbeckett.me:

- **Palette** — `ink` (`ink`/`dim`/`faint`), `lavender` (`l0`…`l9`, the primary
  field), `mint` (`m0`…`m3`), `cyan` (`c0`/`c1`/`c2`/`deep`). Flattened in
  `palette`.
- **Type** — `fonts.display` (Pixelify Sans 600, headings/wordmark),
  `fonts.pixel` (DotGothic16, labels/nav/buttons), `fonts.body` (Inter, prose).
- **Chrome** — chunky pixel-art: 2px solid ink borders, hard offset drop shadow
  (`0 4px 0 ink`), inset highlights. `chrome.chunkyShadow` is the full
  button/panel look. No soft blurs, no decorative gradients.

Fonts are **bundled locally** in `public/fonts/` (OFL — license texts alongside)
and loaded from disk in `src/fonts.ts`, so a headless render never fetches a
webfont mid-render.

## fal wrapper — `src/lib/fal.ts`

```ts
import { generateImage } from "./src/lib/fal";

const shot = await generateImage("a chunky pixel-art lavender key emblem", {
  image_size: "square",
});
// shot.path, shot.relPath, shot.cached
```

- Downloads results into `assets/generated/`.
- **Caches by SHA-256 of (model, prompt, opts).** An identical call returns the
  cached file and logs a cache **HIT** — no credits are spent on a re-render.
- The cache manifest (`assets/generated/cache.json`) is **committed**; the
  generated media files are gitignored (large, regenerable).
- `generateVideo()` is used by `scripts/prep-assets.ts` for the **one** seedance
  clip in `BeckettDemo` (the only video generation in the project). It spends
  metered credits on a cache MISS only; the committed manifest + committed
  `public/generated/seedance.mp4` mean re-renders never re-spend.

Optional round-trip check (one cheap image generation):

```bash
npx tsx scripts/fal-smoke.ts
```

## ffmpeg helpers — `src/lib/ffmpeg.ts`

`trim`, `concat`, `loudnorm` (EBU R128 → −16 LUFS), `transcodeH264`,
`thumbnail`, plus `probeDuration`. Every helper streams progress to stdout with a
heartbeat. Override binaries with `FFMPEG_BIN` / `FFPROBE_BIN` if needed.

## Constraints this lane respects

- **No browser automation** anywhere in this repo — that's the whole point.
- Renders never go silent: progress every few seconds + a heartbeat.
- fal video credits are not spent here.

## Layout

```
src/
  brand.ts            design tokens (palette, type, chrome, format)
  fonts.ts            local webfont loader
  index.ts            Remotion entry (registerRoot)
  Root.tsx            composition registry
  compositions/       one file per composition
  lib/
    fal.ts            fal.ai wrapper + content-addressed cache
    ffmpeg.ts         ffmpeg helpers
scripts/
  render.ts           render a composition at a tier
  fal-smoke.ts        optional fal cache round-trip check
public/fonts/         bundled OFL webfonts + license texts
assets/generated/     downloaded fal media (gitignored) + cache.json (committed)
out/                  render outputs (gitignored)
```
