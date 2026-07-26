/**
 * Render a named composition at a quality tier — one command.
 *
 *   npm run render -- <CompositionId> <preview|final> [--keep-intermediate]
 *
 * Tiers:
 *   preview  960x540,  -preset veryfast, high crf  — fast iteration
 *   final    1920x1080 h264,             crf 18     — delivery master
 *
 * Pipeline: bundle → Remotion render (frames → intermediate mp4) → ffmpeg
 * transcodeH264 (delivery encode) → ffmpeg thumbnail (poster). Progress is logged
 * to stdout continuously plus a heartbeat, so the process is never silent under a
 * watchdog.
 */
import path from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { ensureBrowser, renderMedia, selectComposition } from "@remotion/renderer";
import type { X264Preset } from "@remotion/renderer";
import { transcodeH264, thumbnail, probeDuration } from "../src/lib/ffmpeg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(REPO_ROOT, "out");
const ENTRY = path.join(REPO_ROOT, "src", "index.ts");

type Tier = "preview" | "final";

const TIERS: Record<Tier, { scale: number; crf: number; preset: X264Preset }> = {
  // 960x540 = half of 1920x1080; high crf + veryfast for speed.
  preview: { scale: 0.5, crf: 30, preset: "veryfast" },
  // Full res delivery master.
  final: { scale: 1, crf: 18, preset: "veryfast" },
};

function heartbeat(label: string): () => void {
  const started = Date.now();
  const timer = setInterval(() => {
    const secs = Math.round((Date.now() - started) / 1000);
    console.log(`[render] ${label} — still working (${secs}s elapsed)`);
  }, 10000);
  return () => clearInterval(timer);
}

async function main() {
  const [compId, tierArg = "preview", ...flags] = process.argv.slice(2);
  const keepIntermediate = flags.includes("--keep-intermediate");

  if (!compId) {
    console.error("Usage: npm run render -- <CompositionId> <preview|final>");
    process.exit(1);
  }
  const tier = tierArg as Tier;
  if (!TIERS[tier]) {
    console.error(`Unknown tier "${tierArg}". Use "preview" or "final".`);
    process.exit(1);
  }
  const cfg = TIERS[tier];
  const t0 = Date.now();

  await mkdir(OUT_DIR, { recursive: true });

  console.log(`[render] ensuring headless browser…`);
  await ensureBrowser();

  console.log(`[render] bundling ${ENTRY}…`);
  let stopBeat = heartbeat("bundle");
  const serveUrl = await bundle({
    entryPoint: ENTRY,
    onProgress: (p) => {
      if (p % 25 === 0) console.log(`[render] bundling ${p}%`);
    },
  });
  stopBeat();

  console.log(`[render] selecting composition "${compId}"…`);
  const composition = await selectComposition({ serveUrl, id: compId });
  console.log(
    `[render] ${compId}: ${composition.width}x${composition.height} @ ${composition.fps}fps, ` +
      `${composition.durationInFrames} frames (${(composition.durationInFrames / composition.fps).toFixed(1)}s)`,
  );

  const intermediate = path.join(OUT_DIR, `${compId}-${tier}.intermediate.mp4`);
  const output = path.join(OUT_DIR, `${compId}-${tier}.mp4`);
  const poster = path.join(OUT_DIR, `${compId}-${tier}.jpg`);

  console.log(`[render] rendering frames (tier=${tier}, scale=${cfg.scale})…`);
  let lastLog = 0;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: intermediate,
    scale: cfg.scale,
    crf: cfg.crf,
    x264Preset: cfg.preset,
    concurrency: null,
    // OffthreadVideo frames are extracted per-thread; give them headroom over the
    // 30s default so a busy clip extraction under full concurrency never trips it.
    timeoutInMilliseconds: 120000,
    onProgress: ({ progress, renderedFrames, encodedFrames }) => {
      const now = Date.now();
      // Log on each 5% step OR at least every 8s — never silent.
      if (progress * 100 >= lastLog + 5 || now - (main as any)._last > 8000) {
        (main as any)._last = now;
        lastLog = Math.floor(progress * 100);
        console.log(
          `[render] frames ${Math.round(progress * 100)}% (rendered ${renderedFrames}, encoded ${encodedFrames})`,
        );
      }
    },
  });
  console.log(`[render] Remotion pass done → ${path.relative(REPO_ROOT, intermediate)}`);

  // ffmpeg delivery transcode — the "bytes just move" pass.
  console.log(`[render] ffmpeg transcode (crf=${cfg.crf}, preset=${cfg.preset})…`);
  await transcodeH264(intermediate, output, { crf: cfg.crf, preset: cfg.preset });

  // Poster frame from the middle of the clip.
  const dur = await probeDuration(output);
  await thumbnail(output, poster, Math.max(0, dur / 2));

  if (!keepIntermediate) await rm(intermediate, { force: true });

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n[render] ✔ done in ${secs}s`);
  console.log(`[render]   video: ${path.relative(REPO_ROOT, output)}`);
  console.log(`[render]   poster: ${path.relative(REPO_ROOT, poster)}`);
}

(main as any)._last = 0;
main().catch((err) => {
  console.error("[render] FAILED:", err);
  process.exit(1);
});
