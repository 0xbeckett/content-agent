/**
 * Build an ad deliverable from ONE command:
 *
 *   npm run ad                    # BeckettAdPunch — the 1-2 punch cut (current)
 *   npm run ad -- BeckettAd       # the earlier montage cut, still reproducible
 *   npm run ad -- BeckettAdPunch 2.4   # …with the poster pulled from t=2.4s
 *
 * There is no asset-prep step: neither ad comp has a metered or generated input.
 * Every screen they show is a committed real capture under `public/captures/`
 * (regenerate with `node scripts/capture.mjs`), so this runs offline from a
 * clean checkout.
 *
 * Steps, each streaming progress to stdout (never silent under the watchdog):
 *   1. render — the comp at `final` (1920x1080 h264, crf 18).
 *   2. poster — a frame chosen for the thumbnail, not the arbitrary midpoint
 *      `render.ts` grabs. The first artifact beat sells the ad; the midpoint may
 *      land on whatever shot happens to be halfway through.
 *   3. compress — a Discord-safe copy under 9MB, still full 1080p (no downscale:
 *      the target is a resolution requirement, not just a size one). Skipped
 *      when the master already fits, so we never ship a needlessly degraded copy.
 */
import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compressToTarget, probeDuration, thumbnail } from "../src/lib/ffmpeg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT = path.join(REPO_ROOT, "out");

/** Discord caps uploads at 10MB; leave headroom. */
const TARGET_BYTES = 9 * 1024 * 1024;

/**
 * Seconds into each cut worth freezing as the poster. For BeckettAdPunch that is
 * the first payoff — the live board, mid-push-in — because a thumbnail of the
 * product beats a thumbnail of a chat message.
 */
const POSTER_AT: Record<string, number> = {
  BeckettAdPunch: 2.1,
  BeckettAd: 3.0,
};

function step(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n[ad] $ ${cmd} ${args.join(" ")}`);
    const child = spawn(cmd, args, { cwd: REPO_ROOT, stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

const mb = (n: number) => (n / 1024 / 1024).toFixed(2) + " MB";
const rel = (p: string) => path.relative(REPO_ROOT, p);

async function main() {
  const t0 = Date.now();
  const comp = process.argv[2] ?? "BeckettAdPunch";
  const posterAt = Number(process.argv[3] ?? POSTER_AT[comp] ?? 2);

  await step("npx", ["tsx", "scripts/render.ts", comp, "final"]);

  const full = path.join(OUT, `${comp}-final.mp4`);
  const poster = path.join(OUT, `${comp}-poster.jpg`);
  const discord = path.join(OUT, `${comp}-discord.mp4`);

  console.log(`\n[ad] poster frame at t=${posterAt}s…`);
  await thumbnail(full, poster, posterAt);

  const dur = await probeDuration(full);
  const f = await stat(full);

  let delivered = full;
  if (f.size > TARGET_BYTES) {
    console.log("\n[ad] compressing a Discord-safe copy (<9MB, still 1080p)…");
    await compressToTarget(full, discord, TARGET_BYTES);
    delivered = discord;
  } else {
    console.log(`\n[ad] master is already ${mb(f.size)} — under the ${mb(TARGET_BYTES)} Discord budget, no second encode.`);
  }

  const d = await stat(delivered);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n[ad] ✔ done in ${secs}s · duration ${dur.toFixed(1)}s`);
  console.log(`[ad]   deliverable : ${rel(delivered)}  (${mb(d.size)})`);
  console.log(`[ad]   poster      : ${rel(poster)}`);
  if (delivered !== full) console.log(`[ad]   master      : ${rel(full)}  (${mb(f.size)})`);

  if (dur < 15 || dur > 25) {
    console.error(`[ad] WARNING: duration ${dur.toFixed(1)}s is outside the 15–25s brief.`);
    process.exit(2);
  }
  if (d.size > 10 * 1024 * 1024) {
    console.error("[ad] WARNING: deliverable exceeds 10MB — tighten the budget.");
    process.exit(2);
  }
}

main().catch((e) => {
  console.error("[ad] FAILED:", e);
  process.exit(1);
});
