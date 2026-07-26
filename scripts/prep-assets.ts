/**
 * Prep generated assets for the BeckettDemo composition.
 *
 * The ONLY metered generation in this lane: one fal seedance 2.0 clip — the
 * single live-action beat (a person at a webcam; the shot flips around to the
 * machine side of the same moment). Everything else in the video is drawn in
 * Remotion, so this is the whole fal spend.
 *
 * Routed through `src/lib/fal.ts` `generateVideo`, which is content-addressed:
 * an identical call is served from the committed cache manifest and spends no
 * credits, so re-rendering never re-spends. The downloaded clip is copied into
 * `public/generated/seedance.mp4` and committed alongside it, so a clean
 * checkout re-renders the composition from a single command without a FAL_KEY.
 *
 * Cost guard: fast tier, 720p, 5s ≈ $0.2419/s × 5 = ~$1.21 — well under the
 * $3 ticket cap. (Standard-tier 1080p would be ~$3.41, over the cap.)
 *
 *   npx tsx scripts/prep-assets.ts
 */
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateVideo } from "../src/lib/fal";
import { reencode } from "../src/lib/ffmpeg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PUBLIC_GEN = path.join(REPO_ROOT, "public", "generated");

/** The one live-action beat. This string is the cache key — do not edit casually. */
export const SEEDANCE_PROMPT =
  "Cinematic live-action, one continuous shot, soft natural window light, calm pastel " +
  "color grade with faint lavender and mint tints. It opens close on a person's face lit " +
  "by a laptop webcam — relaxed, focused, a faint smile as they finish typing a short " +
  "message to a coworker. Then the camera makes a smooth 180-degree arc around, whipping " +
  "behind the screen to reveal the machine side of the same moment: a quiet matte server " +
  "and a monitor glowing with lines of code and small agent panels lighting up one after " +
  "another, the work already underway. Unhurried, warm and humane, shallow depth of field, " +
  "no text overlays, no logos.";

export const SEEDANCE_OPTS = {
  model: "bytedance/seedance-2.0/fast/text-to-video",
  resolution: "720p",
  duration: "5",
  aspect_ratio: "16:9",
  generate_audio: false,
} as const;

/** Public path the composition loads via staticFile(). */
export const SEEDANCE_PUBLIC_REL = "generated/seedance.mp4";

async function main() {
  await mkdir(PUBLIC_GEN, { recursive: true });
  const dest = path.join(PUBLIC_GEN, "seedance.mp4");

  if (existsSync(dest)) {
    console.log(`[prep] ${SEEDANCE_PUBLIC_REL} already present — nothing to generate.`);
    return;
  }

  console.log("[prep] ensuring the seedance live-action clip (fal, cache-aware)…");
  const clip = await generateVideo(SEEDANCE_PROMPT, { ...SEEDANCE_OPTS });
  console.log(`[prep] clip ${clip.cached ? "from CACHE (no spend)" : "GENERATED"} → ${clip.relPath}`);

  // seedance returns ~5.04s at 24fps; normalise to 4.9s @ 30fps (audio dropped —
  // the piece reads sound-off) so the delivered clip is unambiguously "5 seconds
  // or less" and OffthreadVideo maps composition frames 1:1 under concurrency.
  await reencode(clip.path, dest, { fps: 30, duration: 4.9, dropAudio: true, label: "seedance-norm" });
  console.log(`[prep] normalised to 4.9s @ 30fps → public/${SEEDANCE_PUBLIC_REL}`);
}

main().catch((e) => {
  console.error("[prep] FAILED:", e);
  process.exit(1);
});
